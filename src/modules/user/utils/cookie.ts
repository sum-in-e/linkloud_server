import { CookieOptions } from 'express';

export const cookieOptions = (mode: string, host: string) => {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    domain: host,
  } as CookieOptions;
};
