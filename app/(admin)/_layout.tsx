import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Store, ChartBar as BarChart3, Settings } from 'lucide-react-native';
import { Colors } from '@/lib/theme';

export default function AdminLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: 'Shops',
          tabBarIcon: ({ size, color }) => <Store size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
