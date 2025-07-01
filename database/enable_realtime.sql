-- Enable real-time for chat tables
-- Run this in your Supabase SQL editor

-- Enable real-time on conversations table
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable real-time on messages table  
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify real-time is enabled
SELECT schemaname, tablename, hasinserts, hasupdates, hasdeletes, hastriggers 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'; 