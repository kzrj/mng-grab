import { API_V1 } from '@/constants/api';
import { fetchJson } from '@/lib/http';

export type Order = {
  id: number;
  where_to: string;
  where_from: string;
  price: number;
  status: string;
  date_when: string;
  customer_id: number;
  courier_id: number | null;
  created_at: string;
  updated_at: string;
};

export type Courier = {
  id: number;
  phone: string;
  description: string | null;
  name: string | null;
  account_id: number | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: number;
  phone: string;
  description: string | null;
  name: string | null;
};

const ORDERS_URL = `${API_V1}/orders`;
const COURIERS_URL = `${API_V1}/couriers`;
const CUSTOMERS_URL = `${API_V1}/customers`;

export function getOrders() {
  return fetchJson<Order[]>(ORDERS_URL);
}

export function getOrder(id: string | number) {
  return fetchJson<Order>(`${ORDERS_URL}/${id}`);
}

export function getCouriers() {
  return fetchJson<Courier[]>(COURIERS_URL);
}

export function getCourier(id: number) {
  return fetchJson<Courier>(`${COURIERS_URL}/${id}`);
}

export function getCustomer(id: number) {
  return fetchJson<Customer>(`${CUSTOMERS_URL}/${id}`);
}

export function createOrderApi(
  token: string,
  body: {
    where_from: string;
    where_to: string;
    price: number;
    date_when: string;
    status?: string;
    courier_id?: number | null;
  }
) {
  return fetchJson(ORDERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function acceptOrderApi(token: string, id: number) {
  return fetchJson<Order>(`${ORDERS_URL}/${id}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function unassignCourierApi(token: string, orderId: number) {
  return fetchJson<Order>(`${ORDERS_URL}/${orderId}/unassign-courier`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

