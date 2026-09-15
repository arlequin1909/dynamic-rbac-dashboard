import { randomUUID } from 'node:crypto';
import type { Role, Session } from '@app/shared';
import { ROLE_PERMISSIONS } from '@app/shared';
import type { CookieOptions } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../../shared/config/env';

const _SESSION_TTL_SECONDS = 28800;
const _ALGORITHM = 'HS256';

export const _COOKIE_NAME = 'session';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.SESSION_SECRET);
}

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && value in ROLE_PERMISSIONS;
}

export async function createSession(role: Role): Promise<string> {
  let result: string;

  try {
    const sub = randomUUID();

    result = await new SignJWT({ role })
      .setProtectedHeader({ alg: _ALGORITHM })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(`${_SESSION_TTL_SECONDS}s`)
      .sign(getSecretKey());
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }

  return result;
}

export async function verifySession(token: string): Promise<Session | null> {
  let result: Session | null = null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [_ALGORITHM],
    });

    if (typeof payload.sub === 'string' && isRole(payload.role)) {
      result = { sub: payload.sub, role: payload.role };
    }
  } catch {
    result = null;
  }

  return result;
}

function buildBaseCookieOptions(): Omit<CookieOptions, 'maxAge'> {
  const result: Omit<CookieOptions, 'maxAge'> = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  };

  return result;
}

export function buildCookie(_token: string): CookieOptions {
  let result: CookieOptions;

  try {
    result = {
      ...buildBaseCookieOptions(),
      maxAge: _SESSION_TTL_SECONDS * 1000,
    };
  } catch (error) {
    console.error('Failed to build session cookie options:', error);
    throw error;
  }

  return result;
}

export function buildClearCookie(): CookieOptions {
  let result: CookieOptions;

  try {
    result = buildBaseCookieOptions();
  } catch (error) {
    console.error('Failed to build clear-cookie options:', error);
    throw error;
  }

  return result;
}
