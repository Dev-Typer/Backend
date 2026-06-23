import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';

const STATIC_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const GIF_MIME_TYPE      = 'image/gif';
const ALLOWED_MIME_TYPES = [...STATIC_MIME_TYPES, GIF_MIME_TYPE] as const;

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

function isAllowedMimeType(mime: string): mime is AllowedMimeType {
    return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export interface UploadResult {
    publicUrl: string;
    key: string;
}

@Injectable()
export class R2StorageService {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;

    constructor(private readonly config: ConfigService) {
        this.bucket    = config.getOrThrow<string>('R2_BUCKET_NAME');
        this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL');

        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId:     config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
                secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
            },
        });
    }

    async upload(
        folder: 'profile' | 'banner',
        userId: number,
        file: Express.Multer.File,
    ): Promise<UploadResult> {
        const mimeType = file.mimetype;

        if (!isAllowedMimeType(mimeType)) {
            throw new Error(`허용되지 않는 파일 타입입니다: ${mimeType}`);
        }

        const isGif = mimeType === GIF_MIME_TYPE;

        const ext     = isGif ? 'gif' : 'webp';
        const key     = `${folder}/${userId}.${ext}`;
        const body    = isGif ? file.buffer : await sharp(file.buffer).webp({ quality: 85 }).toBuffer();
        const content = isGif ? GIF_MIME_TYPE : 'image/webp';

        await this.client.send(new PutObjectCommand({
            Bucket:      this.bucket,
            Key:         key,
            Body:        body,
            ContentType: content,
        }));

        return {
            publicUrl: `${this.publicUrl}/${key}`,
            key,
        };
    }

    async delete(key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key:    key,
        }));
    }

    extractKey(publicUrl: string): string {
        return publicUrl.replace(`${this.publicUrl}/`, '');
    }
}
