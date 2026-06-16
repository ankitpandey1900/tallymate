import fs from "fs/promises";
import path from "path";

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Saves a file upload. If Cloudflare R2 environment variables are present,
 * it uploads to R2. Otherwise, it falls back to the local `public/uploads/` directory.
 */
export async function uploadFile(
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
): Promise<UploadedFile> {
  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
  }

  // Validate size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileExtension = path.extname(file.name) || `.${file.type.split("/")[1]}`;
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;

  // Check if R2 is configured
  const hasR2 =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME;

  if (hasR2) {
    try {
      // Lazy-load AWS SDK to prevent compilation dependency blockages
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
      
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: uniqueFileName,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Construct and return the public URL or sub-domain URL for R2
      const publicUrl = process.env.R2_PUBLIC_URL 
        ? `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`
        : `/api/attachments/${uniqueFileName}`; // fall back or proxy route

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
    } catch (err) {
      console.error("Failed to upload to Cloudflare R2, falling back to local storage:", err);
    }
  }

  // Local Storage Fallback
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  
  // Ensure the directory exists
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }

  const filePath = path.join(uploadsDir, uniqueFileName);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueFileName}`,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };
}
