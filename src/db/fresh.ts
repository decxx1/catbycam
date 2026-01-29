import 'dotenv/config';
import { execSync } from 'child_process';

async function fresh() {
  console.log('=== Fresh Database Setup ===\n');
  console.log('This will reset the database and run all migrations and seeds.\n');
  
  try {
    // 1. Reset
    console.log('Step 1/4: Resetting database...');
    execSync('bun src/db/reset.ts', { stdio: 'inherit' });
    
    // 2. Better-auth migrations
    console.log('\nStep 2/4: Running better-auth migrations...');
    execSync('bunx @better-auth/cli migrate', { stdio: 'inherit' });
    
    // 3. App migrations
    console.log('\nStep 3/4: Running app migrations...');
    execSync('bun src/db/migrate.ts', { stdio: 'inherit' });
    
    // 4. Seeds
    console.log('\nStep 4/4: Running seeds...');
    execSync('bun src/db/seed.ts', { stdio: 'inherit' });
    
    console.log('\n=== Fresh Setup Complete ===');
    console.log('Database is ready to use!');
  } catch (error) {
    console.error('\n❌ Fresh setup failed:', error);
    process.exit(1);
  }
}

fresh();
