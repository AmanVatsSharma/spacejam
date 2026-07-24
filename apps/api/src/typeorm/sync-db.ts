import 'reflect-metadata';
import { dataSource } from './data-source';

dataSource
  .initialize()
  .then(async (ds) => {
    console.log('Database connected. Syncing schema...');
    await ds.synchronize();
    console.log('Schema synchronized successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database sync failed:', err);
    process.exit(1);
  });
