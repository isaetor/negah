import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

export const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: "default",
  credentials: {
    accessKeyId: S3_ACCESS_KEY || "",
    secretAccessKey: S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  message?: string;
}

export async function uploadToStorage(
  file: Buffer,
  filename: string,
  mimeType: string,
): Promise<StorageUploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: filename,
      Body: file,
      ContentType: mimeType,
      ACL: "public-read",
    });

    await s3.send(command);

    const url = `${S3_PUBLIC_URL}/${filename}`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("Error uploading to Storage:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteFromStorage(filename: string) {
  try {
    const key = `${filename}`;

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3.send(command);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
