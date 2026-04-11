import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json({ error: "Only JPEG and PNG files are allowed." }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File exceeds the 5 MB limit." }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  const filePath = path.join(uploadDir, filename);

  // Prevent path traversal — filename is hex-only so this is a safety belt
  if (!filePath.startsWith(uploadDir)) {
    return Response.json({ error: "Invalid filename." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return Response.json({ url: `/uploads/avatars/${filename}` }, { status: 201 });
}
