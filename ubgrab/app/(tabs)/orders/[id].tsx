import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/context/language';
import { getOrder, type Order } from '@/lib/api/orders';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOrder(String(id))
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setError(t('orders_error_load'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (!id) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{t('orders_error_load')}</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>{t('orders_loading')}</ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error ?? t('orders_error_load')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        #{order.id} {order.where_from} → {order.where_to}
      </ThemedText>

      <ThemedText style={styles.label}>{t('orders_detail_status')}</ThemedText>
      <ThemedText style={styles.value}>{order.status}</ThemedText>

      <ThemedText style={styles.label}>{t('orders_detail_price')}</ThemedText>
      <ThemedText style={styles.value}>{order.price.toFixed(0)} ₽</ThemedText>

      <ThemedText style={styles.label}>{t('orders_detail_date')}</ThemedText>
      <ThemedText style={styles.value}>{formatDateTime(order.date_when)}</ThemedText>

      <ThemedText style={styles.label}>{t('orders_detail_created')}</ThemedText>
      <ThemedText style={styles.value}>{formatDateTime(order.created_at)}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  title: {
    marginBottom: 24,
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.8,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
  },
});

