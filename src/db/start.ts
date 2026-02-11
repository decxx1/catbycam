/**
 * Script de inicio para producción
 * Ejecuta reset, migraciones, seeds y luego inicia el servidor
 * Usa Bun.spawnSync para scripts de DB y Bun.spawn para el servidor
 */

function runScript(scriptPath: string, name: string): void {
  console.log(`\n=== ${name} ===`);
  
  const result = Bun.spawnSync(['bun', scriptPath], {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  if (result.exitCode !== 0) {
    console.error(`${name} failed with exit code ${result.exitCode}`);
    process.exit(1);
  }
  
  console.log(`✓ ${name} completed`);
}

async function main() {
  try {
    runScript('src/db/up.ts', 'Database Migrations');
    runScript('src/db/seed.ts', 'Database Seeds');
    
    // Start dollar rate cron (runs in background)
    const { startCron } = await import('./cron');
    await startCron();

    console.log('\n=== Starting Server ===');
    
    // Ejecutar el servidor de Astro - este proceso reemplaza al actual
    const proc = Bun.spawn(['bun', 'dist/server/entry.mjs'], {
      stdout: 'inherit',
      stderr: 'inherit',
      stdin: 'inherit',
    });

    console.log('Server started on port ' + (process.env.PORT || '80'));
    
    // Esperar a que el servidor termine (no debería terminar)
    const exitCode = await proc.exited;
    console.error(`Server exited with code ${exitCode}`);
    process.exit(exitCode);
    
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

main();
