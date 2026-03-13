import { API_V1, API_BASE } from '@/constants/api';
import { fetchJson } from '@/lib/http';

const CUSTOMERS_URL = `${API_V1}/customers`;
const COURIERS_URL = `${API_V1}/couriers`;
const SEED_FILL_URL = `${API_V1}/seed/fill`;
const SEED_CLEAR_URL = `${API_V1}/seed/clear`;

export type UserItem = {
  id: number;
  phone: string;
  description: string | null;
  account_id: number | null;
  created_at: string;
  updated_at: string;
};

export function getCustomers() {
  return fetchJson<UserItem[]>(CUSTOMERS_URL);
}

export function getCouriers() {
  return fetchJson<UserItem[]>(COURIERS_URL);
}

export function fillSeed() {
  return fetchJson<{
    message: string;
    customers: number;
    couriers: number;
  }>(SEED_FILL_URL, { timeoutMs: 15000 });
}

export function clearSeed() {
  return fetchJson<{
    message: string;
    reviews: number;
    orders: number;
    customers: number;
    couriers: number;
  }>(SEED_CLEAR_URL, { method: 'DELETE', timeoutMs: 15000 });
}

export { API_BASE };

