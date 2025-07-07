import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { supabase } from '../../utils/supabase';

export default function OTPVerificationScreen({ route, navigation }) {
  const theme = useTheme();
  const { email, message } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(message || '');

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setLoading(false);
      setError(error.message);
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      // Navigation is handled by the auth state listener
      console.log('Email verification successful, auth state will handle navigation');
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    setResending(false);

    if (error) {
      if (error.message?.includes('seconds')) {
        setError('Please wait a minute before requesting another code.');
      } else {
        setError(error.message);
      }
    } else {
      setError('New code sent to your email!');
    }
  };
  
  const isButtonDisabled = otp.length !== 6 || loading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
            <Text style={styles.appName}>HooMart</Text>
            <Text style={styles.title}>Verify Your Email</Text>
        </View>

        <Text style={styles.subtitle}>
          We sent a 6-digit code to {email}
        </Text>

        <TextInput
          label="Enter 6-digit code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
          left={<TextInput.Icon icon="numeric-6-box-outline" />}
          theme={{ colors: { text: 'white' } }}
        />

        {error ? (
          <Text style={[styles.message, error.includes('sent') ? styles.success : styles.error]}>
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleVerifyOTP}
          loading={loading}
          style={[
            styles.button,
            { backgroundColor: isButtonDisabled ? '#374151' : theme.colors.primary }
          ]}
          labelStyle={styles.buttonText}
          disabled={isButtonDisabled}
        >
          Verify Email
        </Button>

        <Button
          mode="text"
          onPress={handleResendOTP}
          loading={resending}
          style={styles.resendButton}
          disabled={resending}
          textColor={theme.colors.placeholder}
        >
          Resend Code
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    alignSelf: 'center',
    textAlign: 'center',
    color: '#9CA3AF',
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
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 16,
  },
  message: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#EF4444',
  },
  success: {
    color: '#22C55E',
  },
});