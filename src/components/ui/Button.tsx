"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-400 hover:to-secondary-400 glow-primary",
      secondary:
        "bg-dark-800 text-white border border-dark-600 hover:border-primary-500 hover:bg-dark-700",
      outline:
        "bg-transparent text-white border-2 border-primary-500 hover:bg-primary-500/10",
      ghost:
        "bg-transparent text-white hover:bg-white/10",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      xl: "px-10 py-5 text-xl",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
