/**
 * Script de inicio para producción
 * Ejecuta reset, migraciones, seeds y luego inicia el servidor
 */
import { spawn } from 'child_process';
import path from 'path';

async function runScript(scriptPath: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Running ${name} ===`);
    const proc = spawn('bun', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${name} completed`);
        resolve();
      } else {
        reject(new Error(`${name} failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function startServer(): Promise<void> {
  console.log('\n=== Starting Server ===');
  const serverPath = path.join(process.cwd(), 'dist', 'server', 'entry.mjs');
  
  const proc = spawn('bun', [serverPath], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  proc.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Keep the process running
  await new Promise(() => {});
}

async function main() {
  try {
    // TODO: Quitar reset después del primer deploy exitoso
    await runScript('src/db/reset.ts', 'Database Reset');
    await runScript('src/db/up.ts', 'Database Migrations');
    await runScript('src/db/seed.ts', 'Database Seeds');
    await startServer();
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

main();
