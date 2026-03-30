"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Coffee, Brain, Laugh, Zap, Video, ArrowLeft, Users, MessageCircle } from "lucide-react";

const vibes = [
  { id: "chill", label: "Chill", icon: Coffee, description: "Relaxed, casual conversation", color: "from-blue-500 to-cyan-500", emoji: "😌" },
  { id: "deep", label: "Deep Talk", icon: Brain, description: "Meaningful, thoughtful discussions", color: "from-purple-500 to-violet-500", emoji: "🧠" },
  { id: "funny", label: "Funny", icon: Laugh, description: "Jokes, memes, good vibes", color: "from-yellow-500 to-orange-500", emoji: "😂" },
  { id: "chaotic", label: "Chaotic", icon: Zap, description: "Unhinged energy, anything goes", color: "from-pink-500 to-red-500", emoji: "🤪" },
];

export default function AppPage() {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const handleStartMatching = () => {
    if (selectedVibe) {
      setIsMatching(true);
      setTimeout(() => {
        window.location.href = `/app/call?vibe=${selectedVibe}`;
      }, 1500);
    }
  };

  return (
    <main className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-hero-gradient" />
      <motion.div animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />Back
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app/friends" className="text-dark-400 hover:text-white transition-colors"><Users className="w-5 h-5" /></Link>
            <Link href="/app/chat" className="text-dark-400 hover:text-white transition-colors"><MessageCircle className="w-5 h-5" /></Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isMatching ? (
            <motion.div key="vibe-selector" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💜</span>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Pick Your Vibe</h1>
              <p className="text-dark-400 mb-8">We'll match you with someone in the same mood</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {vibes.map((vibe) => (
                  <motion.button
                    key={vibe.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedVibe(vibe.id)}
                    className={`relative p-6 rounded-2xl text-left transition-all duration-300 ${selectedVibe === vibe.id ? "glass-strong ring-2 ring-primary-500" : "glass hover:bg-white/10"}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vibe.color} flex items-center justify-center mb-3`}>
                      <vibe.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-white">{vibe.label}</span>
                      <span>{vibe.emoji}</span>
                    </div>
                    <p className="text-dark-400 text-sm">{vibe.description}</p>
                    {selectedVibe === vibe.id && <motion.div layoutId="vibe-indicator" className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary-500" />}
                  </motion.button>
                ))}
              </div>

              <Button variant="primary" size="xl" onClick={handleStartMatching} disabled={!selectedVibe} className="w-full">
                <Video className="w-5 h-5 mr-2" />Find Someone
              </Button>
              <p className="text-dark-500 text-sm mt-4">You can skip anytime during the call</p>
            </motion.div>
          ) : (
            <motion.div key="matching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 border-r-secondary-500" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-4xl">{vibes.find((v) => v.id === selectedVibe)?.emoji}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Finding Your Match...</h2>
              <p className="text-dark-400">Looking for someone in <span className="text-primary-400">{vibes.find((v) => v.id === selectedVibe)?.label}</span> mode</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
