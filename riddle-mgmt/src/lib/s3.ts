import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "riddle-mgmt-files";

/**
 * Upload a file to S3.
 * Key format: {userId}/{folder}/{filename}
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    })
  );
}

/**
 * Get a temporary signed download URL (expires in 15 minutes).
 */
export async function getDownloadUrl(key: string, fileName?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(fileName ? { ResponseContentDisposition: `attachment; filename="${fileName}"` } : {}),
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

/**
 * Download a file from S3 as a Buffer.
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(command);
  const byteArray = await response.Body?.transformToByteArray();
  if (!byteArray) throw new Error("Empty S3 response");
  return Buffer.from(byteArray);
}

/**
 * Delete a file from S3.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
