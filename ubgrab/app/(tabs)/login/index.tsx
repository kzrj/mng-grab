import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/language';
import { useThemeColor } from '@/hooks/use-theme-color';

import { API_V1 } from '@/constants/api';

const LOGIN_URL = `${API_V1}/auth/login`;
const FETCH_TIMEOUT_MS = 15000;

async function loginApi(phone: string, password: string): Promise<{ access_token: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = typeof data.detail === 'string' ? data.detail : undefined;
      throw new Error(message);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, clearToken, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const inputBg = useThemeColor({ light: '#f0f0f0', dark: '#2a2a2a' }, 'background');

  const handleLogin = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Alert.alert(t('common_error'), t('login_error_phone'));
      return;
    }
    if (!password) {
      Alert.alert(t('common_error'), t('login_error_password'));
      return;
    }
    setLoading(true);
    try {
      const data = await loginApi(trimmedPhone, password);
      await setToken(data.access_token);
      Alert.alert(t('common_done'), t('login_done'));
      setPhone('');
      setPassword('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('login_error_timeout')
            : err.message
          : t('login_error_fail');
      Alert.alert(t('login_error_title'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    Alert.alert(t('common_done'), t('login_logout_done'));
  };

  const handleRegister = () => {
    router.push('/(tabs)/login/register');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedText type="title" style={styles.title}>
        {t('login_title')}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {t('login_subtitle')}
      </ThemedText>

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder={t('login_phone_placeholder')}
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        editable={!loading}
      />
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder={t('login_password_placeholder')}
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: tintColor },
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>{t('login_submit')}</ThemedText>
        )}
      </Pressable>

      {isAuthenticated ? (
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          onPress={handleLogout}
          disabled={loading}
        >
          <ThemedText style={styles.logoutButtonText}>{t('login_logout')}</ThemedText>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          onPress={handleRegister}
          disabled={loading}
        >
          <ThemedText style={styles.logoutButtonText}>{t('login_register')}</ThemedText>
        </Pressable>
      )}
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
  button: {
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
