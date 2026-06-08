/**
 * Admin Promotion Script
 * Usage: npx ts-node src/db/make-admin.ts <email>
 * Example: npx ts-node src/db/make-admin.ts demo@example.com
 */
import '../config/env'; // loads .env first
import { env } from '../config/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

if (!email) {
  console.error('❌  Usage: npx ts-node src/db/make-admin.ts <email>');
  process.exit(1);
}

async function makeAdmin() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db   = drizzle(pool);

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    console.error(`❌  No user found with email: ${email}`);
    await pool.end();
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log(`ℹ️   ${user.username} (${email}) is already an ADMIN.`);
    await pool.end();
    return;
  }

  await db.update(users).set({ role: 'ADMIN' }).where(eq(users.email, email));

  console.log(`✅  Successfully promoted ${user.username} (${email}) to ADMIN.`);
  console.log('    Re-login to get a new JWT with the ADMIN role embedded.');
  await pool.end();
}

makeAdmin().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
