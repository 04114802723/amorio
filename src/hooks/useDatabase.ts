"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export interface Friend {
  friendship_id: string;
  friend_id: string;
  friend_email: string;
  friend_name: string | null;
  friend_avatar: string | null;
  friend_online: boolean;
  friend_last_seen: string;
  friendship_created_at: string;
}

export interface Message {
  id: string;
  friendship_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_friends', { user_id: userId });
      
      if (error) throw error;
      setFriends(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const addFriend = useCallback(async (friendId: string) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase.rpc('create_friendship', {
        user_a: userId,
        user_b: friendId
      });
      
      if (error) throw error;
      
      // Refresh friends list
      await fetchFriends();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add friend');
      return null;
    }
  }, [userId, supabase, fetchFriends]);

  return { friends, loading, error, addFriend, refetch: fetchFriends };
}

export function useMessages(friendshipId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch messages
  useEffect(() => {
    if (!friendshipId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('friendship_id', friendshipId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${friendshipId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [friendshipId, supabase]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    if (!friendshipId) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        friendship_id: friendshipId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      return null;
    }

    return data;
  }, [friendshipId, supabase]);

  return { messages, loading, sendMessage };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId, supabase]);

  const updateProfile = useCallback(async (updates: { display_name?: string; avatar_url?: string }) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return data;
  }, [userId, supabase]);

  const setOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!userId) return;

    await supabase
      .from('profiles')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);
  }, [userId, supabase]);

  return { profile, loading, updateProfile, setOnlineStatus };
}
