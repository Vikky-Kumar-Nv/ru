
import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Award, Gift, X, 
  Clock, ShieldAlert, ExternalLink, Settings, Lock, FileCheck, 
  Sparkles, Trophy, Gem, HelpCircle, ArrowRight, MousePointer2,
  Check, ShieldCheck, ListChecks, Database, UserCheck, Zap
} from 'lucide-react';
import { User, ResourceType, Submission, CoursePattern, DegreeLevel } from '../types.ts';
import { SUBJECTS, SEMESTERS, COLLEGES } from '../constants.ts';
import LoginModal from './LoginModal.tsx';

interface SubmitPaperProps {
  user: User | null;
  userSubmissions: Submission[];
  onLogin: (uid: string, identifier: string, name: string, collegeId: string) => void;
  onSubmitPaper: (file: File, subjectId: string, semester: string, type: ResourceType, additional: {collegeId: string, pattern: CoursePattern, degreeLevel: DegreeLevel}) => Promise<void>;
}

const SubmitPaper: React.FC<SubmitPaperProps> = ({ user, userSubmissions, onLogin, onSubmitPaper }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState('');
  const [type, setType] = useState<ResourceType | ''>('');
  
  const [collegeId, setCollegeId] = useState('');
  const [pattern, setPattern] = useState<CoursePattern | ''>('');
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'bucket' | 'table' | 'permission' | 'general' | null>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file: File) => {
    setError(null);
    setErrorType(null);
    if (file.type === "application/pdf") {
        if (file.size > 20 * 1024 * 1024) {
            setError("File size exceeds 20MB limit.");
            return;
        }
        setFile(file);
    } else {
        setError("Please upload a valid PDF file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!file || !subjectId || !semester || !type || !collegeId || !pattern || !degreeLevel) {
      setError("Incomplete submission. Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitPaper(file, subjectId, semester, type as ResourceType, {
          collegeId,
          pattern: pattern as CoursePattern,
          degreeLevel: degreeLevel as DegreeLevel
      });
      setSubmitted(true);
      setFile(null);
      resetFields();
    } catch (err: any) {
      console.error("Submission Error UI Catch:", err);
      const msg = err.message || "";
      if (msg.includes("BUCKET_MISSING")) {
          setError("Infrastructure Error: Storage bucket not configured.");
          setErrorType('bucket');
      } else if (msg.includes("PERMISSION_DENIED")) {
          setError("Security Error: Upload blocked by server policies.");
          setErrorType('permission');
      } else if (msg.includes("TABLE_MISSING")) {
          setError("Database Error: Submission table missing.");
          setErrorType('table');
      } else {
          setError(msg || "An unexpected error occurred during upload.");
          setErrorType('general');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFields = () => {
    setSubjectId(''); setSemester(''); setType(''); setCollegeId(''); setPattern(''); setDegreeLevel('');
  };

  const handleLoginSuccess = (uid: string, identifier: string, name: string, collegeId: string) => {
      onLogin(uid, identifier, name, collegeId);
      setShowLoginModal(false);
  };

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-university-900/10 to-transparent -z-10"></div>
      <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] bg-university-accent/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-40 left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-university-accent/10 border border-university-accent/20 text-university-accent text-xs font-black tracking-[0.2em] uppercase mb-6 shadow-sm">
            <Sparkles className="h-4 w-4" /> Global Knowledge Exchange
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-university-900 dark:text-white mb-6 tracking-tight">
            The <span className="text-university-accent">Contributor's</span> Vault
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Turn your study notes and old exam papers into valuable community resources. 
            Earn credits for every approved submission.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Visual Roadmap (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Credits Mini Dashboard */}
            <div className="bg-university-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-university-accent opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
               <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Your Balance</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">{user?.credits || 0}</span>
                        <span className="text-university-accent font-bold text-xs tracking-widest uppercase">CR</span>
                      </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center">
                      <Trophy className="h-6 w-6 text-university-accent mb-2" />
                      <span className="text-[10px] font-black uppercase text-slate-300">Level 1</span>
                  </div>
               </div>
            </div>

            {/* The Visual Roadmap */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.07]">
                  <ListChecks className="h-32 w-32" />
               </div>
               
               <h3 className="text-2xl font-serif font-bold text-university-900 dark:text-white mb-10 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-university-accent" />
                  Submission Roadmap
               </h3>

               <div className="space-y-0 relative">
                  {/* Vertical Line Connector */}
                  <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-gradient-to-b from-university-accent/40 via-university-accent/10 to-transparent"></div>

                  <RoadmapStep 
                    number="01" 
                    icon={<FileText className="h-5 w-5" />} 
                    title="Document Readiness" 
                    desc="Ensure your PDF is readable, oriented correctly, and under 20MB. Clear scans get approved faster." 
                  />
                  <RoadmapStep 
                    number="02" 
                    icon={<MousePointer2 className="h-5 w-5" />} 
                    title="The Secure Drop" 
                    desc="Drag your file into the vault dropzone. Our system performs a quick integrity check instantly." 
                  />
                  <RoadmapStep 
                    number="03" 
                    icon={<Database className="h-5 w-5" />} 
                    title="Academic Tagging" 
                    desc="Assign correct metadata (College, Subject, Semester). This helps peers find your material easily." 
                  />
                  <RoadmapStep 
                    number="04" 
                    icon={<UserCheck className="h-5 w-5" />} 
                    title="Vault Validation" 
                    desc="Administrators review the content quality. Upon approval, 5 credits are wired to your profile." 
                    isLast 
                  />
               </div>
            </div>

            {/* Reward Card */}
            <div className="bg-gradient-to-br from-university-accent to-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center gap-6">
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                    <Award className="h-8 w-8" />
                </div>
                <div>
                    <h4 className="font-bold text-lg leading-tight">Contribution Bonus</h4>
                    <p className="text-white/80 text-xs font-medium mt-1">Unlock "Scholar" badge at 100 Credits.</p>
                </div>
            </div>
          </div>

          {/* Right Column: Submission Form (7 cols) */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-green-100 dark:border-green-900/30 p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-50">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] animate-pulse"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="w-32 h-32 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-[3rem] flex items-center justify-center mb-8 mx-auto shadow-xl">
                        <FileCheck className="h-16 w-16" />
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">Submission Captured!</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-10 text-lg">
                        Your paper has been sent to the review vault. You'll receive <span className="font-bold text-green-600">5 Credits</span> once verified.
                    </p>
                    <button 
                        onClick={() => setSubmitted(false)} 
                        className="px-12 py-4 bg-university-900 dark:bg-white text-white dark:text-university-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        Submit Another Material
                    </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl border border-gray-100 dark:border-slate-800 relative">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        
                        {/* Error Banner */}
                        {error && (
                            <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg"><ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                                <p className="text-xs text-red-700 dark:text-red-300 font-black uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Interactive Dropzone */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 block">1. File Selection</label>
                            <div 
                                className={`group relative h-72 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden ${
                                    dragActive ? 'border-university-accent bg-university-accent/5 scale-[1.02]' : 
                                    file ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 
                                    'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 hover:border-university-accent hover:bg-white dark:hover:bg-slate-900'
                                }`}
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                            >
                                <input ref={inputRef} type="file" className="hidden" accept="application/pdf" onChange={handleChange} />
                                
                                {file ? (
                                    <div className="flex flex-col items-center animate-in zoom-in-95">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                                            <FileCheck className="h-10 w-10 text-green-600" />
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{file.name}</p>
                                        <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                                    </div>
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform duration-500">
                                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-100 dark:border-slate-700">
                                            <Upload className="h-8 w-8 text-university-accent" />
                                        </div>
                                        <p className="text-xl font-bold text-gray-700 dark:text-gray-300">Drag & Drop PDF here</p>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-3">Or click to select from storage</p>
                                    </div>
                                )}
                                
                                {dragActive && (
                                    <div className="absolute inset-0 bg-university-accent/10 backdrop-blur-[2px] flex items-center justify-center">
                                        <MousePointer2 className="h-12 w-12 text-university-accent animate-bounce" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata Selection */}
                        <div className="space-y-8">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 block">2. Academic Information</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <CustomSelect 
                                        label="Source Institution" 
                                        value={collegeId} 
                                        onChange={(e) => setCollegeId(e.target.value)}
                                        options={COLLEGES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                                        placeholder="Select College"
                                    />
                                    <CustomSelect 
                                        label="Honors Paper / Subject" 
                                        value={subjectId} 
                                        onChange={(e) => setSubjectId(e.target.value)}
                                        options={SUBJECTS.filter(s => s.id !== 'all').map(s => ({ value: s.id, label: s.name }))}
                                        placeholder="Select Subject"
                                    />
                                    <CustomSelect 
                                        label="Course Semester" 
                                        value={semester} 
                                        onChange={(e) => setSemester(e.target.value)}
                                        options={SEMESTERS.map(s => ({ value: s.toString(), label: `Semester ${s}` }))}
                                        placeholder="Select Semester"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <CustomSelect 
                                        label="Level of Study" 
                                        value={degreeLevel} 
                                        onChange={(e) => setDegreeLevel(e.target.value as DegreeLevel)}
                                        options={[{ value: DegreeLevel.UG, label: 'Undergraduate (UG)' }, { value: DegreeLevel.PG, label: 'Postgraduate (PG)' }]}
                                        placeholder="Select Level"
                                    />
                                    <CustomSelect 
                                        label="Examination Pattern" 
                                        value={pattern} 
                                        onChange={(e) => setPattern(e.target.value as CoursePattern)}
                                        options={[{ value: CoursePattern.NEP, label: 'NEP (New Policy)' }, { value: CoursePattern.CBCS, label: 'CBCS (Old Pattern)' }]}
                                        placeholder="Select Pattern"
                                    />
                                    
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Document Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[ResourceType.PYQ, ResourceType.NOTE, ResourceType.SYLLABUS].map((t) => (
                                                <button 
                                                    key={t} 
                                                    type="button" 
                                                    onClick={() => setType(t)} 
                                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all shadow-sm ${
                                                        type === t 
                                                        ? 'bg-university-900 dark:bg-university-accent text-white border-university-900 dark:border-university-accent' 
                                                        : 'bg-white dark:bg-slate-800 text-gray-500 border-gray-100 dark:border-slate-700 hover:border-university-accent/30'
                                                    }`}
                                                >
                                                    {t.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full relative group h-20 bg-university-900 dark:bg-university-accent rounded-[1.5rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <div className="relative z-10 flex items-center justify-center gap-4 text-white">
                                    {isSubmitting ? (
                                        <><Clock className="animate-spin h-6 w-6" /> <span className="font-black text-xs uppercase tracking-[0.3em]">Processing Secure Upload...</span></>
                                    ) : (
                                        <><Award className="h-6 w-6 group-hover:rotate-12 transition-transform" /> <span className="font-black text-xs uppercase tracking-[0.3em]">Authenticate & Commit to Vault</span></>
                                    )}
                                </div>
                            </button>
                            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-6 leading-relaxed">
                                By committing, you verify this content is academically relevant and does not violate copyright.
                            </p>
                        </div>
                    </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLoginSuccess} />
    </div>
  );
};

// --- Helper Components ---

const RoadmapStep = ({ number, icon, title, desc, isLast }: { number: string, icon: any, title: string, desc: string, isLast?: boolean }) => (
    <div className={`relative flex gap-8 ${!isLast ? 'pb-10' : ''} group`}>
        <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-university-accent text-white flex items-center justify-center shadow-lg shadow-university-accent/30 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div className="absolute -top-2 -right-2 bg-university-900 dark:bg-slate-700 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                {number}
            </div>
        </div>
        <div className="pt-1">
            <h4 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-university-accent transition-colors">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {desc}
            </p>
        </div>
    </div>
);

const CustomSelect = ({ label, value, onChange, options, placeholder }: { label: string, value: string, onChange: (e: any) => void, options: {value: string, label: string}[], placeholder: string }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</label>
        <div className="relative group">
            <select 
                className="w-full appearance-none p-4 pr-10 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:border-university-accent dark:focus:border-university-accent dark:text-white text-sm font-bold transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-slate-800"
                value={value}
                onChange={onChange}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-university-accent transition-colors">
                <ArrowRight className="h-4 w-4 rotate-90" />
            </div>
        </div>
    </div>
);

export default SubmitPaper;
