import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize, sep } from "path";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  txt: "text/plain",
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Prevent path traversal
  if (path.some((segment) => segment === ".." || segment === ".")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uploadsDir = join(process.cwd(), "public", "uploads");
  const filePath = normalize(join(uploadsDir, ...path));

  // Double-check resolved path stays inside uploads directory
  if (!filePath.startsWith(uploadsDir + sep) && filePath !== uploadsDir) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    const filename = path[path.length - 1];
    return new NextResponse(file, {
      headers: {
        "Content-Type": getMimeType(filename),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
