import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/context/language';
import { useOrdersStore } from '@/store';
import { useRouter } from 'expo-router';
import type { Order } from '@/lib/api/orders';

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

function OrderItem({ item, onPress }: { item: Order; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView style={styles.item}>
        <ThemedText type="defaultSemiBold">
          {item.where_from} → {item.where_to}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {formatDate(item.date_when)} · {item.price.toFixed(0)} ₽ · {item.status}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    list,
    listLoading,
    listError,
    loadOrders,
  } = useOrdersStore();

  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      await loadOrders();
      setRefreshing(false);
    },
    [loadOrders]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (listLoading && !list?.length) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>{t('orders_loading')}</ThemedText>
      </ThemedView>
    );
  }

  if (listError && !list?.length) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{listError}</ThemedText>
      </ThemedView>
    );
  }

  const listData = list ?? [];

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderItem
            item={item}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/orders/[id]',
                params: { id: String(item.id) },
              })
            }
          />
        )}
        contentContainerStyle={listData.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>{t('orders_no_orders')}</ThemedText>
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

