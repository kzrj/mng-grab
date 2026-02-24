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

const API_BASE = 'http://192.168.0.14:8000/api/v1';
const ORDERS_URL = `${API_BASE}/orders`;
const COURIERS_URL = `${API_BASE}/couriers`;
const FETCH_TIMEOUT_MS = 10000;

type Courier = { id: number; phone: string; description: string | null };

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

async function createOrder(
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || `Ошибка ${response.status}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

export default function CreateOrderScreen() {
  const { token, isAuthenticated } = useAuth();
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
      const cour = await fetchJson<Courier[]>(COURIERS_URL);
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
      Alert.alert('Ошибка', 'Укажите адрес отправления');
      return;
    }
    if (!to) {
      Alert.alert('Ошибка', 'Укажите адрес назначения');
      return;
    }
    if (priceTrimmed !== '' && (Number.isNaN(priceNum) || priceNum < 0)) {
      Alert.alert('Ошибка', 'Укажите корректную цену (число ≥ 0)');
      return;
    }
    if (!dateWhen) {
      Alert.alert('Ошибка', 'Выберите дату заказа');
      return;
    }
    if (!token) {
      Alert.alert('Ошибка', 'Войдите в аккаунт');
      return;
    }

    setLoadingSubmit(true);
    try {
      await createOrder(token, {
        where_from: from,
        where_to: to,
        price: priceNum,
        date_when: formatDateForApi(dateWhen),
        status: 'new',
        courier_id: courierId ?? undefined,
      });
      Alert.alert('Готово', 'Заказ создан');
      setWhereFrom('');
      setWhereTo('');
      setPrice('');
      setDateWhen(null);
      setCourierId(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Превышено время ожидания'
            : err.message
          : 'Не удалось создать заказ';
      Alert.alert('Ошибка', message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.title}>
          Создание заказа
        </ThemedText>
        <ThemedText style={styles.loadingText}>
          Войдите в аккаунт, чтобы создавать заказы.
        </ThemedText>
      </ThemedView>
    );
  }

  if (loadingLists) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Загрузка…</ThemedText>
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
          Новый заказ
        </ThemedText>

        <ThemedText style={styles.label}>Адрес отправления *</ThemedText>
        <TextInput
          style={styles.input}
          value={whereFrom}
          onChangeText={setWhereFrom}
          placeholder="Откуда везти"
          placeholderTextColor="#687076"
          maxLength={255}
        />

        <ThemedText style={styles.label}>Адрес назначения *</ThemedText>
        <TextInput
          style={styles.input}
          value={whereTo}
          onChangeText={setWhereTo}
          placeholder="Куда везти"
          placeholderTextColor="#687076"
          maxLength={255}
        />

        <ThemedText style={styles.label}>Цена (₽)</ThemedText>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Необязательно"
          placeholderTextColor="#687076"
          keyboardType="decimal-pad"
        />

        <ThemedText style={styles.label}>Дата заказа *</ThemedText>
        <Pressable
          style={styles.selectButton}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText>
            {dateWhen ? formatDateDisplay(dateWhen) : 'Выбрать дату'}
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
            <ThemedText style={styles.datePickerDoneText}>Готово</ThemedText>
          </Pressable>
        )}

        <ThemedText style={styles.label}>Курьер (необязательно)</ThemedText>
        <Pressable
          style={styles.selectButton}
          onPress={() => setCourierModalVisible(true)}
        >
          <ThemedText>
            {selectedCourier
              ? `${selectedCourier.phone}${selectedCourier.description ? ` — ${selectedCourier.description}` : ''}`
              : 'Выбрать курьера'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.submitButton, loadingSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loadingSubmit}
        >
          {loadingSubmit ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitText}>Создать заказ</ThemedText>
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
              Курьер
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
                  <ThemedText>Не назначать</ThemedText>
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
                <ThemedText style={styles.emptyModal}>Нет курьеров</ThemedText>
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
    backgroundColor: '#0a7ea4',
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
  datePickerDoneText: { fontSize: 16, fontWeight: '600', color: '#0a7ea4' },
});
