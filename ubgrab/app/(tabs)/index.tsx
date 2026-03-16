import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/context/language';
import { useThemeColor } from '@/hooks/use-theme-color';

import {
  API_BASE,
  getCustomers,
  getCouriers,
  fillSeed,
  clearSeed,
  topupAccount,
  type UserItem,
} from '@/lib/api/seed';

type UserItemWithSection = UserItem & { _sectionKey: string };

type SectionKey = 'customer' | 'courier';

type UserSection = {
  sectionKey: SectionKey;
  title: string;
  data: UserItemWithSection[];
};

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

function UserItemRow({
  item,
  t,
  onTopupPress,
}: {
  item: UserItemWithSection;
  t: (k: import('@/i18n/translations').TranslationKey, p?: Record<string, string | number>) => string;
  onTopupPress?: (item: UserItemWithSection) => void;
}) {
  const isCustomer = item._sectionKey === 'customer';
  const hasAccount = item.account_id != null;
  const canTopup = isCustomer && hasAccount && onTopupPress;

  return (
    <ThemedView style={styles.item}>
      <ThemedText type="defaultSemiBold">{item.phone}</ThemedText>
      {item.description ? (
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      ) : null}
      <ThemedText style={styles.meta}>
        {t('test_id')}: {item.id}
        {item.account_id != null ? ` · ${t('test_account')}: ${item.account_id}` : ''} · {formatDate(item.created_at)}
      </ThemedText>
      {isCustomer && hasAccount ? (
        <ThemedText style={styles.meta}>
          {t('test_balance')}: {typeof item.balance === 'number' ? item.balance : 0} ₽
        </ThemedText>
      ) : null}
      {canTopup ? (
        <Pressable style={styles.topupButton} onPress={() => onTopupPress?.(item)}>
          <ThemedText style={styles.topupButtonText}>{t('test_topup')}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

function CollapsibleSectionHeader({
  title,
  count,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sectionBg = useThemeColor({}, 'border');
  return (
    <Pressable
      style={({ pressed }) => [styles.sectionHeader, { backgroundColor: sectionBg }, pressed && styles.sectionHeaderPressed]}
      onPress={onToggle}
    >
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title} ({count})
      </ThemedText>
      <ThemedText style={styles.sectionChevron}>
        {expanded ? '▼' : '▶'}
      </ThemedText>
    </Pressable>
  );
}

function MainHeader({
  loadingFill,
  loadingClear,
  onFill,
  onClear,
  t,
  locale,
  onLocaleChange,
}: {
  loadingFill: boolean;
  loadingClear: boolean;
  onFill: () => void;
  onClear: () => void;
  t: (k: import('@/i18n/translations').TranslationKey, p?: Record<string, string | number>) => string;
  locale: 'ru' | 'mn';
  onLocaleChange: (locale: 'ru' | 'mn') => void;
}) {
  const loading = loadingFill || loadingClear;
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  return (
    <ThemedView style={styles.headerBlock}>
      <View style={styles.langRow}>
        <ThemedText style={styles.langLabel}>{t('test_lang')}: </ThemedText>
        <Pressable
          style={[styles.langButton, locale === 'ru' && styles.langButtonActive]}
          onPress={() => onLocaleChange('ru')}
        >
          <ThemedText style={[styles.langButtonText, locale === 'ru' && styles.langButtonTextActive]}>RU</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.langButton, locale === 'mn' && styles.langButtonActive]}
          onPress={() => onLocaleChange('mn')}
        >
          <ThemedText style={[styles.langButtonText, locale === 'mn' && styles.langButtonTextActive]}>MN</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="title" style={styles.greeting}>
        {t('test_greeting')}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {t('test_welcome')}
      </ThemedText>
      <ThemedText style={styles.apiHint}>
        API: {API_BASE}
      </ThemedText>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: tintColor },
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={onFill}
        disabled={loading}
      >
        {loadingFill ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {t('test_fill_data')}
          </ThemedText>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: errorColor },
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={onClear}
        disabled={loading}
      >
        {loadingClear ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {t('test_clear_data')}
          </ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const SECTION_KEYS: SectionKey[] = ['customer', 'courier'];

export default function TestScreen() {
  const { t, locale, setLocale } = useLanguage();
  const borderColor = useThemeColor({}, 'border');
  const [sections, setSections] = useState<UserSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingFill, setLoadingFill] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>(() =>
    Object.fromEntries(SECTION_KEYS.map((k) => [k, false])) as Record<SectionKey, boolean>
  );
  const [topupTarget, setTopupTarget] = useState<UserItemWithSection | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupVisible, setTopupVisible] = useState(false);

  const toggleSection = useCallback((key: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [customers, couriers] = await Promise.all([getCustomers(), getCouriers()]);
      const customerData = customers.map((c) => ({ ...c, _sectionKey: 'customer' }));
      const courierData = couriers.map((c) => ({ ...c, _sectionKey: 'courier' }));
      setSections([
        { sectionKey: 'customer', title: '', data: customerData },
        { sectionKey: 'courier', title: '', data: courierData },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('test_error_timeout')
            : err.message
          : t('test_error_load_users');
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFillTestData = async () => {
    setLoadingFill(true);
    try {
      const data = await fillSeed();
      Alert.alert(
        t('common_done'),
        t('test_done_fill', { customers: data.customers, couriers: data.couriers })
      );
      load();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('test_error_fill')
            : err.message
          : t('test_error_fill');
      Alert.alert(t('common_error'), message);
    } finally {
      setLoadingFill(false);
    }
  };

  const handleClearAllData = async () => {
    setLoadingClear(true);
    try {
      const data = await clearSeed();
      Alert.alert(
        t('common_done'),
        t('test_done_clear', {
          reviews: data.reviews,
          orders: data.orders,
          customers: data.customers,
          couriers: data.couriers,
        })
      );
      load();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('test_error_timeout')
            : err.message
          : t('test_error_clear');
      Alert.alert(t('common_error'), message);
    } finally {
      setLoadingClear(false);
    }
  };

  const listHeader = (
    <MainHeader
      loadingFill={loadingFill}
      loadingClear={loadingClear}
      onFill={handleFillTestData}
      onClear={handleClearAllData}
      t={t}
      locale={locale}
      onLocaleChange={setLocale}
    />
  );

  const displaySections = sections.map((s) => ({
    ...s,
    title: s.sectionKey === 'customer' ? t('test_section_customers') : t('test_section_couriers'),
    data: expandedSections[s.sectionKey] ? s.data : [],
  }));
  const totalItems = sections.reduce((sum, s) => sum + s.data.length, 0);

  const handleTopupConfirm = useCallback(async () => {
    if (!topupTarget || topupTarget.account_id == null) {
      setTopupVisible(false);
      return;
    }
    const raw = topupAmount.replace(',', '.').trim();
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(t('common_error'), t('test_topup_invalid_amount'));
      return;
    }
    setTopupLoading(true);
    try {
      await topupAccount(topupTarget.account_id, amount);
      Alert.alert(t('common_done'), t('test_topup_done'));
      setTopupVisible(false);
      await load(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('test_error_timeout')
            : err.message || t('test_topup_error')
          : t('test_topup_error');
      Alert.alert(t('common_error'), message);
    } finally {
      setTopupLoading(false);
    }
  }, [topupTarget, topupAmount, t, load]);

  const listEmpty =
    loading && sections.length === 0 ? (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>{t('common_loading')}</ThemedText>
      </ThemedView>
    ) : error && sections.length === 0 ? (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    ) : (
      <ThemedText style={styles.emptyText}>{t('test_no_users')}</ThemedText>
    );

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={displaySections}
        keyExtractor={(item) => `${item._sectionKey}-${item.id}`}
        renderItem={({ item }) => (
          <UserItemRow item={item} t={t} onTopupPress={(u) => {
            setTopupTarget(u);
            setTopupAmount('');
            setTopupVisible(true);
          }} />
        )}
        renderSectionHeader={({ section }) => {
          const originalSection = sections.find((s) => s.sectionKey === section.sectionKey);
          const count = originalSection?.data.length ?? 0;
          return (
            <CollapsibleSectionHeader
              title={section.title}
              count={count}
              expanded={!!expandedSections[section.sectionKey]}
              onToggle={() => toggleSection(section.sectionKey)}
            />
          );
        }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={listHeader}
        contentContainerStyle={totalItems === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: borderColor }]} />}
        SectionSeparatorComponent={() => <View style={[styles.sectionSeparator, { backgroundColor: borderColor }]} />}
      />
      {topupVisible && (
        <View style={styles.topupModalOverlay}>
          <ThemedView style={styles.topupModal}>
            <ThemedText type="subtitle" style={styles.topupTitle}>
              {t('test_topup_title')}
            </ThemedText>
            {topupTarget && (
              <ThemedText style={styles.topupSubtitle}>
                {topupTarget.phone}
                {topupTarget.account_id != null
                  ? ` · ${t('test_account')}: ${topupTarget.account_id}`
                  : ''}
              </ThemedText>
            )}
            <View style={styles.topupInputWrapper}>
              <ThemedText style={styles.topupLabel}>{t('test_topup_amount_placeholder')}</ThemedText>
              <View style={styles.topupInputRow}>
                <TextInput
                  style={styles.topupInput}
                  value={topupAmount}
                  onChangeText={setTopupAmount}
                  placeholder={t('test_topup_amount_placeholder')}
                  placeholderTextColor="#687076"
                  keyboardType="decimal-pad"
                  editable={!topupLoading}
                />
              </View>
            </View>
            <View style={styles.topupButtonsRow}>
              <Pressable
                style={[styles.button, styles.topupButtonSecondary]}
                onPress={() => !topupLoading && setTopupVisible(false)}
                disabled={topupLoading}
              >
                <ThemedText style={styles.buttonText}>{t('common_cancel')}</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.topupButtonPrimary]}
                onPress={handleTopupConfirm}
                disabled={topupLoading}
              >
                {topupLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>{t('common_ok')}</ThemedText>
                )}
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
  headerBlock: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  langLabel: {
    fontSize: 14,
    opacity: 0.9,
  },
  langButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  langButtonActive: {
    borderColor: '#0a7ea4',
    backgroundColor: 'rgba(10, 126, 164, 0.15)',
  },
  langButtonText: {
    fontSize: 14,
  },
  langButtonTextActive: {
    fontWeight: '600',
  },
  greeting: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
  },
  apiHint: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 24,
  },
  button: {
    marginBottom: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeaderPressed: {
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 15,
    opacity: 0.9,
  },
  sectionChevron: {
    fontSize: 12,
    opacity: 0.8,
  },
  sectionSeparator: {
    height: 16,
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
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
  },
  topupButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  topupButtonText: {
    fontSize: 12,
    opacity: 0.9,
  },
  topupModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topupModal: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
  },
  topupTitle: {
    marginBottom: 8,
  },
  topupSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
  },
  topupInputWrapper: {
    marginBottom: 16,
  },
  topupLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  topupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topupInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  topupButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  topupButtonSecondary: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    minWidth: 120,
  },
  topupButtonPrimary: {
    backgroundColor: '#0a7ea4',
    minWidth: 140,
  },
});
