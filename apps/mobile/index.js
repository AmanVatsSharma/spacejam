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

import App from './src/screens/App';
registerRootComponent(App);
