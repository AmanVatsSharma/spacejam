/**
 * File:        apps/mobile/App.tsx
 * Module:      Mobile · App Entry
 * Purpose:     App root with Apollo Provider and React Navigation
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { apolloClient } from './src/lib/apollo/client';
import HomeScreen from './src/app/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#FF6A2F' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'SpaceJam' }}
          />
          {/* Add more screens here as you build them */}
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
