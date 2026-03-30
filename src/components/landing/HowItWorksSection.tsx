"use client";

import { motion } from "framer-motion";
import { Sparkles, UserPlus, MessageCircle, Video } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Pick Your Vibe",
    description:
      "Choose how you're feeling — Chill, Deep Talk, Funny, or Chaotic. We'll match you with someone in the same mood.",
    color: "from-primary-500 to-pink-500",
  },
  {
    number: "02",
    icon: Video,
    title: "Random Match",
    description:
      "Get instantly connected with a random person. The icebreaker wheel spins to give you a conversation starter.",
    color: "from-secondary-500 to-purple-500",
  },
  {
    number: "03",
    icon: UserPlus,
    title: "Make Friends",
    description:
      "Vibing? Both tap 'Add Friend' during the call. If both accept, you're friends! No other way to connect.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    number: "04",
    icon: MessageCircle,
    title: "Stay Connected",
    description:
      "Chat anytime after becoming friends. Want to video call again? Tap call and they'll get a unique room link.",
    color: "from-green-500 to-emerald-500",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-32 overflow-hidden bg-dark-950"
    >
      {/* Background effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-primary-400 font-semibold mb-4 block">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            From Stranger to Friend
            <br />
            <span className="text-gradient">In 4 Simple Steps</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/50 via-secondary-500/50 to-transparent" />

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <span
                    className={`inline-block text-6xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-4`}
                  >
                    {step.number}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-dark-400 text-lg max-w-md mx-auto lg:mx-0">
                    {step.description}
                  </p>
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className={`relative w-32 h-32 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
                  <step.icon className="w-16 h-16 text-white relative z-10" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
