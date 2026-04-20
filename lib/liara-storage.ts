import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const LIARA_ENDPOINT = process.env.LIARA_ENDPOINT;
const LIARA_ACCESS_KEY = process.env.LIARA_ACCESS_KEY;
const LIARA_SECRET_KEY = process.env.LIARA_SECRET_KEY;
const LIARA_BUCKET = process.env.LIARA_BUCKET;
const LIARA_PUBLIC_URL = process.env.LIARA_PUBLIC_URL;

const s3 = new S3Client({
  endpoint: LIARA_ENDPOINT,
  region: "default",
  credentials: {
    accessKeyId: LIARA_ACCESS_KEY || "",
    secretAccessKey: LIARA_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

export interface LiaraUploadResult {
  success: boolean;
  url?: string;
  message?: string;
}

export async function uploadToLiara(
  file: Buffer,
  filename: string,
  mimeType: string,
): Promise<LiaraUploadResult> {
  try {
    const key = `negah/${filename}`;
    const command = new PutObjectCommand({
      Bucket: LIARA_BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await s3.send(command);

    const url = generateLiaraUrl(filename);

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("Error uploading to Liara:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteFromLiara(filename: string) {
  try {
    const key = `negah/${filename}`;

    const command = new DeleteObjectCommand({
      Bucket: LIARA_BUCKET,
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

export function generateLiaraUrl(filename: string): string {
  return `${LIARA_PUBLIC_URL}/pinterest/${filename}`;
}
