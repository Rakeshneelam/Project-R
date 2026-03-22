import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.bucket = this.configService.get('S3_BUCKET', 'bondbridge-media');
    this.s3 = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY', ''),
        secretAccessKey: this.configService.get('S3_SECRET_KEY', ''),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async getUploadUrl(userId: string, purpose: string, mimeType: string) {
    const extension = mimeType.split('/')[1] || 'bin';
    const key = `${purpose}/${userId}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const publicUrl = `${this.configService.get('S3_ENDPOINT')}/${this.bucket}/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  async recordUpload(userId: string, url: string, key: string, mimeType: string, sizeBytes: number, purpose: string) {
    return this.prisma.mediaUpload.create({
      data: { userId, url, key, mimeType, sizeBytes, purpose },
    });
  }
}
