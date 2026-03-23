import { API_V1 } from '@/constants/api';
import { fetchJson } from '@/lib/http';

export type OrderStatus = 'active' | 'expired' | 'completed' | 'canceled';

export type Order = {
  id: number;
  where_to: string;
  where_from: string;
  price: number;
  status: OrderStatus;
  date_when: string;
  information?: string | null;
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

export type OrdersFilters = {
  statuses?: OrderStatus[];
  customer_name?: string;
  date_from?: string;
  date_to?: string;
  place?: string;
  only_own?: boolean;
};

const ORDERS_URL = `${API_V1}/orders`;
const COURIERS_URL = `${API_V1}/couriers`;
const CUSTOMERS_URL = `${API_V1}/customers`;

export function getOrders(filters?: OrdersFilters, token?: string | null) {
  let url = ORDERS_URL;
  if (filters) {
    const params = new URLSearchParams();
    if (filters.statuses && filters.statuses.length > 0) {
      params.set('statuses', filters.statuses.join(','));
    }
    if (filters.customer_name) params.append('customer_name', filters.customer_name);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.place) params.append('place', filters.place);
    if (filters.only_own) params.append('only_own', 'true');
    const qs = params.toString();
    if (qs) {
      url = `${ORDERS_URL}?${qs}`;
    }
  }
  return fetchJson<Order[]>(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
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
    information?: string | null;
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

