/**
 * File:        print/print.controller.ts
 * Module:      API · Print · Upload
 * Purpose:     REST file upload for customer documents (GST certificates,
 *              Aadhaar scans, agreements). Stores under ./uploads (served
 *              statically at /uploads/*) and returns the public path. The
 *              CRM onboarding wizard and customer Documents tab upload
 *              here, then persist a CustomerDocument row with the URL.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-25
 */
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// `multer` ships without bundled types; we treat its options as `any` below
// to avoid pulling in @types/multer for a single upload route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as multer from 'multer';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Extensions accepted for KYC/document uploads. */
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.heic',
]);

@Controller('print')
export class PrintController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: './uploads',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filename: (req: any, file: any, cb: any) => {
        // Keep the original extension, drop anything exotic from the
        // original name (spaces etc.) to make the served URL predictable.
        const dot = file.originalname.lastIndexOf('.');
        const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : '';
        const base = dot >= 0 ? file.originalname.slice(0, dot) : file.originalname;
        const safeBase = base.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60) || 'document';
        cb(null, `${Date.now()}-${safeBase}${ext}`);
      }
    }),
    limits: { fileSize: MAX_UPLOAD_BYTES },
    fileFilter: (req: any, file: any, cb: any) => {
      const dot = file.originalname.lastIndexOf('.');
      const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return cb(
          new BadRequestException(`File type not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(', ')}`),
          false,
        );
      }
      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      size: file.size,
    };
  }
}
