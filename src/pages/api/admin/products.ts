import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { ProductService, type ProductImage } from '@/services/productService';
import fs from 'fs/promises';
import path from 'path';

interface ImageData {
  url: string;
  urlFull?: string;
  width?: number;
  height?: number;
}

// Helper para eliminar archivo con reintentos (Windows EBUSY workaround)
async function deleteFileWithRetry(filePath: string, maxRetries = 5, delayMs = 200): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') return true; // Ya no existe
      if (err.code === 'EBUSY' && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  return false;
}

// Limpiar archivos viejos en temp (más de 1 hora)
async function cleanupTempFolder() {
  const tempDir = path.join(process.cwd(), 'public', 'uploads', 'products', 'temp');
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  
  try {
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs < fiveMinutesAgo) {
          await deleteFileWithRetry(filePath);
        }
      } catch {}
    }
  } catch {}
}

// Helper para mover una URL de temp a carpeta del producto
// Usa copy + delete en lugar de rename para evitar EBUSY en Windows
async function moveUrlToProductFolder(productId: number, url: string, tempDir: string, productDir: string): Promise<string> {
  if (url && url.includes('/temp/')) {
    const filename = path.basename(url);
    const oldPath = path.join(tempDir, filename);
    const newPath = path.join(productDir, filename);
    
    try {
      await fs.copyFile(oldPath, newPath);
      // Eliminar original en background (no bloquea si falla)
      deleteFileWithRetry(oldPath).catch(() => {});
      return `/uploads/products/${productId}/${filename}`;
    } catch (e) {
      console.error(`[MOVE ERROR] Failed to move ${oldPath}:`, e);
      return url;
    }
  }
  return url;
}

// Helper para mover imágenes de temp a carpeta del producto
async function moveImagesToProductFolder(productId: number, mainImage: ImageData, extraImages: ImageData[]): Promise<{ mainImage: ImageData; extraImages: ProductImage[] }> {
  const tempDir = path.join(process.cwd(), 'public', 'uploads', 'products', 'temp');
  const productDir = path.join(process.cwd(), 'public', 'uploads', 'products', String(productId));
  
  await fs.mkdir(productDir, { recursive: true });
  
  // Mover main image
  const newMainImage: ImageData = {
    url: await moveUrlToProductFolder(productId, mainImage.url, tempDir, productDir),
    urlFull: mainImage.urlFull ? await moveUrlToProductFolder(productId, mainImage.urlFull, tempDir, productDir) : undefined,
    width: mainImage.width,
    height: mainImage.height
  };
  
  // Mover extra images
  const newExtraImages: ProductImage[] = [];
  for (const img of extraImages) {
    newExtraImages.push({
      url: await moveUrlToProductFolder(productId, img.url, tempDir, productDir),
      urlFull: img.urlFull ? await moveUrlToProductFolder(productId, img.urlFull, tempDir, productDir) : undefined,
      width: img.width,
      height: img.height
    });
  }
  
  return { mainImage: newMainImage, extraImages: newExtraImages };
}

// Helper para eliminar carpeta de imágenes del producto
async function deleteProductImages(productId: number) {
  const productDir = path.join(process.cwd(), 'public', 'uploads', 'products', String(productId));
  
  try {
    await fs.rm(productDir, { recursive: true, force: true });
  } catch (e) {
    console.error(`Error deleting product images folder: ${productId}`, e);
  }
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 10);
  const search = url.searchParams.get('search') || '';
  const categoryId = url.searchParams.get('categoryId') || '';

  const data = await ProductService.getAll({ page, limit, search, categoryId });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const productData = await request.json();
  const id = await ProductService.create(productData);
  
  // Limpiar archivos viejos en temp (en background)
  cleanupTempFolder().catch(() => {});
  
  // Mover imágenes de temp a carpeta del producto
  const mainImageData: ImageData = {
    url: productData.main_image,
    urlFull: productData.main_image_full,
    width: productData.main_image_width,
    height: productData.main_image_height
  };
  const extraImagesData: ImageData[] = productData.images || [];
  
  if (mainImageData.url) {
    const { mainImage, extraImages } = await moveImagesToProductFolder(id, mainImageData, extraImagesData);
    await ProductService.updateImages(id, mainImage, extraImages);
  }
  
  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id, ...data } = await request.json();
  await ProductService.update(id, data);
  return new Response(null, { status: 204 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id } = await request.json();
  
  // Eliminar la carpeta de imágenes del producto
  await deleteProductImages(id);
  
  // Eliminar el producto de la base de datos
  await ProductService.delete(id);
  
  return new Response(null, { status: 204 });
};
