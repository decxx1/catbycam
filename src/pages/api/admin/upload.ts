import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const token = cookies.get('auth_token')?.value;
    const session = token ? await getSession(token) : null;
    if (!session) return new Response('Unauthorized', { status: 401 });

    const user = await UserService.findById(session.userId);
    if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return new Response('No image provided', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${uuidv4()}.webp`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    // Ensure dir exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);

    // Process with sharp: convert to webp, resize if too large, optimize
    await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filePath);

    // Return the relative URL for public access
    const url = `/uploads/products/${filename}`;
    
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Error processing image', { status: 500 });
  }
};

