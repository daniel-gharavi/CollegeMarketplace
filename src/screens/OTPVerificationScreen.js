import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
      // Add a brief delay for better UX to show success state
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      // Navigation will be handled automatically by the auth state change listener
      // in AppNavigator, so we don't need to manually navigate here
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
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
        textAlign="center"
      />
      
      {error ? (
        <Text style={[styles.error, error.includes('sent') && styles.success]}>
          {error}
        </Text>
      ) : null}
      
      <Button
        mode="contained"
        onPress={handleVerifyOTP}
        loading={loading}
        style={styles.button}
        disabled={otp.length !== 6 || loading}
      >
        Verify Email
      </Button>
      
      <Button
        mode="text"
        onPress={handleResendOTP}
        loading={resending}
        style={styles.resendButton}
        disabled={resending}
      >
        Resend Code
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, alignSelf: 'center' },
  subtitle: { fontSize: 16, marginBottom: 32, alignSelf: 'center', textAlign: 'center', color: '#666' },
  input: { marginBottom: 16, fontSize: 18 },
  button: { marginTop: 8 },
  resendButton: { marginTop: 16 },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
  success: { color: 'green' },
}); 