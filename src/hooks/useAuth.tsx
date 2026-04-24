"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    return data;
  }, [supabase]);

  // Set user online/offline status
  const setOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    await supabase
      .from("profiles")
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq("id", userId);
  }, [supabase]);

  useEffect(() => {
    if (pathname === "/auth/callback") {
      setLoading(false);
      return;
    }

    let isActive = true;

    const getSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!isActive) return;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await Promise.allSettled([
            fetchProfile(session.user.id),
            setOnlineStatus(session.user.id, true),
          ]);
        }
      } catch (err) {
        console.error("Failed to get session:", err);
        if (!isActive) return;
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (!isActive) return;
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await Promise.allSettled([
              fetchProfile(session.user.id),
              setOnlineStatus(session.user.id, true),
            ]);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("Auth state change failed:", err);
          setProfile(null);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, pathname, setOnlineStatus, supabase]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        await setOnlineStatus(user.id, false);
      }
    } catch (err) {
      console.error("Failed to set offline status on sign out:", err);
    } finally {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out failed:", err);
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
