import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { supabase } from '../../utils/supabase';

export default function SignupScreen({ navigation }) {
  const theme = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // First, try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
      });

      console.log('Signup result:', { data: data?.user?.id, error: error?.message });

      if (error) {
        if (error.message?.includes('User already registered')) {
          console.log('User already exists, sending OTP...');
          // User exists, just send OTP for verification
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase(),
            options: {
              shouldCreateUser: false,
            }
          });
          
          setLoading(false);
          
          if (otpError) {
            console.log('OTP error:', otpError.message);
            if (otpError.message?.includes('seconds')) {
              navigation.navigate('OTPVerification', { 
                email: email.toLowerCase(),
                message: 'Please wait a minute before requesting another code.'
              });
            } else {
              setError(otpError.message);
            }
          } else {
            console.log('OTP sent successfully');
            navigation.navigate('OTPVerification', { email: email.toLowerCase() });
          }
          return;
        } else {
          setLoading(false);
          setError(error.message);
          return;
        }
      }

      // Check if user is already confirmed
      if (data.user && data.user.email_confirmed_at) {
        setLoading(false);
        setError('Account already exists and is verified. Please use the login screen.');
        return;
      }

      console.log('User confirmation status:', data.user?.email_confirmed_at);
      console.log('User created at:', data.user?.created_at);

      // If user was created successfully, create profile record
      if (data.user) {
        // First check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Profile doesn't exist, create it
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.toLowerCase(),
                phone_number: phoneNumber,
                created_at: new Date().toISOString(),
              }
            ]);

          if (profileError) {
            console.warn('Profile creation error:', profileError.message);
            // If profiles table doesn't exist, show a helpful error
            if (profileError.message?.includes('relation "profiles" does not exist')) {
              setLoading(false);
              setError('Database setup incomplete. Please contact support.');
              return;
            }
            // Continue anyway - the auth user was created successfully
          }
        } else {
          console.log('Profile already exists, skipping creation');
        }
      }

      // signUp() already sends a confirmation email automatically, no need to resend
      setLoading(false);
      navigation.navigate('OTPVerification', { email: email.toLowerCase() });

    } catch (err) {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    }
  };

  const validateForm = () => {
    // Validate required fields
    if (!firstName.trim()) {
      setError('First name is required.');
      return false;
    }
    if (!lastName.trim()) {
      setError('Last name is required.');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required.');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    // if (!email.trim().toLowerCase().endsWith('@virginia.edu')) {
    //   setError('Only virginia.edu emails are allowed.');
    //   return false;
    // }
    return true;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          style={styles.input}
        />
        <TextInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          style={styles.input}
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          mode="contained"
          onPress={handleSignup}
          loading={loading}
          style={styles.button}
          disabled={!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword || loading}
        >
          Sign Up
        </Button>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, alignSelf: 'center' },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  linkContainer: { marginTop: 24, alignItems: 'center' },
  link: { color: '#1976d2', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
}); 