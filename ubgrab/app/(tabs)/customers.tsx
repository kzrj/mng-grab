import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { API_V1 } from '@/constants/api';

const CUSTOMERS_URL = `${API_V1}/customers`;
const COURIERS_URL = `${API_V1}/couriers`;
const FETCH_TIMEOUT_MS = 10000;

type UserItem = {
  id: number;
  phone: string;
  description: string | null;
  account_id: number | null;
  created_at: string;
  updated_at: string;
};

type UserSection = {
  title: string;
  data: (UserItem & { _sectionKey: string })[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Ошибка ${response.status}`);
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

function UserItemRow({ item }: { item: UserItem }) {
  return (
    <ThemedView style={styles.item}>
      <ThemedText type="defaultSemiBold">{item.phone}</ThemedText>
      {item.description ? (
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      ) : null}
      <ThemedText style={styles.meta}>
        ID: {item.id}
        {item.account_id != null ? ` · Аккаунт: ${item.account_id}` : ''} · {formatDate(item.created_at)}
      </ThemedText>
    </ThemedView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
    </View>
  );
}

export default function UsersScreen() {
  const [sections, setSections] = useState<UserSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [customers, couriers] = await Promise.all([
        fetchJson<UserItem[]>(CUSTOMERS_URL),
        fetchJson<UserItem[]>(COURIERS_URL),
      ]);
      const customerData = customers.map((c) => ({ ...c, _sectionKey: 'customer' }));
      const courierData = couriers.map((c) => ({ ...c, _sectionKey: 'courier' }));
      setSections([
        { title: 'Заказчики', data: customerData },
        { title: 'Курьеры', data: courierData },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Превышено время ожидания'
            : err.message
          : 'Не удалось загрузить список пользователей';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && sections.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Загрузка…</ThemedText>
      </ThemedView>
    );
  }

  if (error && sections.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  const totalItems = sections.reduce((sum, s) => sum + s.data.length, 0);

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item._sectionKey}-${item.id}`}
        renderItem={({ item }) => <UserItemRow item={item} />}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        stickySectionHeadersEnabled
        contentContainerStyle={totalItems === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>Нет пользователей</ThemedText>
        }
        ListFooterComponent={
          totalItems === 0 && sections.length > 0 ? (
            <ThemedText style={styles.emptyText}>Нет пользователей</ThemedText>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
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
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 15,
    opacity: 0.9,
  },
  sectionSeparator: {
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  description: {
    marginTop: 4,
    opacity: 0.9,
    fontSize: 14,
  },
  meta: {
    marginTop: 4,
    opacity: 0.7,
    fontSize: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
