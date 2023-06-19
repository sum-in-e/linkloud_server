import { CookieOptions } from 'express';

export const cookieOptions = (mode: string, host: string) => {
  return {
    httpOnly: true,
    secure: mode === 'production' ? true : false,
    sameSite: 'lax',
    path: '/',
    domain: host,
  } as CookieOptions;
};
