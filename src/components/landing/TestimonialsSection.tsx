"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Star, MessageCircle } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    avatar: "S",
    location: "New York, USA",
    text: "I was skeptical at first, but I've made 3 real friends through AMORIO. The vibe selector is genius — everyone's actually in the same mood!",
    rating: 5,
  },
  {
    name: "Alex K.",
    avatar: "A",
    location: "London, UK",
    text: "The icebreaker wheel saved so many awkward silences. Now I have a friend in Japan I video call every week. Crazy!",
    rating: 5,
  },
  {
    name: "Maria L.",
    avatar: "M",
    location: "Barcelona, Spain",
    text: "No creepy DMs, no spam requests. Just genuine conversations that sometimes turn into friendships. This is what social media should be.",
    rating: 5,
  },
  {
    name: "James T.",
    avatar: "J",
    location: "Sydney, Australia",
    text: "The reaction bombs are hilarious. I love that both people have to add each other — no one-sided weirdness.",
    rating: 5,
  },
  {
    name: "Priya S.",
    avatar: "P",
    location: "Mumbai, India",
    text: "Finally an app where being yourself is actually rewarded. Made friends from 6 different countries already!",
    rating: 5,
  },
  {
    name: "Tom B.",
    avatar: "T",
    location: "Toronto, Canada",
    text: "The 'Chaotic' vibe mode is absolutely unhinged in the best way. Met some of the funniest people ever.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 to-dark-950" />

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
            TESTIMONIALS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Real People,
            <br />
            <span className="text-gradient">Real Connections</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Don't take our word for it — hear from people who found real friends
            through AMORIO.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full">
                {/* Quote icon */}
                <MessageCircle className="w-8 h-8 text-primary-500/30 mb-4" />

                {/* Text */}
                <p className="text-dark-200 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-dark-400 text-sm">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
