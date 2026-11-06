import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Wallet, PackageCheck, UserCircle, PhoneCall, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const BottomTabBar: React.FC = () => {
  const { user, setIsAuthModalOpen } = useApp();

  const tabs = [
    { to: '/shop', label: 'Shop', icon: Store, authRequired: false },
    { to: '/social-boost', label: 'Boost', icon: Flame, authRequired: false },
    { to: '/virtual-numbers', label: 'Numbers', icon: PhoneCall, authRequired: false },
    { to: '/wallet', label: 'Wallet', icon: Wallet, authRequired: true },
    { to: '/orders', label: 'Orders', icon: PackageCheck, authRequired: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-oj-dark-surface/95 backdrop-blur-md border-t border-oj-border dark:border-oj-dark-border px-2 py-1.5 shadow-lg safe-bottom">
      <nav className="flex items-center justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onClick={(e) => {
              if (tab.authRequired && !user) {
                e.preventDefault();
                setIsAuthModalOpen(true);
              }
            }}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-oj-primary dark:text-oj-cyan font-bold'
                  : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <tab.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-oj-primary dark:bg-oj-cyan"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

