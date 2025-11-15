import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Subject, VideoLesson, LiveClass, ChatMessage, PaymentRecord, QuizAttempt, Enrollment, LessonCompletion, ActivityType, ActivityLog, Book, SubjectPost, PostType, BookPurchase, ToastMessage, Withdrawal, DirectMessage, Examination, ExaminationAttempt, ExaminationQuestion, Quiz, SubscriptionPlan, StudentSubscription, LessonBookmark, BookReading, PostComment } from './types';
import { USERS, SUBJECTS, VIDEO_LESSONS, INITIAL_LIVE_CLASSES, PAYMENT_HISTORY, QUIZZES, QUIZ_ATTEMPTS, ENROLLMENTS, LESSON_COMPLETIONS, ACTIVITY_LOGS, BOOKS, SUBJECT_POSTS, INITIAL_DIRECT_MESSAGES, EXAMINATIONS, EXAMINATION_ATTEMPTS, BOOK_PURCHASES, WITHDRAWALS, BOOKMARKS, BOOK_READINGS, POST_COMMENTS, PLANS } from './constants';
import { runAiTutor, generateQuizOptions, getMotivationalQuote, getRecommendedLessons } from './services/geminiService';
import { UserCircleIcon, BellIcon, ArrowLeftIcon, SearchIcon, VideoCameraIcon, ClockIcon, SendIcon, SparklesIcon, WalletIcon, CheckCircleIcon, CheckBadgeIcon, AirtelMoneyIcon, TnmMpambaIcon, NationalBankIcon, StarIcon, UserGroupIcon, ChartBarIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon, CloseIcon, LockClosedIcon, Cog6ToothIcon, CameraIcon, BookOpenIcon, CloudArrowUpIcon, TrashIcon, RssIcon, XCircleIcon, ComputerDesktopIcon, MicrophoneIcon, VideoCameraSlashIcon, ChevronUpIcon, WifiIcon, EyeIcon, BuildingStorefrontIcon, LightBulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, GoogleIcon, EnvelopeIcon, UserIcon, HomeIcon, AcademicCapIcon, ShoppingCartIcon, SmartLearnLogo, BriefcaseIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon, BanknotesIcon, CalendarDaysIcon, TrophyIcon, ClipboardDocumentCheckIcon, BookmarkIcon, InformationCircleIcon, ChatBubbleOvalLeftEllipsisIcon, DocumentTextIcon, ArrowDownTrayIcon, ArrowRightIcon } from './components/icons';
import { Button, Modal, ToastContainer } from './components/common';

const APP_OWNER_ID = 'user-7';

// ----- Helper Functions -----
type SubscriptionStatus = 'Active' | 'Expired' | 'None';
const getSubscriptionStatus = (user: User | null): { status: SubscriptionStatus; plan: SubscriptionPlan } => {
    if (!user || user.role === Role.Teacher || user.role === Role.Owner || !user.subscription || user.subscription.plan === SubscriptionPlan.None) {
        return { status: 'None', plan: SubscriptionPlan.None };
    }
    if (user.subscription.endDate.getTime() < Date.now()) {
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

// App.tsx
export const App: React.FC = () => {
    // --- State Management ---
    const [users, setUsers] = useState<User[]>(USERS);
    const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS);
    const [videoLessons, setVideoLessons] = useState<VideoLesson[]>(VIDEO_LESSONS);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>(INITIAL_LIVE_CLASSES);
    const [payments, setPayments] = useState<PaymentRecord[]>(PAYMENT_HISTORY);
    const [quizzes, setQuizzes] = useState<Quiz[]>(QUIZZES);
    const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(QUIZ_ATTEMPTS);
    const [enrollments, setEnrollments] = useState<Enrollment[]>(ENROLLMENTS);
    const [lessonCompletions, setLessonCompletions] = useState<LessonCompletion[]>(LESSON_COMPLETIONS);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(ACTIVITY_LOGS);
    const [books, setBooks] = useState<Book[]>(BOOKS);
    const [bookPurchases, setBookPurchases] = useState<BookPurchase[]>(BOOK_PURCHASES);
    const [bookReadings, setBookReadings] = useState<BookReading[]>(BOOK_READINGS);
    const [bookmarks, setBookmarks] = useState<LessonBookmark[]>(BOOKMARKS);
    const [subjectPosts, setSubjectPosts] = useState<SubjectPost[]>(SUBJECT_POSTS);
    const [postComments, setPostComments] = useState<PostComment[]>(POST_COMMENTS);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>(INITIAL_DIRECT_MESSAGES);
    const [examinations, setExaminations] = useState<Examination[]>(EXAMINATIONS);
    const [examinationAttempts, setExaminationAttempts] = useState<ExaminationAttempt[]>(EXAMINATION_ATTEMPTS);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(WITHDRAWALS);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [navigationStack, setNavigationStack] = useState<any[]>([{ page: 'dashboard' }]);
    
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
    const [newContentModal, setNewContentModal] = useState<{type: 'lesson' | 'class', subjectId: string | null} | null>(null);

    const [tutorChatMessages, setTutorChatMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: 'Hello! I am Bright Titan, your AI Tutor. How can I help you study today?', timestamp: new Date() }
    ]);
    const [tutorInput, setTutorInput] = useState('');
    const [isTutorLoading, setIsTutorLoading] = useState(false);

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
    const currentPage = navigationStack[navigationStack.length - 1];
    
    // --- Navigation Handlers ---
    const navigate = (page: string, params: any = {}) => {
        setNavigationStack(prev => [...prev, { page, ...params }]);
    };
    const goBack = () => {
        if (navigationStack.length > 1) {
            setNavigationStack(prev => prev.slice(0, -1));
        }
    };
    const resetToDashboard = () => setNavigationStack([{ page: 'dashboard' }]);

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
    const handleLogin = (email: string, pass: string, role: Role) => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass && u.role === role);
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
    const handleGoogleAuth = (role: Role) => {
         const defaultUser = users.find(u => u.role === role);
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
    
    const handleSignUp = (name: string, email: string, pass: string, role: Role, cvFile: File | null, message: string) => {
        if(users.some(u => u.email.toLowerCase() === email.toLowerCase())){
            addToast('An account with this email already exists.', 'error');
            return;
        }
        
        const newUser: User = { 
            id: `user-${users.length + 1}`, 
            name, 
            email, 
            password: pass, 
            role, 
            profilePicture: `https://i.pravatar.cc/150?u=user-${users.length + 1}`,
            ...(role === Role.Student && { subscription: { plan: SubscriptionPlan.None, startDate: new Date(), endDate: new Date() } })
        };

        if (role === Role.Teacher) {
            newUser.teacherApplication = {
                cvUrl: cvFile ? `/path/to/${cvFile.name}` : '/path/to/default_cv.pdf', // Simulated URL
                message: message,
                status: 'Pending',
            };
             // Log for owner
            const ownerLog: ActivityLog = { id: `log-${activityLogs.length + 1}`, userId: APP_OWNER_ID, type: ActivityType.TeacherApplication, text: `${name} has applied to be a teacher.`, timestamp: new Date(), read: false };
            setActivityLogs(prev => [...prev, ownerLog]);
            setUsers(prev => [...prev, newUser]);
            addToast('Application submitted! You will be notified upon review.', 'success');
        } else {
            setUsers(prev => [...prev, newUser]);
            setCurrentUser(newUser);
            addToast('Account created successfully!', 'success');
        }
    };

    const handleEnroll = (subjectId: string) => {
        if (!currentUser || currentUser.role !== Role.Student) return;
        if (enrollments.some(e => e.studentId === currentUser.id && e.subjectId === subjectId)) {
            addToast("You are already enrolled in this subject.", 'info');
            return;
        }

        const newEnrollment: Enrollment = { studentId: currentUser.id, subjectId };
        setEnrollments(prev => [...prev, newEnrollment]);

        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            // Log for owner
            const ownerLog: ActivityLog = { id: `log-${activityLogs.length + 1}`, userId: APP_OWNER_ID, type: ActivityType.NewEnrollment, text: `${currentUser.name} enrolled in ${subject.name}.`, timestamp: new Date(), read: false };
            // Log for teacher
            const teacherLog: ActivityLog = { id: `log-${activityLogs.length + 2}`, userId: subject.teacherId, type: ActivityType.NewEnrollmentInClass, text: `${currentUser.name} has enrolled in your ${subject.name} class.`, timestamp: new Date(), read: false };
            setActivityLogs(prev => [...prev, ownerLog, teacherLog]);
            addToast(`Successfully enrolled in ${subject.name}!`, 'success');
        }
        goBack(); // Go back to dashboard after enrolling
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
            const aiResponseText = await runAiTutor(currentInput);
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

        const planDetails = PLANS.find(p => p.plan === newPlan);
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
    
    const handleCreateLesson = (lessonData: { title: string; description: string; subjectId: string; duration: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced' }) => {
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

        addToast('New lesson uploaded successfully!', 'success');
        setNewContentModal(null);
    };
    
    const handleCreateLiveClass = (classData: { title: string; subjectId: string; startTime: Date }) => {
        if (!currentUser) return;
        const newClass: LiveClass = {
          id: `lc-${liveClasses.length + 1}`,
          teacherName: currentUser.name,
          teacherId: currentUser.id,
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


    // --- Component Rendering ---
    
     // A more complete header
    const Header: React.FC = () => {
        const title = currentPage.page === 'subject' ? subjects.find(s => s.id === currentPage.subjectId)?.name
                    : currentPage.page === 'lesson' ? videoLessons.find(l => l.id === currentPage.lessonId)?.title
                    : currentPage.page.charAt(0).toUpperCase() + currentPage.page.slice(1);

        return (
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    {navigationStack.length > 1 ? (
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
                        {activityLogs.filter(a => !a.read).length > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>}
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
                <div className="flex items-center justify-between p-2 rounded-md">
                    <span className="text-sm font-medium">Dark Mode</span>
                    <button onClick={handleToggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-teal-600' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md">
                    <span className="text-sm font-medium">Music</span>
                    <button onClick={() => setIsMusicPlaying(p => !p)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isMusicPlaying ? 'bg-teal-600' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMusicPlaying ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
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
            getMotivationalQuote().then(setQuote);
        }, []);

        useEffect(() => {
            const fetchRecommendations = async () => {
                const enrolledSubjectIds = enrollments.map(e => e.subjectId);
                const completedLessonIds = lessonCompletions.map(c => c.lessonId);
                const allLessonInfo = videoLessons.map(l => ({ id: l.id, title: l.title, subjectId: l.subjectId }));
                const recommendedIds = await getRecommendedLessons(enrolledSubjectIds, allLessonInfo, completedLessonIds);
                const recommended = videoLessons.filter(lesson => recommendedIds.includes(lesson.id));
                setRecommendedLessons(recommended);
            };

            if (enrollments.length > 0) {
                fetchRecommendations();
            }
        }, [enrollments, videoLessons, lessonCompletions]);

        const mySubjects = subjects.filter(subject => enrollments.some(e => e.subjectId === subject.id));
        const upcomingClasses = liveClasses
            .filter(lc => mySubjects.some(s => s.id === lc.subjectId) && lc.startTime > new Date())
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
                                        <div>
                                            <h3 className="font-bold">{lc.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{lc.teacherName} &bull; {subjects.find(s=>s.id === lc.subjectId)?.name}</p>
                                            <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1">{lc.startTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
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
        
        return (
             <div className="p-4 sm:p-6 space-y-6">
                 <div>
                    <h2 className="text-3xl font-bold">Teacher Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your subjects and students.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-white">
                    <StatCard icon={<AcademicCapIcon />} title="My Subjects" value={mySubjects.length} gradient="bg-gradient-to-br from-purple-500 to-violet-600" />
                    <StatCard icon={<UsersIcon />} title="My Students" value={myStudentsCount} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
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
                 <div>
                    <h3 className="text-xl font-bold mb-4">My Subjects</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mySubjects.map(subject => (
                            <div key={subject.id} onClick={() => navigate('subject', { subjectId: subject.id })} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover-lift cursor-pointer">
                                <img src={subject.coverPhoto} alt={subject.name} className="h-24 w-full object-cover" />
                                <div className="p-4">
                                    <h3 className="font-bold truncate">{subject.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{enrollments.filter(e => e.subjectId === subject.id).length} Students</p>
                                </div>
                            </div>
                        ))}
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
          .sort((a,b) => a.title.localeCompare(b.title)); // A consistent sort order is important
        
        const currentIndex = subjectLessons.findIndex(l => l.id === lesson.id);
        const prevLesson = currentIndex > 0 ? subjectLessons[currentIndex - 1] : null;
        const nextLesson = currentIndex < subjectLessons.length - 1 ? subjectLessons[currentIndex + 1] : null;

        return (
            <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Video Player Placeholder */}
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

        return (
            <div className="p-4 sm:p-6">
                <h2 className="text-3xl font-bold mb-6">Bookstore & Library</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {books.map(book => {
                        const isPurchased = myPurchases.includes(book.id);
                        return (
                            <div key={book.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center p-4 text-center hover-lift">
                                <img src={book.coverPhoto} alt={book.title} className="h-48 w-auto object-contain rounded-md mb-2"/>
                                <h3 className="font-bold flex-grow">{book.title}</h3>
                                <p className="text-sm text-slate-500">{book.author}</p>
                                <div className="mt-4 w-full">
                                    {isPurchased ? (
                                        <Button variant="secondary" className="w-full">Read Now</Button>
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
        onSubmit: (data: { title: string; description: string; subjectId: string; duration: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced' }) => void;
    }> = ({ teacherSubjects, preselectedSubjectId, onClose, onSubmit }) => {
        const [title, setTitle] = useState('');
        const [description, setDescription] = useState('');
        const [subjectId, setSubjectId] = useState(preselectedSubjectId || (teacherSubjects[0]?.id || ''));
        const [duration, setDuration] = useState('');
        const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!title || !description || !subjectId || !duration) {
                addToast('Please fill out all fields.', 'error');
                return;
            }
            onSubmit({ title, description, subjectId, duration, difficulty });
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
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required>
                            {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (e.g., 15:30)</label>
                            <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="MM:SS" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                        </div>
                        <div>
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
    
    const NewLiveClassModal: React.FC<{
        teacherSubjects: Subject[];
        preselectedSubjectId: string | null;
        onClose: () => void;
        onSubmit: (data: { title: string; subjectId: string; startTime: Date }) => void;
    }> = ({ teacherSubjects, preselectedSubjectId, onClose, onSubmit }) => {
        const [title, setTitle] = useState('');
        const [subjectId, setSubjectId] = useState(preselectedSubjectId || (teacherSubjects[0]?.id || ''));
        const [startTime, setStartTime] = useState('');

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!title || !subjectId || !startTime) {
                addToast('Please fill out all fields.', 'error');
                return;
            }
            onSubmit({ title, subjectId, startTime: new Date(startTime) });
        };

        return (
            <Modal isOpen={true} onClose={onClose} title="Schedule Live Class">
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Class Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required>
                            {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Schedule Class</Button>
                    </div>
                </form>
            </Modal>
        )
    };


    const ProfileScreen: React.FC = () => {
        if (!currentUser) return null;

        const { status, plan } = getSubscriptionStatus(currentUser);

        const SubscriptionManagement: React.FC = () => {
            return (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Subscription Management</h3>
                    
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Current Plan</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{plan === SubscriptionPlan.None ? 'No Active Plan' : plan}</p>
                        {plan !== SubscriptionPlan.None && (
                            <p className="text-sm mt-1">
                                Status: <span className={status === 'Active' ? 'text-green-500' : 'text-red-500'}>{status}</span>
                                {status !== 'None' && ` | Expires on: ${currentUser.subscription?.endDate.toLocaleDateString()}`}
                            </p>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold mb-3">Choose a new plan</h4>
                        <div className="space-y-4">
                            {PLANS.map(p => {
                                const isCurrentPlan = plan === p.plan && status === 'Active';
                                return (
                                    <div key={p.plan} className={`p-4 rounded-lg border-2 ${isCurrentPlan ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h5 className="font-bold">{p.name}</h5>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{p.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold">K{p.price.toLocaleString()}</p>
                                                {isCurrentPlan ? (
                                                    <Button variant="secondary" disabled className="!py-1 !px-4 mt-1 cursor-not-allowed opacity-70">Current Plan</Button>
                                                ) : (
                                                    <Button onClick={() => handleSubscriptionChange(p.plan)} className="!py-1 !px-4 mt-1">
                                                        {plan === SubscriptionPlan.None || status === 'Expired' ? 'Subscribe' : 'Switch Plan'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                    <img src={currentUser.profilePicture} alt={currentUser.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg"/>
                    <div>
                        <h2 className="text-3xl font-bold text-center sm:text-left">{currentUser.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-center sm:text-left">{currentUser.email}</p>
                    </div>
                </div>
                
                {currentUser.role === Role.Student && <SubscriptionManagement />}
                
                <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Profile Settings</h3>
                    <p className="text-slate-500">Other settings like changing password or updating profile details would go here.</p>
                </div>
            </div>
        );
    };

    const renderPage = () => {
        switch (currentPage.page) {
            case 'dashboard':
                switch (currentUser?.role) {
                    case Role.Student: return <StudentDashboard 
                        currentUser={currentUser}
                        enrollments={enrollments.filter(e => e.studentId === currentUser.id)}
                        subjects={subjects}
                        videoLessons={videoLessons}
                        liveClasses={liveClasses}
                        lessonCompletions={lessonCompletions.filter(c => c.studentId === currentUser.id)}
                        bookmarks={bookmarks.filter(b => b.studentId === currentUser.id)}
                        navigate={navigate}
                    />;
                    case Role.Teacher: return <TeacherDashboard />;
                    case Role.Owner: return <OwnerDashboard />;
                    default: return <div>Loading...</div>;
                }
            case 'subject': return <SubjectDetailScreen />;
            case 'lesson': return <LessonDetailScreen />;
            case 'bookstore': return <BookstoreScreen />;
            case 'tutor': return <AiTutorScreen />;
            case 'help': return <HelpAndSupportScreen />;
            case 'profile': return <ProfileScreen />;
            case 'exploreSubjects': return <ExploreSubjectsScreen
                allSubjects={subjects}
                studentEnrollments={enrollments.filter(e => e.studentId === currentUser.id)}
                onEnroll={handleEnroll}
            />;
            default: return <div>Page not found</div>;
        }
    };
    
    const BottomNav = () => (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-30 md:hidden">
           <button onClick={resetToDashboard} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentPage.page === 'dashboard' ? 'text-teal-600' : 'text-slate-500'}`}>
               <HomeIcon className="w-6 h-6" />
               <span className="text-xs">Home</span>
           </button>
           <button onClick={() => navigate('bookstore')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentPage.page === 'bookstore' ? 'text-teal-600' : 'text-slate-500'}`}>
               <BookOpenIcon className="w-6 h-6" />
               <span className="text-xs">Library</span>
           </button>
           <button onClick={() => navigate('tutor')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentPage.page === 'tutor' ? 'text-teal-600' : 'text-slate-500'}`}>
               <SparklesIcon className="w-6 h-6" />
               <span className="text-xs">AI Tutor</span>
           </button>
           <button onClick={() => navigate('help')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentPage.page === 'help' ? 'text-teal-600' : 'text-slate-500'}`}>
                <QuestionMarkCircleIcon className="w-6 h-6" />
               <span className="text-xs">Help</span>
           </button>
       </nav>
    );

    // --- Final Render ---
    if (!currentUser) {
        return (
            <>
                <ToastContainer toasts={toasts} onDismiss={dismissToast} />
                {isAboutUsOpen && <AboutUsModal onClose={() => setIsAboutUsOpen(false)} />}
                <AuthScreen
                    onLogin={handleLogin}
                    onSignUp={handleSignUp}
                    onGoogleAuth={handleGoogleAuth}
                    onShowAbout={() => setIsAboutUsOpen(true)}
                />
            </>
        );
    }
    
    // When logged in
    return (
        <div className="h-screen max-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
            <audio ref={audioRef} id="background-music" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            
            {newContentModal?.type === 'lesson' && currentUser?.role === Role.Teacher && (
                <NewLessonModal 
                    teacherSubjects={subjects.filter(s => s.teacherId === currentUser.id)}
                    preselectedSubjectId={newContentModal.subjectId}
                    onClose={() => setNewContentModal(null)}
                    onSubmit={handleCreateLesson}
                />
            )}
            {newContentModal?.type === 'class' && currentUser?.role === Role.Teacher && (
                <NewLiveClassModal
                    teacherSubjects={subjects.filter(s => s.teacherId === currentUser.id)}
                    preselectedSubjectId={newContentModal.subjectId}
                    onClose={() => setNewContentModal(null)}
                    onSubmit={handleCreateLiveClass}
                />
            )}

            <Header />
            {isProfileMenuOpen && <ProfileMenu />}


            <main className="flex-grow overflow-y-auto pb-16 md:pb-0">
                {renderPage()}
            </main>
            
            {/* Student Bottom Nav */}
            {currentUser.role === Role.Student && <BottomNav />}

        </div>
    );
};