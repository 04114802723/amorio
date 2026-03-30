"use client";

import Link from "next/link";
import { Heart, Github, Twitter, Instagram } from "lucide-react";

const footerLinks = {
  product: [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "/app", label: "Try App" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/about#manifesto", label: "Manifesto" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  social: [
    { href: "https://twitter.com", label: "Twitter", icon: Twitter },
    { href: "https://instagram.com", label: "Instagram", icon: Instagram },
    { href: "https://github.com", label: "GitHub", icon: Github },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-dark-950/50">
      {/* Gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-xl">💜</span>
              </div>
              <span className="text-2xl font-bold text-gradient">AMORIO</span>
            </Link>
            <p className="text-dark-400 max-w-md mb-6">
              Connect through shared moments. Random video calls that turn into
              real friendships. No usernames, no spam — just authentic
              connections.
            </p>
            <p className="text-dark-500 text-sm flex items-center gap-1">
              Made with <Heart size={14} className="text-primary-500 fill-primary-500" /> for
              meaningful connections
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dark-500 text-sm">
            © {new Date().getFullYear()} AMORIO. All rights reserved. 100% Free Forever.
          </p>
          <div className="flex items-center gap-4">
            {footerLinks.social.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-dark-400 hover:text-white hover:border-primary-500 transition-all duration-300"
              >
                <link.icon size={18} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
