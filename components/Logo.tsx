
import React from 'react';
import { Shield, BookOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
    xl: 'h-10 w-10'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Animated Glow Backdrop */}
        <div className={`absolute inset-0 bg-amber-500 blur-md opacity-20 rounded-full animate-pulse`}></div>
        
        {/* Main Logo Container */}
        <div className={`relative bg-gradient-to-br from-university-900 to-slate-800 p-2 rounded-xl shadow-xl border border-white/10 flex items-center justify-center ${sizes[size]}`}>
          <Shield className={`${iconSizes[size]} text-university-accent absolute opacity-50`} />
          <BookOpen className={`${size === 'sm' ? 'h-3 w-3' : size === 'xl' ? 'h-6 w-6' : 'h-4 w-4'} text-amber-200 relative z-10 mt-1`} />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold tracking-tight bg-gradient-to-r from-white via-amber-100 to-orange-100 bg-clip-text text-transparent leading-none ${
            size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
          }`}>
            StudyVault
          </span>
          <span className={`text-amber-500 font-bold tracking-[0.2em] uppercase ${
            size === 'sm' ? 'text-[7px]' : 'text-[10px]'
          }`}>
            Ranchi University
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
