/**
 * Script de inicio para producción
 * Ejecuta reset, migraciones, seeds y luego inicia el servidor
 */

async function runScript(scriptPath: string, name: string): Promise<void> {
  console.log(`\n=== Running ${name} ===`);
  
  const proc = Bun.spawn(['bun', scriptPath], {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  const exitCode = await proc.exited;
  
  if (exitCode === 0) {
    console.log(`✓ ${name} completed`);
  } else {
    throw new Error(`${name} failed with code ${exitCode}`);
  }
}

async function startServer(): Promise<never> {
  console.log('\n=== Starting Server ===');
  
  const proc = Bun.spawn(['bun', 'dist/server/entry.mjs'], {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  // Wait for server process (this should run forever)
  await proc.exited;
  
  // If we get here, server crashed
  console.error('Server exited unexpectedly');
  process.exit(1);
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
