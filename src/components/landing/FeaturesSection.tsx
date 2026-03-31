"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import {
  RefreshCw,
  Users,
  MessageCircle,
  Video,
  Sparkles,
  Zap,
  Heart,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: RefreshCw,
    title: "Vibe Selector",
    description:
      "Choose your mood before matching — Chill, Deep Talk, Funny, or Chaotic. We pair you with someone on the same wavelength.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Instant Match",
    description:
      "No waiting, no swiping. Get matched with someone random instantly. Don't vibe? Skip anytime.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Sparkles,
    title: "Icebreaker Wheel",
    description:
      "Stuck for words? Spin the wheel for a random conversation topic. Makes every call unique.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Heart,
    title: "Reaction Bombs",
    description:
      "Send emoji reactions that fly across the screen mid-call. Express yourself beyond words.",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Real Friendships",
    description:
      "Both tap 'Add Friend' during the call to connect. No usernames, no searching — just shared moments.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: MessageCircle,
    title: "Private Chat",
    description:
      "After becoming friends, unlock private messaging. Video call again with a unique room link.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Zero Spam Design",
    description:
      "No way to find strangers outside calls. Every connection starts from a genuine moment.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Video,
    title: "Challenge Mode",
    description:
      "Optional dare mode — accept anonymous challenges to do on camera. For the brave ones!",
    color: "from-fuchsia-500 to-pink-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary-400 font-semibold mb-4 block">
            FEATURES
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Need
            <br />
            <span className="text-gradient">To Make Real Friends</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            We built AMORIO to make genuine connections easy. No gimmicks, no
            paywalls — just features that bring people together.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
