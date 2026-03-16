import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/language';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCouriers, createOrderApi, type Courier } from '@/lib/api/orders';

function formatDateForApi(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CreateOrderScreen() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const tintColor = useThemeColor({}, 'tint');
  const [whereFrom, setWhereFrom] = useState('');
  const [whereTo, setWhereTo] = useState('');
  const [price, setPrice] = useState('');
  const [dateWhen, setDateWhen] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [courierId, setCourierId] = useState<number | null>(null);

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [courierModalVisible, setCourierModalVisible] = useState(false);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const cour = await getCouriers();
      setCouriers(cour);
    } catch {
      setCouriers([]);
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const selectedCourier = couriers.find((c) => c.id === courierId);

  const handleSubmit = async () => {
    const from = whereFrom.trim();
    const to = whereTo.trim();
    const priceTrimmed = price.replace(',', '.').trim();
    const priceNum = priceTrimmed === '' ? 0 : parseFloat(priceTrimmed);

    if (!from) {
      Alert.alert(t('common_error'), t('create_error_from'));
      return;
    }
    if (!to) {
      Alert.alert(t('common_error'), t('create_error_to'));
      return;
    }
    if (priceTrimmed !== '' && (Number.isNaN(priceNum) || priceNum < 0)) {
      Alert.alert(t('common_error'), t('create_error_price'));
      return;
    }
    if (!dateWhen) {
      Alert.alert(t('common_error'), t('create_error_date'));
      return;
    }
    if (!token) {
      Alert.alert(t('common_error'), t('create_error_auth'));
      return;
    }

    setLoadingSubmit(true);
    try {
      await createOrderApi(token, {
        where_from: from,
        where_to: to,
        price: priceNum,
        date_when: formatDateForApi(dateWhen),
        status: 'new',
        courier_id: courierId ?? undefined,
      });
      Alert.alert(t('common_done'), t('create_done'));
      setWhereFrom('');
      setWhereTo('');
      setPrice('');
      setDateWhen(null);
      setCourierId(null);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : '';
      const isInsufficientFunds =
        typeof rawMessage === 'string' &&
        (rawMessage.includes('Недостаточно средств') || rawMessage.includes('insufficient'));
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('create_error_timeout')
            : isInsufficientFunds
              ? t('create_error_insufficient_funds')
              : rawMessage || t('create_error_fail')
          : t('create_error_fail');
      Alert.alert(t('common_error'), message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.title}>
          {t('create_order_title')}
        </ThemedText>
        <ThemedText style={styles.loadingText}>
          {t('create_login_required')}
        </ThemedText>
      </ThemedView>
    );
  }

  if (loadingLists) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>{t('common_loading')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="subtitle" style={styles.title}>
          {t('create_title')}
        </ThemedText>

        <ThemedText style={styles.label}>{t('create_from')}</ThemedText>
        <TextInput
          style={styles.input}
          value={whereFrom}
          onChangeText={setWhereFrom}
          placeholder={t('create_from_placeholder')}
          placeholderTextColor="#687076"
          maxLength={255}
        />

        <ThemedText style={styles.label}>{t('create_to')}</ThemedText>
        <TextInput
          style={styles.input}
          value={whereTo}
          onChangeText={setWhereTo}
          placeholder={t('create_to_placeholder')}
          placeholderTextColor="#687076"
          maxLength={255}
        />

        <ThemedText style={styles.label}>{t('create_price')}</ThemedText>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder={t('create_price_placeholder')}
          placeholderTextColor="#687076"
          keyboardType="decimal-pad"
        />

        <ThemedText style={styles.label}>{t('create_date')}</ThemedText>
        <Pressable
          style={styles.selectButton}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText>
            {dateWhen ? formatDateDisplay(dateWhen) : t('create_date_choose')}
          </ThemedText>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={dateWhen ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDateWhen(selectedDate);
            }}
            minimumDate={new Date()}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <Pressable
            style={styles.datePickerDone}
            onPress={() => setShowDatePicker(false)}
          >
            <ThemedText style={[styles.datePickerDoneText, { color: tintColor }]}>Готово</ThemedText>
          </Pressable>
        )}

        <ThemedText style={styles.label}>{t('create_courier')}</ThemedText>
        <Pressable
          style={styles.selectButton}
          onPress={() => setCourierModalVisible(true)}
        >
          <ThemedText>
            {selectedCourier
              ? `${selectedCourier.phone}${selectedCourier.description ? ` — ${selectedCourier.description}` : ''}`
              : t('create_courier_choose')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.submitButton, { backgroundColor: tintColor }, loadingSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loadingSubmit}
        >
          {loadingSubmit ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitText}>{t('create_submit')}</ThemedText>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={courierModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCourierModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCourierModalVisible(false)}
        >
          <ThemedView style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {t('create_modal_courier')}
            </ThemedText>
            <FlatList
              data={couriers}
              keyExtractor={(item) => String(item.id)}
              ListHeaderComponent={
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setCourierId(null);
                    setCourierModalVisible(false);
                  }}
                >
                  <ThemedText>{t('create_modal_no_courier')}</ThemedText>
                </Pressable>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setCourierId(item.id);
                    setCourierModalVisible(false);
                  }}
                >
                  <ThemedText type="defaultSemiBold">{item.phone}</ThemedText>
                  {item.description ? (
                    <ThemedText style={styles.modalItemDesc}>{item.description}</ThemedText>
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={styles.emptyModal}>{t('create_modal_no_couriers')}</ThemedText>
              }
            />
          </ThemedView>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12 },
  container: { padding: 20, paddingBottom: 40 },
  title: { marginBottom: 20 },
  label: { marginBottom: 6, fontSize: 14, opacity: 0.9 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: { marginBottom: 12 },
  modalItem: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalItemDesc: { marginTop: 4, fontSize: 14, opacity: 0.8 },
  emptyModal: { padding: 14, textAlign: 'center' },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  datePickerDoneText: { fontSize: 16, fontWeight: '600' },
});
