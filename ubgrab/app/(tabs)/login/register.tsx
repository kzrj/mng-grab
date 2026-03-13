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
import { useLanguage } from '@/context/language';
import { useThemeColor } from '@/hooks/use-theme-color';
import { registerApi, type RegisterRole } from '@/lib/api/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('customer');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const inputBg = useThemeColor({ light: '#f0f0f0', dark: '#2a2a2a' }, 'background');

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      Alert.alert(t('common_error'), t('register_error_name'));
      return;
    }
    if (!trimmedPhone) {
      Alert.alert(t('common_error'), t('register_error_phone'));
      return;
    }
    if (!password) {
      Alert.alert(t('common_error'), t('register_error_password'));
      return;
    }

    setLoading(true);
    try {
      const data = await registerApi(trimmedName, trimmedPhone, password, role);
      await setToken(data.access_token);
      Alert.alert(t('common_done'), t('register_done'), [
        {
          text: t('common_ok'),
          onPress: () => router.replace('/(tabs)/profile'),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? t('register_error_timeout')
            : err.message
          : t('register_error_fail');
      Alert.alert(t('register_error_title'), message);
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
        {t('register_title')}
      </ThemedText>
      <ThemedText style={styles.subtitle}>{t('register_subtitle')}</ThemedText>

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder={t('register_name_placeholder')}
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder={t('register_phone_placeholder')}
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        editable={!loading}
      />
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder={t('register_password_placeholder')}
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <ThemedText style={styles.roleLabel}>{t('register_role')}</ThemedText>
      <View style={styles.roleRow}>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            role === 'customer' && { borderColor: tintColor, backgroundColor: tintColor + '22' },
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
            {t('register_role_customer')}
          </ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            role === 'courier' && { borderColor: tintColor, backgroundColor: tintColor + '22' },
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
            {t('register_role_courier')}
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: tintColor },
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
            {t('register_submit')}
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
});
