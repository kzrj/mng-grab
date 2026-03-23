import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/language';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProfile, type AccountInfo } from '@/lib/api/auth';
import {
  acceptOrderApi,
  getCustomer,
  getCourier,
  getOrder,
  unassignCourierApi,
  type Customer,
  type Courier,
  type Order,
} from '@/lib/api/orders';

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

function formatPerson(name: string | null, phone: string, description?: string | null): string {
  const main = name?.trim() ? `${name} — ${phone}` : phone;
  return description?.trim() ? `${main} · ${description}` : main;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AccountInfo | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [courier, setCourier] = useState<Courier | null>(null);

  const { token, isAuthenticated } = useAuth();
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOrder(String(id))
      .then(async (data) => {
        if (cancelled) return;
        setOrder(data);
        // подгружаем заказчика и курьера по id
        try {
          const [cust, cour] = await Promise.all([
            getCustomer(data.customer_id),
            data.courier_id != null ? getCourier(data.courier_id) : Promise.resolve(null),
          ]);
          if (!cancelled) {
            setCustomer(cust);
            setCourier(cour);
          }
        } catch {
          if (!cancelled) {
            setCustomer(null);
            setCourier(null);
          }
        }
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

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    getProfile(token)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!order || !token) return;
    setAcceptLoading(true);
    try {
      const updated = await acceptOrderApi(token, order.id);
      setOrder(updated);
      setCourier(null);
      Alert.alert(t('common_done'), t('orders_accept_done'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('orders_accept_error');
      Alert.alert(t('common_error'), msg);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleUnassignCourier = async () => {
    if (!order || !token) return;
    setUnassignLoading(true);
    try {
      const updated = await unassignCourierApi(token, order.id);
      setOrder(updated);
      setCourier(null);
      Alert.alert(t('common_done'), t('orders_unassign_done'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('orders_unassign_error');
      Alert.alert(t('common_error'), msg);
    } finally {
      setUnassignLoading(false);
    }
  };

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

  const isCourier = isAuthenticated && profile?.role === 'courier';
  const canAccept = isCourier && order.courier_id == null;
  const isMyOrder =
    isAuthenticated && profile?.role === 'customer' && profile?.customer_id != null && profile.customer_id === order.customer_id;
  const canUnassign = isMyOrder && order.courier_id != null;

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

      {order.information ? (
        <>
          <ThemedText style={styles.label}>Информация</ThemedText>
          <ThemedText style={styles.value}>{order.information}</ThemedText>
        </>
      ) : null}

      <ThemedText style={styles.label}>{t('orders_detail_created')}</ThemedText>
      <ThemedText style={styles.value}>{formatDateTime(order.created_at)}</ThemedText>

      <ThemedText style={styles.label}>{t('orders_detail_customer')}</ThemedText>
      <ThemedText style={styles.value}>
        {customer
          ? formatPerson(customer.name, customer.phone, customer.description)
          : `#${order.customer_id}`}
      </ThemedText>

      <ThemedText style={styles.label}>{t('orders_detail_courier')}</ThemedText>
      {order.courier_id == null ? (
        <ThemedText style={styles.value}>—</ThemedText>
      ) : courier ? (
        <>
          <ThemedText style={styles.value}>
            {formatPerson(courier.name, courier.phone, courier.description)}
          </ThemedText>
          <ThemedText style={styles.meta}>
            ID: {courier.id}
            {courier.account_id != null ? ` · аккаунт: ${courier.account_id}` : ''}
            {courier.created_at ? ` · c ${formatDateTime(courier.created_at)}` : ''}
          </ThemedText>
        </>
      ) : (
        <ThemedText style={styles.value}>#{order.courier_id}</ThemedText>
      )}

      {canAccept && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: tintColor },
            pressed && styles.buttonPressed,
            acceptLoading && styles.buttonDisabled,
          ]}
          onPress={handleAccept}
          disabled={acceptLoading}
        >
          {acceptLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.actionButtonText}>{t('orders_accept')}</ThemedText>
          )}
        </Pressable>
      )}

      {canUnassign && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.unassignButton,
            pressed && styles.buttonPressed,
            unassignLoading && styles.buttonDisabled,
          ]}
          onPress={handleUnassignCourier}
          disabled={unassignLoading}
        >
          {unassignLoading ? (
            <ActivityIndicator color="#666" />
          ) : (
            <ThemedText style={styles.unassignButtonText}>{t('orders_unassign_courier')}</ThemedText>
          )}
        </Pressable>
      )}
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
  meta: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  actionButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unassignButton: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  unassignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

