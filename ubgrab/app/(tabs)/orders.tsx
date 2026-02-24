import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_BASE = 'http://192.168.0.14:8000/api/v1';
const ORDERS_URL = `${API_BASE}/orders`;
const FETCH_TIMEOUT_MS = 10000;

type Order = {
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

async function fetchOrders(): Promise<Order[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(ORDERS_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Ошибка ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function OrderItem({ item }: { item: Order }) {
  return (
    <ThemedView style={styles.item}>
      <ThemedText type="defaultSemiBold">
        {item.where_from} → {item.where_to}
      </ThemedText>
      <ThemedText style={styles.meta}>
        {formatDate(item.date_when)} · {item.price.toFixed(0)} ₽ · {item.status}
      </ThemedText>
    </ThemedView>
  );
}

export default function OrdersScreen() {
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      setList(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Превышено время ожидания'
            : err.message
          : 'Не удалось загрузить список';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && list.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Загрузка…</ThemedText>
      </ThemedView>
    );
  }

  if (error && list.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <OrderItem item={item} />}
        contentContainerStyle={list.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>Нет заказов</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    textAlign: 'center',
  },
  item: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  meta: {
    marginTop: 4,
    opacity: 0.8,
    fontSize: 14,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
  },
});
