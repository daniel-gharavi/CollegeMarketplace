import * as React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider theme={DefaultTheme}>
      <AppNavigator />
    </PaperProvider>
  );
}