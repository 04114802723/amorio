"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Video, Search, Users, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFriends, useMessages, Friend } from "@/hooks/useDatabase";
import { createClient } from "@/lib/supabase/client";

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onStartChat?: (friendshipId: string, friend: Friend) => void;
  onStartCall?: (friendshipId: string, friend: Friend) => void;
}

export function FriendsPanel({ isOpen, onClose, userId, onStartChat, onStartCall }: FriendsPanelProps) {
  const { friends, loading } = useFriends(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [view, setView] = useState<"list" | "chat">("list");

  const filteredFriends = friends.filter(
    (friend) =>
      friend.friend_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.friend_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setView("chat");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedFriend(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-900 border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              {view === "chat" && selectedFriend ? (
                <>
                  <button onClick={handleBackToList} className="p-2 hover:bg-white/10 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex items-center gap-3 flex-1 ml-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                      {selectedFriend.friend_avatar ? (
                        <img src={selectedFriend.friend_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold">
                          {(selectedFriend.friend_name || selectedFriend.friend_email)[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {selectedFriend.friend_name || selectedFriend.friend_email.split("@")[0]}
                      </h3>
                      <span className={`text-xs ${selectedFriend.friend_online ? "text-green-400" : "text-dark-400"}`}>
                        {selectedFriend.friend_online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-400" />
                    <h2 className="text-white font-semibold">Friends</h2>
                    <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs">
                      {friends.length}
                    </span>
                  </div>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            {view === "list" ? (
              <>
                {/* Search */}
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Friends List */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Users className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                      <p className="text-dark-400">
                        {searchQuery ? "No friends found" : "No friends yet"}
                      </p>
                      <p className="text-dark-500 text-sm mt-2">
                        Make friends during random calls!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 px-2">
                      {filteredFriends.map((friend) => (
                        <motion.div
                          key={friend.friendship_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer group"
                          onClick={() => handleSelectFriend(friend)}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                              {friend.friend_avatar ? (
                                <img src={friend.friend_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-white font-semibold text-lg">
                                  {(friend.friend_name || friend.friend_email)[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            {/* Online indicator */}
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-900 ${
                              friend.friend_online ? "bg-green-500" : "bg-dark-500"
                            }`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">
                              {friend.friend_name || friend.friend_email.split("@")[0]}
                            </h3>
                            <p className="text-dark-400 text-sm truncate">
                              {friend.friend_online ? "Online now" : `Last seen ${formatLastSeen(friend.friend_last_seen)}`}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartChat?.(friend.friendship_id, friend);
                              }}
                              className="p-2 rounded-full hover:bg-primary-500/20 text-primary-400"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartCall?.(friend.friendship_id, friend);
                              }}
                              className="p-2 rounded-full hover:bg-green-500/20 text-green-400"
                            >
                              <Video className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              selectedFriend && (
                <ChatView
                  friendshipId={selectedFriend.friendship_id}
                  userId={userId}
                  friend={selectedFriend}
                />
              )
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Chat View Component
function ChatView({ friendshipId, userId, friend }: { friendshipId: string; userId: string; friend: Friend }) {
  const { messages, loading, sendMessage } = useMessages(friendshipId);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage.trim(), userId);
    setNewMessage("");
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400">No messages yet</p>
            <p className="text-dark-500 text-sm">Say hi to {friend.friend_name || "your friend"}!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.sender_id === userId
                    ? "bg-primary-500 text-white"
                    : "bg-dark-800 text-white"
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === userId ? "text-white/70" : "text-dark-400"
                }`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button variant="primary" onClick={handleSend} disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
