
import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, Mail, Phone, X, Instagram, Twitter, Facebook, Activity, Globe, Heart } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  onNavigate: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [visitorCount, setVisitorCount] = useState(() => Math.floor(Math.random() * (15000 - 12000 + 1)) + 12000);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisitorCount(prev => {
        const change = Math.floor(Math.random() * 5) - 1; 
        const next = prev + change;
        return next > 15500 ? 15000 : next < 12000 ? 12005 : next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, section: string) => {
    e.preventDefault();
    onNavigate(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 pt-20 pb-10">
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-university-accent/10 rounded-xl">
                        <Mail className="h-5 w-5 text-university-accent" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Get in Touch</h3>
                </div>
                <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2"><X className="h-6 w-6" /></button>
             </div>
             <div className="space-y-4">
                <a href="tel:6203577553" className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl hover:bg-university-accent/5 transition-all group border border-transparent hover:border-university-accent/20">
                   <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-university-accent group-hover:scale-110 transition-transform">
                      <Phone className="h-5 w-5" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Phone Support</span>
                      <span className="text-base font-bold text-slate-700 dark:text-slate-200">+91 6203577553</span>
                   </div>
                </a>
                <a href="mailto:suryanshkishor@gmail.com" className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl hover:bg-university-accent/5 transition-all group border border-transparent hover:border-university-accent/20">
                   <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-university-accent group-hover:scale-110 transition-transform">
                      <Mail className="h-5 w-5" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Email Inquiry</span>
                      <span className="text-base font-bold text-slate-700 dark:text-slate-200 truncate">suryanshkishor@gmail.com</span>
                   </div>
                </a>
             </div>
             <p className="mt-8 text-center text-xs text-slate-400">Available 10:00 AM — 6:00 PM IST</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-16 gap-x-12 mb-20">
          <div className="col-span-2 space-y-8">
            <div className="cursor-pointer group" onClick={() => onNavigate('hero')}>
               <Logo size="md" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Empowering students of Ranchi University with a centralized repository of academic excellence. Knowledge Secured. Success Assured.
            </p>
            <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 group hover:border-university-accent/30 transition-all">
               <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white tabular-nums tracking-wider">{visitorCount.toLocaleString()}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Daily Visits</span>
               </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-university-accent mb-8">Resources</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><button onClick={(e) => handleLinkClick(e, 'resources')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Question Papers</button></li>
              <li><button onClick={(e) => handleLinkClick(e, 'resources')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Honors Notes</button></li>
              <li><button onClick={(e) => handleLinkClick(e, 'resources')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Latest Syllabus</button></li>
              <li><button onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Student Help</button></li>
            </ul>
          </div>

          <div>
             <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-university-accent mb-8">Platform</h4>
             <ul className="space-y-4 text-sm text-slate-400">
                <li><button onClick={(e) => handleLinkClick(e, 'about')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> About Us</button></li>
                <li><button onClick={(e) => handleLinkClick(e, 'submit')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Contribute</button></li>
                <li><button onClick={(e) => handleLinkClick(e, 'terms')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Terms of Use</button></li>
                <li><button onClick={(e) => handleLinkClick(e, 'planner')} className="hover:text-white transition-colors flex items-center gap-2 group"><div className="h-1 w-1 bg-slate-700 rounded-full group-hover:bg-university-accent transition-colors"></div> Study Planner</button></li>
             </ul>
          </div>

          <div className="flex flex-col items-start md:items-end">
             <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-university-accent mb-8">Connect Column</h4>
             <div className="flex gap-4 mb-8">
                <a href="https://www.instagram.com/suryanshthakur_77/" target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-white/5 hover:bg-university-accent text-slate-500 hover:text-white transition-all hover:-translate-y-1 shadow-lg">
                    <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="p-3 rounded-2xl bg-white/5 hover:bg-university-accent text-slate-500 hover:text-white transition-all hover:-translate-y-1 shadow-lg"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="p-3 rounded-2xl bg-white/5 hover:bg-university-accent text-slate-500 hover:text-white transition-all hover:-translate-y-1 shadow-lg"><Facebook className="h-5 w-5" /></a>
             </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="text-xs text-slate-500 font-medium tracking-wide">&copy; 2026 StudyVault. Ranchi University Academic Node.</p>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
