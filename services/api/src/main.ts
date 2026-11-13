import { loadAllRegions } from '@northwind/config';
import { migrate, openDatabase } from './db.ts';
import { createApiServer } from './server.ts';

const port = Number(process.env.PORT ?? 8080);
const databasePath = process.env.DATABASE_PATH ?? ':memory:';

const db = openDatabase(databasePath);
const applied = migrate(db);
console.log(`Database: ${databasePath === ':memory:' ? 'in memory (data is lost on exit)' : databasePath}`);
if (applied.length) console.log(`Applied migrations: ${applied.join(', ')}`);

const server = createApiServer({ db, regions: loadAllRegions(), commit: process.env.GIT_COMMIT ?? 'dev' });
server.listen(port, () => console.log(`Orders API listening on http://localhost:${port}`));

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
