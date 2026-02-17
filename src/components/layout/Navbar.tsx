'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import AuthModal from '@/components/auth/AuthModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Bell,
  LogOut,
  Shield,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

export default function Navbar() {
  const { userProfile, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: Users },
    { href: '/sessions', label: 'Sessions', icon: Calendar },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[rgb(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">SkillSwap</span>
            </Link>

            {userProfile && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm t-text-secondary hover:t-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors t-text-secondary"
                aria-label="Toggle theme"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </button>

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-secondary))] animate-pulse" />
              ) : userProfile ? (
                <>
                  <Link
                    href="/notifications"
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
                  >
                    <Bell size={20} className="t-text-secondary" />
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Avatar
                        src={userProfile.photoURL}
                        name={userProfile.displayName}
                        size="sm"
                      />
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-56 glass-card py-2 shadow-2xl"
                        >
                          <div className="px-4 py-2 border-b border-[rgb(var(--border))]">
                            <p className="text-sm font-medium t-text">{userProfile.displayName}</p>
                            <p className="text-xs t-text-muted">{userProfile.email}</p>
                          </div>

                          <Link
                            href="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm t-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:t-text"
                          >
                            <Users size={16} />
                            Profile
                          </Link>

                          <Link
                            href="/dashboard"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm t-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:t-text"
                          >
                            <LayoutDashboard size={16} />
                            Dashboard
                          </Link>

                          {userProfile.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm t-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:t-text"
                            >
                              <Shield size={16} />
                              Admin Panel
                            </Link>
                          )}

                          <button
                            onClick={() => {
                              signOut();
                              setProfileMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Button onClick={() => setAuthModalOpen(true)} size="sm">
                  Get Started
                </Button>
              )}

              <button
                className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && userProfile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-[rgb(var(--border))]"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg t-text-secondary hover:t-text hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
