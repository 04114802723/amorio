"use client";

import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components/shared";
import { Heart, Target, Sparkles, Shield, Users, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";

const values = [
  {
    icon: Heart,
    title: "Authentic Connections",
    description: "We believe real friendships start from shared moments, not curated profiles.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description: "Zero spam design. No way to find strangers outside calls. Your safety matters.",
  },
  {
    icon: Users,
    title: "Mutual Respect",
    description: "Both people must want to connect. No one-sided interactions, ever.",
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Meet people from every corner of the world. Borders don't exist here.",
  },
  {
    icon: Sparkles,
    title: "Fun First",
    description: "Icebreakers, reactions, vibes — we make meeting new people actually enjoyable.",
  },
  {
    icon: Target,
    title: "Purpose Driven",
    description: "We're not here to maximize engagement. We're here to create friendships.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary-400 font-semibold mb-4 block">ABOUT AMORIO</span>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              We're Building a<br />
              <span className="text-gradient">Lonelier-Free World</span>
            </h1>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto">
              AMORIO was born from a simple idea: what if making friends online could feel as natural as meeting someone at a party?
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-dark-300 text-lg leading-relaxed">
              <p>In a world of infinite connections, we're somehow lonelier than ever. Social media promised us community but gave us comparison. Dating apps promised us love but gave us exhaustion.</p>
              <p>We asked ourselves: what if we stripped away all the noise? No profiles to judge. No followers to count. No algorithms to game. Just two people, face to face, sharing a moment.</p>
              <p>That's AMORIO. A place where the only way to connect is through a genuine conversation. Where friendships aren't requested — they're earned. Where being yourself isn't just accepted, it's the whole point.</p>
              <p className="text-primary-400 font-semibold">Welcome to the new way of making friends. Welcome to AMORIO.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="py-20 bg-dark-900/50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold mb-4 block">MANIFESTO</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What We <span className="text-gradient">Believe</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-dark-400">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Forever */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Free Forever. <span className="text-gradient">Period.</span>
            </h2>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-8">
              No premium tiers. No ads. No selling your data. We believe friendship shouldn't cost anything. AMORIO is and always will be 100% free.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass">
              <span className="text-2xl">💜</span>
              <span className="text-dark-200">Built with love for a lonelier-free world</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
