import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { receiptSchema } from "@/lib/validations/receipt";
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

  const contentType = req.headers.get("content-type") ?? "";
  let filePath: string | undefined;
  let fileName: string | undefined;
  let body: Record<string, unknown>;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      filePath = await saveFile(buffer, session.user.id, file.name);
      fileName = file.name;
    }

    const latRaw = formData.get("latitude") as string | null;
    const lngRaw = formData.get("longitude") as string | null;
    body = {
      amount: parseFloat(formData.get("amount") as string),
      category: formData.get("category"),
      date: formData.get("date"),
      latitude: latRaw ? parseFloat(latRaw) : undefined,
      longitude: lngRaw ? parseFloat(lngRaw) : undefined,
    };
  } else {
    const json = await req.json();
    if (json.fileBase64 && json.fileName) {
      const buffer = Buffer.from(json.fileBase64, "base64");
      filePath = await saveFile(buffer, session.user.id, json.fileName);
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
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
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
