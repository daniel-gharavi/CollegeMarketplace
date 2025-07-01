import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, Title, useTheme, Divider } from 'react-native-paper';
import { supabase } from '../../utils/supabase';

export default function SettingsScreen({ navigation }) {
  const theme = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleChangePassword = async () => {
    // This is the corrected way to get the user in Supabase v2
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "Could not identify the current user.");
      return;
    }
    
    // Proceed with the user's email
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Check your email", `A password reset link has been sent to ${user.email}.`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>Settings</Title>

      <List.Section style={styles.listSection}>
        <List.Item
          title="My Profile & Listings"
          left={props => <List.Icon {...props} icon="person-outline" color={theme.colors.text} />}
          onPress={() => navigation.navigate('Profile')}
          titleStyle={{ color: theme.colors.text }}
        />
      </List.Section>

      <List.Section style={styles.listSection}>
        <List.Item
          title="Change Password"
          left={props => <List.Icon {...props} icon="lock-outline" color={theme.colors.text} />}
          onPress={handleChangePassword}
          titleStyle={{ color: theme.colors.text }}
        />
      </List.Section>

       <List.Section style={styles.listSection}>
        <List.Item
          title="Sign Out"
          left={props => <List.Icon {...props} icon="logout" color={theme.colors.primary} />}
          onPress={handleSignOut}
          titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  listSection: {
    backgroundColor: '#1A294B',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  }
});