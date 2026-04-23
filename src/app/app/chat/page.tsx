"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Video, Send, Phone, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends, useMessages } from "@/hooks/useDatabase";
import { createClient } from "@/lib/supabase/client";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendshipIdFromUrl = searchParams.get("friendship");
  
  const { user, loading: authLoading } = useAuth();
  const { friends, loading: friendsLoading } = useFriends(user?.id);
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string | null>(friendshipIdFromUrl);
  const [showCallModal, setShowCallModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Get selected friend
  const selectedFriend = friends.find(f => f.friendship_id === selectedFriendshipId);
  
  // Get messages for selected friendship
  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedFriendshipId || undefined);
  const [messageInput, setMessageInput] = useState("");

  // Set initial selection from URL
  useEffect(() => {
    if (friendshipIdFromUrl) {
      setSelectedFriendshipId(friendshipIdFromUrl);
    }
  }, [friendshipIdFromUrl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user?.id) return;
    await sendMessage(messageInput.trim(), user.id);
    setMessageInput("");
  };

  const handleStartCall = async () => {
    if (!selectedFriend || !user || !selectedFriendshipId) return;

    const { data, error } = await supabase.rpc("create_or_get_pending_call_room", {
      target_friendship_id: selectedFriendshipId,
      requester_id: user.id,
    });

    if (!error && data && data.length > 0) {
      const room = data[0];
      const roomCode = room.room_code;
      const callPath = `/app/call?room=${encodeURIComponent(roomCode)}`;
      const callUrl = `${window.location.origin}${callPath}`;

      if (room.room_is_new) {
        await sendMessage(`📹 Video call invite: ${callUrl}`, user.id);
      }

      setShowCallModal(false);
      window.location.href = callPath;
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      const search = searchParams.toString();
      const redirect = search ? `/app/chat?${search}` : "/app/chat";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [authLoading, user, router, searchParams]);

  if (authLoading || friendsLoading) {
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
          <h2 className="text-xl font-bold text-white mb-4">Please log in to chat</h2>
          <Link href="/auth/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark-950 flex">
      <div className="fixed inset-0 bg-hero-gradient -z-10" />

      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${selectedFriendshipId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/app" className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <div className="w-5" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-dark-400">No conversations yet</p>
              <p className="text-dark-500 text-sm mt-2">Make friends during random calls!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <motion.button
                key={friend.friendship_id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                onClick={() => setSelectedFriendshipId(friend.friendship_id)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                  selectedFriendshipId === friend.friendship_id ? "bg-white/10" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                    {friend.friend_avatar ? (
                      <Image src={friend.friend_avatar} alt="" width={48} height={48} className="w-full h-full object-cover" />
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
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">
                    {friend.friend_name || friend.friend_email.split("@")[0]}
                  </div>
                  <div className="text-dark-400 text-sm">
                    {friend.friend_online ? "Online" : "Offline"}
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedFriendshipId && selectedFriend ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="md:hidden text-dark-400 hover:text-white" onClick={() => setSelectedFriendshipId(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                {selectedFriend.friend_avatar ? (
                  <Image src={selectedFriend.friend_avatar} alt="" width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-semibold">
                    {(selectedFriend.friend_name || selectedFriend.friend_email)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="text-white font-semibold">
                  {selectedFriend.friend_name || selectedFriend.friend_email.split("@")[0]}
                </div>
                <div className="text-dark-400 text-sm">
                  {selectedFriend.friend_online ? (
                    <span className="text-green-400">Online</span>
                  ) : "Offline"}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCallModal(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white"
            >
              <Video className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400">No messages yet</p>
                <p className="text-dark-500 text-sm">Say hi to {selectedFriend.friend_name || "your friend"}!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.sender_id === user.id
                        ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                        : "glass text-white"
                    }`}
                  >
                    <p>{renderMessageWithLinks(msg.content)}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user.id ? "text-white/70" : "text-dark-400"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 px-4 py-3 rounded-xl glass bg-white/5 border-0 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-dark-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a Chat</h3>
            <p className="text-dark-400">Choose a conversation to start messaging</p>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && selectedFriend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-8 max-w-md w-full text-center relative"
          >
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Call {selectedFriend.friend_name || selectedFriend.friend_email.split("@")[0]}?
            </h3>
            <p className="text-dark-400 mb-6">
              A unique room link will be sent. They'll join when ready.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowCallModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleStartCall} className="flex-1">
                <Video className="w-5 h-5 mr-2" /> Send Call Link
              </Button>
            </div>
            <p className="text-dark-500 text-sm mt-4">One pending call at a time</p>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMessageWithLinks(content: string) {
  const urlRegex = /(https?:\/\/[^\s]+|\/app\/call\?room=[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^https?:\/\//.test(part) || /^\/app\/call\?room=/.test(part);
    if (!isUrl) {
      return <span key={`text-${index}`}>{part}</span>;
    }

    const href = part.startsWith("http") ? part : part;
    return (
      <a
        key={`link-${index}`}
        href={href}
        className="underline text-primary-300 hover:text-primary-200 break-all"
      >
        Join call
      </a>
    );
  });
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </main>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
