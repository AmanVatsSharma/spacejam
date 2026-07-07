/**
 * File:        auth/scripts/seed-admin.ts
 * Module:      Api · Auth · Scripts
 * Purpose:     Idempotent seed script that creates/updates a default admin user
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 *
 * Usage:
 *   ADMIN_EMAIL=admin@spacejam.test \
 *   ADMIN_PASSWORD=changeme-1234 \
 *   ADMIN_NAME='SpaceJam Admin' \
 *   npx ts-node -r tsconfig-paths/register apps/api/src/auth/scripts/seed-admin.ts
 *
 * The script uses the same TypeORM DataSource the rest of the API uses, so
 * running it from the project root will pick up `apps/api/src/typeorm/data-source.ts`.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';

import { dataSource } from '../../typeorm/data-source';
import { User } from '../../typeorm/entities/user.entity';
import { UserRole } from '../roles.enum';

const BCRYPT_COST = 12;

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@spacejam.test').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'changeme-1234';
  const name = process.env.ADMIN_NAME ?? 'SpaceJam Admin';

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  let admin = await repo
    .createQueryBuilder('u')
    .addSelect('u.passwordHash')
    .where('u.email = :email', { email })
    .getOne();

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  if (!admin) {
    admin = repo.create({
      email,
      name,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
      emailVerified: true,
    });
    await repo.save(admin);
    // eslint-disable-next-line no-console
    console.log(`created admin ${email}`);
  } else {
    admin.role = UserRole.ADMIN;
    admin.active = true;
    admin.emailVerified = true;
    admin.name = name;
    admin.passwordHash = passwordHash;
    await repo.save(admin);
    // eslint-disable-next-line no-console
    console.log(`updated admin ${email}`);
  }

  await dataSource.destroy();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('seed-admin failed', err);
  process.exit(1);
});
