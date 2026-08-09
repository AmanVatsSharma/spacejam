import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ReferAndEarnScreen from '../screens/ReferAndEarnScreen';
import OffersScreen from '../screens/OffersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AvailableRoomsScreen from '../screens/AvailableRoomsScreen';
import QuickBookingScreen from '../screens/QuickBookingScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import EventSuccessScreen from '../screens/EventSuccessScreen';
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import MyRoomDetailsScreen from '../screens/MyRoomDetailsScreen';
import MyEventDetailsScreen from '../screens/MyEventDetailsScreen';
import MyPrintDetailsScreen from '../screens/MyPrintDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import TermsScreen from '../screens/TermsScreen';
import AboutScreen from '../screens/AboutScreen';
import SupportScreen from '../screens/SupportScreen';
import WalletScreen from '../screens/WalletScreen';
import RechargeTokensScreen from '../screens/RechargeTokensScreen';
import AddTokensPaymentScreen from '../screens/AddTokensPaymentScreen';
import PrintPreviewScreen from '../screens/PrintPreviewScreen';
import PrintProcessingScreen from '../screens/PrintProcessingScreen';
import PrintSuccessScreen from '../screens/PrintSuccessScreen';
import MyInvoicesScreen from '../screens/MyInvoicesScreen';
// M4: new screens
import PlansScreen from '../screens/PlansScreen';
import MeetingRoomsScreen from '../screens/MeetingRoomsScreen';

import { useAuth } from '../lib/auth/context';
import { FloatingNavBar } from '../components/FloatingNavBar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Role buckets driving what each user sees. Staff = center managers / admins.
const STAFF_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'CENTER_OWNER', 'CENTER_MANAGER', 'FINANCE', 'SUPPORT', 'STAFF']);
const COMPANY_ROLES = new Set(['EMPLOYEE', 'COMPANY_ADMIN']);

const TabNavigator = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'MEMBER';
  const isStaff = STAFF_ROLES.has(role);
  const isCompany = COMPANY_ROLES.has(role);

  // Build the tab set by role. Everyone gets Home + Bookings + Profile.
  // Company employees get a "Plans" tab (their monthly seat). Staff see the
  // same core tabs (they mostly use the web admin; mobile is for on-floor ops).
  const tabs: { name: string; component: React.ComponentType }[] = [
    { name: 'HomeTab', component: HomeScreen },
  ];
  if (isCompany) {
    tabs.push({ name: 'PlansTab', component: PlansScreen });
  }
  tabs.push(
    { name: 'EventsTab', component: EventsScreen },
    { name: 'MyBookingsTab', component: MyBookingsScreen },
    { name: 'ProfileTab', component: ProfileScreen },
  );
  void isStaff;

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FloatingNavBar
          activeTab={props.state.routes[props.state.index].name.toLowerCase().replace('tab', '') as any}
          onTabChange={(tab) => {
            const map: Record<string, string> = {
              home: 'HomeTab',
              plans: 'PlansTab',
              events: 'EventsTab',
              bookings: 'MyBookingsTab',
              profile: 'ProfileTab',
            };
            props.navigation.navigate(map[tab] ?? 'HomeTab');
          }}
        />
      )}
    >
      {tabs.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} />
      ))}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Return a loading screen or null if handled by splash screen
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="ReferAndEarn" component={ReferAndEarnScreen} />
            <Stack.Screen name="Offers" component={OffersScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="AvailableRooms" component={AvailableRoomsScreen} />
            <Stack.Screen name="MeetingRooms" component={MeetingRoomsScreen} />
            <Stack.Screen name="Plans" component={PlansScreen} />
            <Stack.Screen name="QuickBooking" component={QuickBookingScreen} />
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="EventSuccess" component={EventSuccessScreen} />
            <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
            <Stack.Screen name="MyRoomDetails" component={MyRoomDetailsScreen} />
            <Stack.Screen name="MyEventDetails" component={MyEventDetailsScreen} />
            <Stack.Screen name="MyPrintDetails" component={MyPrintDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="RechargeTokens" component={RechargeTokensScreen} />
            <Stack.Screen name="AddTokensPayment" component={AddTokensPaymentScreen} />
            <Stack.Screen name="PrintPreview" component={PrintPreviewScreen} />
            <Stack.Screen name="PrintProcessing" component={PrintProcessingScreen} />
            <Stack.Screen name="PrintSuccess" component={PrintSuccessScreen} />
            <Stack.Screen name="MyInvoices" component={MyInvoicesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
