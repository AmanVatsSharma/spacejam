/**
 * File:        apps/api/src/app/app.controller.ts
 * Module:      API · App Controller
 * Purpose:     Main application controller with health check
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
