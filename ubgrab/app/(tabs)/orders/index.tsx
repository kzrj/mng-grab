import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/context/language';
import { useOrdersStore } from '@/store';
import { useNavigation, useRouter } from 'expo-router';
import type { Order, OrdersFilters, OrderStatus } from '@/lib/api/orders';
import { getOrders } from '@/lib/api/orders';

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

const ORDER_STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  active: 'order_status_active',
  expired: 'order_status_expired',
  completed: 'order_status_completed',
  canceled: 'order_status_canceled',
};

function OrderItem({
  item,
  onPress,
  t,
}: {
  item: Order;
  onPress: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (k: any, p?: Record<string, string | number>) => string;
}) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView style={styles.item}>
        <ThemedText type="defaultSemiBold">
          {item.where_from} → {item.where_to}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {formatDate(item.date_when)} · {item.price.toFixed(0)} ₽ ·{' '}
          {t(ORDER_STATUS_LABEL_KEY[item.status]) ?? item.status}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useLanguage() as any;
  const {
    list,
    listLoading,
    listError,
    loadOrders,
  } = useOrdersStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<OrdersFilters | undefined>(undefined);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
   const [quickSearch, setQuickSearch] = useState('');
  const [customerNameSuggestions, setCustomerNameSuggestions] = useState<string[]>([]);
  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);

  const load = useCallback(
    async (isRefresh = false, nextFilters?: OrdersFilters | undefined) => {
      const effectiveFilters = nextFilters ?? filters;
      if (isRefresh) setRefreshing(true);
      await loadOrders(effectiveFilters);
      setRefreshing(false);
    },
    [loadOrders, filters]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setFiltersVisible(true)}>
          <ThemedText>{t('orders_filters_button') ?? 'Фильтры'}</ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, t]);

  const handleApplyFilters = () => {
    const next: OrdersFilters = {};
    if (statusFilter.trim()) next.status = statusFilter.trim();
    if (customerNameFilter.trim()) next.customer_name = customerNameFilter.trim();
    if (dateFromFilter.trim()) next.date_from = dateFromFilter.trim();
    if (dateToFilter.trim()) next.date_to = dateToFilter.trim();
    if (placeFilter.trim()) next.place = placeFilter.trim();

    setFilters(next);
    load(false, next);
    setFiltersVisible(false);
  };

  const handleCustomerNameChange = async (value: string) => {
    setCustomerNameFilter(value);
    const query = value.trim();
    if (query.length < 2) {
      setCustomerNameSuggestions([]);
      return;
    }
    try {
      const orders = await getOrders({ customer_name: query });
      const names = Array.from(
        new Set(
          orders
            .map((o: any) => (o.customer_name as string | undefined) || null)
            .filter((n): n is string => !!n)
        )
      ).slice(0, 5);
      setCustomerNameSuggestions(names);
    } catch {
      setCustomerNameSuggestions([]);
    }
  };

  const handlePlaceChange = async (value: string) => {
    setPlaceFilter(value);
    const query = value.trim();
    if (query.length < 2) {
      setPlaceSuggestions([]);
      return;
    }
    try {
      const orders = await getOrders({ place: query });
      const places = Array.from(
        new Set(
          orders
            .flatMap((o) => [o.where_from, o.where_to])
            .filter((p) => typeof p === 'string' && p.toLowerCase().includes(query.toLowerCase()))
        )
      ).slice(0, 5);
      setPlaceSuggestions(places as string[]);
    } catch {
      setPlaceSuggestions([]);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setCustomerNameFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setPlaceFilter('');
    setCustomerNameSuggestions([]);
    setPlaceSuggestions([]);
    setFilters(undefined);
    load(false, undefined);
  };

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

  const baseData = list ?? [];
  const listData =
    quickSearch.trim().length > 0
      ? baseData.filter((o) => {
          const q = quickSearch.trim().toLowerCase();
          return (
            (o.where_from && o.where_from.toLowerCase().includes(q)) ||
            (o.where_to && o.where_to.toLowerCase().includes(q))
          );
        })
      : baseData;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={quickSearch}
          onChangeText={setQuickSearch}
          placeholder="Поиск по месту (откуда/докуда)"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderItem
            item={item}
            t={t}
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
      {filtersVisible && (
        <View style={styles.filtersOverlay}>
          <ThemedView style={styles.filtersModal}>
            <ThemedText type="subtitle" style={styles.filtersTitle}>
              {t('orders_filters_title') ?? 'Фильтры'}
            </ThemedText>
            <View style={styles.filtersField}>
              <ThemedText style={styles.filtersLabel}>{t('orders_filter_status') ?? 'Статус'}</ThemedText>
              <View style={styles.statusChipsRow}>
                {(['active', 'expired', 'completed', 'canceled'] as OrderStatus[]).map((status) => {
                  const selected = statusFilter === status;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => setStatusFilter(selected ? '' : status)}
                      style={[
                        styles.statusChip,
                        selected && styles.statusChipSelected,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusChipText,
                          selected && styles.statusChipTextSelected,
                        ]}
                      >
                        {t(ORDER_STATUS_LABEL_KEY[status]) ?? status}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.filtersField}>
              <ThemedText style={styles.filtersLabel}>
                {t('orders_filter_customer_name') ?? 'Имя заказчика'}
              </ThemedText>
              <TextInput
                style={styles.filtersInput}
                value={customerNameFilter}
                onChangeText={handleCustomerNameChange}
                placeholder={t('orders_filter_customer_name_placeholder') ?? 'Иван'}
                placeholderTextColor="#687076"
              />
              {customerNameSuggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  {customerNameSuggestions.map((name) => (
                    <Pressable
                      key={name}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setCustomerNameFilter(name);
                        setCustomerNameSuggestions([]);
                      }}
                    >
                      <ThemedText style={styles.suggestionText}>{name}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.filtersRow}>
              <View style={[styles.filtersField, styles.filtersFieldHalf]}>
                <ThemedText style={styles.filtersLabel}>
                  {t('orders_filter_date_from') ?? 'Дата от (ГГГГ-ММ-ДД)'}
                </ThemedText>
                <TextInput
                  style={styles.filtersInput}
                  value={dateFromFilter}
                  onChangeText={setDateFromFilter}
                  placeholder="2024-01-01"
                  placeholderTextColor="#687076"
                />
              </View>
              <View style={[styles.filtersField, styles.filtersFieldHalf]}>
                <ThemedText style={styles.filtersLabel}>
                  {t('orders_filter_date_to') ?? 'Дата до (ГГГГ-ММ-ДД)'}
                </ThemedText>
                <TextInput
                  style={styles.filtersInput}
                  value={dateToFilter}
                  onChangeText={setDateToFilter}
                  placeholder="2024-12-31"
                  placeholderTextColor="#687076"
                />
              </View>
            </View>
            <View style={styles.filtersField}>
              <ThemedText style={styles.filtersLabel}>
                {t('orders_filter_place') ?? 'Место (откуда/докуда)'}
              </ThemedText>
              <TextInput
                style={styles.filtersInput}
                value={placeFilter}
                onChangeText={handlePlaceChange}
                placeholder={t('orders_filter_place_placeholder') ?? 'Улица, район...'}
                placeholderTextColor="#687076"
              />
              {placeSuggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  {placeSuggestions.map((place) => (
                    <Pressable
                      key={place}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setPlaceFilter(place);
                        setPlaceSuggestions([]);
                      }}
                    >
                      <ThemedText style={styles.suggestionText}>{place}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.filtersButtonsRow}>
              <Pressable
                style={[styles.filtersButton, styles.filtersButtonSecondary]}
                onPress={handleResetFilters}
              >
                <ThemedText style={styles.filtersButtonText}>
                  {t('orders_filters_reset') ?? 'Сбросить'}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.filtersButton, styles.filtersButtonPrimary]}
                onPress={handleApplyFilters}
              >
                <ThemedText style={styles.filtersButtonText}>
                  {t('orders_filters_apply') ?? 'Применить'}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.filtersButton, styles.filtersButtonSecondary]}
                onPress={() => setFiltersVisible(false)}
              >
                <ThemedText style={styles.filtersButtonText}>
                  {t('common_cancel') ?? 'Отмена'}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
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
  filtersOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 64,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  filtersModal: {
    width: '92%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  filtersTitle: {
    marginBottom: 12,
  },
  filtersField: {
    marginBottom: 12,
  },
  filtersLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  filtersInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  suggestionsBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.98)',
    maxHeight: 140,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  suggestionText: {
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  filtersFieldHalf: {
    flex: 1,
  },
  filtersButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filtersButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  filtersButtonPrimary: {
    backgroundColor: '#0a7ea4',
  },
  filtersButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  filtersButtonText: {
    color: '#111827',
    fontSize: 14,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  statusChipSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  statusChipText: {
    fontSize: 13,
  },
  statusChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

