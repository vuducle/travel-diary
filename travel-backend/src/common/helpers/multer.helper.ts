import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export interface MulterConfigOptions {
  destination: string;
  fileNamePrefix: string;
  maxSizeMB?: number;
  allowedMimeTypes?: RegExp;
}

export function createMulterConfig(options: MulterConfigOptions) {
  const {
    destination,
    fileNamePrefix,
    maxSizeMB = 5,
    allowedMimeTypes = /\/(jpg|jpeg|png|gif|webp)$/,
  } = options;

  return {
    storage: diskStorage({
      destination,
      filename: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
      ) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${fileNamePrefix}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!file.mimetype.match(allowedMimeTypes)) {
        return cb(
          new BadRequestException(
            `Only image files are allowed! Accepted types: ${allowedMimeTypes.source}`,
          ),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  };
}

// Preset configurations
export const avatarUploadConfig = createMulterConfig({
  destination: './uploads/avatars',
  fileNamePrefix: 'avatar',
  maxSizeMB: 5,
  allowedMimeTypes: /\/(jpg|jpeg|png)$/,
});

export const entryImageUploadConfig = createMulterConfig({
  destination: './uploads/entries',
  fileNamePrefix: 'entry',
  maxSizeMB: 10,
  allowedMimeTypes: /\/(jpg|jpeg|png|gif|webp)$/,
});

export const tripCoverUploadConfig = createMulterConfig({
  destination: './uploads/trips',
  fileNamePrefix: 'trip',
  maxSizeMB: 10,
  allowedMimeTypes: /\/(jpg|jpeg|png|webp)$/,
});
