'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Calendar, Star, Zap, Shield, Video, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import AuthModal from '@/components/auth/AuthModal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { TRENDING_SKILLS } from '@/utils/helpers';

const SkillExchangeScene = dynamic(
  () => import('@/components/three/SkillExchangeScene'),
  { ssr: false }
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const features = [
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'AI-powered matching pairs you with ideal skill exchange partners based on complementary skills and availability.',
    color: 'from-primary-500 to-blue-500',
  },
  {
    icon: Calendar,
    title: 'Session Booking',
    description: 'Seamlessly schedule learning sessions with built-in calendar, timezone support, and one-click video meetings.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Chat',
    description: 'Instant messaging with your matched partners. Discuss, plan, and coordinate your skill exchange sessions.',
    color: 'from-accent-500 to-pink-500',
  },
  {
    icon: Star,
    title: 'Reviews & Ratings',
    description: 'Build your reputation through detailed reviews. Rate skill quality, communication, and punctuality.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Trust System',
    description: 'Verification badges, report system, and active moderation keep the community safe and trustworthy.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Video,
    title: 'Video Calls',
    description: 'Built-in video conferencing for face-to-face learning sessions. No external tools needed.',
    color: 'from-cyan-500 to-teal-500',
  },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '25K+', label: 'Skills Exchanged' },
  { value: '50K+', label: 'Sessions Completed' },
  { value: '4.9', label: 'Average Rating' },
];

export default function HomePage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (userProfile) {
      router.push('/dashboard');
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <main className="min-h-screen t-bg overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 opacity-70">
          <Suspense fallback={<div className="w-full h-full t-bg" />}>
            <SkillExchangeScene />
          </Suspense>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-900" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 mt-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles size={16} className="text-primary-400" />
              <span className="text-sm text-dark-50">The Future of Skill Exchange</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Exchange{' '}
            <span className="text-gradient">Skills</span>
            <br />
            Not Money
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg sm:text-xl t-text-secondary mb-8 max-w-2xl mx-auto"
          >
            Join a community where knowledge is the currency. Teach what you know,
            learn what you need. No payments, just pure skill exchange.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" onClick={handleGetStarted} className="group">
              Start Exchanging
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="t-text-secondary text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-gradient">Exchange Skills</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="t-text-secondary max-w-2xl mx-auto">
              A complete platform designed to make skill bartering seamless, safe, and rewarding.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i}>
                <Card hover className="h-full group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon size={24} className="t-text" />
                  </div>
                  <h3 className="text-lg font-semibold t-text mb-2">{feature.title}</h3>
                  <p className="t-text-secondary text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trending Skills */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-primary-900/10 to-dark-900" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <TrendingUp size={16} className="text-primary-400" />
              <span className="text-sm text-dark-50">Trending Now</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-4">
              Popular Skills Being <span className="text-gradient">Exchanged</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {TRENDING_SKILLS.map((skill, i) => (
              <motion.div
                key={skill}
                variants={fadeUp}
                custom={i * 0.5}
                className="px-5 py-2.5 rounded-full glass hover-glow cursor-pointer text-sm text-dark-50 hover:t-text transition-all"
              >
                {skill}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              How <span className="text-gradient">SkillSwap</span> Works
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { step: '01', title: 'Create Your Profile', desc: 'List your skills and what you want to learn. Set your experience level and availability.' },
              { step: '02', title: 'Get Matched', desc: 'Our smart algorithm finds perfect skill exchange partners based on complementary needs.' },
              { step: '03', title: 'Start Learning', desc: 'Book sessions, chat with partners, and begin exchanging knowledge in real-time.' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center">
                <div className="text-5xl font-bold text-gradient mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold t-text mb-2">{item.title}</h3>
                <p className="t-text-secondary">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card glow className="text-center py-16 px-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-accent-600/10 to-primary-600/10 animate-gradient" />
              <div className="relative">
                <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Start <span className="text-gradient">Exchanging Skills</span>?
                </motion.h2>
                <motion.p variants={fadeUp} custom={1} className="t-text-secondary mb-8 max-w-xl mx-auto">
                  Join thousands of learners and teachers. Your next skill is just one exchange away.
                </motion.p>
                <motion.div variants={fadeUp} custom={2}>
                  <Button size="lg" onClick={handleGetStarted} className="group">
                    <Zap size={18} />
                    Get Started Free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles size={18} className="t-text" />
              </div>
              <span className="text-lg font-bold text-gradient">SkillSwap</span>
            </div>
            <div className="flex items-center gap-6 text-sm t-text-secondary">
              <a href="#" className="hover:t-text transition-colors">About</a>
              <a href="#" className="hover:t-text transition-colors">Privacy</a>
              <a href="#" className="hover:t-text transition-colors">Terms</a>
              <a href="#" className="hover:t-text transition-colors">Contact</a>
            </div>
            <p className="text-sm t-text-muted">&copy; 2026 SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </main>
  );
}
