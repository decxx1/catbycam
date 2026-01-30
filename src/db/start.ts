/**
 * Script de inicio para producción
 * Ejecuta reset, migraciones, seeds y luego inicia el servidor
 */
import 'dotenv/config';
import { reset } from './reset';
import { up } from './up';
import { seedAll } from './seed';

async function startServer(): Promise<void> {
  console.log('\n=== Starting Server ===');
  
  // Importar y ejecutar el servidor de Astro
  const server = await import('../../dist/server/entry.mjs');
  
  // El servidor de Astro se mantiene corriendo automáticamente
  console.log('Server started successfully');
}

async function main() {
  try {
    // TODO: Quitar reset después del primer deploy exitoso
    console.log('\n=== Running Database Reset ===');
    await reset();
    console.log('✓ Database Reset completed');
    
    console.log('\n=== Running Database Migrations ===');
    await up();
    console.log('✓ Database Migrations completed');
    
    console.log('\n=== Running Database Seeds ===');
    await seedAll();
    console.log('✓ Database Seeds completed');
    
    await startServer();
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

main();
