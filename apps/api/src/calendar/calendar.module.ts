/**
 * File:        apps/api/src/calendar/calendar.module.ts
 * Module:      API · Calendar Module
 * Purpose:     Provides the Visit and Calendar (unified feed) resolvers.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerEnumType } from '@nestjs/graphql';
import { VisitResolver } from '../graphql/resolvers/visit.resolver';
import { CalendarResolver } from '../graphql/resolvers/calendar.resolver';
import { Visit } from '../typeorm/entities/visit.entity';
import { TourType, VisitStatus } from '../graphql/enums/visit.enums';

// Register the Visit-domain enums with the GraphQL schema. Done here in the
// module file (loads during DI setup, before schema build) rather than at the
// top of an entity/input file, which caused a webpack load-order cycle that
// broke resolver class instantiation ("metatype is not a constructor").
try { registerEnumType(TourType, { name: 'TourType' }); } catch { /* already registered */ }
try { registerEnumType(VisitStatus, { name: 'VisitStatus' }); } catch { /* already registered */ }

@Module({
  imports: [TypeOrmModule.forFeature([Visit])],
  providers: [VisitResolver, CalendarResolver],
  exports: [VisitResolver, CalendarResolver],
})
export class CalendarModule {}
