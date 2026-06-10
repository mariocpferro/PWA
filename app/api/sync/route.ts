import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncBatchSchema } from "@/lib/validations/receipt";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function saveFile(buffer: Buffer, userId: string, originalName: string): Promise<string> {
  const ext = originalName.split(".").pop();
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "receipts", userId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/api/uploads/receipts/${userId}/${filename}`;
}

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
        filePath = await saveFile(buffer, session.user.id, item.fileName);
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
          latitude: item.latitude,
          longitude: item.longitude,
        },
      });

      results.push({ localId: item.localId, serverId: receipt.id });
    } catch {
      results.push({ localId: item.localId, error: "Failed to save" });
    }
  }

  return NextResponse.json({ results });
}
