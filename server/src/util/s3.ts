import Minio from 'minio';
import dotenv from 'dotenv';
dotenv.config();

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export async function ensureBucket(bucket = 'sync-data') {
  const exists = await minioClient.bucketExists(bucket).catch(() => false);
  if (!exists) await minioClient.makeBucket(bucket, '');
  return bucket;
}
