import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { receiptSchema } from "@/lib/validations/receipt";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let filePath: string | undefined;
  let fileName: string | undefined;
  let body: Record<string, unknown>;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop();
      const uniqueName = `receipts/${session.user.id}/${randomUUID()}.${ext}`;
      const blob = await put(uniqueName, file, { access: "public" });
      filePath = blob.url;
      fileName = file.name;
    }

    body = {
      amount: parseFloat(formData.get("amount") as string),
      category: formData.get("category"),
      date: formData.get("date"),
    };
  } else {
    const json = await req.json();
    if (json.fileBase64 && json.fileName) {
      const buffer = Buffer.from(json.fileBase64, "base64");
      const ext = json.fileName.split(".").pop();
      const uniqueName = `receipts/${session.user.id}/${randomUUID()}.${ext}`;
      const blob = await put(uniqueName, buffer, { access: "public" });
      filePath = blob.url;
      fileName = json.fileName;
    }
    body = json;
  }

  const parsed = receiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const receipt = await prisma.receipt.create({
    data: {
      userId: session.user.id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      date: new Date(parsed.data.date),
      filePath,
      fileName,
    },
  });

  return NextResponse.json(receipt, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(receipts);
}
