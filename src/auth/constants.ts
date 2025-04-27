export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? '';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? '';

export const ACCESS_TOKEN_EXPIRED_IN_SECONDS = 15 * 60; // 15 minutes = 900 seconds
export const REFRESH_TOKEN_EXPIRED_IN_SECONDS = 15 * 24 * 60 * 60; // 15 days = 604800 seconds
