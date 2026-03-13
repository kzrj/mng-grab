import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/language';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getProfile, type RegisterRole } from '@/lib/api/auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, token } = useAuth();
  const { t } = useLanguage();

  const [role, setRole] = useState<RegisterRole | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      if (!token) {
        setRole(null);
        return;
      }
      try {
        const profile = await getProfile(token);
        if (!cancelled) {
          setRole(profile.role);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
        }
      }
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const headerHeight = 80;
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      initialRouteName="orders"
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarShowLabel: true,
        headerShown: true,
        headerTitle: t('tab_header'),
        headerStyle: { height: headerHeight, backgroundColor: colors.surface },
        headerTitleAlign: 'center',
        headerTintColor: colors.tint,
        headerShadowVisible: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_test'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="questionmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tab_orders'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="shippingbox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-order"
        options={{
          href: role === 'customer' ? undefined : null,
          title: t('tab_create_order'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: isAuthenticated ? null : undefined,
          title: t('tab_login'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: !isAuthenticated ? null : undefined,
          title: t('tab_profile'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
