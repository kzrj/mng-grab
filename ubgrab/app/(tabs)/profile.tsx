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
import { useLanguage } from '@/context/language';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProfile, type AccountInfo } from '@/lib/api/auth';

export default function ProfileScreen() {
  const { token, clearToken } = useAuth();
  const { t } = useLanguage();
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
      try {
        const data = await getProfile(token);
        setAccount(data);
      } catch (err) {
        if (err instanceof Error && /401/.test(err.message)) {
          await clearToken();
          return;
        }
        Alert.alert(t('common_error'), t('profile_error_account'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await clearToken();
    Alert.alert(t('common_done'), t('profile_logout_done'));
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
        {t('profile_title')}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {t('profile_subtitle')}
      </ThemedText>

      {account && (
        <ThemedView style={[styles.card, { backgroundColor: inputBg }]}>
          <ThemedText style={[styles.label, styles.labelFirst]}>{t('profile_name')}</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>{account.name}</ThemedText>

          <ThemedText style={styles.label}>{t('profile_phone')}</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>{account.phone}</ThemedText>

          <ThemedText style={styles.label}>{t('profile_role')}</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>
            {account.role === 'customer'
              ? t('profile_role_customer')
              : t('profile_role_courier')}
          </ThemedText>

          <ThemedText style={styles.label}>{t('profile_created')}</ThemedText>
          <ThemedText style={[styles.value, { color: textColor }]}>
            {formatDate(account.created_at)}
          </ThemedText>
        </ThemedView>
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
        onPress={handleLogout}
      >
        <ThemedText style={styles.logoutButtonText}>{t('profile_logout')}</ThemedText>
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
