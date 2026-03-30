"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Video, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-secondary-900/20" />

      {/* Animated orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Make
            <br />
            <span className="text-gradient">Real Friends?</span>
          </h2>
          <p className="text-xl text-dark-300 mb-10 max-w-2xl mx-auto">
            Join thousands who've already found genuine connections. It's free,
            it's fun, and your next best friend might be one click away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app">
              <Button variant="primary" size="xl">
                <Video className="w-5 h-5 mr-2" />
                Start Your First Call
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-dark-500 text-sm mt-8">
            No signup required to try • 100% Free Forever • No credit card
          </p>
        </motion.div>
      </div>
    </section>
  );
}
