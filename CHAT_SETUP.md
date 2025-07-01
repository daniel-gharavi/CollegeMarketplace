# Chat Functionality Setup Guide

This guide explains how to set up the chat functionality in your College Marketplace app.

## Database Setup

### 1. Run the SQL Schema

Copy and run the SQL code from `database/chat_schema.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire content from `database/chat_schema.sql`
5. Run the query

This will create:
- `conversations` table
- `messages` table
- Proper indexes for performance
- Row Level Security (RLS) policies
- Database triggers for auto-updating timestamps

### 2. Verify Tables

After running the schema, verify the tables were created:

```sql
-- Check conversations table
SELECT * FROM conversations LIMIT 5;

-- Check messages table  
SELECT * FROM messages LIMIT 5;
```

## Features Included

### ✅ **Real-time Messaging**
- Live message updates using Supabase real-time subscriptions
- Messages appear instantly for both users

### ✅ **Conversation Management**
- Automatic conversation creation between users
- Links conversations to specific marketplace items
- Prevents duplicate conversations

### ✅ **Security**
- Row Level Security (RLS) ensures users only see their own conversations
- Authenticated users only
- Proper foreign key constraints

### ✅ **UI/UX**
- Modern chat interface with bubbles
- Automatic scrolling to latest messages
- Loading states and error handling
- Message timestamps
- Empty state for new conversations

## How It Works

1. **Starting a Chat**: When user taps "Chat" button in ContactSellerBottomSheet
2. **Conversation Creation**: System creates or finds existing conversation between buyer and seller
3. **Real-time Updates**: Both users see messages instantly via Supabase subscriptions
4. **Message Storage**: All messages stored in `messages` table with proper relationships

## Usage

The chat functionality is automatically integrated:

1. User views a marketplace item
2. Taps "Contact Seller" 
3. Taps "Chat" button
4. Chat screen opens with real-time messaging

## Database Schema Overview

```
conversations
├── id (UUID, primary key)
├── buyer_id (UUID, references auth.users)
├── seller_id (UUID, references auth.users)  
├── item_id (UUID, references marketplace_items, optional)
├── created_at (timestamp)
└── updated_at (timestamp)

messages
├── id (UUID, primary key)
├── conversation_id (UUID, references conversations)
├── sender_id (UUID, references auth.users)
├── content (text)
├── read_at (timestamp, optional)
└── created_at (timestamp)
```

## Next Steps (Optional Enhancements)

- Push notifications for new messages
- Image/file sharing in chat
- Message status indicators (delivered/read)
- Chat list screen to view all conversations
- Delete/archive conversations 