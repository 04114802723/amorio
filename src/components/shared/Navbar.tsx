"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setShowProfileMenu(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-4 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`glass rounded-2xl px-6 py-4 transition-all duration-300 ${
            scrolled ? "bg-dark-900/80" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center"
              >
                <span className="text-xl">💜</span>
              </motion.div>
              <span className="text-2xl font-bold text-gradient">AMORIO</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-dark-300 hover:text-white transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/app">
                    <Button variant="primary" size="md">
                      <Video className="w-4 h-4 mr-2" />
                      Start Call
                    </Button>
                  </Link>
                  
                  {/* User Profile Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary-500" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center border-2 border-primary-500">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                    
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 w-56 glass rounded-xl p-2 shadow-xl"
                      >
                        <div className="px-3 py-2 border-b border-dark-700">
                          <p className="text-sm font-medium text-white truncate">
                            {profile?.display_name || user.email?.split("@")[0]}
                          </p>
                          <p className="text-xs text-dark-400 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/app"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-700 rounded-lg mt-1"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Video className="w-4 h-4" />
                          Random Call
                        </Link>
                        <Link
                          href="/app/friends"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-700 rounded-lg"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          My Friends
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-700 rounded-lg"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button variant="primary" size="md">
                    Get Started — Free
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-dark-300 hover:text-white transition-colors duration-300"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 py-2 border-t border-white/10">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{profile?.display_name || user.email?.split("@")[0]}</p>
                          <p className="text-xs text-dark-400">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/app" onClick={() => setIsOpen(false)}>
                        <Button variant="primary" size="md" className="w-full">
                          <Video className="w-4 h-4 mr-2" />
                          Start Call
                        </Button>
                      </Link>
                      <button
                        onClick={() => { handleSignOut(); setIsOpen(false); }}
                        className="text-red-400 text-left"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                      <Button variant="primary" size="md" className="w-full mt-2">
                        Get Started — Free
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
