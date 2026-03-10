import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useThemeColor } from '@/hooks/use-theme-color';

import { API_V1 } from '@/constants/api';

const REGISTER_URL = `${API_V1}/auth/register`;
const FETCH_TIMEOUT_MS = 15000;

type Role = 'customer' | 'courier';

async function registerApi(
  name: string,
  phone: string,
  password: string,
  role: Role
): Promise<{ access_token: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password, role }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = typeof data.detail === 'string' ? data.detail : 'Ошибка регистрации';
      throw new Error(message);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBg = useThemeColor({ light: '#f0f0f0', dark: '#2a2a2a' }, 'background');

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      Alert.alert('Ошибка', 'Введите имя');
      return;
    }
    if (!trimmedPhone) {
      Alert.alert('Ошибка', 'Введите телефон');
      return;
    }
    if (!password) {
      Alert.alert('Ошибка', 'Введите пароль');
      return;
    }

    setLoading(true);
    try {
      const data = await registerApi(trimmedName, trimmedPhone, password, role);
      await setToken(data.access_token);
      Alert.alert('Готово', 'Вы успешно зарегистрированы.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/profile'),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Превышено время ожидания. Проверьте сервер и сеть.'
            : err.message
          : 'Не удалось зарегистрироваться.';
      Alert.alert('Ошибка регистрации', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedText type="title" style={styles.title}>
        Регистрация
      </ThemedText>
      <ThemedText style={styles.subtitle}>Заполните данные для создания аккаунта</ThemedText>

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder="Имя"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder="Телефон"
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        editable={!loading}
      />
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder="Пароль"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <ThemedText style={styles.roleLabel}>Роль</ThemedText>
      <View style={styles.roleRow}>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            role === 'customer' && styles.roleButtonActive,
            pressed && styles.roleButtonPressed,
          ]}
          onPress={() => setRole('customer')}
          disabled={loading}
        >
          <ThemedText
            style={[
              styles.roleButtonText,
              role === 'customer' && styles.roleButtonTextActive,
            ]}
          >
            Заказчик
          </ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            role === 'courier' && styles.roleButtonActive,
            pressed && styles.roleButtonPressed,
          ]}
          onPress={() => setRole('courier')}
          disabled={loading}
        >
          <ThemedText
            style={[
              styles.roleButtonText,
              role === 'courier' && styles.roleButtonTextActive,
            ]}
          >
            Курьер
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.submitButtonText}>
            Зарегистрироваться
          </ThemedText>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 24,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  roleLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999',
  },
  roleButtonActive: {
    borderColor: '#0a7ea4',
    backgroundColor: '#0a7ea422',
  },
  roleButtonPressed: {
    opacity: 0.85,
  },
  roleButtonText: {
    fontSize: 14,
  },
  roleButtonTextActive: {
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
