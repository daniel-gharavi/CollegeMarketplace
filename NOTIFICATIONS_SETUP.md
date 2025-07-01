# Notifications Setup Guide

This guide explains how to set up push notifications for the chat functionality.

## Database Setup

### 1. Add push_token column to profiles table

Run this SQL in your Supabase SQL editor:

```sql
-- Copy and paste content from database/add_push_token.sql
```

## Features Included

### ✅ **Push Notifications**
- Automatic permission requests when user logs in
- Push token storage in user profiles
- Real-time message notifications

### ✅ **Local Notifications**
- In-app notifications when app is in background
- Notification when receiving messages from other users
- Auto-navigation to chat when notification is tapped

### ✅ **Smart Notification Logic**
- Only shows notifications for messages from other users
- No notifications when app is active (user is already in chat)
- Automatic read receipt handling

## How It Works

### **1. Initialization**
- When user logs in, app requests notification permissions
- Push token is generated and saved to user's profile
- Notification listeners are set up

### **2. Sending Messages**
- When user sends a message, app attempts to send push notification to recipient
- Uses recipient's stored push token from their profile
- Falls back gracefully if push notification fails

### **3. Receiving Messages**
- Real-time messages trigger notification logic
- Local notifications shown if app is in background
- Push notifications sent to other user's device

## Testing Notifications

### **Physical Device Required**
- Push notifications only work on physical devices
- iOS Simulator and Android Emulator don't support push notifications

### **Testing Steps**
1. **Install app on 2 physical devices**
2. **Login with different users on each device**
3. **Start a chat between the users**
4. **Put one app in background**
5. **Send message from the other device**
6. **Background device should receive notification**

## Troubleshooting

### **Common Issues**

#### **No notifications received:**
- Check if notifications are enabled in device settings
- Verify push_token is saved in database
- Check console logs for errors

#### **Notifications not working in development:**
- Ensure you're using physical devices
- Check Expo project configuration
- Verify notification permissions are granted

#### **App doesn't navigate when tapping notification:**
- Check notification payload includes correct data
- Verify navigation is set up properly
- Check console logs for navigation errors

## Configuration

### **Customization Options**

#### **Notification Content:**
- Edit `notificationService.js` to customize notification titles/bodies
- Modify notification icons and colors in `app.json`

#### **Sound and Vibration:**
- Add custom notification sounds to `/assets/` folder
- Configure vibration patterns in notification settings

#### **Notification Channels (Android):**
- Modify `app.json` to add custom notification channels
- Set different priorities for different types of notifications

## Security Notes

- Push tokens are stored securely in Supabase with RLS policies
- Only authenticated users can update their own push tokens
- Notification content is limited to prevent data leakage

## Next Steps (Optional Enhancements)

- Badge count for unread messages
- Rich media notifications (images, actions)
- Notification scheduling for offline users
- Email notifications as fallback
- Notification preferences in settings 