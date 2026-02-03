import path from 'path';

/**
 * Obtiene la ruta base para uploads según el entorno
 * - Desarrollo: public/uploads (Vite sirve archivos de public/)
 * - Producción: dist/client/uploads (Astro standalone sirve desde dist/client/)
 */
export function getUploadsBasePath(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    return path.join(process.cwd(), 'public', 'uploads');
  }
  
  return path.join(process.cwd(), 'dist', 'client', 'uploads');
}

/**
 * Obtiene la ruta completa para una subcarpeta de uploads
 */
export function getUploadsPath(...subfolders: string[]): string {
  return path.join(getUploadsBasePath(), ...subfolders);
}
