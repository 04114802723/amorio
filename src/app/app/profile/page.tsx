"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MessageCircle, Video, Users, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useDatabase";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { friends, loading: friendsLoading } = useFriends(user?.id);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/app/profile")}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile]);

  const onlineFriendsCount = useMemo(
    () => friends.filter((friend) => friend.friend_online).length,
    [friends]
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile({
        display_name: displayName.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      });
      setSaveMessage("Profile updated successfully.");
    } catch {
      setSaveMessage("Could not update profile right now.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-dark-950">
      <div className="fixed inset-0 bg-hero-gradient" />

      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6 pt-2">
          <Link href="/app" className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <div className="w-16" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 lg:col-span-2"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
                <p className="text-dark-400 text-sm">Only email or Google login users can access AMORIO features.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-300 mb-2 block">Display Name</label>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-dark-300 mb-2 block">Avatar URL</label>
                <input
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-400" />
                <span className="text-dark-300 text-sm">{user.email}</span>
              </div>

              <Button variant="primary" onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Profile
                  </>
                )}
              </Button>

              {saveMessage && <p className="text-sm text-dark-300">{saveMessage}</p>}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">Account Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-dark-300">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Total Friends</span>
                <strong className="text-white">{friends.length}</strong>
              </div>
              <div className="flex items-center justify-between text-dark-300">
                <span>Online Friends</span>
                <strong className="text-white">{onlineFriendsCount}</strong>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/app/friends" className="w-full">
                <Button variant="secondary" className="w-full">Open Friends List</Button>
              </Link>
              <Link href="/app/chat" className="w-full">
                <Button variant="secondary" className="w-full">Open Chats</Button>
              </Link>
            </div>
          </motion.aside>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Friends on Your Profile</h2>
            <span className="text-dark-400 text-sm">Newly added friends appear here automatically</span>
          </div>

          {friendsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-dark-400">No friends yet. Start a random call and add friends during chat.</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.friendship_id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                      {friend.friend_avatar ? (
                        <img src={friend.friend_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold">
                          {(friend.friend_name || friend.friend_email)[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white truncate">{friend.friend_name || friend.friend_email.split("@")[0]}</p>
                      <p className="text-dark-400 text-sm truncate">{friend.friend_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/app/chat?friendship=${friend.friendship_id}`}>
                      <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-dark-300 hover:text-white">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href="/app/friends">
                      <button className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white">
                        <Video className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
