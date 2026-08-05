import { registerRootComponent } from 'expo';
import { LogBox, AppState, AppStateStatus, Platform } from 'react-native';

// Surface errors in release builds (normally silent)
if (__DEV__ === false) {
  const _log = console.error;
  console.error = (...args: any[]) => {
    _log('[APP ERROR]', ...args);
  };

  const originalHandler = ErrorUtils?.getGlobalHandler?.();
  ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    console.error('[FATAL]', error?.message, error?.stack);
    if (originalHandler) originalHandler(error, isFatal);
  });
}

import React from 'react';
import App from './src/screens/App';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './src/lib/apollo/client';
import { AuthProvider } from './src/lib/auth/context';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Root = () => (
  <SafeAreaProvider>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <App />
        <Toast />
      </AuthProvider>
    </ApolloProvider>
  </SafeAreaProvider>
);

registerRootComponent(Root);
