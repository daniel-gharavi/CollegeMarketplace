import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { supabase } from '../../utils/supabase';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setResetMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data?.user?.confirmed_at === null) {
      setError('Please confirm your email before logging in.');
    } else {
      // Navigation will be handled automatically by the auth state change listener
      // in AppNavigator, so we don't need to manually navigate here
      console.log('Login successful, auth state will handle navigation');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResetLoading(true);
    setError('');
    setResetMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'collegemp://reset-password',
    });

    setResetLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetMessage('Password reset email sent! Check your inbox.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {resetMessage ? <Text style={styles.success}>{resetMessage}</Text> : null}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            disabled={!email || !password || loading}
          >
            Login
          </Button>
          <TouchableOpacity 
            onPress={handleResetPassword} 
            style={styles.resetContainer}
            disabled={resetLoading}
          >
            <Text style={[styles.resetLink, resetLoading && styles.disabledLink]}>
              {resetLoading ? 'Sending...' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.linkContainer}>
            <Text style={styles.link}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%'
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, alignSelf: 'center' },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  resetContainer: { marginTop: 16, alignItems: 'center' },
  resetLink: { color: '#666', fontWeight: '500' },
  disabledLink: { color: '#ccc' },
  linkContainer: { marginTop: 24, alignItems: 'center' },
  link: { color: '#1976d2', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
  success: { color: 'green', marginBottom: 12, textAlign: 'center' },
}); 