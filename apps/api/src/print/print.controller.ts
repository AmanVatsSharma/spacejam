import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// `multer` ships without bundled types; we treat its options as `any` below
// to avoid pulling in @types/multer for a single upload route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as multer from 'multer';

@Controller('print')
export class PrintController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: './uploads',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filename: (req: any, file: any, cb: any) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    })
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
