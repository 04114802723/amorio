"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Video, MessageCircle, Users, Search } from "lucide-react";

const mockFriends = [
  { id: 1, name: "Alex K.", avatar: "A", lastSeen: "Online", country: "UK", vibe: "Deep Talk" },
  { id: 2, name: "Maria L.", avatar: "M", lastSeen: "2 min ago", country: "Spain", vibe: "Chill" },
  { id: 3, name: "James T.", avatar: "J", lastSeen: "1 hour ago", country: "Australia", vibe: "Funny" },
  { id: 4, name: "Priya S.", avatar: "P", lastSeen: "Online", country: "India", vibe: "Chaotic" },
];

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = mockFriends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {filteredFriends.length > 0 ? (
          <div className="space-y-3">
            {filteredFriends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                      {friend.avatar}
                    </div>
                    {friend.lastSeen === "Online" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{friend.name}</div>
                    <div className="text-dark-400 text-sm flex items-center gap-2">
                      <span>{friend.country}</span>
                      <span>•</span>
                      <span className="text-primary-400">{friend.vibe}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/app/chat?friend=${friend.id}`}>
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
            <h3 className="text-xl font-semibold text-white mb-2">No Friends Yet</h3>
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
