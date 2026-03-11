import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_KEY = '@ubgrab_lang';

export type Locale = 'ru' | 'mn';

export async function getStoredLocale(): Promise<Locale> {
  const value = await AsyncStorage.getItem(LANG_KEY);
  if (value === 'ru' || value === 'mn') return value;
  return 'mn';
}

export async function setStoredLocale(locale: Locale): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, locale);
}
