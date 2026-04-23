"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    subtitle: "Start meeting people instantly",
    features: [
      "Random vibe matching",
      "Cross-vibe fallback matching",
      "Mutual Add Friend flow",
      "Private chat after friendship",
      "Call links for reconnect",
    ],
  },
  {
    name: "Premium (Waitlist)",
    price: "$9",
    period: "/month",
    subtitle: "For power users and creators",
    features: [
      "Everything in Free",
      "Priority matching queues",
      "Advanced profile themes",
      "Extra challenge packs",
      "Early access experiments",
    ],
  },
];

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-dark-950">
      <div className="fixed inset-0 bg-hero-gradient" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-dark-300 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-dark-200">AMORIO Pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple Pricing, Zero Spam</h1>
          <p className="text-dark-300 max-w-2xl mx-auto">
            AMORIO is fully usable for free today. Premium is optional and focused on advanced experience, not basic access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-semibold text-white mb-2">{plan.name}</h2>
              <p className="text-dark-400 mb-4">{plan.subtitle}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-dark-400">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-dark-200">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.name === "Free" ? (
                <Link href="/auth/login?redirect=/app" className="block mt-6">
                  <Button variant="primary" className="w-full">Start Free</Button>
                </Link>
              ) : (
                <div className="mt-6 text-sm text-dark-400">Join the waitlist below</div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 max-w-2xl mx-auto border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-2">Premium Waitlist</h3>
          <p className="text-dark-300 mb-4">
            Join to get notified when Premium opens. Free tier continues for everyone.
          </p>
          {submitted ? (
            <p className="text-green-400">You are on the waitlist preview. We will notify you at {email}.</p>
          ) : (
            <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button type="submit" variant="primary">Join Waitlist</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
