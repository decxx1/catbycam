import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET } from 'astro:env/server';

const secret = new TextEncoder().encode(JWT_SECRET);

export async function createSession(userId: number) {
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return jwt;
}

export async function getSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: number };
  } catch (error) {
    return null;
  }
}
