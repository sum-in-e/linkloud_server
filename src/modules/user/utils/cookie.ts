import { CookieOptions } from 'express';

export const cookieOptions = (host: string, maxAge: number) => {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    domain: host,
    maxAge,
  } as CookieOptions;
};
