/**
 * Базовый URL API. Задайте EXPO_PUBLIC_API_BASE в .env (например http://34.172.114.64:8000).
 */
const envBase =
  typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE;
export const API_BASE = (envBase as string) || 'http://192.168.0.14:8000';
export const API_V1 = `${API_BASE}/api/v1`;
