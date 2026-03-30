"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover = true, glow = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      className={cn(
        "glass rounded-2xl p-6",
        glow && "glow-primary",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
