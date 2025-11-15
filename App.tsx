import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Subject, VideoLesson, LiveClass, ChatMessage, PaymentRecord, QuizAttempt, Enrollment, LessonCompletion, ActivityType, ActivityLog, Book, SubjectPost, PostType, BookPurchase, ToastMessage, Withdrawal, DirectMessage, Examination, ExaminationAttempt, ExaminationQuestion, Quiz, SubscriptionPlan, StudentSubscription, LessonBookmark, BookReading, PostComment, BookRating, BookNote } from './types';
import * as api from './services/api';
import { UserCircleIcon, BellIcon, ArrowLeftIcon, SearchIcon, VideoCameraIcon, ClockIcon, SendIcon, SparklesIcon, WalletIcon, CheckCircleIcon, CheckBadgeIcon, AirtelMoneyIcon, TnmMpambaIcon, NationalBankIcon, StarIcon, UserGroupIcon, ChartBarIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon, CloseIcon, LockClosedIcon, Cog6ToothIcon, CameraIcon, BookOpenIcon, CloudArrowUpIcon, TrashIcon, RssIcon, XCircleIcon, ComputerDesktopIcon, MicrophoneIcon, VideoCameraSlashIcon, ChevronUpIcon, WifiIcon, EyeIcon, BuildingStorefrontIcon, LightBulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, GoogleIcon, EnvelopeIcon, UserIcon, HomeIcon, AcademicCapIcon, ShoppingCartIcon, SmartLearnLogo, BriefcaseIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon, BanknotesIcon, CalendarDaysIcon, TrophyIcon, ClipboardDocumentCheckIcon, BookmarkIcon, InformationCircleIcon, ChatBubbleOvalLeftEllipsisIcon, DocumentTextIcon, ArrowDownTrayIcon, ArrowRightIcon, MicrophoneSlashIcon, ArrowsRightLeftIcon, ChevronDownIcon, PhoneIcon } from './components/icons';
import { Button, Modal, ToastContainer } from './components/common';

const APP_OWNER_ID = 'user-7';

// ----- Helper Functions -----
type SubscriptionStatus = 'Active' | 'Expired' | 'None';
const getSubscriptionStatus = (user: User | null): { status: SubscriptionStatus; plan: SubscriptionPlan } => {
    if (!user || user.role === Role.Teacher || user.role === Role.Owner || !user.subscription || user.subscription.plan === SubscriptionPlan.None) {
        return { status: 'None', plan: SubscriptionPlan.None };
    }
    // Subscriptions are now objects with dates, so we need to parse them if they are strings
    const endDate = typeof user.subscription.endDate === 'string' 
        ? new Date(user.subscription.endDate)
        : user.subscription.endDate;

    if (endDate.getTime() < Date.now()) {
        return { status: 'Expired', plan: user.subscription.plan };
    }
    return { status: 'Active', plan: user.subscription.plan };
};


const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ----- Reusable Components -----

const InputWithIcon: React.FC<{ icon: React.ReactNode, type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, name?: string }> = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input {...props} className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
    </div>
);

const AuthScreen: React.FC<{
    onLogin: (email: string, pass: string, role: Role) => void;
    onSignUp: (name: string, email: string, pass: string, role: Role, cvFile: File | null, message: string) => void;
    onGoogleAuth: (role: Role) => void;
    onShowAbout: () => void;
}> = ({ onLogin, onSignUp, onGoogleAuth, onShowAbout }) => {
    const [authRole, setAuthRole] = useState<Role | null>(null);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [coverMessage, setCoverMessage] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authRole) onLogin(email, password, authRole);
    };

    const handleSignUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authRole) onSignUp(name, email, password, authRole, cvFile, coverMessage);
    };
    
    const RoleCard: React.FC<{icon: React.ReactNode, title: Role, description: string, onClick: () => void, gradient: string}> = ({ icon, title, description, onClick, gradient }) => (
        <div onClick={onClick} className={`${gradient} p-6 rounded-2xl text-white text-center cursor-pointer transition-all duration-300 hover-lift shadow-lg hover:shadow-xl animate-float-subtle`}>
            <div className="flex justify-center mb-3">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm opacity-90 mt-1">{description}</p>
        </div>
    );

    const renderAuthForm = () => {
        if (!authRole) return null;
        
        const isManager = authRole === Role.Owner;
        const isTeacherSignup = authRole === Role.Teacher && mode === 'signup';

        return (
            <div className="w-full max-w-sm">
                <button onClick={() => setAuthRole(null)} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
                    <ArrowLeftIcon className="w-5 h-5" /> Back to roles
                </button>
                 <div className="bg-white rounded-2xl shadow-2xl p-6 animate-fade-in-up">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-800">Welcome {authRole}</h2>
                    </div>

                    {!isManager && (
                        <div className="flex border-b border-slate-200 mb-6">
                            <button onClick={() => setMode('login')} className={`flex-1 py-3 font-semibold text-center ${mode === 'login' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Login</button>
                            <button onClick={() => setMode('signup')} className={`flex-1 py-3 font-semibold text-center ${mode === 'signup' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Sign Up</button>
                        </div>
                    )}

                    {mode === 'login' || isManager ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <InputWithIcon icon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <InputWithIcon icon={<LockClosedIcon className="w-5 h-5 text-slate-400" />} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            <Button type="submit" className="w-full">Sign In</Button>
                        </form>
                    ) : ( // Signup form
                         <form onSubmit={handleSignUpSubmit} className="space-y-4">
                            <InputWithIcon icon={<UserIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                            <InputWithIcon icon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <InputWithIcon icon={<LockClosedIcon className="w-5 h-5 text-slate-400" />} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            {isTeacherSignup && (
                                <>
                                    <textarea value={coverMessage} onChange={(e) => setCoverMessage(e.target.value)} placeholder="Short message about your teaching experience..." className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" rows={3}></textarea>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload CV (PDF)</label>
                                        <input type="file" accept=".pdf" onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                                    </div>
                                </>
                            )}
                            <Button type="submit" className="w-full">Create Account</Button>
                        </form>
                    )}
                    
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    
                    <Button onClick={() => onGoogleAuth(authRole)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                       <GoogleIcon className="w-5 h-5" /> Sign in with Google
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen animated-gradient-login flex flex-col justify-center items-center p-4">
            {authRole ? renderAuthForm() : (
                 <div className="w-full max-w-lg text-center">
                    <SmartLearnLogo className="w-20 h-20 mx-auto" />
                    <h1 className="text-4xl font-bold text-white mt-2 mb-2">Welcome to SmartLearn</h1>
                    <p className="text-teal-100 mb-8">Please select your role to continue.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <RoleCard icon={<AcademicCapIcon className="w-12 h-12 text-white"/>} title={Role.Student} description="Access courses, lessons, and your AI tutor." onClick={() => {setAuthRole(Role.Student); setMode('login')}} gradient="bg-gradient-to-br from-teal-500 to-cyan-600" />
                        <RoleCard icon={<BriefcaseIcon className="w-12 h-12 text-white"/>} title={Role.Teacher} description="Manage your content and engage with students." onClick={() => {setAuthRole(Role.Teacher); setMode('login')}} gradient="bg-gradient-to-br from-emerald-500 to-green-600" />
                        <RoleCard icon={<ShieldCheckIcon className="w-12 h-12 text-white"/>} title={Role.Owner} description="Oversee the entire platform and its users." onClick={() => setAuthRole(Role.Owner)} gradient="bg-gradient-to-br from-slate-600 to-gray-700" />
                    </div>
                     <div className="text-center mt-8">
                        <button onClick={onShowAbout} className="text-teal-100 hover:text-white underline transition-colors">
                            About SmartLearn
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactElement<{ className?: string }>; title: string; value: string | number; gradient?: string }> = ({ icon, title, value, gradient }) => (
    <div className={`p-4 rounded-xl shadow-sm flex items-center gap-4 hover-lift ${gradient ? gradient : 'bg-white dark:bg-slate-800'}`}>
        <div className="bg-white/20 p-3 rounded-full">
            {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
        <div>
            <p className="text-sm opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const LoadingScreen = () => (
    <div className="flex flex-col justify-center items-center h-screen w-screen bg-slate-100 dark:bg-slate-900">
        <SmartLearnLogo className="w-24 h-24 animate-bounce" title="SmartLearn Logo" />
        <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-4">Loading SmartLearn...</h1>
        <p className="text-slate-500 dark:text-slate-400">Please wait a moment.</p>
    </div>
);

const StarRating: React.FC<{ rating: number; totalStars?: number; }> = ({ rating, totalStars = 5 }) => {
    const fullStars = Math.round(rating);
    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, i) => (
                // FIX: Wrapped StarIcon in a div to provide a key for React's list rendering, resolving a TypeScript error.
                <div key={i}>
                    <StarIcon className={`w-4 h-4 ${i < fullStars ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </div>
            ))}
        </div>
    );
};

// App.tsx
export const App: React.FC = () => {
    // --- State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [lessonCompletions, setLessonCompletions] = useState<LessonCompletion[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [bookPurchases, setBookPurchases] = useState<BookPurchase[]>([]);
    const [bookRatings, setBookRatings] = useState<BookRating[]>([]);
    const [bookNotes, setBookNotes] = useState<BookNote[]>([]);
    const [bookReadings, setBookReadings] = useState<BookReading[]>([]);
    const [bookmarks, setBookmarks] = useState<LessonBookmark[]>([]);
    const [subjectPosts, setSubjectPosts] = useState<SubjectPost[]>([]);
    const [postComments, setPostComments] = useState<PostComment[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [examinationAttempts, setExaminationAttempts] = useState<ExaminationAttempt[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [plans, setPlans] = useState<any[]>([]);

    const [unlockedBooks, setUnlockedBooks] = useState<string[]>([]);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // New Navigation State
    const [activeTab, setActiveTab] = useState('dashboard');
    const initialNavState = { 
        dashboard: [{ page: 'dashboard' }], 
        courses: [{ page: 'myCourses' }], 
        bookstore: [{ page: 'bookstore' }], 
        notes: [{ page: 'myNotes' }], 
        tutor: [{ page: 'aiTutor' }] 
    };
    const [navigationStacks, setNavigationStacks] = useState(initialNavState);
    
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
    const [newContentModal, setNewContentModal] = useState<{type: 'lesson' | 'class', subjectId: string | null} | null>(null);
    const [bookPasswordModal, setBookPasswordModal] = useState<Book | null>(null);

    const [tutorChatMessages, setTutorChatMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: 'Hello! I am Bright Titan, your AI Tutor. How can I help you study today?', timestamp: new Date() }
    ]);
    const [tutorInput, setTutorInput] = useState('');
    const [isTutorLoading, setIsTutorLoading] = useState(false);
    
    const [paymentModalClass, setPaymentModalClass] = useState<LiveClass | null>(null);
    const [liveChatMessages, setLiveChatMessages] = useState<ChatMessage[]>([]);
    const [liveChatInput, setLiveChatInput] = useState('');


    const audioRef = useRef<HTMLAudioElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
     useEffect(() => {
        const savedTheme = localStorage.getItem('smartlearn-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }

        const loadData = async () => {
            try {
                const data = await api.fetchAllInitialData();
                setUsers(data.users);
                setSubjects(data.subjects);
                setVideoLessons(data.videoLessons);
                setLiveClasses(data.liveClasses.map(lc => ({...lc, startTime: new Date(lc.startTime)}))); // Deserialize dates
                setPayments(data.payments.map(p => ({...p, date: new Date(p.date)})));
                setQuizzes(data.quizzes);
                setQuizAttempts(data.quizAttempts.map(qa => ({...qa, completedAt: new Date(qa.completedAt)})));
                setEnrollments(data.enrollments);
                setLessonCompletions(data.lessonCompletions.map(lc => ({...lc, completedAt: new Date(lc.completedAt)})));
                setActivityLogs(data.activityLogs.map(log => ({...log, timestamp: new Date(log.timestamp)})));
                setBooks(data.books);
                setBookPurchases(data.bookPurchases);
                setBookRatings(data.bookRatings);
                setBookNotes(data.bookNotes.map(n => ({...n, lastUpdatedAt: new Date(n.lastUpdatedAt) })));
                setBookReadings(data.bookReadings.map(br => ({...br, lastReadAt: new Date(br.lastReadAt)})));
                setBookmarks(data.bookmarks);
                setSubjectPosts(data.subjectPosts.map(p => ({...p, timestamp: new Date(p.timestamp)})));
                setPostComments(data.postComments.map(c => ({...c, timestamp: new Date(c.timestamp)})));
                setDirectMessages(data.directMessages.map(dm => ({...dm, timestamp: new Date(dm.timestamp)})));
                setExaminations(data.examinations);
                setExaminationAttempts(data.examinationAttempts.map(ea => ({...ea, completedAt: new Date(ea.completedAt)})));
                setWithdrawals(data.withdrawals.map(w => ({...w, timestamp: new Date(w.timestamp)})));
                setPlans(data.plans);
            } catch (error) {
                console.error("Failed to load initial data", error);
                addToast("Could not load app data. Please refresh.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();

    }, []);

    useEffect(() => {
        if (isMusicPlaying) {
            audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audioRef.current?.pause();
        }
    }, [isMusicPlaying]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);


    // --- Derived State ---
    const { status: subscriptionStatus, plan: subscriptionPlan } = getSubscriptionStatus(currentUser);
    const currentStack = navigationStacks[activeTab as keyof typeof navigationStacks] || [{ page: 'dashboard' }];
    const currentPage = currentStack[currentStack.length - 1];
    
    // --- Navigation Handlers ---
    const navigate = (page: string, params: any = {}) => {
        setNavigationStacks(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab as keyof typeof prev], { page, ...params }]
        }));
    };

    const goBack = () => {
        setNavigationStacks(prev => {
            const stack = prev[activeTab as keyof typeof prev];
            if (stack.length > 1) {
                return { ...prev, [activeTab]: stack.slice(0, -1) };
            }
            return prev;
        });
    };
    
    const changeTab = (tab: string) => {
        setActiveTab(tab);
    };

    const resetToDashboard = () => {
      setNavigationStacks(initialNavState);
      setActiveTab('dashboard');
    }


    // --- Helper & Handler Functions ---
    const addToast = (message: string, type: 'success' | 'error' | 'info') => {
        const newToast: ToastMessage = { id: Date.now(), message, type };
        setToasts(prev => [newToast, ...prev]);
    };
    const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
    
    const handleToggleTheme = () => {
        setIsDarkMode(prev => {
            const newIsDark = !prev;
            if (newIsDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('smartlearn-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('smartlearn-theme', 'light');
            }
            return newIsDark;
        });
    };

    // --- Auth Handlers ---
    const handleLogin = async (email: string, pass: string, role: Role) => {
        const user = await api.login(email, pass, role);
        if (user) {
            if(user.role === Role.Teacher && user.teacherApplication?.status !== 'Approved'){
                addToast('Your application is still pending review.', 'info');
                return;
            }
            setCurrentUser(user);
            addToast(`Welcome back, ${user.name}!`, 'success');
        } else {
            addToast('Invalid credentials for the selected role.', 'error');
        }
    };
    const handleGoogleAuth = async (role: Role) => {
        const defaultUser = await api.googleAuth(role);
        if(defaultUser) {
            setCurrentUser(defaultUser);
            addToast(`Signed in as ${defaultUser.name} via Google.`, 'success');
        } else {
            addToast(`No default ${role} account for simulation.`, 'error');
        }
    };
    const handleLogout = () => {
        setCurrentUser(null);
        resetToDashboard();
        setIsProfileMenuOpen(false);
        addToast('You have been logged out.', 'info');
    };
    
    const handleSignUp = async (name: string, email: string, pass: string, role: Role, cvFile: File | null, message: string) => {
       const response = await api.signUp(name, email, pass, role, cvFile, message);

        if ('error' in response) {
            addToast(response.error, 'error');
            return;
        }

        const { newUser, ownerLog } = response;
        
        if (ownerLog) {
            setActivityLogs(prev => [...prev, ownerLog]);
        }

        setUsers(prev => [...prev, newUser]);

        if (role === Role.Teacher) {
            addToast('Application submitted! You will be notified upon review.', 'success');
        } else {
            setCurrentUser(newUser);
            addToast('Account created successfully!', 'success');
        }
    };

    const handleEnroll = async (subjectId: string) => {
        if (!currentUser || currentUser.role !== Role.Student) return;
        
        const response = await api.enrollInSubject(currentUser.id, subjectId);

        if ('error' in response) {
            addToast(response.error, 'info');
            return;
        }
        
        const { newEnrollment, ownerLog, teacherLog } = response;

        setEnrollments(prev => [...prev, newEnrollment]);
        setActivityLogs(prev => [...prev, ownerLog, teacherLog]);

        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            addToast(`Successfully enrolled in ${subject.name}!`, 'success');
        }
        goBack();
    };
    
    const handleToggleBookmark = (lessonId: string) => {
        if (!currentUser || currentUser.role !== Role.Student) return;
        
        const existingBookmark = bookmarks.find(b => b.studentId === currentUser.id && b.lessonId === lessonId);
        
        if (existingBookmark) {
            setBookmarks(prev => prev.filter(b => !(b.studentId === currentUser.id && b.lessonId === lessonId)));
            addToast('Bookmark removed.', 'info');
        } else {
            const newBookmark: LessonBookmark = { studentId: currentUser.id, lessonId };
            setBookmarks(prev => [...prev, newBookmark]);
            addToast('Lesson bookmarked!', 'success');
        }
    };
    
    const handleBuyBook = (bookId: string) => {
        if (!currentUser || currentUser.role !== Role.Student) return;
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        const newPurchase: BookPurchase = { studentId: currentUser.id, bookId };
        setBookPurchases(prev => [...prev, newPurchase]);

        const paymentRecord: PaymentRecord = {
            id: `pay-${payments.length + 1}`,
            studentId: currentUser.id,
            studentName: currentUser.name,
            date: new Date(),
            amount: book.price,
            method: 'Wallet',
            plan: 'BookPurchase'
        };
        setPayments(prev => [...prev, paymentRecord]);
        addToast(`Successfully purchased ${book.title}!`, 'success');
    };

    const handleTutorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tutorInput.trim() || isTutorLoading) return;
    
        const userMessage: ChatMessage = { sender: 'user', text: tutorInput, timestamp: new Date() };
        setTutorChatMessages(prev => [...prev, userMessage]);
        const currentInput = tutorInput;
        setTutorInput('');
        setIsTutorLoading(true);
    
        try {
            const aiResponseText = await api.runAiTutor(currentInput);
            const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText, timestamp: new Date() };
            setTutorChatMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'ai', text: "I'm having trouble connecting right now. Please try again later.", timestamp: new Date() };
            setTutorChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTutorLoading(false);
        }
    };

    const handleSubscriptionChange = (newPlan: SubscriptionPlan) => {
        if (!currentUser || currentUser.role !== Role.Student) return;

        const planDetails = plans.find(p => p.plan === newPlan);
        if (!planDetails) {
            addToast('Invalid subscription plan selected.', 'error');
            return;
        }

        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + planDetails.durationDays);

        const updatedUser: User = {
            ...currentUser,
            subscription: {
                plan: newPlan,
                startDate: new Date(),
                endDate: newEndDate,
            }
        };

        setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);

        const newPayment: PaymentRecord = {
            id: `pay-${payments.length + 1}`,
            studentId: currentUser.id,
            studentName: currentUser.name,
            date: new Date(),
            amount: planDetails.price,
            method: 'Online',
            plan: newPlan,
        };
        setPayments(prev => [newPayment, ...prev]);

        addToast(`Successfully subscribed to the ${planDetails.name}!`, 'success');
    };
    
    const handleCreateLesson = (lessonData: { title: string; description: string; subjectId: string; duration: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced' }, videoFile: File) => {
        if (!currentUser) return;
        const newLesson: VideoLesson = {
          id: `vl-${videoLessons.length + 1}`,
          thumbnail: `https://picsum.photos/seed/vl-${videoLessons.length + 1}/400/225`,
          chapters: [],
          ...lessonData
        };
        setVideoLessons(prev => [...prev, newLesson]);
        
        const subject = subjects.find(s => s.id === lessonData.subjectId);
        const newLog: ActivityLog = {
          id: `log-${activityLogs.length + 1}`,
          userId: currentUser.id,
          type: ActivityType.NewLesson,
          text: `${currentUser.name} uploaded a new lesson: "${lessonData.title}" in ${subject?.name}`,
          timestamp: new Date(),
          read: false
        };
        setActivityLogs(prev => [newLog, ...prev]);

        addToast(`Lesson "${lessonData.title}" with video "${videoFile.name}" uploaded successfully!`, 'success');
        setNewContentModal(null);
    };
    
    const handleCreateLiveClass = (classData: { title: string; subjectId: string; startTime: Date }) => {
        if (!currentUser) return;
        const newClass: LiveClass = {
          id: `lc-${liveClasses.length + 1}`,
          teacherName: currentUser.name,
          teacherId: currentUser.id,
          status: 'Scheduled',
          ...classData
        };
        setLiveClasses(prev => [...prev, newClass]);
        
        const subject = subjects.find(s => s.id === classData.subjectId);
        const reminderLog: ActivityLog = {
          id: `log-${activityLogs.length + 1}`,
          userId: 'all',
          type: ActivityType.LiveReminder,
          text: `New live class scheduled: "${classData.title}" in ${subject?.name}.`,
          timestamp: new Date(),
          read: false
        };
        setActivityLogs(prev => [reminderLog, ...prev]);
        
        addToast('Live class scheduled successfully!', 'success');
        setNewContentModal(null);
    };

    const handleRateBook = (bookId: string, rating: number) => {
        if (!currentUser) return;
        setBookRatings(prev => {
            const existingRatingIndex = prev.findIndex(r => r.bookId === bookId && r.studentId === currentUser.id);
            if (existingRatingIndex > -1) {
                const updatedRatings = [...prev];
                updatedRatings[existingRatingIndex] = { ...updatedRatings[existingRatingIndex], rating };
                return updatedRatings;
            }
            return [...prev, { bookId, studentId: currentUser.id, rating }];
        });
        addToast(`You rated this book ${rating} stars.`, 'success');
    };

    const handleAddOrUpdateNote = (bookId: string, noteText: string, noteId?: string) => {
        if (!currentUser) return;
        setBookNotes(prev => {
            if (noteId) {
                return prev.map(note => note.id === noteId ? { ...note, note: noteText, lastUpdatedAt: new Date() } : note);
            } else {
                const newNote: BookNote = {
                    id: `note-${Date.now()}`,
                    bookId,
                    studentId: currentUser.id,
                    note: noteText,
                    lastUpdatedAt: new Date()
                };
                return [...prev, newNote];
            }
        });
        addToast(noteId ? 'Note updated!' : 'Note added!', 'success');
    };

    const handleDeleteNote = (noteId: string) => {
        setBookNotes(prev => prev.filter(note => note.id !== noteId));
        addToast('Note deleted.', 'info');
    };

    // --- Live Class Handlers ---
    const handleJoinLiveClass = (liveClass: LiveClass) => {
        if (!currentUser || currentUser.role !== Role.Student) return;

        const hasMonthlyPass = subscriptionStatus === 'Active' && subscriptionPlan === SubscriptionPlan.Monthly;
        const hasOneTimePass = currentUser.oneTimeClassPasses?.includes(liveClass.id);

        if (hasMonthlyPass || hasOneTimePass) {
            setLiveChatMessages([]); // Clear chat for new session
            addToast(`Joining "${liveClass.title}"...`, 'info');
            navigate('liveStream', { classId: liveClass.id });
        } else {
            setPaymentModalClass(liveClass);
        }
    };

    const handlePayForLiveClass = (liveClass: LiveClass) => {
        if (!currentUser || currentUser.role !== Role.Student) return;

        const updatedUser: User = {
            ...currentUser,
            oneTimeClassPasses: [...(currentUser.oneTimeClassPasses || []), liveClass.id],
        };

        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        
        const paymentRecord: PaymentRecord = {
            id: `pay-${payments.length + 1}`,
            studentId: currentUser.id,
            studentName: currentUser.name,
            date: new Date(),
            amount: 500,
            method: 'Online',
            plan: 'LiveStreamTopUp',
        };
        setPayments(prev => [paymentRecord, ...prev]);
        
        setPaymentModalClass(null);
        addToast(`Payment successful! You can now join the class.`, 'success');
        setLiveChatMessages([]);
        navigate('liveStream', { classId: liveClass.id });
    };

    const handleGoLive = (liveClass: LiveClass) => {
        setLiveClasses(prev => prev.map(lc => lc.id === liveClass.id ? { ...lc, status: 'Live' } : lc));
        
        const subject = subjects.find(s => s.id === liveClass.subjectId);
        const startLog: ActivityLog = {
          id: `log-${activityLogs.length + 1}`,
          userId: 'all',
          type: ActivityType.LiveClassStarted,
          text: `${liveClass.teacherName} has started the live class: "${liveClass.title}" in ${subject?.name}.`,
          timestamp: new Date(),
          read: false
        };
        setActivityLogs(prev => [startLog, ...prev]);

        setLiveChatMessages([]);
        navigate('liveStream', { classId: liveClass.id });
    };

    const handleEndStream = (liveClass: LiveClass) => {
        setLiveClasses(prev => prev.map(lc => lc.id === liveClass.id ? { ...lc, status: 'Ended' } : lc));
        addToast('Live stream has ended.', 'info');
        goBack();
    };
    
    const handleSendLiveChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!liveChatInput.trim() || !currentUser) return;
        const newMessage: ChatMessage = {
            sender: currentUser.role === Role.Student ? 'student' : 'teacher',
            text: liveChatInput,
            timestamp: new Date(),
            name: currentUser.name,
        };
        setLiveChatMessages(prev => [...prev, newMessage]);
        setLiveChatInput('');
    };
    
    const handleMarkAllNotificationsRead = () => {
        if (!currentUser) return;
        setActivityLogs(prevLogs =>
            prevLogs.map(log =>
                (log.userId === currentUser.id || log.userId === 'all') ? { ...log, read: true } : log
            )
        );
        addToast('All notifications marked as read.', 'info');
    };

    const handleNotificationSettingChange = (setting: ActivityType, value: boolean) => {
        if (!currentUser) return;
        const updatedUser = {
            ...currentUser,
            notificationSettings: {
                ...currentUser.notificationSettings,
                [setting]: value,
            },
        };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => (u.id === currentUser.id ? updatedUser : u)));
    };


    // --- Component Rendering ---
    
    const Header: React.FC = () => {
        const title = currentPage.page.charAt(0).toUpperCase() + currentPage.page.slice(1);
        const unreadCount = currentUser ? activityLogs.filter(log => !log.read && (log.userId === 'all' || log.userId === currentUser.id)).length : 0;

        return (
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    {currentStack.length > 1 ? (
                    <button onClick={goBack} className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400" aria-label="Go back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    ) : (
                        <SmartLearnLogo className="w-8 h-8" />
                    )}
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 hidden sm:block truncate">{title}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative flex-grow max-w-xs md:max-w-sm">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                         {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setIsNotificationsOpen(true)} className="text-slate-500 dark:text-slate-400 relative" aria-label="View notifications">
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>}
                    </button>
                    <div className="relative">
                        <button onClick={() => setIsProfileMenuOpen(p => !p)} className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400" aria-label="Open profile menu">
                            {currentUser?.profilePicture ? <img src={currentUser.profilePicture} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" /> : <UserCircleIcon className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
            </header>
        );
    };

    const ProfileMenu = () => (
        <div ref={profileMenuRef} className="absolute top-16 right-4 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-30 animate-fade-in-up">
            <div className="p-4 border-b dark:border-slate-700">
                <p className="font-semibold">{currentUser?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
            </div>
            <div className="p-2">
                 <button onClick={() => { navigate('profile'); setIsProfileMenuOpen(false); }} className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                    <UserCircleIcon className="w-5 h-5" /> My Profile
                </button>
                <button onClick={() => { navigate('settings'); setIsProfileMenuOpen(false); }} className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                    <Cog6ToothIcon className="w-5 h-5" /> Settings
                </button>
            </div>
            <div className="p-2 border-t dark:border-slate-700">
                <Button onClick={handleLogout} variant="secondary" className="w-full !py-2 !font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50">
                    Logout
                </Button>
            </div>
        </div>
    );
    
    const StudentDashboard: React.FC<{
        currentUser: User;
        enrollments: Enrollment[];
        subjects: Subject[];
        videoLessons: VideoLesson[];
        liveClasses: LiveClass[];
        lessonCompletions: LessonCompletion[];
        bookmarks: LessonBookmark[];
        navigate: (page: string, params?: any) => void;
    }> = ({ currentUser, enrollments, subjects, videoLessons, liveClasses, lessonCompletions, bookmarks, navigate }) => {
        const [quote, setQuote] = useState("Loading your daily inspiration...");
        const [recommendedLessons, setRecommendedLessons] = useState<VideoLesson[]>([]);

        useEffect(() => {
            api.getMotivationalQuote().then(setQuote);
        }, []);

        useEffect(() => {
            const fetchRecommendations = async () => {
                const enrolledSubjectIds = enrollments.map(e => e.subjectId);
                const completedLessonIds = lessonCompletions.map(c => c.lessonId);
                const allLessonInfo = videoLessons.map(l => ({ id: l.id, title: l.title, subjectId: l.subjectId }));
                const recommendedIds = await api.getRecommendedLessons(enrolledSubjectIds, allLessonInfo, completedLessonIds);
                const recommended = videoLessons.filter(lesson => recommendedIds.includes(lesson.id));
                setRecommendedLessons(recommended);
            };

            if (enrollments.length > 0) {
                fetchRecommendations();
            }
        }, [enrollments, videoLessons, lessonCompletions]);

        const mySubjects = subjects.filter(subject => enrollments.some(e => e.subjectId === subject.id));
        const upcomingClasses = liveClasses
            .filter(lc => mySubjects.some(s => s.id === lc.subjectId) && lc.status !== 'Ended')
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .slice(0, 3);
        
        const lastCompleted = lessonCompletions.sort((a,b) => b.completedAt.getTime() - a.completedAt.getTime())[0];
        let continueLearningLesson: VideoLesson | null = null;
        if (lastCompleted) {
            const lastLesson = videoLessons.find(l => l.id === lastCompleted.lessonId);
            if (lastLesson) {
                const lessonsInSameSubject = videoLessons.filter(l => l.subjectId === lastLesson.subjectId);
                const lastLessonIndex = lessonsInSameSubject.findIndex(l => l.id === lastLesson.id);
                if (lastLessonIndex < lessonsInSameSubject.length - 1) {
                    continueLearningLesson = lessonsInSameSubject[lastLessonIndex + 1];
                }
            }
        } else if (mySubjects.length > 0) {
            continueLearningLesson = videoLessons.find(l => l.subjectId === mySubjects[0].id) || null;
        }
        
        const myBookmarks = bookmarks
            .map(b => videoLessons.find(l => l.id === b.lessonId))
            .filter((l): l is VideoLesson => l !== undefined);

        const DashboardSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
            <section className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                    {icon}
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                </div>
                {children}
            </section>
        );

        return (
            <div className="p-4 sm:p-6 space-y-8">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 rounded-2xl text-white shadow-lg animate-fade-in-up">
                    <h1 className="text-2xl sm:text-3xl font-bold">Hello, {currentUser.name.split(' ')[0]}!</h1>
                    <p className="mt-2 text-teal-100 italic">"{quote}"</p>
                </div>

                {continueLearningLesson && (
                    <DashboardSection title="Continue Learning" icon={<PlayIcon className="w-6 h-6 text-teal-500" />}>
                         <div onClick={() => navigate('lesson', { lessonId: continueLearningLesson?.id })} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex flex-col sm:flex-row items-center gap-4 hover-lift cursor-pointer">
                            <img src={continueLearningLesson.thumbnail} alt={continueLearningLesson.title} className="w-full sm:w-40 h-auto object-cover rounded-lg" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-slate-400">{subjects.find(s => s.id === continueLearningLesson?.subjectId)?.name}</p>
                                <h3 className="text-lg font-bold mt-1">{continueLearningLesson.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{continueLearningLesson.description}</p>
                            </div>
                            <Button className="mt-4 sm:mt-0 self-start sm:self-center">Start Lesson</Button>
                        </div>
                    </DashboardSection>
                )}

                <DashboardSection title="My Subjects" icon={<AcademicCapIcon className="w-6 h-6 text-teal-500" />}>
                    {mySubjects.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mySubjects.map(subject => (
                                <div key={subject.id} onClick={() => navigate('subject', { subjectId: subject.id })} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover-lift cursor-pointer">
                                    <img src={subject.coverPhoto} alt={subject.name} className="h-24 w-full object-cover" />
                                    <div className="p-4">
                                        <h3 className="font-bold truncate">{subject.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{subject.teacherName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">You are not enrolled in any subjects yet.</p>
                            <Button className="mt-4" onClick={() => navigate('exploreSubjects')}>Explore Subjects</Button>
                        </div>
                    )}
                </DashboardSection>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {upcomingClasses.length > 0 && (
                        <DashboardSection title="Upcoming Live Classes" icon={<VideoCameraIcon className="w-6 h-6 text-teal-500" />}>
                            <div className="space-y-3">
                                {upcomingClasses.map(lc => (
                                    <div key={lc.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex items-center gap-4">
                                        <div className="p-3 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                                            <CalendarDaysIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold">{lc.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{lc.teacherName} &bull; {subjects.find(s=>s.id === lc.subjectId)?.name}</p>
                                            <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1">{lc.startTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                        <Button onClick={() => handleJoinLiveClass(lc)} className="!py-2 !px-4">
                                            {lc.status === 'Live' ? 'Join Now' : 'Join'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </DashboardSection>
                    )}

                    {myBookmarks.length > 0 && (
                        <DashboardSection title="My Bookmarks" icon={<BookmarkIcon className="w-6 h-6 text-teal-500" />}>
                            <div className="space-y-3">
                                {myBookmarks.map(lesson => (
                                    <div key={lesson.id} onClick={() => navigate('lesson', { lessonId: lesson.id })} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 flex items-center gap-3 hover-lift cursor-pointer">
                                        <img src={lesson.thumbnail} alt={lesson.title} className="w-24 h-16 object-cover rounded-md"/>
                                        <div className="flex-1">
                                            <h3 className="font-semibold line-clamp-2">{lesson.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{subjects.find(s => s.id === lesson.subjectId)?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardSection>
                    )}

                    {recommendedLessons.length > 0 && !myBookmarks.length && (
                         <DashboardSection title="Recommended For You" icon={<LightBulbIcon className="w-6 h-6 text-teal-500" />}>
                            <div className="space-y-3">
                                {recommendedLessons.map(lesson => (
                                    <div key={lesson.id} onClick={() => navigate('lesson', { lessonId: lesson.id })} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 flex items-center gap-3 hover-lift cursor-pointer">
                                        <img src={lesson.thumbnail} alt={lesson.title} className="w-24 h-16 object-cover rounded-md"/>
                                        <div className="flex-1">
                                            <h3 className="font-semibold line-clamp-2">{lesson.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{subjects.find(s => s.id === lesson.subjectId)?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardSection>
                    )}
                </div>
            </div>
        );
    };

    const ExploreSubjectsScreen: React.FC<{
        allSubjects: Subject[];
        studentEnrollments: Enrollment[];
        onEnroll: (subjectId: string) => void;
    }> = ({ allSubjects, studentEnrollments, onEnroll }) => {
        return (
            <div className="p-4 sm:p-6">
                <h2 className="text-3xl font-bold mb-6">Explore Subjects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allSubjects.map(subject => {
                        const isEnrolled = studentEnrollments.some(e => e.subjectId === subject.id);
                        return (
                            <div key={subject.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col">
                                <img src={subject.coverPhoto} alt={subject.name} className="h-40 w-full object-cover" />
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold">{subject.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">by {subject.teacherName}</p>
                                    <p className="text-sm mt-2 flex-grow text-slate-600 dark:text-slate-300">{subject.description}</p>
                                    <div className="mt-4">
                                        {isEnrolled ? (
                                            <Button variant="secondary" disabled className="w-full opacity-70 cursor-not-allowed flex items-center justify-center gap-2">
                                                <CheckCircleIcon className="w-5 h-5" />
                                                Enrolled
                                            </Button>
                                        ) : (
                                            <Button onClick={() => onEnroll(subject.id)} className="w-full">
                                                Enroll Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };


    const TeacherDashboard: React.FC = () => {
        const mySubjects = subjects.filter(s => s.teacherId === currentUser?.id);
        const myStudentsCount = enrollments.filter(e => mySubjects.some(s => s.id === e.subjectId)).map(e => e.studentId).filter((v, i, a) => a.indexOf(v) === i).length;
        const myLiveClasses = liveClasses.filter(lc => lc.teacherId === currentUser?.id).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
        
        const StatusBadge: React.FC<{ status: LiveClass['status']}> = ({ status }) => {
            const styles = {
                Scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                Live: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 animate-pulse',
                Ended: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
            };
            return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status || 'Scheduled']}`}>{status}</span>
        };
        
        return (
             <div className="p-4 sm:p-6 space-y-6">
                 <div>
                    <h2 className="text-3xl font-bold">Teacher Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your subjects and students.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-white">
                    <StatCard icon={<AcademicCapIcon />} title="My Subjects" value={mySubjects.length} gradient="bg-gradient-to-br from-purple-500 to-violet-600" />
                    <StatCard icon={<UsersIcon />} title="My Students" value={myStudentsCount} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                    <StatCard icon={<VideoCameraIcon />} title="Live Classes" value={myLiveClasses.length} gradient="bg-gradient-to-br from-red-500 to-pink-600" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">Create Content</h3>
                    <div className="flex gap-4">
                        <Button onClick={() => setNewContentModal({type: 'lesson', subjectId: null})} className="w-full flex items-center justify-center gap-2">
                            <CloudArrowUpIcon className="w-5 h-5" /> Upload Lesson
                        </Button>
                        <Button onClick={() => setNewContentModal({type: 'class', subjectId: null})} variant="secondary" className="w-full flex items-center justify-center gap-2">
                            <VideoCameraIcon className="w-5 h-5" /> Schedule Class
                        </Button>
                    </div>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <h3 className="text-xl font-bold mb-4">My Subjects</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mySubjects.map(subject => (
                                <div key={subject.id} onClick={() => navigate('subject', { subjectId: subject.id })} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl shadow-md overflow-hidden hover-lift cursor-pointer">
                                    <img src={subject.coverPhoto} alt={subject.name} className="h-24 w-full object-cover" />
                                    <div className="p-4">
                                        <h3 className="font-bold truncate">{subject.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{enrollments.filter(e => e.subjectId === subject.id).length} Students</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                         <h3 className="text-xl font-bold mb-4">My Live Classes</h3>
                         <div className="space-y-3 max-h-80 overflow-y-auto">
                            {myLiveClasses.length > 0 ? myLiveClasses.map(lc => (
                                <div key={lc.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{lc.title}</h4>
                                            <StatusBadge status={lc.status} />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{lc.startTime.toLocaleString()}</p>
                                    </div>
                                    {lc.status === 'Scheduled' && (
                                        <Button onClick={() => handleGoLive(lc)} className="!py-1 !px-3 !text-sm">Go Live</Button>
                                    )}
                                    {lc.status === 'Live' && (
                                        <Button onClick={() => navigate('liveStream', {classId: lc.id})} variant="secondary" className="!py-1 !px-3 !text-sm">View Stream</Button>
                                    )}
                                </div>
                            )) : <p className="text-center text-slate-500 text-sm py-4">No live classes scheduled.</p>}
                         </div>
                     </div>
                </div>
             </div>
        )
    };
    const OwnerDashboard: React.FC = () => {
        const [ownerTab, setOwnerTab] = useState('overview');
        const [userSubTab, setUserSubTab] = useState<'students' | 'teachers' | 'applications'>('students');
        const [platformBalance, setPlatformBalance] = useState(500000);
        const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
        const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState<User | null>(null);
        const [isAppDetailsModalOpen, setIsAppDetailsModalOpen] = useState<User | null>(null);
        
        const recentLogs = activityLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
        const teacherApplications = users.filter(u => u.role === Role.Teacher && u.teacherApplication?.status === 'Pending');

        const handleApproveTeacher = (teacherId: string) => {
            setUsers(users.map(u => u.id === teacherId ? { ...u, teacherApplication: { ...u.teacherApplication!, status: 'Approved' } } : u));
            addToast('Teacher application approved.', 'success');
        };

        const handleRejectTeacher = (teacherId: string) => {
             setUsers(users.map(u => u.id === teacherId ? { ...u, teacherApplication: { ...u.teacherApplication!, status: 'Rejected' } } : u));
            addToast('Teacher application rejected.', 'error');
        };

        const handleWithdrawal = (amount: number, method: Withdrawal['method'], details: any) => {
            const newWithdrawal: Withdrawal = {
                id: `wd-${withdrawals.length + 1}`,
                amount,
                method,
                timestamp: new Date(),
                ...details
            };
            setWithdrawals(prev => [newWithdrawal, ...prev]);
            setPlatformBalance(prev => prev - amount);
            addToast(`Withdrawal of K${amount.toLocaleString()} successful.`, 'success');
            setIsWithdrawalModalOpen(false);
        };
        
        const TabButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode, count?: number}> = ({active, onClick, children, count}) => (
            <button onClick={onClick} className={`whitespace-nowrap pb-3 px-4 border-b-2 font-medium text-sm transition-colors ${active ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                {children} {typeof count !== 'undefined' && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{count}</span>}
            </button>
        );

        const activityIcons: { [key in ActivityType]?: React.ReactElement } = {
            [ActivityType.NewEnrollment]: <UserGroupIcon className="w-5 h-5 text-blue-500" />,
            [ActivityType.NewEnrollmentInClass]: <UserGroupIcon className="w-5 h-5 text-blue-500" />,
            [ActivityType.PaymentReceived]: <BanknotesIcon className="w-5 h-5 text-green-500" />,
            [ActivityType.NewLesson]: <BookOpenIcon className="w-5 h-5 text-purple-500" />,
            [ActivityType.QuizSubmission]: <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-500" />,
            [ActivityType.LiveReminder]: <VideoCameraIcon className="w-5 h-5 text-red-500" />,
            [ActivityType.TeacherApplication]: <BriefcaseIcon className="w-5 h-5 text-amber-500" />,
        };
        
        return (
            <div className="p-4 sm:p-6 space-y-6">
                 {isWithdrawalModalOpen && <WithdrawalModal balance={platformBalance} onClose={() => setIsWithdrawalModalOpen(false)} onSubmit={handleWithdrawal} />}
                 {isUserDetailsModalOpen && <UserDetailsModal user={isUserDetailsModalOpen} onClose={() => setIsUserDetailsModalOpen(null)} />}
                 {isAppDetailsModalOpen && <ApplicationDetailsModal applicant={isAppDetailsModalOpen} onClose={() => setIsAppDetailsModalOpen(null)} />}

                <div>
                    <h2 className="text-3xl font-bold">Owner Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Welcome, {currentUser?.name}. Here's an overview of your platform.</p>
                </div>

                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton active={ownerTab === 'overview'} onClick={() => setOwnerTab('overview')}>Overview</TabButton>
                        <TabButton active={ownerTab === 'users'} onClick={() => setOwnerTab('users')} count={teacherApplications.length}>User Management</TabButton>
                        <TabButton active={ownerTab === 'finances'} onClick={() => setOwnerTab('finances')}>Finances</TabButton>
                    </nav>
                </div>

                {ownerTab === 'overview' && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-white">
                            <StatCard icon={<UsersIcon />} title="Total Students" value={users.filter(u=>u.role === Role.Student).length} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                            <StatCard icon={<BriefcaseIcon />} title="Total Teachers" value={users.filter(u=>u.role === Role.Teacher && u.teacherApplication?.status === 'Approved').length} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                             <StatCard icon={<BanknotesIcon />} title="Platform Balance" value={`K${platformBalance.toLocaleString()}`} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                            <StatCard icon={<AcademicCapIcon />} title="Total Subjects" value={subjects.length} gradient="bg-gradient-to-br from-purple-500 to-violet-600" />
                             <StatCard icon={<DocumentTextIcon />} title="Pending Apps" value={teacherApplications.length} gradient="bg-gradient-to-br from-pink-500 to-rose-600" />
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                            <ul className="space-y-4">
                                {recentLogs.map(log => (
                                    <li key={log.id} className="flex items-start gap-3">
                                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1">
                                            {activityIcons[log.type] || <RssIcon className="w-5 h-5 text-slate-500" />}
                                        </div>
                                        <div>
                                            <p className="text-sm">{log.text}</p>
                                            <p className="text-xs text-slate-400">{log.timestamp.toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                
                {ownerTab === 'users' && (
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <div className="border-b border-slate-200 dark:border-slate-700">
                            <nav className="-mb-px flex space-x-6">
                                <TabButton active={userSubTab === 'students'} onClick={() => setUserSubTab('students')} count={users.filter(u => u.role === Role.Student).length}>Students</TabButton>
                                <TabButton active={userSubTab === 'teachers'} onClick={() => setUserSubTab('teachers')} count={users.filter(u => u.role === Role.Teacher && u.teacherApplication?.status === 'Approved').length}>Teachers</TabButton>
                                <TabButton active={userSubTab === 'applications'} onClick={() => setUserSubTab('applications')} count={teacherApplications.length}>Applications</TabButton>
                            </nav>
                        </div>
                        <div className="mt-4 max-h-96 overflow-y-auto">
                            {(userSubTab === 'students' || userSubTab === 'teachers') && users.filter(u => (userSubTab === 'students' ? u.role === Role.Student : u.role === Role.Teacher && u.teacherApplication?.status === 'Approved')).map(user => (
                                <div key={user.id} className="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                    <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full object-cover mr-4" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                    </div>
                                    <Button onClick={() => setIsUserDetailsModalOpen(user)} variant="secondary" className="!py-1 !px-3 !text-sm">View</Button>
                                </div>
                            ))}
                            {userSubTab === 'applications' && teacherApplications.map(user => (
                                 <div key={user.id} className="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                    <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full object-cover mr-4" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Button onClick={() => setIsAppDetailsModalOpen(user)} variant="secondary" className="!py-1 !px-3 !text-sm">Message</Button>
                                        <Button onClick={() => addToast('Simulating CV download...','info')} variant="secondary" className="!py-1 !px-3 !text-sm"><ArrowDownTrayIcon className="w-4 h-4" title="Download CV" /></Button>
                                        <Button onClick={() => handleApproveTeacher(user.id)} className="!py-1 !px-3 !text-sm !bg-green-500 hover:!bg-green-600"><CheckCircleIcon className="w-4 h-4"/></Button>
                                        <Button onClick={() => handleRejectTeacher(user.id)} className="!py-1 !px-3 !text-sm !bg-red-500 hover:!bg-red-600"><XCircleIcon className="w-4 h-4"/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {ownerTab === 'finances' && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-semibold">Financials</h3>
                             <Button onClick={() => setIsWithdrawalModalOpen(true)}>Withdraw Funds</Button>
                        </div>
                        <h4 className="text-lg font-semibold mb-2">Withdrawal History</h4>
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                        <th scope="col" className="px-6 py-3">Amount</th>
                                        <th scope="col" className="px-6 py-3">Method</th>
                                        <th scope="col" className="px-6 py-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map(w => (
                                        <tr key={w.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                            <td className="px-6 py-4">{w.timestamp.toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium">K{w.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4">{w.method}</td>
                                            <td className="px-6 py-4 text-xs">{w.phoneNumber || `${w.bankName} - ${w.accountNumber}`}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const SubjectDetailScreen: React.FC = () => {
        const subject = subjects.find(s => s.id === currentPage.subjectId);
        if (!subject || !currentUser) return <div className="p-6">Subject not found.</div>;
        
        const lessons = videoLessons.filter(l => l.subjectId === subject.id);
        const isTeacherOfSubject = currentUser.role === Role.Teacher && subject.teacherId === currentUser.id;

        return (
            <div className="p-4 sm:p-6">
                <div className="mb-6">
                    <img src={subject.coverPhoto} alt={subject.name} className="h-48 w-full object-cover rounded-2xl"/>
                    <h1 className="text-3xl font-bold mt-4">{subject.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Taught by {subject.teacherName}</p>
                </div>
                 {isTeacherOfSubject && (
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                        <h3 className="text-lg font-bold flex-1">Teacher Tools</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button onClick={() => setNewContentModal({type: 'lesson', subjectId: subject.id})} className="w-full flex-1 flex items-center justify-center gap-2"><CloudArrowUpIcon className="w-5 h-5" /> Add Lesson</Button>
                            <Button onClick={() => setNewContentModal({type: 'class', subjectId: subject.id})} variant="secondary" className="w-full flex-1 flex items-center justify-center gap-2"><VideoCameraIcon className="w-5 h-5" /> Schedule Class</Button>
                        </div>
                    </div>
                )}
                 <div>
                    <h2 className="text-2xl font-bold mb-4">Video Lessons</h2>
                    <div className="space-y-4">
                        {lessons.length > 0 ? lessons.map(lesson => (
                            <div key={lesson.id} onClick={() => navigate('lesson', { lessonId: lesson.id })} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4 hover-lift cursor-pointer">
                                <img src={lesson.thumbnail} alt={lesson.title} className="w-28 h-20 object-cover rounded-lg" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{lesson.title}</h3>
                                    <p className="text-sm text-slate-500">{lesson.duration} &bull; {lesson.difficulty}</p>
                                </div>
                                <PlayIcon className="w-8 h-8 text-teal-500"/>
                            </div>
                        )) : (
                            <div className="text-center py-8 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <p className="text-slate-500 dark:text-slate-400">No lessons have been added to this subject yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const LessonDetailScreen: React.FC = () => {
        const lesson = videoLessons.find(l => l.id === currentPage.lessonId);
        if (!lesson || !currentUser) return <div className="p-6">Lesson not found.</div>;

        const subject = subjects.find(s => s.id === lesson.subjectId);
        const isBookmarked = bookmarks.some(b => b.studentId === currentUser.id && b.lessonId === lesson.id);

        const subjectLessons = videoLessons
          .filter(l => l.subjectId === lesson.subjectId)
          .sort((a,b) => a.title.localeCompare(b.title));
        
        const currentIndex = subjectLessons.findIndex(l => l.id === lesson.id);
        const prevLesson = currentIndex > 0 ? subjectLessons[currentIndex - 1] : null;
        const nextLesson = currentIndex < subjectLessons.length - 1 ? subjectLessons[currentIndex + 1] : null;

        return (
            <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="aspect-video bg-black rounded-2xl mb-4 flex items-center justify-center">
                        <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-teal-500 font-semibold">{subject?.name}</p>
                            <h1 className="text-3xl font-bold">{lesson.title}</h1>
                        </div>
                         {currentUser.role === Role.Student && (
                            <button onClick={() => handleToggleBookmark(lesson.id)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                                <BookmarkIcon title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'} className={`w-7 h-7 ${isBookmarked ? 'text-teal-500' : 'text-slate-500'}`} filled={isBookmarked} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm mb-4">
                        <span><ClockIcon className="w-4 h-4 inline mr-1" /> {lesson.duration}</span>
                        <span><StarIcon className="w-4 h-4 inline mr-1" /> {lesson.difficulty}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{lesson.description}</p>

                    {currentUser.role === Role.Student && (
                        <div className="mt-8 pt-6 border-t dark:border-slate-700 flex justify-between items-center">
                            <Button onClick={() => navigate('lesson', { lessonId: prevLesson!.id })} disabled={!prevLesson} variant="secondary" className="flex items-center gap-2">
                                <ArrowLeftIcon className="w-5 h-5" /> Previous
                            </Button>
                            <Button onClick={() => navigate('lesson', { lessonId: nextLesson!.id })} disabled={!nextLesson} className="flex items-center gap-2">
                                Next <ArrowRightIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    const BookstoreScreen: React.FC = () => {
        if (!currentUser) return null;
        const myPurchases = bookPurchases.filter(p => p.studentId === currentUser.id).map(p => p.bookId);

        const handleReadBook = (book: Book) => {
            if (book.password && !unlockedBooks.includes(book.id)) {
                setBookPasswordModal(book);
            } else {
                navigate('bookReader', { bookId: book.id });
            }
        };

        return (
            <div className="p-4 sm:p-6">
                <h2 className="text-3xl font-bold mb-6">Bookstore & Library</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {books.map(book => {
                        const isPurchased = myPurchases.includes(book.id);
                        const ratingsForBook = bookRatings.filter(r => r.bookId === book.id);
                        const avgRating = ratingsForBook.length > 0 ? ratingsForBook.reduce((sum, r) => sum + r.rating, 0) / ratingsForBook.length : 0;
                        
                        return (
                            <div key={book.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col p-4 text-center hover-lift">
                                <div className="relative cursor-pointer" onClick={() => isPurchased && handleReadBook(book)}>
                                    <img src={book.coverPhoto} alt={book.title} className="h-48 w-auto object-contain rounded-md mb-2 mx-auto"/>
                                    {isPurchased && book.password && <div className="absolute top-2 right-2 bg-slate-800/60 p-1.5 rounded-full"><LockClosedIcon className="w-4 h-4 text-white"/></div>}
                                </div>
                                <h3 className="font-bold flex-grow mt-2">{book.title}</h3>
                                <p className="text-sm text-slate-500">{book.author}</p>
                                <div className="my-2 flex items-center justify-center gap-1">
                                    {avgRating > 0 ? <StarRating rating={avgRating} /> : <p className="text-xs text-slate-400">Not rated</p>}
                                    <span className="text-xs text-slate-400">({ratingsForBook.length})</span>
                                </div>
                                <div className="mt-auto w-full">
                                    {isPurchased ? (
                                        <Button variant="secondary" className="w-full" onClick={() => handleReadBook(book)}>Read Now</Button>
                                    ) : (
                                        <Button onClick={() => handleBuyBook(book.id)} className="w-full">
                                            Buy K{book.price.toLocaleString()}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </div>
        );
    };

    const AiTutorScreen: React.FC = () => {
        const chatEndRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [tutorChatMessages]);

        return (
            <div className="h-full flex flex-col p-4">
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    {tutorChatMessages.map((msg, index) => (
                         <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white"/></div>}
                            <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                         </div>
                    ))}
                    {isTutorLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white"/></div>
                            <div className="max-w-md p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-none">
                                <div className="flex gap-1.5">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-0"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                 <form onSubmit={handleTutorSubmit} className="flex-shrink-0 pt-4 flex items-center gap-2">
                    <input 
                        type="text"
                        value={tutorInput}
                        onChange={(e) => setTutorInput(e.target.value)}
                        placeholder="Ask about any topic..."
                        className="w-full px-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Button type="submit" className="!px-4 !rounded-full" disabled={isTutorLoading || !tutorInput.trim()}>
                        <SendIcon className="w-6 h-6"/>
                    </Button>
                </form>
            </div>
        );
    };

    const HelpAndSupportScreen: React.FC = () => {
        return (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">Help & Support</h2>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md mb-8">
                    <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Have an urgent issue or a question you can't find an answer to? Our support team is available on WhatsApp.
                    </p>
                    <a href="https://wa.me/265883526602" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 active:scale-95 bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 w-full">
                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        Chat on WhatsApp
                    </a>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold">How do I subscribe to a plan?</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Navigate to your profile, select 'Subscription', and choose a plan. You can pay via Airtel Money, TNM Mpamba, or Bank Transfer.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold">Can I watch lessons offline?</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Currently, offline viewing is not supported. You need an active internet connection to stream video lessons.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">How do I reset my password?</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">On the login screen, click "Forgot Password" and follow the instructions sent to your email address.</p>
                        </div>
                    </div>
                 </div>
            </div>
        );
    };
    
    const LiveStreamScreen: React.FC = () => {
        const liveClass = liveClasses.find(lc => lc.id === currentPage.classId);
        const chatEndRef = useRef<HTMLDivElement>(null);

        const [isMicOn, setIsMicOn] = useState(true);
        const [isCameraOn, setIsCameraOn] = useState(true);
        const [isScreenSharing, setIsScreenSharing] = useState(false);
        const [isPresentationActive, setIsPresentationActive] = useState(false);
        const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('user');
        const [videoQuality, setVideoQuality] = useState('720p');
        const [isStudentPanelOpen, setIsStudentPanelOpen] = useState(false);
        const [studentPanelTab, setStudentPanelTab] = useState<'notes' | 'files' | 'books'>('files');
        
        useEffect(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [liveChatMessages]);

        if (!liveClass || !currentUser) return <p>Live class not found.</p>;

        const isTeacher = currentUser.role === Role.Teacher;

        const handleReadBook = (book: Book) => {
            if (book.password && !unlockedBooks.includes(book.id)) {
                setBookPasswordModal(book);
            } else {
                navigate('bookReader', { bookId: book.id });
            }
        };

        const MainFeed = () => {
            let content = <p className="text-slate-400 text-2xl">-- Mock Video Feed --</p>;
            if (isTeacher) {
                if (!isCameraOn) content = <p className="text-slate-400 text-2xl">Your camera is off</p>;
                else if (isScreenSharing) content = <p className="text-slate-400 text-2xl">You are sharing your screen</p>;
                else if (isPresentationActive) content = <p className="text-slate-400 text-2xl">Displaying Presentation</p>;
                else content = <p className="text-slate-400 text-2xl">Your camera feed ({videoQuality})</p>;
            } else {
                 if (isScreenSharing) content = <p className="text-slate-400 text-2xl">Teacher is sharing their screen</p>;
                else if (isPresentationActive) content = <p className="text-slate-400 text-2xl">Teacher's Presentation</p>;
                else content = <p className="text-slate-400 text-2xl">Teacher's Camera Feed ({videoQuality})</p>;
            }
            return <div className="flex-grow flex items-center justify-center">{content}</div>;
        };

        const TeacherControls = () => (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-black/40 p-3 rounded-full backdrop-blur-sm">
                <button onClick={() => setIsMicOn(p => !p)} className={`p-3 rounded-full text-white transition-colors ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isMicOn ? <MicrophoneIcon className="w-6 h-6" /> : <MicrophoneSlashIcon className="w-6 h-6" />}
                </button>
                <button onClick={() => setIsCameraOn(p => !p)} className={`p-3 rounded-full text-white transition-colors ${isCameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isCameraOn ? <VideoCameraIcon className="w-6 h-6" /> : <VideoCameraSlashIcon className="w-6 h-6" />}
                </button>
                 <button onClick={() => setCurrentCamera(p => p === 'user' ? 'environment' : 'user')} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 hidden sm:block">
                    <ArrowsRightLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={() => setIsScreenSharing(p => !p)} className={`p-3 rounded-full text-white transition-colors ${isScreenSharing ? 'bg-teal-600' : 'bg-white/10'} hover:bg-teal-700`}>
                    <ComputerDesktopIcon className="w-6 h-6" />
                </button>
                <button onClick={() => addToast('Upload presentation... (simulated)', 'info')} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <CloudArrowUpIcon className="w-6 h-6" />
                </button>
                <button onClick={() => handleEndStream(liveClass)} className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700">
                    <PhoneIcon className="w-6 h-6" />
                </button>
            </div>
        );

        const StudentLearningPanel = () => {
            const subject = subjects.find(s => s.id === liveClass.subjectId);
            const subjectBooks = books.filter(b => b.subject === subject?.name);
            const myPurchasedBooksInSubject = subjectBooks.filter(b => bookPurchases.some(p => p.bookId === b.id && p.studentId === currentUser.id));

            return (
                <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 rounded-t-2xl transition-transform duration-300 ${isStudentPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <button onClick={() => setIsStudentPanelOpen(false)} className="absolute -top-10 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md"><CloseIcon className="w-5 h-5"/></button>
                    <div className="p-4 border-b dark:border-slate-600">
                        <div className="flex">
                            <button onClick={() => setStudentPanelTab('notes')} className={`px-4 py-2 text-sm font-semibold ${studentPanelTab === 'notes' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Notes</button>
                            <button onClick={() => setStudentPanelTab('files')} className={`px-4 py-2 text-sm font-semibold ${studentPanelTab === 'files' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Files</button>
                            <button onClick={() => setStudentPanelTab('books')} className={`px-4 py-2 text-sm font-semibold ${studentPanelTab === 'books' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Books</button>
                        </div>
                    </div>
                    <div className="p-4 h-64 overflow-y-auto">
                        {studentPanelTab === 'notes' && <p>Here are some notes for the class...</p>}
                        {studentPanelTab === 'files' && (
                            <ul className="space-y-2">
                                {liveClass.studyMaterials?.map(file => (
                                    <li key={file.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <div className="flex items-center gap-2">
                                            <DocumentTextIcon className="w-5 h-5 text-slate-500"/>
                                            <span>{file.name}</span>
                                        </div>
                                        <button onClick={() => addToast(`Downloading ${file.name}...`, 'info')}><ArrowDownTrayIcon className="w-5 h-5 text-teal-500"/></button>
                                    </li>
                                ))}
                                {!liveClass.studyMaterials?.length && <p className="text-slate-500 text-center text-sm py-4">No files shared for this class.</p>}
                            </ul>
                        )}
                        {studentPanelTab === 'books' && (
                            <ul className="space-y-3">
                                {myPurchasedBooksInSubject.map(book => (
                                     <li key={book.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <img src={book.coverPhoto} alt={book.title} className="w-12 h-16 object-cover rounded-md"/>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm line-clamp-2">{book.title}</h4>
                                        </div>
                                        <Button onClick={() => handleReadBook(book)} variant="secondary" className="!py-1 !px-3 !text-xs">
                                            {book.password ? <LockClosedIcon className="w-4 h-4 mr-1 inline-block"/> : null}
                                            Read
                                        </Button>
                                    </li>
                                ))}
                                {!myPurchasedBooksInSubject.length && <p className="text-slate-500 text-center text-sm py-4">You have not purchased any books for this subject.</p>}
                            </ul>
                        )}
                    </div>
                </div>
            );
        };

        const subject = subjects.find(s => s.id === liveClass.subjectId);

        return (
            <div className="h-full flex flex-col md:flex-row bg-slate-900 overflow-hidden">
                <div className="flex-1 flex flex-col relative">
                    <div className="p-4 flex justify-between items-start">
                        <div>
                             <h2 className="text-white text-xl font-bold">{liveClass.title}</h2>
                             <p className="text-slate-300 text-sm">{subject?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-white font-bold text-sm">LIVE</span>
                            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                                <UsersIcon className="w-4 h-4 text-white" />
                                <span className="text-white text-sm font-semibold">142</span>
                            </div>
                        </div>
                    </div>

                    <MainFeed />
                    
                    {!isTeacher && (
                         <button onClick={() => setIsStudentPanelOpen(p => !p)} className="absolute bottom-4 left-4 bg-teal-500 text-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 z-10">
                            <BookOpenIcon className="w-5 h-5" /> Study Materials {isStudentPanelOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
                        </button>
                    )}
                    
                    {isTeacher && <TeacherControls />}
                </div>
                <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-800 flex flex-col border-l dark:border-slate-700 relative transition-all duration-300 ${isStudentPanelOpen && !isTeacher ? 'md:w-0 md:opacity-0 md:invisible' : ''}`}>
                    <div className="p-4 border-b dark:border-slate-700">
                        <h3 className="font-bold text-lg">Live Chat</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {liveChatMessages.map((msg, index) => (
                             <div key={index} className="flex gap-2">
                                <img src={users.find(u => u.name === msg.name)?.profilePicture} className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-xs text-slate-500">{msg.name}</p>
                                    <div className="text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mt-1">
                                        {msg.text}
                                    </div>
                                </div>
                             </div>
                        ))}
                         <div ref={chatEndRef}></div>
                    </div>
                    <form onSubmit={handleSendLiveChatMessage} className="p-4 border-t dark:border-slate-700 flex items-center gap-2">
                        <input type="text" value={liveChatInput} onChange={e => setLiveChatInput(e.target.value)} placeholder="Say something..." className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 border dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <Button type="submit" className="!p-3 !rounded-full"><SendIcon className="w-5 h-5"/></Button>
                    </form>
                    {!isTeacher && <StudentLearningPanel />}
                </div>
            </div>
        );
    };

    const AboutUsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
        <Modal isOpen={true} onClose={onClose} title="About SmartLearn">
            <div className="text-center">
                <SmartLearnLogo className="w-16 h-16 mx-auto text-teal-600" />
                <h3 className="text-2xl font-bold mt-4">Our Mission</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                    To provide accessible, high-quality secondary education to students across Malawi, powered by modern technology and dedicated educators.
                </p>
                <h3 className="text-2xl font-bold mt-6">Our Team</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <img src="https://i.pravatar.cc/150?u=user-7" alt="Bright Nason" className="w-20 h-20 rounded-full mx-auto object-cover"/>
                        <p className="font-bold mt-2">Bright Nason</p>
                        <p className="text-sm text-teal-600 dark:text-teal-400">Founder & CEO</p>
                    </div>
                     <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <img src="https://i.pravatar.cc/150?u=user-2" alt="Emily Carter" className="w-20 h-20 rounded-full mx-auto object-cover"/>
                        <p className="font-bold mt-2">Emily Carter</p>
                        <p className="text-sm text-teal-600 dark:text-teal-400">Head of Curriculum</p>
                    </div>
                </div>
            </div>
        </Modal>
    );

    const WithdrawalModal: React.FC<{ balance: number, onClose: () => void, onSubmit: (amount: number, method: Withdrawal['method'], details: any) => void }> = ({ balance, onClose, onSubmit }) => {
        const [amount, setAmount] = useState('');
        const [method, setMethod] = useState<Withdrawal['method']>('Airtel Money');
        const [phone, setPhone] = useState('');
        const [bankName, setBankName] = useState('');
        const [accountNumber, setAccountNumber] = useState('');

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0 || numAmount > balance) {
                addToast('Invalid withdrawal amount.', 'error');
                return;
            }
            let details = {};
            if (method === 'Bank') {
                if(!bankName || !accountNumber) { addToast('Bank details are required.', 'error'); return; }
                details = { bankName, accountNumber };
            } else {
                if(!phone) { addToast('Phone number is required.', 'error'); return; }
                details = { phoneNumber: phone };
            }
            onSubmit(numAmount, method, details);
        };
        
        return (
            <Modal isOpen={true} onClose={onClose} title="Withdraw Funds">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm">Available Balance: <span className="font-bold text-teal-500">K{balance.toLocaleString()}</span></p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount (K)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 50000" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Method</label>
                        <select value={method} onChange={e => setMethod(e.target.value as Withdrawal['method'])} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                            <option>Airtel Money</option>
                            <option>TNM Mpamba</option>
                            <option>Bank</option>
                        </select>
                    </div>
                    {method === 'Bank' ? (
                        <>
                           <div>
                                <label className="block text-sm font-medium mb-1">Bank Name</label>
                                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., National Bank" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Account Number</label>
                                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="e.g., 1001234567" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                            </div>
                        </>
                    ) : (
                         <div>
                            <label className="block text-sm font-medium mb-1">Phone Number</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g., 099xxxxxxx" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Confirm Withdrawal</Button>
                    </div>
                </form>
            </Modal>
        )
    };
    
    const UserDetailsModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => (
        <Modal isOpen={true} onClose={onClose} title="User Details">
            <div className="flex flex-col items-center">
                 <img src={user.profilePicture} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
                 <h3 className="text-xl font-bold mt-4">{user.name}</h3>
                 <p className="text-slate-500">{user.email}</p>
                 <span className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${user.role === Role.Student ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span>
            </div>
             <div className="mt-6 border-t pt-4">
                 {user.role === Role.Student && (
                    <>
                        <h4 className="font-semibold mb-2">Student Info</h4>
                        <p><strong>Subscription:</strong> {getSubscriptionStatus(user).plan} ({getSubscriptionStatus(user).status})</p>
                        <p className="mt-2"><strong>Enrolled Subjects:</strong></p>
                        <ul className="list-disc list-inside">
                            {enrollments.filter(e => e.studentId === user.id).map(e => (
                                <li key={e.subjectId}>{subjects.find(s=>s.id === e.subjectId)?.name}</li>
                            ))}
                        </ul>
                    </>
                 )}
                  {user.role === Role.Teacher && (
                     <>
                        <h4 className="font-semibold mb-2">Teacher Info</h4>
                        <p><strong>Application Status:</strong> <span className={user.teacherApplication?.status === 'Approved' ? 'text-green-500' : 'text-amber-500'}>{user.teacherApplication?.status}</span></p>
                        <p className="mt-2"><strong>Teaching Subjects:</strong></p>
                        <ul className="list-disc list-inside">
                           {subjects.filter(s => s.teacherId === user.id).map(s => (
                                <li key={s.id}>{s.name} ({videoLessons.filter(l=>l.subjectId === s.id).length} lessons)</li>
                           ))}
                        </ul>
                    </>
                 )}
            </div>
        </Modal>
    );
    
    const ApplicationDetailsModal: React.FC<{ applicant: User, onClose: () => void }> = ({ applicant, onClose }) => (
         <Modal isOpen={true} onClose={onClose} title={`Application: ${applicant.name}`}>
            <div>
                <h4 className="font-semibold mb-2">Introductory Message</h4>
                <p className="text-slate-600 dark:text-slate-300 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap">{applicant.teacherApplication?.message}</p>
            </div>
         </Modal>
    );
    
    const NewLessonModal: React.FC<{
        teacherSubjects: Subject[];
        preselectedSubjectId: string | null;
        onClose: () => void;
        onSubmit: (data: { title: string; description: string; subjectId: string; duration: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced' }, videoFile: File) => void;
    }> = ({ teacherSubjects, preselectedSubjectId, onClose, onSubmit }) => {
        const [title, setTitle] = useState('');
        const [description, setDescription] = useState('');
        const [subjectId, setSubjectId] = useState(preselectedSubjectId || (teacherSubjects[0]?.id || ''));
        const [duration, setDuration] = useState('');
        const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
        const [videoFile, setVideoFile] = useState<File | null>(null);
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!title || !description || !subjectId || !duration) {
                addToast('Please fill out all fields.', 'error');
                return;
            }
            if (!videoFile) {
                addToast('Please select a video file to upload.', 'error');
                return;
            }
            onSubmit({ title, description, subjectId, duration, difficulty }, videoFile);
        };
        
        return (
            <Modal isOpen={true} onClose={onClose} title="Upload New Lesson">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Lesson Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required>
                            {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Upload Video</label>
                         <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 dark:file:bg-teal-900/50 file:text-teal-700 hover:file:bg-teal-100" />
                    </div>
                    <div className="flex gap-4">
                         <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Duration</label>
                            <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 15:30" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Difficulty</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required>
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Upload Lesson</Button>
                    </div>
                </form>
            </Modal>
        )
    };
    
    const NotificationsModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        logs: ActivityLog[];
        userId: string | null;
        onMarkAllRead: () => void;
    }> = ({ isOpen, onClose, logs, userId, onMarkAllRead }) => {
        if (!userId) return null;

        const userLogs = logs
            .filter(log => log.userId === 'all' || log.userId === userId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        const activityIcons: { [key in ActivityType]?: React.ReactElement } = {
            [ActivityType.NewEnrollment]: <UserGroupIcon className="w-5 h-5 text-blue-500" />,
            [ActivityType.NewEnrollmentInClass]: <UserGroupIcon className="w-5 h-5 text-blue-500" />,
            [ActivityType.PaymentReceived]: <BanknotesIcon className="w-5 h-5 text-green-500" />,
            [ActivityType.NewLesson]: <BookOpenIcon className="w-5 h-5 text-purple-500" />,
            [ActivityType.QuizSubmission]: <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-500" />,
            [ActivityType.LiveReminder]: <VideoCameraIcon className="w-5 h-5 text-red-500" />,
            [ActivityType.TeacherApplication]: <BriefcaseIcon className="w-5 h-5 text-amber-500" />,
            [ActivityType.LiveClassStarted]: <RssIcon className="w-5 h-5 text-red-500" />,
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
                <div className="flex justify-end mb-2">
                    <button onClick={onMarkAllRead} className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        Mark all as read
                    </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {userLogs.length > 0 ? userLogs.map(log => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg relative">
                             {!log.read && <div className="absolute top-3 left-0 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1">
                                {activityIcons[log.type] || <RssIcon className="w-5 h-5 text-slate-500" />}
                            </div>
                            <div>
                                <p className="text-sm text-slate-800 dark:text-slate-100">{log.text}</p>
                                <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">No new notifications.</p>
                    )}
                </div>
            </Modal>
        );
    };

    const SettingsScreen: React.FC = () => {
        if (!currentUser) return null;

        const SettingSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-4">{title}</h3>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm divide-y divide-slate-200 dark:divide-slate-700">
                    {children}
                </div>
            </div>
        );

        const SettingRow: React.FC<{label: string, children: React.ReactNode}> = ({ label, children }) => (
            <div className="p-4 flex justify-between items-center">
                <span className="font-medium">{label}</span>
                <div>{children}</div>
            </div>
        );

        const ToggleSwitch: React.FC<{checked: boolean, onChange: (checked: boolean) => void}> = ({ checked, onChange }) => (
            <button onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        );
        
        const studentNotificationTypes = [ActivityType.NewLesson, ActivityType.LiveReminder, ActivityType.LiveClassStarted, ActivityType.NewExamination, ActivityType.NewDirectMessage];
        const teacherNotificationTypes = [ActivityType.NewEnrollmentInClass, ActivityType.QuizSubmission, ActivityType.NewCommentOnPostTeacher, ActivityType.NewDirectMessage];

        const relevantNotificationTypes =
            currentUser.role === Role.Student ? studentNotificationTypes :
            currentUser.role === Role.Teacher ? teacherNotificationTypes :
            [];

        return (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">Settings</h2>

                <SettingSection title="Account">
                    <SettingRow label="My Profile">
                        <Button variant="secondary" className="!py-1.5 !px-4 !text-sm" onClick={() => navigate('profile')}>Edit Profile</Button>
                    </SettingRow>
                    {currentUser.role === Role.Student && (
                        <SettingRow label="Subscription">
                            <Button variant="secondary" className="!py-1.5 !px-4 !text-sm" onClick={() => navigate('subscription')}>Manage Plan</Button>
                        </SettingRow>
                    )}
                </SettingSection>

                {relevantNotificationTypes.length > 0 && (
                    <SettingSection title="Notifications">
                        {relevantNotificationTypes.map(type => (
                             <SettingRow key={type} label={type}>
                                <ToggleSwitch 
                                    checked={!!currentUser.notificationSettings?.[type]}
                                    onChange={(value) => handleNotificationSettingChange(type, value)}
                                />
                            </SettingRow>
                        ))}
                    </SettingSection>
                )}

                <SettingSection title="Appearance">
                     <SettingRow label="Dark Mode">
                        <ToggleSwitch checked={isDarkMode} onChange={handleToggleTheme} />
                    </SettingRow>
                     <SettingRow label="Background Music">
                        <ToggleSwitch checked={isMusicPlaying} onChange={setIsMusicPlaying} />
                    </SettingRow>
                </SettingSection>
                
                <SettingSection title="More">
                     <SettingRow label="Help & Support">
                        <Button variant="secondary" className="!py-1.5 !px-4 !text-sm" onClick={() => navigate('help')}>Contact Us</Button>
                    </SettingRow>
                </SettingSection>
            </div>
        );
    };

    const BookReaderScreen: React.FC = () => {
        const book = books.find(b => b.id === currentPage.bookId);
        if (!book || !currentUser) return <div className="p-6">Book not found.</div>;

        const myRating = bookRatings.find(r => r.bookId === book.id && r.studentId === currentUser.id)?.rating || 0;
        const myNotes = bookNotes.filter(n => n.bookId === book.id && n.studentId === currentUser.id);

        const [newNote, setNewNote] = useState('');
        
        const handleAddNoteSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!newNote.trim()) return;
            handleAddOrUpdateNote(book.id, newNote);
            setNewNote('');
        };

        const StarRatingInput: React.FC<{ rating: number, onRate: (rating: number) => void }> = ({ rating, onRate }) => (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <button key={i} onClick={() => onRate(i + 1)}>
                        <StarIcon className={`w-6 h-6 transition-colors ${i < rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'}`} />
                    </button>
                ))}
            </div>
        );

        return (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold">{book.title}</h1>
                <p className="text-slate-500 mb-4">by {book.author}</p>
                <div className="prose dark:prose-invert max-w-none bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                    <p>This is a mock reader view. In a real application, the book's content would be displayed here, page by page. For now, imagine you are reading "{book.title}".</p>
                    <p>You can rate the book and add your personal notes below. These notes are private and only visible to you.</p>
                </div>

                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Rate this book</h3>
                    <StarRatingInput rating={myRating} onRate={(r) => handleRateBook(book.id, r)} />
                </div>
                
                <div className="mt-6">
                    <h3 className="text-xl font-bold mb-4">My Notes for this Book</h3>
                    <form onSubmit={handleAddNoteSubmit} className="flex gap-2 mb-4">
                        <input value={newNote} onChange={(e) => setNewNote(e.target.value)} type="text" placeholder="Add a new note..." className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"/>
                        <Button type="submit">Save</Button>
                    </form>
                    <div className="space-y-3">
                        {myNotes.map(note => (
                            <div key={note.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex justify-between items-start">
                                <p className="text-sm">{note.note}</p>
                                <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 ml-2">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                         {myNotes.length === 0 && <p className="text-sm text-center text-slate-500 py-4">You have not added any notes for this book yet.</p>}
                    </div>
                </div>
            </div>
        );
    };

    const MyCoursesScreen: React.FC = () => {
        if (!currentUser) return null;
        const myEnrollments = enrollments.filter(e => e.studentId === currentUser.id);
        const mySubjects = subjects.filter(s => myEnrollments.some(e => e.subjectId === s.id));

        return (
            <div className="p-4 sm:p-6">
                <h2 className="text-3xl font-bold mb-6">My Courses</h2>
                {mySubjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mySubjects.map(subject => (
                            <div key={subject.id} onClick={() => navigate('subject', { subjectId: subject.id })} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover-lift cursor-pointer">
                                <img src={subject.coverPhoto} alt={subject.name} className="h-32 w-full object-cover" />
                                <div className="p-4">
                                    <h3 className="font-bold text-lg truncate">{subject.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{subject.teacherName}</p>
                                    {/* Progress bar could be added here */}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400">You haven't enrolled in any courses yet.</p>
                        <Button className="mt-4" onClick={() => navigate('exploreSubjects')}>Explore Courses</Button>
                    </div>
                )}
            </div>
        );
    };

    const MyNotesScreen: React.FC = () => {
        if (!currentUser) return null;
        const myPurchasedBookIds = bookPurchases.filter(p => p.studentId === currentUser.id).map(p => p.bookId);
        const myPurchasedBooks = books.filter(b => myPurchasedBookIds.includes(b.id));

        return (
             <div className="p-4 sm:p-6">
                <h2 className="text-3xl font-bold mb-6">My Book Notes</h2>
                <div className="space-y-4">
                    {myPurchasedBooks.map(book => {
                        const notesForBook = bookNotes.filter(n => n.studentId === currentUser.id && n.bookId === book.id);
                        return (
                            <details key={book.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm group">
                                <summary className="font-semibold cursor-pointer flex justify-between items-center">
                                    {book.title}
                                    <ChevronDownIcon className="w-5 h-5 group-open:rotate-180 transition-transform"/>
                                </summary>
                                <div className="mt-4 pt-4 border-t dark:border-slate-700">
                                     {notesForBook.length > 0 ? (
                                        <ul className="space-y-2 list-disc list-inside">
                                            {notesForBook.map(note => <li key={note.id} className="text-sm">{note.note}</li>)}
                                        </ul>
                                     ) : (
                                        <p className="text-sm text-slate-500">No notes for this book yet.</p>
                                     )}
                                     <Button onClick={() => navigate('bookReader', { bookId: book.id })} variant="secondary" className="!text-sm !py-1 !px-3 mt-4">
                                        Go to Book
                                    </Button>
                                </div>
                            </details>
                        )
                    })}
                    {myPurchasedBooks.length === 0 && (
                         <div className="text-center py-12 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">You can add notes to books you have purchased.</p>
                            <Button className="mt-4" onClick={() => changeTab('bookstore')}>Go to Bookstore</Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Main Render Logic ---
    const renderPage = () => {
        if (!currentUser) {
            return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} onGoogleAuth={handleGoogleAuth} onShowAbout={() => setIsAboutUsOpen(true)} />;
        }

        switch (currentPage.page) {
            case 'dashboard':
                if (currentUser.role === Role.Student) return <StudentDashboard currentUser={currentUser} enrollments={enrollments.filter(e => e.studentId === currentUser.id)} subjects={subjects} videoLessons={videoLessons} liveClasses={liveClasses} lessonCompletions={lessonCompletions.filter(c => c.studentId === currentUser.id)} bookmarks={bookmarks.filter(b => b.studentId === currentUser.id)} navigate={navigate} />;
                if (currentUser.role === Role.Teacher) return <TeacherDashboard />;
                if (currentUser.role === Role.Owner) return <OwnerDashboard />;
                return <p>Dashboard not available for this role.</p>;
            case 'myCourses':
                return <MyCoursesScreen />;
            case 'exploreSubjects':
                return <ExploreSubjectsScreen allSubjects={subjects} studentEnrollments={enrollments.filter(e => e.studentId === currentUser.id)} onEnroll={handleEnroll} />;
            case 'subject':
                return <SubjectDetailScreen />;
            case 'lesson':
                return <LessonDetailScreen />;
            case 'liveStream':
                return <LiveStreamScreen />;
            case 'bookstore':
                return <BookstoreScreen />;
            case 'bookReader':
                return <BookReaderScreen />;
            case 'myNotes':
                return <MyNotesScreen />;
            case 'aiTutor':
                return <AiTutorScreen />;
            case 'help':
                return <HelpAndSupportScreen />;
            case 'settings':
                return <SettingsScreen />;
            default:
                return <div>Page not found.</div>;
        }
    };

    const StudentBottomNav = () => {
        const navItems = [
            { id: 'dashboard', label: 'Home', icon: HomeIcon },
            { id: 'courses', label: 'My Courses', icon: AcademicCapIcon },
            { id: 'bookstore', label: 'Bookstore', icon: ShoppingCartIcon },
            { id: 'notes', label: 'My Notes', icon: DocumentTextIcon },
            { id: 'tutor', label: 'AI Tutor', icon: SparklesIcon },
        ];
        return (
            <footer className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 grid grid-cols-5 gap-2 p-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => changeTab(item.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-teal-100 dark:bg-teal-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <item.icon className={`w-6 h-6 mb-1 ${activeTab === item.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className={`text-xs font-semibold ${activeTab === item.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>{item.label}</span>
                    </button>
                ))}
            </footer>
        )
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!currentUser) {
        return (
            <main>
                 <ToastContainer toasts={toasts} onDismiss={dismissToast} />
                 {isAboutUsOpen && <AboutUsModal onClose={() => setIsAboutUsOpen(false)} />}
                <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} onGoogleAuth={handleGoogleAuth} onShowAbout={() => setIsAboutUsOpen(true)} />
            </main>
        );
    }
    
    return (
        <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
             <ToastContainer toasts={toasts} onDismiss={dismissToast} />
             {isProfileMenuOpen && <ProfileMenu />}
             {isAboutUsOpen && <AboutUsModal onClose={() => setIsAboutUsOpen(false)} />}
             {newContentModal && (
                newContentModal.type === 'lesson' ? 
                <NewLessonModal 
                    teacherSubjects={subjects.filter(s => s.teacherId === currentUser.id)} 
                    preselectedSubjectId={newContentModal.subjectId}
                    onClose={() => setNewContentModal(null)}
                    onSubmit={handleCreateLesson}
                /> :
                <NewLessonModal
                     teacherSubjects={subjects.filter(s => s.teacherId === currentUser.id)} 
                     preselectedSubjectId={newContentModal.subjectId}
                    onClose={() => setNewContentModal(null)}
                    onSubmit={(data, file) => console.log('not implemented')}
                />
             )}
             {isNotificationsOpen && (
                <NotificationsModal 
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                    logs={activityLogs}
                    userId={currentUser.id}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                />
            )}

            <Header />
             <main className="flex-grow overflow-y-auto">
                {renderPage()}
             </main>
             {currentUser.role === Role.Student && <StudentBottomNav />}
        </div>
    );
};