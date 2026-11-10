import React from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const FloatingSupport: React.FC = () => {
  const { setIsSupportOpen } = useApp();

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => setIsSupportOpen(true)}
      className="hidden md:flex fixed bottom-8 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-oj-primary to-oj-cyan text-white shadow-glow-primary items-center justify-center border border-white/20 focus:outline-none"
      aria-label="Contact Customer Support"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="sr-only">Support</span>
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-oj-midnight animate-pulse" />
    </motion.button>
  );
};

