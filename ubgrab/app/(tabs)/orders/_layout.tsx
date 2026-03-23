import { Stack } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/context/language';

const HEADER_HEIGHT = 32;

function OrdersHeader(props: any) {
  const { options, navigation, back } = props;
  const title = options.title ?? options.headerTitle ?? '';
  const headerRight = options.headerRight?.();
  const headerMiddle = options.headerMiddle?.();

  return (
    <View style={styles.headerContainer}>
      {back ? (
        <Pressable
          onPress={navigation.goBack}
          style={styles.backButton}
          hitSlop={8}
        >
          <Text style={styles.backText}>{'‹'}</Text>
        </Pressable>
      ) : null}
      <View style={styles.headerMain}>
        <View style={styles.headerLeft}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>
        </View>
        <View style={styles.headerMiddle}>{headerMiddle ? headerMiddle : null}</View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
    </View>
  );
}

export default function OrdersStackLayout() {
  const { t } = useLanguage();

  return (
    <Stack
      screenOptions={{
        header: (props) => <OrdersHeader {...props} />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('tab_orders'),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t('orders_detail_title'),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    paddingLeft: 0,
    marginRight: 4,
  },
  backText: {
    fontSize: 22,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 0,
    justifyContent: 'flex-start',
  },
  headerMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerRight: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
});

