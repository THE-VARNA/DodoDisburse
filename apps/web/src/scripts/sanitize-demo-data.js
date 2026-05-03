import 'dotenv/config';
import { db } from '../lib/db.js';
import { contractors } from '@gcp/db';
import { eq } from 'drizzle-orm';

async function sanitize() {
  const all = await db.select().from(contractors);
  
  console.log(`Sanitizing ${all.length} contractors...`);
  
  for (let i = 0; i < all.length; i++) {
    const c = all[i];
    const newName = `Demo Contractor #${i + 1}`;
    const newEmail = `contractor${i + 1}@demo.dododisburse.com`;
    
    await db.update(contractors)
      .set({ name: newName, email: newEmail })
      .where(eq(contractors.id, c.id));
      
    console.log(`Updated ${c.id} to ${newName}`);
  }
  
  console.log('Sanitation complete!');
  process.exit(0);
}

sanitize().catch(err => {
  console.error(err);
  process.exit(1);
});
