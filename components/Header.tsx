
import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen, Shield, Upload, CalendarCheck, Moon, Sun, User as UserIcon, LogOut, Award, PenTool, LogIn, History, Bookmark } from 'lucide-react';
import { ResourceType, User } from '../types';
import Logo from './Logo';

interface HeaderProps {
  onLinkClick: (section: string, type?: string) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLinkClick, darkMode, toggleTheme, user, onLogout, onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onLinkClick('submit');
    closeMenu();
  };

  const handleNavClick = (e: React.MouseEvent, section: string, type?: string) => {
    e.preventDefault();
    onLinkClick(section, type);
    closeMenu();
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAverageScore = () => {
    if (!user?.assessmentHistory || user.assessmentHistory.length === 0) return 0;
    const total = user.assessmentHistory.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0);
    return Math.round(total / user.assessmentHistory.length);
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
      
      <div className={`absolute inset-0 -z-10 overflow-hidden transition-all duration-500 ${
          scrolled 
            ? 'shadow-2xl border-b border-white/10' 
            : 'border-b border-transparent'
      }`}>
          {scrolled ? (
              <>
                  <div className="absolute inset-0 bg-university-900/90 backdrop-blur-xl supports-[backdrop-filter]:bg-university-900/80"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10 animate-gradient-slow mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50"></div>
              </>
          ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-university-900 via-slate-800 to-university-900"></div>
          )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative z-10">
          {/* Logo Section */}
          <div className="cursor-pointer group" onClick={(e) => { e.preventDefault(); onLinkClick('hero', 'all'); }}>
            <Logo size={scrolled ? 'md' : 'lg'} />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-1">
               <NavButton onClick={(e) => handleNavClick(e, 'hero', 'all')} label="Home" />
               <NavButton onClick={(e) => handleNavClick(e, 'assessments')} label="Assessments" icon={<PenTool className="h-3.5 w-3.5" />} />
               <NavButton onClick={(e) => handleNavClick(e, 'planner')} label="Planner" icon={<CalendarCheck className="h-3.5 w-3.5" />} />
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => handleNavClick(e, 'admin')}
                className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-300 hover:text-amber-400"
                title="Admin Panel Access"
              >
                <Shield className="h-5 w-5" />
              </button>

              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-300 hover:text-amber-400"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {user ? (
                <div className="relative group">
                  <div className="flex items-center gap-3 cursor-pointer">
                    {user.credits > 0 && (
                      <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-university-accent/20 border border-university-accent/30">
                        <Award className="h-3.5 w-3.5 text-university-accent" />
                        <span className="text-xs font-bold text-university-accent">{user.credits}</span>
                      </div>
                    )}
                    <button className="h-10 w-10 rounded-full bg-gradient-to-br from-university-accent to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/10 hover:scale-105 transition-transform">
                      {getInitials(user.name || user.identifier)}
                    </button>
                  </div>
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 p-4">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                      <div className="h-10 w-10 rounded-full bg-university-light dark:bg-slate-700 flex items-center justify-center text-university-accent">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Logged in as</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={user.name}>
                          {user.name || user.identifier}
                        </p>
                      </div>
                    </div>

                    {user.assessmentHistory && user.assessmentHistory.length > 0 && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Avg. Test Score</span>
                             <span className={`text-sm font-bold ${getAverageScore() >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                                {getAverageScore()}%
                             </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                             <div className="bg-university-accent h-1.5 rounded-full" style={{ width: `${getAverageScore()}%` }}></div>
                          </div>
                      </div>
                    )}
                    
                    <button onClick={(e) => handleNavClick(e, 'profile')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium mb-1">
                      <UserIcon className="h-4 w-4" /> My Profile
                    </button>
                    <button onClick={(e) => handleNavClick(e, 'saved')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium mb-1">
                      <Bookmark className="h-4 w-4" /> Saved Resources
                    </button>
                    <button onClick={(e) => handleNavClick(e, 'assessment-history')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium mb-1">
                      <History className="h-4 w-4" /> Assessment History
                    </button>
                    <button onClick={handleUploadClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium mb-1">
                      <Upload className="h-4 w-4" /> Submit a Paper
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={onLoginClick} className="group relative px-6 py-2.5 rounded-full font-bold text-sm text-white overflow-hidden shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 transition-all group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </div>
                  </button>
                  <a href="#" onClick={handleUploadClick} className="group relative px-6 py-2.5 rounded-full font-bold text-sm text-white overflow-hidden shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 transition-all group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="-mr-2 flex items-center md:hidden gap-4">
            {user && (
               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-university-accent to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/10">
                  {getInitials(user.name || user.identifier)}
               </div>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10 transition-colors text-amber-400">
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-gradient-to-b from-university-900 to-slate-900 border-t border-white/10 shadow-2xl absolute w-full`}>
        <div className="px-4 pt-4 pb-6 space-y-2">
          {user ? (
             <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-university-accent flex items-center justify-center text-white font-bold">
                          {getInitials(user.name || user.identifier)}
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-300 uppercase tracking-wider">Account</p>
                          <p className="text-sm font-bold text-white truncate max-w-[150px]">{user.name || user.identifier}</p>
                      </div>
                   </div>
                   <button onClick={onLogout} className="text-slate-300 hover:text-white p-2">
                      <LogOut className="h-5 w-5" />
                   </button>
                </div>
                {user.credits > 0 && (
                   <div className="bg-university-accent/10 rounded-lg p-2 flex items-center gap-2 text-university-accent text-sm font-bold border border-university-accent/20 mb-2">
                      <Award className="h-4 w-4" />
                      Credits Earned: {user.credits}
                   </div>
                )}
                {user.assessmentHistory && user.assessmentHistory.length > 0 && (
                   <div className="bg-slate-800 rounded-lg p-2 flex items-center justify-between text-xs border border-white/5">
                      <span className="text-gray-400">Avg. Score</span>
                      <span className="font-bold text-white">{getAverageScore()}%</span>
                   </div>
                )}
                
                <button onClick={(e) => handleNavClick(e, 'profile')} className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 py-2 rounded-lg text-xs font-bold text-gray-300 border border-white/5 transition-colors mt-2">
                   <UserIcon className="h-3 w-3" /> My Profile
                </button>
                <button onClick={(e) => handleNavClick(e, 'saved')} className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 py-2 rounded-lg text-xs font-bold text-gray-300 border border-white/5 transition-colors mt-2">
                   <Bookmark className="h-3 w-3" /> Saved Resources
                </button>
             </div>
          ) : (
             <div className="mb-4">
                <button onClick={() => { onLoginClick(); closeMenu(); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg mb-3">
                   <LogIn className="h-5 w-5" /> Login
                </button>
             </div>
          )}

          <MobileNavLink onClick={(e) => handleNavClick(e, 'hero', 'all')} label="Home" />
          <MobileNavLink onClick={(e) => handleNavClick(e, 'assessments')} label="Check Assessment" icon={<PenTool className="h-4 w-4" />} />
          <MobileNavLink onClick={(e) => handleNavClick(e, 'planner')} label="Study Planner" icon={<CalendarCheck className="h-4 w-4" />} />
          <MobileNavLink onClick={(e) => handleNavClick(e, 'submit')} label="Upload" icon={<Upload className="h-4 w-4" />} />
          <MobileNavLink onClick={(e) => handleNavClick(e, 'admin')} label="Admin Panel" icon={<Shield className="h-4 w-4" />} />
          
          <div className="pt-4 mt-4 border-t border-white/10">
            <button onClick={handleUploadClick} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
                <Upload className="h-5 w-5" />
                Upload Materials
              </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ onClick, label, icon }: { onClick: (e: any) => void, label: string, icon?: React.ReactNode }) => (
  <button onClick={onClick} className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors group overflow-hidden rounded-lg hover:bg-white/5">
    <div className="flex items-center gap-1.5 relative z-10">
      {icon}
      <span>{label}</span>
    </div>
  </button>
);

const MobileNavLink = ({ onClick, label, icon }: { onClick: (e: any) => void, label: string, icon?: React.ReactNode }) => (
  <a href="#" onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95">
    {icon}
    <span>{label}</span>
  </a>
);

export default Header;
