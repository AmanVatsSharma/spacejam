/**
 * File:        apps/api/src/typeorm/typeorm.module.ts
 * Module:      API · TypeORM Configuration
 * Purpose:     TypeORM DataSource and module setup
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '../config/module';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true',
  extra: {
    max: parseInt(process.env.DATABASE_POOL_SIZE) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
  exports: [TypeOrmModule],
})
export class TypeOrmConfigModule {}