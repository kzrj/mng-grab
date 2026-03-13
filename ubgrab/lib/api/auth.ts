import { API_V1 } from '@/constants/api';
import { fetchJson } from '@/lib/http';

const LOGIN_URL = `${API_V1}/auth/login`;
const REGISTER_URL = `${API_V1}/auth/register`;
const ME_URL = `${API_V1}/auth/me`;

type AccessTokenResponse = { access_token: string };

export function loginApi(phone: string, password: string) {
  return fetchJson<AccessTokenResponse>(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
    timeoutMs: 15000,
  });
}

export type RegisterRole = 'customer' | 'courier';

export function registerApi(
  name: string,
  phone: string,
  password: string,
  role: RegisterRole
) {
  return fetchJson<AccessTokenResponse>(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password, role }),
    timeoutMs: 15000,
  });
}

export type AccountInfo = {
  id: number;
  name: string;
  phone: string;
  role: RegisterRole;
  created_at: string;
  updated_at: string;
};

export function getProfile(token: string) {
  return fetchJson<AccountInfo>(ME_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

