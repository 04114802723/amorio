"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Video, MessageCircle, Users, Search, Loader2 } from "lucide-react";
import { useFriends } from "@/hooks/useDatabase";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function FriendsPage() {
  const { user, loading: authLoading } = useAuth();
  const { friends, loading: friendsLoading } = useFriends(user?.id);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const filteredFriends = friends.filter((friend) =>
    (friend.friend_name || friend.friend_email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCall = async (friendshipId: string) => {
    if (!user) return;

    const { data, error } = await supabase.rpc("create_or_get_pending_call_room", {
      target_friendship_id: friendshipId,
      requester_id: user.id,
    });

    if (!error && data && data.length > 0) {
      const roomCode = data[0].room_code;
      window.location.href = `/app/call?room=${encodeURIComponent(roomCode)}`;
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/app/friends")}`);
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Please log in to view friends</h2>
          <Link href="/auth/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark-950">
      <div className="fixed inset-0 bg-hero-gradient" />
      
      <div className="relative z-10 max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <Link href="/app" className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />Back
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" /> Friends
            <span className="text-sm font-normal text-dark-400">({friends.length})</span>
          </h1>
          <div className="w-16" />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl glass bg-white/5 border-0 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Friends List */}
        {friendsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredFriends.length > 0 ? (
          <div className="space-y-3">
            {filteredFriends.map((friend, index) => (
              <motion.div
                key={friend.friendship_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                      {friend.friend_avatar ? (
                        <img src={friend.friend_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold">
                          {(friend.friend_name || friend.friend_email)[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    {friend.friend_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {friend.friend_name || friend.friend_email.split("@")[0]}
                    </div>
                    <div className="text-dark-400 text-sm">
                      {friend.friend_online ? (
                        <span className="text-green-400">Online</span>
                      ) : (
                        <span>Last seen {formatLastSeen(friend.friend_last_seen)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/app/chat?friendship=${friend.friendship_id}`}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full glass flex items-center justify-center text-dark-300 hover:text-white hover:bg-white/10"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStartCall(friend.friendship_id)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white"
                  >
                    <Video className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-dark-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "No friends found" : "No Friends Yet"}
            </h3>
            <p className="text-dark-400 mb-6">Start a random call and make some connections!</p>
            <Link href="/app">
              <Button variant="primary">Start Random Call</Button>
            </Link>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
          <p className="text-primary-300 text-sm text-center">
            💜 Friends are made during calls when both people tap "Add Friend"
          </p>
        </div>
      </div>
    </main>
  );
}

function formatLastSeen(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
