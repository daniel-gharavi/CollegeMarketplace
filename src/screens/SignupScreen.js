import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { supabase } from '../../utils/supabase';

export default function SignupScreen({ navigation }) {
  const theme = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
      });

      if (signUpError) {
        if (signUpError.message?.includes('User already registered')) {
          setError('This email is already registered. Please log in.');
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.toLowerCase(),
            phone_number: phoneNumber,
            graduation_year: parseInt(graduationYear, 10),
          },
        ]);

        if (profileError) {
          setError('Could not create your user profile. Please contact support.');
          console.error('Profile creation error:', profileError);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      navigation.navigate('OTPVerification', { email: email.toLowerCase() });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An unexpected error occurred.');
      console.error('Signup error:', err);
    }
  };

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim() || !graduationYear.trim() || !password) {
      setError('All fields are required.');
      return false;
    }
    if (!email.trim().toLowerCase().endsWith('@virginia.edu')) {
      setError('A valid @virginia.edu email is required.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

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
          <Text style={styles.title}>Create Your Account</Text>
        </View>

        <TextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          style={styles.input}
          left={<TextInput.Icon icon="account-outline" />}
        />
        <TextInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          style={styles.input}
          left={<TextInput.Icon icon="account-outline" />}
        />
        <TextInput
          label="UVA Email (@virginia.edu)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          left={<TextInput.Icon icon="email-outline" />}
        />
        <TextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="phone-outline" />}
        />
        <TextInput
          label="Graduation Year"
          value={graduationYear}
          onChangeText={setGraduationYear}
          keyboardType="numeric"
          maxLength={4}
          style={styles.input}
          left={<TextInput.Icon icon="calendar" />}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          left={<TextInput.Icon icon="lock-outline" />}
        />
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          left={<TextInput.Icon icon="lock-check-outline" />}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          mode="contained"
          onPress={handleSignup}
          loading={loading}
          style={styles.button}
          labelStyle={styles.buttonText}
          disabled={loading}
        >
          Sign Up
        </Button>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
          <Text style={styles.link}>
            Already have an account? <Text style={{ fontWeight: 'bold' }}>Log in</Text>
          </Text>
        </TouchableOpacity>
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
    marginBottom: 32,
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
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: '#9CA3AF',
  },
  error: {
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
});