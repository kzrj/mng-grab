import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth';
import { useThemeColor } from '@/hooks/use-theme-color';

const API_BASE = 'http://192.168.0.14:8000/api/v1';
const ME_URL = `${API_BASE}/auth/me`;

type AccountInfo = {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export default function ProfileScreen() {
  const { token, clearToken } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBg = useThemeColor({ light: '#f0f0f0', dark: '#2a2a2a' }, 'background');

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(ME_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          await clearToken();
          return;
        }
        throw new Error('Не удалось загрузить профиль');
      }
      const data: AccountInfo = await res.json();
      setAccount(data);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить данные аккаунта');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await clearToken();
    Alert.alert('Готово', 'Вы вышли из аккаунта.');
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return s;
    }
  };

  if (loading && !account) {
    return (
      <ThemedView style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} />
      }
    >
      <ThemedText type="title" style={styles.title}>
        Профиль
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Информация об аккаунте
      </ThemedText>

      {account && (
        <ThemedView style={[styles.card, { backgroundColor: inputBg }]}>
          <ThemedText style={[styles.label, styles.labelFirst]}>Имя</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>{account.name}</ThemedText>

          <ThemedText style={styles.label}>Телефон</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>{account.phone}</ThemedText>

          <ThemedText style={styles.label}>Аккаунт создан</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>
            {formatDate(account.created_at)}
          </ThemedText>
        </ThemedView>
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
        onPress={handleLogout}
      >
        <ThemedText style={styles.logoutButtonText}>Выйти из аккаунта</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 12,
    marginBottom: 4,
  },
  labelFirst: {
    marginTop: 0,
  },
  value: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  logoutButtonText: {
    fontSize: 16,
    opacity: 0.8,
  },
});
