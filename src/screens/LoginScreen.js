import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { supabase } from '../../utils/supabase';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  // --- ADDED THIS FUNCTION ---
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'collegemarketplace://reset-password', // Optional: deep link back to your app
    });

    if (error) {
      setError(error.message);
    } else {
      Alert.alert('Check your email', `A password reset link has been sent to ${email}.`);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
            <Text style={styles.appName}>HooMart</Text>
            <Text style={styles.title}>Welcome Back</Text>
        </View>

        <View style={styles.form}>
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                left={<TextInput.Icon icon="email-outline" />}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
                labelStyle={styles.buttonText}
                disabled={loading}
            >
                Login
            </Button>
        </View>

        <View style={styles.footer}>
            {/* --- ADDED THIS LINK --- */}
            <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ marginTop: 24 }}>
                <Text style={styles.link}>Don't have an account? <Text style={{fontWeight: 'bold'}}>Sign up</Text></Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
      alignItems: 'center',
      marginBottom: 40,
  },
  appName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1,
  },
  title: {
      fontSize: 18,
      color: '#9CA3AF',
      marginTop: 8,
  },
  form: {
      width: '100%',
  },
  input: {
      marginBottom: 16,
      backgroundColor: '#1A294B',
  },
  button: {
      marginTop: 8,
      paddingVertical: 8,
      borderRadius: 12,
  },
  buttonText: {
      fontSize: 16,
      fontWeight: 'bold'
  },
  footer: {
      marginTop: 24,
      alignItems: 'center'
  },
  link: {
      color: '#9CA3AF',
  },
  error: {
      color: '#EF4444',
      marginBottom: 12,
      textAlign: 'center'
  },
});