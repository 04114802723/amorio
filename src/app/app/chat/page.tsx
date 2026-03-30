"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Video, Send, Phone, X } from "lucide-react";

const mockConversations = [
  {
    id: 1,
    friend: { name: "Alex K.", avatar: "A", online: true },
    messages: [
      { id: 1, text: "Hey! Great call yesterday 😊", sender: "them", time: "2:30 PM" },
      { id: 2, text: "Yeah it was fun! Your music taste is impeccable", sender: "me", time: "2:32 PM" },
      { id: 3, text: "Haha thanks! We should do another call sometime", sender: "them", time: "2:33 PM" },
    ],
  },
  {
    id: 2,
    friend: { name: "Maria L.", avatar: "M", online: false },
    messages: [
      { id: 1, text: "That was such a fun conversation!", sender: "them", time: "Yesterday" },
      { id: 2, text: "I know right! Can't believe we both love that show", sender: "me", time: "Yesterday" },
    ],
  },
];

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(mockConversations[0]?.messages || []);
  const [showCallModal, setShowCallModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = mockConversations.find((c) => c.id === selectedChat);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMessage = {
      id: messages.length + 1,
      text: messageInput,
      sender: "me" as const,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const handleStartCall = () => {
    setShowCallModal(true);
  };

  return (
    <main className="min-h-screen bg-dark-950 flex">
      <div className="fixed inset-0 bg-hero-gradient -z-10" />

      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
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
          {mockConversations.map((conv) => (
            <motion.button
              key={conv.id}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              onClick={() => {
                setSelectedChat(conv.id);
                setMessages(conv.messages);
              }}
              className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                selectedChat === conv.id ? "bg-white/10" : ""
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                  {conv.friend.avatar}
                </div>
                {conv.friend.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{conv.friend.name}</div>
                <div className="text-dark-400 text-sm truncate">
                  {conv.messages[conv.messages.length - 1]?.text}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="md:hidden text-dark-400 hover:text-white" onClick={() => setSelectedChat(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                {currentConversation?.friend.avatar}
              </div>
              <div>
                <div className="text-white font-semibold">{currentConversation?.friend.name}</div>
                <div className="text-dark-400 text-sm">
                  {currentConversation?.friend.online ? "Online" : "Offline"}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartCall}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white"
            >
              <Video className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.sender === "me"
                      ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                      : "glass text-white"
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-white/70" : "text-dark-400"}`}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
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
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white"
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
      {showCallModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-8 max-w-md w-full text-center"
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
            <h3 className="text-2xl font-bold text-white mb-2">Call {currentConversation?.friend.name}?</h3>
            <p className="text-dark-400 mb-6">
              A unique room link will be sent. They'll join when ready.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowCallModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" className="flex-1">
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
