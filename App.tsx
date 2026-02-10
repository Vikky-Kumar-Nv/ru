
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header.tsx';
import Hero from './components/Hero.tsx';
import ResourceList from './components/ResourceList.tsx';
import SubjectGrid from './components/SubjectGrid.tsx';
import PatternSelection from './components/PatternSelection.tsx';
import DegreeSelection from './components/DegreeSelection.tsx';
import SemesterSelection from './components/SemesterSelection.tsx';
import CollegeSelection from './components/CollegeSelection.tsx';
import ResourceTypeSelection from './components/ResourceTypeSelection.tsx';
import FilterSection from './components/FilterSection.tsx'; 
import StatsSection from './components/StatsSection.tsx';
import StudyPlanner from './components/StudyPlanner.tsx';
import AboutUs from './components/AboutUs.tsx'; 
import SubmitPaper from './components/SubmitPaper.tsx';
import AdminDashboard from './components/AdminDashboard.tsx'; 
import AssessmentSection from './components/AssessmentSection.tsx';
import AssessmentHistory from './components/AssessmentHistory.tsx';
import UserProfile from './components/UserProfile.tsx';
import Footer from './components/Footer.tsx';
import AIChat from './components/AIChat.tsx';
import TermsOfService from './components/TermsOfService.tsx';
import LoginModal from './components/LoginModal.tsx';
import Logo from './components/Logo.tsx';
import { ResourceType, CoursePattern, DegreeLevel, FilterState, User, Submission, Resource, AssessmentResult, LoginRecord, Order } from './types.ts'; 
import { SUBJECTS, COLLEGES } from './constants.ts';
import { ChevronRight, Home, CalendarCheck, Info, Upload, ShieldCheck, ScrollText, PenTool, Loader2, History, Bookmark, CheckCircle, XCircle, User as UserIcon, Send, Sparkles, ArrowRight, Database, ExternalLink } from 'lucide-react';
import { db } from './services/db.ts';
import { supabase } from './services/supabase.ts';

type ViewState = 'subjects' | 'patterns' | 'degrees' | 'colleges' | 'semesters' | 'resource-types' | 'list' | 'planner' | 'about' | 'submit' | 'admin' | 'terms' | 'assessments' | 'assessment-history' | 'profile' | 'order';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Data State
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Order State
  const [orderData, setOrderData] = useState({ subject: '', semester: '', details: '' });

  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      try {
        const resources = await db.getAllResources();
        // Filter out mock data if any real data exists
        const realResources = resources.filter(r => !r.id.startsWith('res-'));
        if (realResources.length > 0) {
            setAllResources(realResources);
        } else {
            setAllResources(resources); // Keep mock data for UI visual if empty
        }

        const history = await db.getLoginHistory();
        setLoginRecords(history);

        const subs = await db.getAllSubmissions();
        setSubmissions(subs);

        const paperRequests = await db.getAllOrders();
        setOrders(paperRequests);

        const profiles = await db.getAllProfiles();
        setAllProfiles(profiles);
      } catch (error) {
        console.error("Failed to load database:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            const profile = await db.getUser(session.user.id);
            if (profile) {
                setUser(profile);
            } else {
                const newUser: User = {
                    id: session.user.id,
                    identifier: session.user.email || '',
                    name: session.user.user_metadata.full_name || 'Student',
                    collegeId: session.user.user_metadata.college_id || '',
                    isLoggedIn: true,
                    credits: 0,
                    assessmentHistory: [],
                    savedResources: []
                };
                await db.saveUser(newUser);
                setUser(newUser);
                // Refresh full profiles list
                const profiles = await db.getAllProfiles();
                setAllProfiles(profiles);
            }
        } else {
            setUser(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (uid: string, identifier: string, name: string, collegeId: string) => {
    const profile = await db.getUser(uid);
    
    await db.saveUser({
        ...(profile || { 
            id: uid, identifier, name, collegeId, isLoggedIn: true, credits: 0, assessmentHistory: [], savedResources: []
        })
    });

    const freshProfile = await db.getUser(uid);
    if(freshProfile) setUser(freshProfile);

    const newRecord: LoginRecord = {
      id: Date.now().toString(),
      identifier,
      timestamp: Date.now(),
      method: 'email'
    };
    await db.addLoginRecord(newRecord);
    setLoginRecords(prev => [newRecord, ...prev]);
    
    // Refresh all profiles to ensure admin sees latest
    const profiles = await db.getAllProfiles();
    setAllProfiles(profiles);

    showToast("Welcome back!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('subjects'); 
    showToast("Logged out successfully");
  };

  const handleToggleFavorite = async (resourceId: string) => {
      if (!user) {
          setIsLoginModalOpen(true);
          showToast("Please login to like/save items", "error");
          return;
      }

      const isSaved = user.savedResources?.includes(resourceId) || false;
      const newSaved = isSaved 
          ? user.savedResources?.filter(id => id !== resourceId) || []
          : [...(user.savedResources || []), resourceId];
      
      setUser({ ...user, savedResources: newSaved });
      await db.toggleFavorite(user.id, resourceId);
      
      showToast(isSaved ? "Removed from Liked Items" : "Added to Liked Items");
  };

  const handleAssessmentComplete = async (result: AssessmentResult) => {
    if (user) {
      const updatedHistory = [result, ...(user.assessmentHistory || [])];
      const updatedUser = { 
        ...user, 
        assessmentHistory: updatedHistory,
        credits: user.credits + 2
      };
      setUser(updatedUser);
      await db.saveUser(updatedUser);
      showToast("Assessment saved! +2 Credits earned");
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!orderData.subject || !orderData.semester) {
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      await db.createOrder({
        userId: user.id,
        email: user.identifier,
        itemName: `Paper Request: ${orderData.subject}`,
        subject: orderData.subject,
        semester: orderData.semester,
        details: orderData.details
      });
      showToast("Paper request (Order) submitted to Supabase!");
      setOrderData({ subject: '', semester: '', details: '' });
      setView('subjects');
      // Refresh orders
      const paperRequests = await db.getAllOrders();
      setOrders(paperRequests);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleSubmitPaper = async (file: File, subjectId: string, semester: string, type: ResourceType, additional: {collegeId: string, pattern: CoursePattern, degreeLevel: DegreeLevel}) => {
    if (!user) {
        setIsLoginModalOpen(true);
        return;
    }
    
    const subjectName = SUBJECTS.find(s => s.id === subjectId)?.name || subjectId;
    
    const newSubmission: Submission = {
        id: crypto.randomUUID(), 
        userId: user.id,
        userIdentifier: user.identifier,
        fileName: file.name,
        fileUrl: '', 
        subjectId: subjectId,
        subjectName: subjectName,
        semester: parseInt(semester) || 1,
        type: type,
        status: 'pending',
        timestamp: Date.now(),
        ...additional
    };
    
    try {
        await db.addSubmission(newSubmission, file);
        setSubmissions(prev => [...prev, newSubmission]);
        showToast("Paper submitted successfully!");
    } catch (err: any) {
        showToast(err.message, "error");
    }
  };

  const handleApproveSubmission = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    const updatedSub = { ...sub, status: 'approved' as const, creditsEarned: 5 };
    setSubmissions(prev => prev.map(s => s.id === id ? updatedSub : s));
    await db.updateSubmission(updatedSub);

    await handleAddCreditsToUser(sub.userId, 5);
    showToast("Submission verified! 5 credits awarded.");
  };

  const handleAddCreditsToUser = async (userId: string, amount: number) => {
    const targetProfile = await db.getUser(userId);
    if (targetProfile) {
      const updatedUser = { ...targetProfile, credits: (targetProfile.credits || 0) + amount };
      await db.saveUser(updatedUser);
      if (user && user.id === userId) {
          setUser(updatedUser);
      }
    }
  };

  const handleRejectSubmission = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;
    const updatedSub = { ...sub, status: 'rejected' as const };
    setSubmissions(prev => prev.map(s => s.id === id ? updatedSub : s));
    await db.updateSubmission(updatedSub);
  };

  const handleUpdateSubmission = async (id: string, updates: Partial<Submission>) => {
    setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, ...updates } : sub));
    const sub = submissions.find(s => s.id === id);
    if (sub) await db.updateSubmission({ ...sub, ...updates });
  };

  const handleDeleteSubmission = async (id: string) => {
    setSubmissions(prev => prev.filter(sub => sub.id !== id));
    await db.deleteSubmission(id);
  };

  const handleAdminAddResource = async (resource: Resource) => {
    await db.addResource(resource);
    setAllResources(prev => [{ ...resource, createdAt: Date.now() }, ...prev]);
  };

  const handleDeleteResource = async (id: string) => {
    await db.deleteResource(id);
    setAllResources(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteOrder = async (id: string) => {
    await db.deleteOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<CoursePattern | null>(null);
  const [activeDegree, setActiveDegree] = useState<DegreeLevel | null>(null);
  const [activeCollegeId, setActiveCollegeId] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [activeResourceType, setActiveResourceType] = useState<ResourceType | null>(null);
  const [activeYear, setActiveYear] = useState<number | null>(null); 

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleSubjectSelect = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    setView('patterns');
  };

  const handlePatternSelect = (pattern: CoursePattern) => {
    setActivePattern(pattern);
    setView('degrees');
  };

  const handleDegreeSelect = (degree: DegreeLevel) => {
    setActiveDegree(degree);
    setView('colleges');
  };

  const handleCollegeSelect = (collegeId: string) => {
    setActiveCollegeId(collegeId);
    setView('semesters');
  };

  const handleSemesterSelect = (semester: number) => {
    setActiveSemester(semester);
    if (activeResourceType) {
      setView('list');
    } else {
      setView('resource-types');
    }
  };

  const handleResourceTypeSelect = (type: ResourceType) => {
    setActiveResourceType(type);
    setView('list');
  };

  const handleBreadcrumbClick = (targetView: ViewState) => {
    setView(targetView);
    if (targetView === 'subjects') {
      setActiveSubjectId(null);
      setActivePattern(null);
      setActiveDegree(null);
      setActiveCollegeId(null);
      setActiveSemester(null);
      setActiveResourceType(null);
      setActiveYear(null);
    }
  };

  const handleNavigation = (sectionId: string, type?: string) => {
    if (sectionId === 'submit') {
      setView('submit');
      setActiveSubjectId(null);
      return;
    }
    if (sectionId === 'order') {
        setView('order');
        return;
    }
    if (sectionId === 'saved' || sectionId === 'profile') {
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }
        setView('profile');
        return;
    }
    if (sectionId === 'admin') {
      setView('admin');
      return;
    }
    if (sectionId === 'about') {
      setView('about');
      return;
    }
    if (sectionId === 'terms') {
      setView('terms');
      return;
    }
    if (sectionId === 'assessments') {
      setView('assessments');
      return;
    }
    if (sectionId === 'assessment-history') {
      setView('assessment-history');
      return;
    }
    if (sectionId === 'hero' || sectionId === 'home') {
      setView('subjects');
      setActiveSubjectId(null);
      return;
    }
    if (sectionId === 'resources') {
      if (type) setActiveResourceType(type as ResourceType);
      setView('subjects');
      setActiveSubjectId(null);
      return;
    }
    if (sectionId === 'planner') {
      setView('planner');
      return;
    }
  };

  const handleSearchNavigation = (term: string) => {
    const foundSubject = SUBJECTS.find(s => s.name.toLowerCase() === term.toLowerCase());
    if (foundSubject) {
      handleSubjectSelect(foundSubject.id);
    } else {
      setSearchQuery(term);
    }
  };

  const activeSubject = SUBJECTS.find(s => s.id === activeSubjectId);
  const activeCollege = COLLEGES.find(c => c.id === activeCollegeId);

  const filteredResources = useMemo(() => {
    if (view === 'profile') {
        const savedIds = user?.savedResources || [];
        return allResources.filter(r => savedIds.includes(r.id));
    }

    if (view !== 'list' || !activeSubjectId || !activePattern || !activeDegree || !activeSemester || !activeResourceType) return [];
    
    return allResources.filter(resource => {
      const matchesSubject = activeSubjectId === 'all' || resource.subjectId === activeSubjectId;
      const matchesPattern = resource.pattern === activePattern;
      const matchesDegree = resource.degreeLevel === activeDegree;
      const matchesCollege = !activeCollegeId || activeCollegeId === 'all' || resource.collegeId === activeCollegeId;
      const matchesSemester = activeSemester === null || activeSemester === ('' as any) || resource.semester === activeSemester;
      const matchesType = resource.type === activeResourceType;
      const matchesYear = activeYear === null || activeYear === ('' as any) || resource.year === activeYear;

      return matchesSubject && matchesPattern && matchesDegree && matchesCollege && matchesSemester && matchesType && matchesYear;
    });
  }, [allResources, view, activeSubjectId, activePattern, activeDegree, activeCollegeId, activeSemester, activeResourceType, activeYear, user?.savedResources]);

  const currentFilters: FilterState = {
    collegeId: activeCollegeId || 'all',
    subjectId: activeSubjectId || 'all',
    semester: activeSemester || '',
    year: activeYear || '',
    pattern: activePattern || 'all',
    degreeLevel: activeDegree || 'all',
    resourceType: activeResourceType || 'all',
    searchQuery: '',
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    switch (key) {
      case 'collegeId': setActiveCollegeId(value); break;
      case 'degreeLevel': setActiveDegree(value); break;
      case 'pattern': setActivePattern(value); break;
      case 'semester': setActiveSemester(value === '' ? null : value); break;
      case 'year': setActiveYear(value === '' ? null : value); break;
    }
  };

  const isRealDataEmpty = useMemo(() => {
      return !allResources.some(r => !r.id.startsWith('res-'));
  }, [allResources]);

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
              <Loader2 className="h-10 w-10 animate-spin text-university-accent" />
          </div>
      );
  }

  if (view === 'admin') {
     return (
        <AdminDashboard
           submissions={submissions}
           resources={allResources}
           orders={orders}
           loginRecords={loginRecords}
           allProfiles={allProfiles}
           onApprove={handleApproveSubmission}
           onReject={handleRejectSubmission}
           onUpdateSubmission={handleUpdateSubmission}
           onDeleteSubmission={handleDeleteSubmission}
           onAddResource={handleAdminAddResource}
           onDeleteResource={handleDeleteResource}
           onDeleteOrder={handleDeleteOrder}
           onExit={() => setView('subjects')}
        />
     );
  }

  const getBreadcrumbs = () => (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 py-3 sticky top-20 z-30 shadow-sm overflow-x-auto transition-colors">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-nowrap items-center text-sm whitespace-nowrap">
          <button onClick={() => handleBreadcrumbClick('subjects')} className="flex items-center hover:text-university-accent text-gray-500 dark:text-gray-400 font-medium">
            <Home className="h-4 w-4 mr-1" /> Home
          </button>
          {view === 'planner' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <CalendarCheck className="h-4 w-4 mr-1" /> Study Planner
              </div>
            </>
          )}
          {view === 'order' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <Send className="h-4 w-4 mr-1" /> Request Paper
              </div>
            </>
          )}
          {view === 'profile' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <UserIcon className="h-4 w-4 mr-1" /> My Profile
              </div>
            </>
          )}
          {view === 'assessments' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <PenTool className="h-4 w-4 mr-1" /> Check Assessment
              </div>
            </>
          )}
          {view === 'assessment-history' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <History className="h-4 w-4 mr-1" /> Assessment History
              </div>
            </>
          )}
          {view === 'about' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <Info className="h-4 w-4 mr-1" /> About Us
              </div>
            </>
          )}
          {view === 'submit' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <Upload className="h-4 w-4 mr-1" /> Submit Paper
              </div>
            </>
          )}
          {view === 'terms' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <div className="flex items-center font-bold text-university-900 dark:text-white">
                <ScrollText className="h-4 w-4 mr-1" /> Terms of Service
              </div>
            </>
          )}
          {activeSubject && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-2" />
              <button 
                onClick={() => handleBreadcrumbClick('patterns')}
                className={`hover:text-university-accent ${view === 'patterns' ? 'font-bold text-university-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {activeSubject.name}
              </button>
            </>
          )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors relative isolate">
      {toast && (
        <div className="fixed bottom-24 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className={`
                flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border
                ${toast.type === 'success' 
                    ? 'bg-university-900 text-white border-university-accent/30' 
                    : 'bg-red-600 text-white border-red-500'}
            `}>
                {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5" />}
                <p className="font-bold text-sm">{toast.message}</p>
            </div>
        </div>
      )}

      {/* Database Setup Helper Banner (Visible to owner only when empty) */}
      {isRealDataEmpty && view === 'subjects' && (
          <div className="bg-university-900 text-white py-3 px-4 relative z-50 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
              <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-university-accent animate-pulse" />
                  <span className="text-sm font-bold">Your Supabase database is connected but currently empty.</span>
              </div>
              <button 
                onClick={() => setView('admin')}
                className="bg-white text-university-900 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-university-accent hover:text-white transition-all shadow-lg flex items-center gap-2"
              >
                  Go to Manual Upload <ExternalLink className="h-3.5 w-3.5" />
              </button>
          </div>
      )}

      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
         <div className="w-[500px] h-[500px] flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] grayscale blur-[1px]">
            <Logo size="xl" showText={false} />
         </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          onLinkClick={handleNavigation} 
          darkMode={darkMode} 
          toggleTheme={toggleTheme} 
          user={user}
          onLogout={handleLogout}
          onLoginClick={() => setIsLoginModalOpen(true)}
        />
        
        <main className="flex-grow">
          {view === 'subjects' ? (
            <Hero 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onPopularClick={handleSearchNavigation}
            />
          ) : (
             getBreadcrumbs()
          )}
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[500px]">
            {view === 'subjects' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div id="subject-section" className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                      <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                          {activeResourceType ? `Browse ${activeResourceType === ResourceType.PYQ ? 'Papers' : 'Notes'}` : 'Browse Honors Departments'}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">Select your honors paper to find study material.</p>
                   </div>
                   <button 
                      onClick={() => setView('order')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-university-accent/10 text-university-accent font-bold text-sm hover:bg-university-accent hover:text-white transition-all shadow-sm"
                   >
                      <Send className="h-4 w-4" /> Request Missing Paper
                   </button>
                </div>
                <SubjectGrid 
                  subjects={SUBJECTS} 
                  allResources={allResources}
                  onSelectSubject={handleSubjectSelect}
                  searchQuery={searchQuery}
                  user={user}
                  favorites={user?.savedResources || []}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}

            {view === 'order' && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl border border-gray-100 dark:border-slate-800">
                        <div className="text-center mb-8">
                            <div className="bg-university-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Send className="h-8 w-8 text-university-accent" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-university-900 dark:text-white">Request Paper (Order)</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Can't find a specific paper? Place an 'Order' request and we'll find it for you.</p>
                        </div>
                        <form onSubmit={handleOrderSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Honors Subject</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white"
                                    value={orderData.subject}
                                    onChange={(e) => setOrderData({...orderData, subject: e.target.value})}
                                >
                                    <option value="">Select Subject</option>
                                    {SUBJECTS.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Semester</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white"
                                    value={orderData.semester}
                                    onChange={(e) => setOrderData({...orderData, semester: e.target.value})}
                                >
                                    <option value="">Select Semester</option>
                                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Additional Details (Year, Core Paper No.)</label>
                                <textarea 
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white min-h-[120px]"
                                    placeholder="Ex: I need Core Paper 5 from year 2021..."
                                    value={orderData.details}
                                    onChange={(e) => setOrderData({...orderData, details: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-5 bg-university-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
                            >
                                <span>Place Request Order</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {view === 'planner' && <StudyPlanner />}
            {view === 'about' && <AboutUs />}
            {view === 'terms' && <TermsOfService />}
            
            {view === 'assessments' && (
               <AssessmentSection 
                  user={user}
                  onLoginRequest={() => setIsLoginModalOpen(true)}
                  onCompleteAssessment={handleAssessmentComplete}
               />
            )}

            {view === 'assessment-history' && (
               <AssessmentHistory 
                  history={user?.assessmentHistory || []}
                  onBack={() => setView('subjects')}
               />
            )}
            
            {view === 'submit' && (
               <SubmitPaper 
                 user={user}
                 userSubmissions={submissions.filter(s => s.userId === user?.id)}
                 onLogin={handleLogin}
                 onSubmitPaper={handleSubmitPaper}
               />
            )}

            {view === 'profile' && user && (
                <UserProfile 
                   user={user}
                   savedResources={filteredResources}
                   onLogout={handleLogout}
                   onToggleFavorite={handleToggleFavorite}
                   onNavigate={handleNavigation}
                />
            )}

            {view === 'patterns' && activeSubject && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                 <PatternSelection onSelectPattern={handlePatternSelect} />
              </div>
            )}
            {view === 'degrees' && activePattern && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                 <DegreeSelection onSelectDegree={handleDegreeSelect} />
              </div>
            )}
            {view === 'colleges' && activeDegree && (
               <CollegeSelection onSelectCollege={handleCollegeSelect} />
            )}
            {view === 'semesters' && activeCollegeId && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                 <SemesterSelection 
                    pattern={activePattern!} 
                    degree={activeDegree!} 
                    onSelectSemester={handleSemesterSelect} 
                 />
              </div>
            )}
            {view === 'resource-types' && activeSemester && (
               <ResourceTypeSelection onSelectType={handleResourceTypeSelect} />
            )}

            {view === 'list' && activeSubject && activeSemester && activeResourceType && (
               <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-6">
                      <span className="text-university-accent font-bold tracking-wider uppercase text-xs mb-2 block">
                        {activePattern} &bull; {activeDegree} &bull; {activeCollege?.name}
                      </span>
                      <h1 className="text-3xl md:text-4xl font-serif font-bold text-university-900 dark:text-white">
                        {activeSubject.name} &bull; Semester {activeSemester}
                      </h1>
                  </div>

                  <FilterSection 
                    filters={currentFilters}
                    onFilterChange={handleFilterChange}
                  />

                  <ResourceList 
                    resources={filteredResources} 
                    activeFilterType={activeResourceType}
                    user={user}
                    onLogin={handleLogin}
                    favorites={user?.savedResources || []}
                    onToggleFavorite={handleToggleFavorite}
                    onNavigate={handleNavigation}
                  />
               </div>
            )}
          </div>

          {view === 'subjects' && <StatsSection resources={allResources} />}
        </main>

        <Footer onNavigate={handleNavigation} />
      </div>

      <AIChat />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin} 
      />
    </div>
  );
};

export default App;
