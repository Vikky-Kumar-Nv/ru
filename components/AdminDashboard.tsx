
import React, { useState, useRef, useEffect } from 'react';
import { Submission, Resource, ResourceType, CoursePattern, DegreeLevel, LoginRecord, Order, User } from '../types';
import {
    CheckCircle, XCircle, FileText, User as UserIcon, ShieldCheck, Mail,
    Inbox, Archive, ArrowLeft, Paperclip, Check, X, LogOut,
    LayoutDashboard, Users, Settings, Lock, Key, Loader2,
    Stamp, FolderOpen, Trash2, Plus, Upload, Eye, Edit2,
    Save, ExternalLink, Activity, Smartphone, ShieldAlert, AlertCircle, Download, Clock, HardDrive, Database, Copy, Terminal,
    ArrowRight, Info, AlertTriangle, RefreshCcw, Send, Globe, Fingerprint, Calendar, Building2
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { SUBJECTS, SEMESTERS, PATTERNS, DEGREE_LEVELS, COLLEGES } from '../constants';
import { db } from '../services/db';

interface AdminDashboardProps {
    submissions: Submission[];
    resources: Resource[];
    orders: Order[];
    loginRecords: LoginRecord[];
    allProfiles: User[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onUpdateSubmission: (id: string, updates: Partial<Submission>) => void;
    onDeleteSubmission: (id: string) => void;
    onAddResource: (resource: Resource) => void;
    onDeleteResource: (id: string) => void;
    onDeleteOrder: (id: string) => void;
    onExit: () => void;
}

type AdminView = 'dashboard' | 'inbox' | 'resources' | 'orders' | 'users' | 'activity' | 'settings' | 'setup';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    submissions, resources, orders, loginRecords, allProfiles, onApprove, onReject,
    onUpdateSubmission, onDeleteSubmission, onAddResource, onDeleteResource,
    onDeleteOrder, onExit
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Persistent Password State
    const [adminPassword, setAdminPassword] = useState(() => {
        return localStorage.getItem('studyvault_admin_secret') || 'admin';
    });

    const [error, setError] = useState('');

    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [inboxStatusFilter, setInboxStatusFilter] = useState<'pending' | 'approved'>('pending');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Health State
    const [healthStatus, setHealthStatus] = useState<any>(null);
    const [checkingHealth, setCheckingHealth] = useState(false);

    // Manual Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadSubject, setUploadSubject] = useState('');
    const [uploadSemester, setUploadSemester] = useState('');
    const [uploadType, setUploadType] = useState<ResourceType | ''>('');
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadPattern, setUploadPattern] = useState('');
    const [uploadDegree, setUploadDegree] = useState('');
    const [uploadCollege, setUploadCollege] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const uploadFileInputRef = useRef<HTMLInputElement>(null);

    // Settings/Password Change State
    const [currentPassInput, setCurrentPassInput] = useState('');
    const [newPassInput, setNewPassInput] = useState('');
    const [confirmPassInput, setConfirmPassInput] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const [settingsSuccess, setSettingsSuccess] = useState(false);

    const filteredInboxSubmissions = submissions.filter(s => s.status === inboxStatusFilter);
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const orderCount = orders.length;

    const uniqueUsers = Array.from(new Set(submissions.map(s => s.userIdentifier))).map((id: string) => {
        const userSubs = submissions.filter(s => s.userIdentifier === id);
        const profile = allProfiles.find(p => p.identifier === id);
        return {
            identifier: id,
            name: profile?.name || 'Unknown Student',
            college: COLLEGES.find(c => c.id === profile?.collegeId)?.name || 'N/A',
            totalSubmissions: userSubs.length,
            approved: userSubs.filter(s => s.status === 'approved').length,
            rejected: userSubs.filter(s => s.status === 'rejected').length,
            lastActive: Math.max(...userSubs.map(s => s.timestamp))
        };
    });

    useEffect(() => {
        if (isAuthenticated) {
            checkSystemHealth();
        }
    }, [isAuthenticated]);

    const checkSystemHealth = async () => {
        setCheckingHealth(true);
        const status = await db.checkSystemHealth();
        setHealthStatus(status);
        setCheckingHealth(false);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'suryanshkishor@gmail.com' && password === adminPassword) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Invalid credentials');
        }
    };

    const handleLogout = () => {
        if (window.confirm("Terminate admin session and return to main website?")) {
            // 1. Clear local auth state
            setIsAuthenticated(false);
            setEmail('');
            setPassword('');
            setActiveView('dashboard');

            // 2. IMMEDIATELY fire onExit to tell parent App to switch view to 'subjects'
            onExit();
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleUploadFile = (file: File) => {
        if (file.type === "application/pdf") {
            if (file.size > 20 * 1024 * 1024) {
                alert("File size exceeds 20MB limit.");
                return;
            }
            setUploadFile(file);
            if (!uploadTitle) {
                setUploadTitle(file.name.replace('.pdf', ''));
            }
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    const handleDeleteResourceAction = (id: string) => {
        if (window.confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
            onDeleteResource(id);
            showToast("Resource deleted successfully.");
        }
    };

    const handleDeleteOrderAction = (id: string) => {
        if (window.confirm("Mark this request as addressed and remove it from vault?")) {
            onDeleteOrder(id);
            showToast("Request addressed.");
        }
    };

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setSettingsError('');
        setSettingsSuccess(false);

        if (currentPassInput !== adminPassword) {
            setSettingsError('The current passcode you entered is incorrect.');
            return;
        }

        if (newPassInput.length < 4) {
            setSettingsError('New passcode must be at least 4 characters long.');
            return;
        }

        if (newPassInput !== confirmPassInput) {
            setSettingsError('New passwords do not match.');
            return;
        }

        // Save to persistence
        localStorage.setItem('studyvault_admin_secret', newPassInput);
        setAdminPassword(newPassInput);
        setSettingsSuccess(true);
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');

        setTimeout(() => setSettingsSuccess(false), 3000);
    };

    const MASTER_SQL = `-- FINAL FIX FOR STORAGE ERRORS: RUN THIS IN SUPABASE SQL EDITOR

-- 1. DELETE ANY CONFLICTING OLD POLICIES
DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Any User Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Storage: Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Storage Access" ON storage.objects;

-- 2. CREATE MASTER STORAGE POLICY
-- This allows both guest (anon) and logged-in (authenticated) users to upload to your buckets.
CREATE POLICY "Master Storage Policy"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id IN ('resources', 'submissions'))
WITH CHECK (bucket_id IN ('resources', 'submissions'));

-- 3. ENSURE TABLE PERMISSIONS ARE ALSO WIDE OPEN
DROP POLICY IF EXISTS "Unrestricted Resources" ON public.resources;
CREATE POLICY "Unrestricted Resources" ON public.resources FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Unrestricted Submissions" ON public.submissions;
CREATE POLICY "Unrestricted Submissions" ON public.submissions FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Unrestricted Profiles" ON public.profiles;
CREATE POLICY "Unrestricted Profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. FIX AUTH SCHEMA PERMISSIONS
GRANT ALL ON TABLE public.resources TO anon, authenticated;
GRANT ALL ON TABLE public.submissions TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
`;

    const copySql = () => {
        navigator.clipboard.writeText(MASTER_SQL);
        showToast("SQL Copied! Run this in Supabase.");
    };

    const applyWatermark = async (fileUrl: string): Promise<string> => {
        try {
            setUploadStatus('Applying Security Watermark...');
            const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const pages = pdfDoc.getPages();
            const watermarkText = 'STUDYVAULT';
            const textSize = 50;

            pages.forEach(page => {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(watermarkText, textSize);
                page.drawText(watermarkText, {
                    x: width / 2 - textWidth / 2,
                    y: height / 2 - 50,
                    size: textSize,
                    font: font,
                    color: rgb(0.8, 0.8, 0.8),
                    opacity: 0.1,
                    rotate: degrees(45),
                });
            });

            const modifiedPdfBytes = await pdfDoc.save();
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.warn("Watermarking failed, proceeding with original", e);
            return fileUrl;
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadSubject || !uploadSemester || !uploadType || !uploadTitle || !uploadPattern || !uploadDegree || !uploadCollege) {
            alert("All metadata fields (Title, College, Subject, etc.) are mandatory.");
            return;
        }

        setIsProcessing('upload');
        setUploadStatus('Initializing Secure Upload...');

        try {
            // Step 1: Watermark
            const tempUrl = URL.createObjectURL(uploadFile);
            const finalUrl = await applyWatermark(tempUrl);
            const response = await fetch(finalUrl);
            const blob = await response.blob();

            // Step 2: Storage
            setUploadStatus('Transferring to Supabase Storage...');
            const resourceId = `up-${Date.now()}`;
            const publicUrl = await db.saveFile(resourceId, blob);

            if (!publicUrl) {
                throw new Error("Storage rejected the file. Please re-run the Master SQL in Supabase and ensure the bucket is PUBLIC.");
            }

            // Step 3: Database
            setUploadStatus('Finalizing Database Record...');
            const newResource: Resource = {
                id: resourceId,
                title: uploadTitle,
                collegeId: uploadCollege,
                subjectId: uploadSubject,
                semester: parseInt(uploadSemester),
                year: new Date().getFullYear(),
                type: uploadType as ResourceType,
                pattern: uploadPattern as CoursePattern,
                degreeLevel: uploadDegree as DegreeLevel,
                downloadUrl: publicUrl,
                size: `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`,
                downloadCount: 0,
                createdAt: Date.now()
            };

            await onAddResource(newResource);

            setUploadStatus('');
            showToast("Publication Successful!");
            setIsUploadModalOpen(false);
            resetForm();
        } catch (err: any) {
            console.error("Manual Upload Error:", err);
            alert(`UPLOAD FAILED: ${err.message}. \n\nFIX: Go to 'Infrastructure Setup' tab, copy the SQL, and run it in Supabase.`);
        } finally {
            setIsProcessing(null);
            setUploadStatus('');
        }
    };

    const resetForm = () => {
        setUploadFile(null);
        setUploadTitle('');
        setUploadSubject('');
        setUploadSemester('');
        setUploadType('');
        setUploadPattern('');
        setUploadDegree('');
        setUploadCollege('');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/5">
                    <div className="bg-university-900 p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-university-accent/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/10">
                            <ShieldCheck className="h-10 w-10 text-university-accent" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Admin Console</h2>
                        <p className="text-slate-400 text-sm mt-2 font-medium">Verify Identity</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-10 space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-university-accent rounded-xl focus:outline-none transition-all dark:text-white"
                                placeholder="admin@studyvault.com"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Secret Key</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-university-accent rounded-xl focus:outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                                <XCircle className="h-4 w-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-university-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <Lock className="h-4 w-4 group-hover:scale-110 transition-transform" /> Sign In
                        </button>

                        <button
                            type="button"
                            onClick={onExit}
                            className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest"
                        >
                            Back to Site
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex relative transition-colors">

            {toastMessage && (
                <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-university-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <p className="font-bold text-sm">{toastMessage}</p>
                    </div>
                </div>
            )}

            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="bg-university-accent p-2 rounded-xl text-white">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-university-900 dark:text-white">Manual Library Upload</h3>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-6">
                            <div
                                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleUploadFile(e.dataTransfer.files[0]); }}
                                onClick={() => uploadFileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragActive ? 'border-university-accent bg-university-accent/5' :
                                        uploadFile ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                                            'border-gray-300 dark:border-slate-700 hover:border-university-accent'
                                    }`}
                            >
                                <input ref={uploadFileInputRef} type="file" className="hidden" accept="application/pdf" onChange={(e) => e.target.files && handleUploadFile(e.target.files[0])} />
                                {uploadFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileText className="h-12 w-12 text-green-500 mb-2" />
                                        <p className="font-bold text-gray-900 dark:text-white">{uploadFile.name}</p>
                                        <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mt-2">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-10 w-10 text-gray-400 mb-3" />
                                        <p className="font-bold text-gray-600 dark:text-gray-300">Drag PDF or Click to Select</p>
                                        <p className="text-xs text-gray-400 mt-2">Maximum file size: 20MB</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Resource Display Title</label>
                                    <input
                                        type="text"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-university-accent rounded-xl focus:outline-none transition-all dark:text-white"
                                        placeholder="e.g. Physics CC-3 (2024) - Mechanics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Institution</label>
                                    <select value={uploadCollege} onChange={(e) => setUploadCollege(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white">
                                        <option value="">Choose College</option>
                                        {COLLEGES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Honors Subject</label>
                                    <select value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white">
                                        <option value="">Choose Dept</option>
                                        {SUBJECTS.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Semester</label>
                                    <select value={uploadSemester} onChange={(e) => setUploadSemester(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white">
                                        <option value="">Semester</option>
                                        {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Material Type</label>
                                    <select value={uploadType} onChange={(e) => setUploadType(e.target.value as any)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white">
                                        <option value="">Select Type</option>
                                        <option value={ResourceType.PYQ}>Paper</option>
                                        <option value={ResourceType.NOTE}>Notes</option>
                                        <option value={ResourceType.SYLLABUS}>Syllabus</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Level</label>
                                    <select value={uploadDegree} onChange={(e) => setUploadDegree(e.target.value as any)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white">
                                        <option value="">Select Level</option>
                                        <option value={DegreeLevel.UG}>UG</option>
                                        <option value={DegreeLevel.PG}>PG</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Curriculum</label>
                                    <select value={uploadPattern} onChange={(e) => setUploadPattern(e.target.value as any)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none dark:text-white">
                                        <option value="">Select Pattern</option>
                                        <option value={CoursePattern.CBCS}>CBCS</option>
                                        <option value={CoursePattern.NEP}>NEP</option>
                                    </select>
                                </div>
                            </div>

                            {isProcessing === 'upload' && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300">{uploadStatus}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isProcessing === 'upload' || !uploadFile}
                                className="w-full py-5 bg-university-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-university-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                            >
                                {isProcessing === 'upload' ? 'Processing...' : <><Stamp className="h-5 w-5" /> Authenticate & Publish</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <aside className="w-72 bg-university-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 border-r border-white/5">
                <div className="p-8 flex items-center gap-4 border-b border-white/5">
                    <div className="bg-university-accent p-2 rounded-xl shadow-lg shadow-university-accent/20">
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-serif text-2xl font-bold tracking-tight">Admin</span>
                        <span className="text-[10px] text-university-accent uppercase tracking-[0.2em] font-bold">Controller</span>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-3 overflow-y-auto no-scrollbar">
                    <SidebarItem icon={<LayoutDashboard />} label="Summary" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    <SidebarItem icon={<Inbox />} label="Submission Inbox" active={activeView === 'inbox'} onClick={() => setActiveView('inbox')} badge={pendingCount} />
                    <SidebarItem icon={<Send />} label="Request Vault" active={activeView === 'orders'} onClick={() => setActiveView('orders')} badge={orderCount} />
                    <SidebarItem icon={<FolderOpen />} label="Manage Library" active={activeView === 'resources'} onClick={() => setActiveView('resources')} />
                    <SidebarItem icon={<Users />} label="Student Base" active={activeView === 'users'} onClick={() => setActiveView('users')} />
                    <SidebarItem icon={<Activity />} label="Security Logs" active={activeView === 'activity'} onClick={() => setActiveView('activity')} />
                    <SidebarItem icon={<Terminal />} label="Infrastructure Setup" active={activeView === 'setup'} onClick={() => setActiveView('setup')} />
                    <SidebarItem icon={<Settings />} label="System Config" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />

                    <div className="pt-4 border-t border-white/5">
                        <SidebarItem icon={<Globe />} label="Return to Website" active={false} onClick={onExit} />
                    </div>
                </nav>

                <div className="p-6 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-4 mb-6 px-2">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-university-accent to-orange-600 flex items-center justify-center font-bold text-xl shadow-xl">S</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">Suryansh</p>
                            <p className="text-[10px] text-slate-400 truncate">suryanshkishor@gmail.com</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-2xl transition-all text-xs font-bold border border-red-500/20"
                    >
                        <LogOut className="h-4 w-4" /> Terminate Session
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-72 p-12 overflow-y-auto relative">
                {/* Top Header Row for consistent Logout access */}
                <div className="flex justify-end mb-8 sticky top-0 z-10 -mt-6 pt-6 pb-4 bg-gray-50 dark:bg-slate-950/80 backdrop-blur-md">
                    <div className="flex gap-3">
                        <button
                            onClick={onExit}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-university-accent transition-all text-xs font-bold"
                        >
                            <Globe className="h-4 w-4" /> View Site
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all text-xs font-bold"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>
                </div>

                {activeView === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="mb-12 flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Admin Summary</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Status of system-wide operations</p>
                            </div>
                            <button
                                onClick={checkSystemHealth}
                                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-slate-500 hover:text-university-accent transition-all"
                                title="Refresh System Health"
                            >
                                <Activity className={`h-5 w-5 ${checkingHealth ? 'animate-pulse text-university-accent' : ''}`} />
                            </button>
                        </div>

                        {/* Health Alert Section */}
                        {healthStatus && (
                            <div className="mb-12 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 rounded-2xl bg-university-accent/10 text-university-accent">
                                        <ShieldAlert className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Supabase Infrastructure Health</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <HealthPill label="Storage: resources" status={healthStatus.resourcesBucket} type="bucket" />
                                    <HealthPill label="Storage: submissions" status={healthStatus.submissionsBucket} type="bucket" />
                                    <HealthPill label="Table: profiles" status={healthStatus.profilesTable} type="table" />
                                    <HealthPill label="Table: resources" status={healthStatus.resourcesTable} type="table" />
                                    <HealthPill label="Table: submissions" status={healthStatus.submissionsTable} type="table" />
                                    <HealthPill label="Table: orders" status={healthStatus.ordersTable} type="table" />
                                </div>

                                {Object.values(healthStatus).some(v => v === false) && (
                                    <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 border-2 border-dashed border-amber-200 dark:border-amber-900/30 rounded-3xl flex items-start gap-4">
                                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                                        <div>
                                            <p className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">Setup Incomplete (2 Red Boxes?)</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 leading-relaxed">
                                                If storage boxes are red, it means policies or buckets are missing.
                                            </p>
                                            <button
                                                onClick={() => setActiveView('setup')}
                                                className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-university-900 text-white rounded-xl text-xs font-bold shadow-lg transition-all hover:scale-105"
                                            >
                                                Go to Infrastructure Setup <ArrowRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                            <StatCard label="Review Queue" value={pendingCount} icon={<Inbox className="text-blue-500" />} onClick={() => setActiveView('inbox')} />
                            <StatCard label="Paper Requests" value={orderCount} icon={<Send className="text-pink-500" />} onClick={() => setActiveView('orders')} />
                            <StatCard label="Total PDFs" value={resources.length} icon={<FileText className="text-amber-500" />} onClick={() => setActiveView('resources')} />
                            <StatCard label="Total Students" value={uniqueUsers.length} icon={<Users className="text-purple-500" />} onClick={() => setActiveView('users')} />
                        </div>
                    </div>
                )}

                {activeView === 'orders' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="mb-10 flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Paper Request Vault</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Student messages for missing resources</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">Subject/Course</th>
                                            <th className="px-8 py-5">Sem</th>
                                            <th className="px-8 py-5">Specific Details</th>
                                            <th className="px-8 py-5">Student Email</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-slate-600 dark:text-slate-400">
                                        {orders.length > 0 ? orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">
                                                    {order.subject}
                                                </td>
                                                <td className="px-8 py-5 font-medium">{order.semester}</td>
                                                <td className="px-8 py-5 text-xs max-w-xs">{order.details || 'No extra info'}</td>
                                                <td className="px-8 py-5 font-medium text-university-accent">{order.email}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => handleDeleteOrderAction(order.id)}
                                                        className="p-2.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                                        title="Mark as Addressed"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                                                    No active paper requests.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'setup' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="mb-10">
                            <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Infrastructure Setup</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Fix all database, storage, and permission issues at once.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                            <Terminal className="h-6 w-6 text-university-accent" />
                                            Step 1: Copy Master SQL
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                            Copy this code and paste it in <b>Supabase SQL Editor</b>. This version specifically fixes <b>PERMISSION_DENIED</b> errors by granting access to both guest and logged-in users.
                                        </p>
                                        <div className="bg-slate-950 rounded-2xl p-6 relative group overflow-hidden">
                                            <pre className="text-[10px] text-emerald-400 overflow-x-auto h-64 no-scrollbar opacity-60 group-hover:opacity-100 transition-opacity">
                                                {MASTER_SQL}
                                            </pre>
                                            <button
                                                onClick={copySql}
                                                className="absolute top-4 right-4 bg-university-accent text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                            >
                                                <Copy className="h-4 w-4" /> Copy SQL
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                        <HardDrive className="h-6 w-6 text-university-accent" />
                                        Step 2: Check Bucket Toggle
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                        Manual SQL cannot toggle the "Public" switch. You must check this manually.
                                    </p>

                                    <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 rounded-3xl space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">resources Bucket</p>
                                                <p className="text-xs text-slate-500">Go to Storage {'->'} resources {'->'} Settings. Toggle <b>Public</b> to ON.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">submissions Bucket</p>
                                                <p className="text-xs text-slate-500">Go to Storage {'->'} submissions {'->'} Settings. Toggle <b>Public</b> to ON.</p>
                                            </div>
                                        </div>

                                        <a
                                            href="https://supabase.com/dashboard/project/sjptcgmjokirbgeuehhm/storage"
                                            target="_blank"
                                            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-university-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all"
                                        >
                                            Open Storage Dashboard <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>

                                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border-2 border-dashed border-amber-200 rounded-2xl flex items-start gap-4">
                                        <Info className="h-5 w-5 text-amber-600 mt-1 shrink-0" />
                                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                                            Crucial: The SQL grants permission, but the "Public" toggle makes the links accessible.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'resources' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div>
                                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Active Library</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Live resources currently accessible by students</p>
                            </div>
                            <button
                                onClick={() => { resetForm(); setIsUploadModalOpen(true); }}
                                className="w-full md:w-auto bg-university-accent hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-university-accent/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                <Plus className="h-6 w-6" /> Manual Upload
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">Title Descriptor</th>
                                            <th className="px-8 py-5">Subject Area</th>
                                            <th className="px-8 py-5">Resource Type</th>
                                            <th className="px-8 py-5 text-center">Impressions</th>
                                            <th className="px-8 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-slate-600 dark:text-slate-400">
                                        {resources.map(res => {
                                            const subjectName = SUBJECTS.find(s => s.id === res.subjectId)?.name || res.subjectId;
                                            return (
                                                <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">
                                                        <button
                                                            onClick={async () => {
                                                                const url = await db.getFileUrl(`res-${res.id}`);
                                                                if (url) window.open(url, '_blank');
                                                                else alert("File missing");
                                                            }}
                                                            className="flex items-center gap-3 hover:text-university-accent transition-colors text-left"
                                                        >
                                                            <FileText className="h-5 w-5 text-slate-300 group-hover:text-university-accent" />
                                                            <span className="line-clamp-1">{res.title}</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 font-medium">{subjectName}</td>
                                                    <td className="px-8 py-5">
                                                        <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-widest ${res.type === ResourceType.PYQ ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                                                res.type === ResourceType.NOTE ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                                                                    'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                                            }`}>
                                                            {res.type === ResourceType.PYQ ? 'Paper' : res.type === ResourceType.NOTE ? 'Notes' : 'Syllabus'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center font-bold text-slate-900 dark:text-white">{res.downloadCount.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => handleDeleteResourceAction(res.id)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'inbox' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="mb-10 flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Submission Inbox</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Review student contributions</p>
                            </div>
                            <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
                                <button
                                    onClick={() => setInboxStatusFilter('pending')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${inboxStatusFilter === 'pending' ? 'bg-white dark:bg-slate-700 text-university-accent shadow-sm' : 'text-slate-500'}`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setInboxStatusFilter('approved')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${inboxStatusFilter === 'approved' ? 'bg-white dark:bg-slate-700 text-university-accent shadow-sm' : 'text-slate-500'}`}
                                >
                                    Approved
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">File Name</th>
                                            <th className="px-8 py-5">Contributor</th>
                                            <th className="px-8 py-5">Subject</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-slate-600 dark:text-slate-400">
                                        {filteredInboxSubmissions.map(sub => (
                                            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-slate-300" />
                                                        {sub.fileName}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 font-medium">{sub.userIdentifier}</td>
                                                <td className="px-8 py-5">{sub.subjectName}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {sub.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => onApprove(sub.id)} className="p-2.5 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all"><Check className="h-4 w-4" /></button>
                                                                <button onClick={() => onReject(sub.id)} className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X className="h-4 w-4" /></button>
                                                            </>
                                                        )}
                                                        <button onClick={() => onDeleteSubmission(sub.id)} className="p-2.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="mb-12">
                            <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Student Base</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Registered students and their contribution metrics</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">Student</th>
                                            <th className="px-8 py-5">Institution</th>
                                            <th className="px-8 py-5 text-center">Submissions</th>
                                            <th className="px-8 py-5 text-center">Verified</th>
                                            <th className="px-8 py-5 text-right">Trust Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-slate-600 dark:text-slate-400">
                                        {uniqueUsers.map(user => (
                                            <tr key={user.identifier} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-university-accent to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {user.identifier.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{user.name}</span>
                                                        <span className="text-[10px] font-medium text-slate-400">{user.identifier}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 font-medium text-xs max-w-xs">{user.college}</td>
                                                <td className="px-8 py-5 text-center font-bold text-slate-900 dark:text-white">{user.totalSubmissions}</td>
                                                <td className="px-8 py-5 text-center text-green-600 dark:text-green-400 font-bold">{user.approved}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <CheckCircle key={star} className={`h-3 w-3 ${star <= Math.ceil((user.approved / Math.max(1, user.totalSubmissions)) * 5) ? 'text-university-accent' : 'text-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'activity' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-university-accent/10 border border-university-accent/20 text-university-accent text-[10px] font-black tracking-widest uppercase mb-4">
                                <Fingerprint className="h-3 w-3" /> Enhanced Security Feed
                            </div>
                            <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Security Logs</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time audit of student access and identities</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">Active Identity</th>
                                            <th className="px-8 py-5">Assigned Institution</th>
                                            <th className="px-8 py-5">Method</th>
                                            <th className="px-8 py-5">Timestamp</th>
                                            <th className="px-8 py-5 text-right">Gate Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-slate-600 dark:text-slate-400">
                                        {loginRecords.sort((a, b) => b.timestamp - a.timestamp).map(record => {
                                            const profile = allProfiles.find(p => p.identifier === record.identifier);
                                            const college = COLLEGES.find(c => c.id === profile?.collegeId);

                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-university-accent group-hover:text-white transition-all">
                                                                <UserIcon className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-white">{profile?.name || 'Unknown User'}</span>
                                                                <span className="text-[10px] font-medium text-slate-400">{record.identifier}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2 text-xs font-medium">
                                                            <Building2 className="h-3.5 w-3.5 text-slate-300" />
                                                            <span className="line-clamp-1">{college?.name || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{record.method}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <Calendar className="h-3 w-3 text-university-accent" />
                                                                {new Date(record.timestamp).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                                            <ShieldCheck className="h-3 w-3" /> Authorized
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-2xl">
                        <div className="mb-12">
                            <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">System Config</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage administrator security and credentials</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-university-accent/5 rounded-full blur-3xl"></div>

                            <form onSubmit={handlePasswordUpdate} className="space-y-6 relative z-10">
                                <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <ShieldAlert className="h-6 w-6 text-university-accent" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Security Protocol</p>
                                        <p className="text-[10px] text-slate-500">Updating credentials will immediately invalidate the previous secret key.</p>
                                    </div>
                                </div>

                                {settingsError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" /> {settingsError}
                                    </div>
                                )}

                                {settingsSuccess && (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-xl flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> Passcode updated successfully!
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Current Passcode</label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPassInput}
                                        onChange={(e) => setCurrentPassInput(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-university-accent rounded-xl focus:outline-none transition-all dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">New Passcode</label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassInput}
                                            onChange={(e) => setNewPassInput(e.target.value)}
                                            className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-university-accent rounded-xl focus:outline-none transition-all dark:text-white"
                                            placeholder="New Secret"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Confirm New Passcode</label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassInput}
                                            onChange={(e) => setConfirmPassInput(e.target.value)}
                                            className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-university-accent rounded-xl focus:outline-none transition-all dark:text-white"
                                            placeholder="Repeat Secret"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-university-900 hover:bg-black text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
                                >
                                    <RefreshCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                                    Apply Security Update
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const HealthPill = ({ label, status, type }: { label: string, status: boolean, type: 'bucket' | 'table' }) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${status ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
        <div className="flex items-center gap-3">
            {type === 'bucket' ? <HardDrive className={`h-4 w-4 ${status ? 'text-green-600' : 'text-red-600'}`} /> : <Database className={`h-4 w-4 ${status ? 'text-green-600' : 'text-red-600'}`} />}
            <span className={`text-[10px] font-black uppercase tracking-widest ${status ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>{label}</span>
        </div>
        {status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
    </div>
);

const SidebarItem = ({ icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-university-accent text-white shadow-xl shadow-university-accent/20 scale-[1.02]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
        <div className="flex items-center gap-4">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 20, className: `transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-university-accent'}` })}
            <span className="font-bold text-sm tracking-tight">{label}</span>
        </div>
        {badge ? (
            <span className="bg-university-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] h-6 flex items-center justify-center shadow-lg border border-white/20">{badge}</span>
        ) : null}
    </button>
);

const StatCard = ({ label, value, icon, onClick }: { label: string, value: number, icon: any, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-between group ${onClick ? 'cursor-pointer hover:border-university-accent transition-all hover:scale-[1.02]' : ''}`}
    >
        <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mb-2 group-hover:text-university-accent transition-colors">{label}</p>
            <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-3xl group-hover:bg-university-accent/5 group-hover:scale-110 transition-all">{icon}</div>
    </div>
);

export default AdminDashboard;
