"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "success";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-dark-800 text-dark-200 border-dark-600",
    primary: "bg-primary-500/20 text-primary-300 border-primary-500/30",
    secondary: "bg-secondary-500/20 text-secondary-300 border-secondary-500/30",
    success: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </motion.span>
  );
}
