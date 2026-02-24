import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_BASE = 'http://192.168.0.14:8000/api/v1';
const SEED_FILL_URL = `${API_BASE}/seed/fill`;
const SEED_CLEAR_URL = `${API_BASE}/seed/clear`;
const FETCH_TIMEOUT_MS = 15000;

async function fetchApi(
  url: string,
  method: 'GET' | 'DELETE' = 'GET'
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { method, signal: controller.signal });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Ошибка ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export default function HomeScreen() {
  const [loadingFill, setLoadingFill] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const loading = loadingFill || loadingClear;

  const handleFillTestData = async () => {
    setLoadingFill(true);
    try {
      const data = (await fetchApi(SEED_FILL_URL)) as {
        message: string;
        customers: number;
        couriers: number;
      };
      Alert.alert(
        'Готово',
        `Тестовые данные добавлены.\nКлиентов: ${data.customers}, курьеров: ${data.couriers}.`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Превышено время ожидания. Проверьте, что сервер запущен и доступен.'
            : err.message
          : 'Не удалось заполнить тестовые данные.';
      Alert.alert('Ошибка', message);
    } finally {
      setLoadingFill(false);
    }
  };

  const handleClearAllData = async () => {
    setLoadingClear(true);
    try {
      const data = (await fetchApi(SEED_CLEAR_URL, 'DELETE')) as {
        message: string;
        reviews: number;
        orders: number;
        customers: number;
        couriers: number;
      };
      Alert.alert(
        'Готово',
        `Все данные удалены.\nОтзывов: ${data.reviews}, заказов: ${data.orders}, заказчиков: ${data.customers}, курьеров: ${data.couriers}.`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Превышено время ожидания.'
            : err.message
          : 'Не удалось удалить данные.';
      Alert.alert('Ошибка', message);
    } finally {
      setLoadingClear(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.greeting}>
        Привет!
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Добро пожаловать в приложение.
      </ThemedText>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleFillTestData}
        disabled={loading}
      >
        {loadingFill ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            Заполнить тестовые данные
          </ThemedText>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.buttonDanger,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleClearAllData}
        disabled={loading}
      >
        {loadingClear ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            Удалить все данные
          </ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  greeting: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#0a7ea4',
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
  buttonDanger: {
    backgroundColor: '#c53030',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
