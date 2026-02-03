import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { getUploadsPath } from '@/utils/uploads';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof Response) return authResult;

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const productId = formData.get('productId') as string | null;

    if (!file) {
      return new Response('No image provided', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseFilename = uuidv4();
    
    // Si hay productId, guardar en subcarpeta del producto; si no, en carpeta temporal
    // Usa helper que detecta entorno (dev: public/, prod: dist/client/)
    const subfolder = productId ? productId : 'temp';
    const uploadDir = getUploadsPath('products', subfolder);

    // Ensure dir exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Obtener metadata de la imagen original
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 1920;
    const originalHeight = metadata.height || 1080;

    // 1. Crear versión FULL (max 1920px, alta calidad para PhotoSwipe)
    // .rotate() sin argumentos auto-rota basándose en metadata EXIF
    const fullFilename = `${baseFilename}_full.webp`;
    const fullPath = path.join(uploadDir, fullFilename);
    
    await sharp(buffer)
      .rotate() // Auto-rotar según EXIF orientation
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullPath);
    
    // Obtener dimensiones reales de la imagen full (después de rotar)
    const fullMetadata = await sharp(fullPath).metadata();
    const fullWidth = fullMetadata.width || originalWidth;
    const fullHeight = fullMetadata.height || originalHeight;

    // 2. Crear THUMBNAIL (400px, optimizado para carga rápida)
    const thumbFilename = `${baseFilename}_thumb.webp`;
    const thumbPath = path.join(uploadDir, thumbFilename);
    
    await sharp(buffer)
      .rotate() // Auto-rotar según EXIF orientation
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    // URLs para acceso público
    const url = `/uploads/products/${subfolder}/${thumbFilename}`;
    const urlFull = `/uploads/products/${subfolder}/${fullFilename}`;
    
    return new Response(JSON.stringify({ 
      url,           // Thumbnail para mostrar en cards y galería
      urlFull,       // Full para PhotoSwipe lightbox
      width: fullWidth,
      height: fullHeight
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Error processing image', { status: 500 });
  }
};

