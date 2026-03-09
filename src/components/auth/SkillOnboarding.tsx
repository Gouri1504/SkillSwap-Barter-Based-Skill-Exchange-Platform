'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, ChevronRight, BookOpen, GraduationCap } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { SKILL_CATEGORIES } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface SkillEntry {
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export default function SkillOnboarding() {
  const { userProfile, refreshProfile } = useAuth();
  const { request } = useApi();
  const [step, setStep] = useState<'offer' | 'want'>('offer');
  const [saving, setSaving] = useState(false);

  const [skillsOffered, setSkillsOffered] = useState<SkillEntry[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<SkillEntry[]>([]);

  const [currentSkill, setCurrentSkill] = useState('');
  const [currentCategory, setCurrentCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [currentLevel, setCurrentLevel] = useState<typeof LEVELS[number]>('beginner');

  const needsOnboarding = userProfile &&
    userProfile.skillsOffered.length === 0 &&
    userProfile.skillsWanted.length === 0;

  if (!needsOnboarding) return null;

  const addSkill = () => {
    if (!currentSkill.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    const entry: SkillEntry = {
      name: currentSkill.trim(),
      category: currentCategory,
      level: currentLevel,
    };

    if (step === 'offer') {
      if (skillsOffered.some((s) => s.name.toLowerCase() === entry.name.toLowerCase())) {
        toast.error('Skill already added');
        return;
      }
      setSkillsOffered((prev) => [...prev, entry]);
    } else {
      if (skillsWanted.some((s) => s.name.toLowerCase() === entry.name.toLowerCase())) {
        toast.error('Skill already added');
        return;
      }
      setSkillsWanted((prev) => [...prev, entry]);
    }

    setCurrentSkill('');
    setCurrentLevel('beginner');
  };

  const removeSkill = (index: number, type: 'offer' | 'want') => {
    if (type === 'offer') {
      setSkillsOffered((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSkillsWanted((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    if (step === 'offer') {
      if (skillsOffered.length === 0) {
        toast.error('Add at least one skill you can teach');
        return;
      }
      setStep('want');
    }
  };

  const handleSave = async () => {
    if (skillsWanted.length === 0) {
      toast.error('Add at least one skill you want to learn');
      return;
    }

    setSaving(true);
    const result = await request('/api/users/profile', 'PUT', {
      skillsOffered,
      skillsWanted,
    });

    if (result) {
      toast.success('Profile set up successfully!');
      await refreshProfile();
    }
    setSaving(false);
  };

  const currentSkills = step === 'offer' ? skillsOffered : skillsWanted;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-card p-8 shadow-2xl overflow-hidden"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
              {step === 'offer' ? <GraduationCap size={32} className="text-white" /> : <BookOpen size={32} className="text-white" />}
            </div>
            <h2 className="text-2xl font-bold t-text">
              {step === 'offer' ? 'What can you teach?' : 'What do you want to learn?'}
            </h2>
            <p className="text-sm t-text-secondary mt-1">
              {step === 'offer'
                ? 'Add skills you can share with others'
                : 'Add skills you want to learn from others'}
            </p>

            <div className="flex justify-center gap-2 mt-4">
              <div className={`w-16 h-1.5 rounded-full transition-colors ${step === 'offer' ? 'bg-primary-500' : 'bg-primary-500'}`} />
              <div className={`w-16 h-1.5 rounded-full transition-colors ${step === 'want' ? 'bg-primary-500' : 'bg-[rgb(var(--border))]'}`} />
            </div>
          </div>

          {/* Skill Input */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-2">
              <input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                placeholder={step === 'offer' ? 'e.g., React, Python, Guitar...' : 'e.g., UI/UX Design, Spanish...'}
                className="flex-1 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-4 py-2.5 t-text placeholder:t-text-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 text-sm"
              />
              <button
                onClick={addSkill}
                className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-400 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                className="flex-1 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 t-text text-sm focus:outline-none focus:border-primary-500/50"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value as typeof LEVELS[number])}
                className="flex-1 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 t-text text-sm focus:outline-none focus:border-primary-500/50"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Added Skills */}
          <div className="min-h-[100px] max-h-[160px] overflow-y-auto mb-6 space-y-2">
            {currentSkills.length === 0 ? (
              <div className="flex items-center justify-center h-[100px] border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
                <div className="text-center">
                  <Sparkles size={24} className="mx-auto t-text-muted mb-1" />
                  <p className="text-xs t-text-muted">No skills added yet</p>
                </div>
              </div>
            ) : (
              currentSkills.map((skill, idx) => (
                <motion.div
                  key={`${skill.name}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={14} className="text-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium t-text truncate">{skill.name}</p>
                      <p className="text-xs t-text-muted">{skill.category} &middot; {skill.level}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSkill(idx, step === 'offer' ? 'offer' : 'want')}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step === 'want' && (
              <Button variant="secondary" onClick={() => setStep('offer')} className="flex-1">
                Back
              </Button>
            )}
            {step === 'offer' ? (
              <Button onClick={handleNext} className="flex-1">
                Next <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleSave} loading={saving} className="flex-1">
                <Sparkles size={16} /> Complete Setup
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
