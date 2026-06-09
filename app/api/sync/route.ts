import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncBatchSchema } from "@/lib/validations/receipt";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = syncBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const results: { localId: string; serverId?: string; error?: string }[] = [];

  for (const item of parsed.data.receipts) {
    try {
      let filePath: string | undefined;
      let fileName: string | undefined;

      if (item.fileBase64 && item.fileName) {
        const buffer = Buffer.from(item.fileBase64, "base64");
        const ext = item.fileName.split(".").pop();
        const uniqueName = `receipts/${session.user.id}/${randomUUID()}.${ext}`;
        const blob = await put(uniqueName, buffer, { access: "public" });
        filePath = blob.url;
        fileName = item.fileName;
      }

      const receipt = await prisma.receipt.create({
        data: {
          userId: session.user.id,
          amount: item.amount,
          category: item.category,
          date: new Date(item.date),
          filePath,
          fileName,
        },
      });

      results.push({ localId: item.localId, serverId: receipt.id });
    } catch {
      results.push({ localId: item.localId, error: "Failed to save" });
    }
  }

  return NextResponse.json({ results });
}
