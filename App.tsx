







import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Subject, VideoLesson, LiveClass, ChatMessage, PaymentRecord, QuizAttempt, Enrollment, LessonCompletion, ActivityType, ActivityLog, Book, SubjectPost, PostType, JobApplication, ApplicationStatus, BookPurchase, ToastMessage, Withdrawal, DirectMessage } from './types';
import { USERS, SUBJECTS, VIDEO_LESSONS, INITIAL_LIVE_CLASSES, PAYMENT_HISTORY, QUIZZES, QUIZ_ATTEMPTS, ENROLLMENTS, LESSON_COMPLETIONS, ACTIVITY_LOGS, BOOKS, SUBJECT_POSTS, INITIAL_JOB_APPLICATIONS, INITIAL_DIRECT_MESSAGES } from './constants';
import { runAiTutor, generateQuizOptions } from './services/geminiService';
// FIX: Imported CheckBadgeIcon to resolve 'Cannot find name' error.
import { UserCircleIcon, BellIcon, ArrowLeftIcon, SearchIcon, VideoCameraIcon, ClockIcon, SendIcon, SparklesIcon, WalletIcon, CheckCircleIcon, CheckBadgeIcon, AirtelMoneyIcon, TnmMpambaIcon, NationalBankIcon, StarIcon, UserGroupIcon, ChartBarIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon, CloseIcon, LockClosedIcon, Cog6ToothIcon, CameraIcon, BookOpenIcon, DocumentCheckIcon, CloudArrowUpIcon, TrashIcon, RssIcon, XCircleIcon, ComputerDesktopIcon, MicrophoneIcon, VideoCameraSlashIcon, ChevronUpIcon, WifiIcon, EyeIcon, BuildingStorefrontIcon, LightBulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, GoogleIcon, EnvelopeIcon, UserIcon, PhoneIcon, DocumentTextIcon, HomeIcon, AcademicCapIcon, ShoppingCartIcon, SmartLearnLogo, BriefcaseIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon, BanknotesIcon } from './components/icons';
import { Button, Modal, ToastContainer } from './components/common';

const APP_OWNER_ID = 'user-7'; // Mr. Nyalugwe's ID

// ----- Reusable Components (defined outside main component) -----

const InputWithIcon: React.FC<{ icon: React.ReactNode, type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input {...props} className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
);

const AuthScreen: React.FC<{
    onLogin: (email: string, pass: string, role: Role) => void;
    onSignUp: (name: string, email: string, pass: string, role: Role) => void;
    onGoogleAuth: () => void;
    onApply: () => void;
}> = ({ onLogin, onSignUp, onGoogleAuth, onApply }) => {
    const [authRole, setAuthRole] = useState<Role | null>(null);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authRole) onLogin(email, password, authRole);
    };

    const handleSignUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authRole) onSignUp(name, email, password, authRole);
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
        const isTeacher = authRole === Role.Teacher;

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
                            <button onClick={() => setMode('login')} className={`flex-1 py-3 font-semibold text-center ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Login</button>
                            <button onClick={() => setMode('signup')} className={`flex-1 py-3 font-semibold text-center ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Sign Up</button>
                        </div>
                    )}

                    {mode === 'login' || isManager ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <InputWithIcon icon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <InputWithIcon icon={<LockClosedIcon className="w-5 h-5 text-slate-400" />} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            <Button type="submit" className="w-full">Sign In</Button>
                        </form>
                    ) : ( // Signup form
                        isTeacher ? (
                           <div className="text-center space-y-4">
                               <p className="text-slate-600">Teacher accounts are created after a successful application.</p>
                               <p className="text-sm text-slate-500">Please use the "Apply for a Teaching Job" link on the previous screen to submit an application.</p>
                               <Button variant="secondary" onClick={() => setAuthRole(null)} className="w-full mt-2">Back to Roles</Button>
                           </div>
                        ) : (
                             <form onSubmit={handleSignUpSubmit} className="space-y-4">
                                <InputWithIcon icon={<UserIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                                <InputWithIcon icon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                                <InputWithIcon icon={<LockClosedIcon className="w-5 h-5 text-slate-400" />} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                                <Button type="submit" className="w-full">Create Account</Button>
                            </form>
                        )
                    )}
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
                    <p className="text-blue-100 mb-8">Please select your role to continue.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <RoleCard icon={<AcademicCapIcon className="w-12 h-12 text-white"/>} title={Role.Student} description="Access courses, lessons, and your AI tutor." onClick={() => {setAuthRole(Role.Student); setMode('login')}} gradient="bg-gradient-to-br from-sky-500 to-indigo-600" />
                        <RoleCard icon={<BriefcaseIcon className="w-12 h-12 text-white"/>} title={Role.Teacher} description="Manage your content and engage with students." onClick={() => {setAuthRole(Role.Teacher); setMode('login')}} gradient="bg-gradient-to-br from-teal-500 to-emerald-600" />
                        <RoleCard icon={<ShieldCheckIcon className="w-12 h-12 text-white"/>} title={Role.Owner} description="Oversee the entire platform and its users." onClick={() => setAuthRole(Role.Owner)} gradient="bg-gradient-to-br from-purple-600 to-indigo-700" />
                    </div>
                    <div className="mt-10 pt-6 border-t border-blue-100/20">
                        <h3 className="text-xl font-semibold text-white">Join Our Team</h3>
                        <p className="text-blue-100 mt-2 mb-4">Are you a passionate educator? We're looking for talented teachers to join our platform.</p>
                        <Button onClick={onApply} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 focus:ring-orange-300 shadow-lg">
                            Apply for a Teaching Job
                        </Button>
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


interface HeaderProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onBack?: () => void;
  onNavigateToSettings: () => void;
  unreadCount: number;
  onToggleNotifications: () => void;
}
const Header: React.FC<HeaderProps> = ({ user, onLogout, currentView, onBack, onNavigateToSettings, unreadCount, onToggleNotifications }) => {
  const showBackButton = currentView !== 'dashboard';
  const showSettingsButton = currentView === 'dashboard' || (user.role === Role.Student);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4">
        {showBackButton && onBack ? (
          <button onClick={onBack} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Go back">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        ) : (
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">SmartLearn</h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onToggleNotifications} className="text-slate-500 dark:text-slate-400 relative" aria-label="View notifications">
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>}
        </button>
        {showSettingsButton && (
             <button onClick={onNavigateToSettings} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Open settings">
                <Cog6ToothIcon className="w-6 h-6" />
            </button>
        )}
        <div className="flex items-center gap-2">
            {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
                <UserCircleIcon className="w-8 h-8 text-slate-400" />
            )}
          <div>
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{user.name}</p>
            <button onClick={onLogout} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
};

const SubjectCard: React.FC<{ subject: Subject; onClick: () => void; progress: number; isLocked: boolean; isLive: boolean; }> = ({ subject, onClick, progress, isLocked, isLive }) => (
    <div onClick={onClick} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105 duration-300 flex flex-col relative">
        {isLive && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
            </div>
        )}
        <img className="h-32 w-full object-cover" src={subject.coverPhoto} alt={subject.name} />
        <div className={`p-4 flex flex-col flex-grow ${isLocked ? 'blur-sm' : ''}`}>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{subject.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subject.teacherName}</p>
            <div className="mt-auto pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                </div>
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
        {isLocked && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-xl">
                <LockClosedIcon className="w-10 h-10 text-white" />
            </div>
        )}
    </div>
);

const PaymentPrompt: React.FC<{ onPay: () => void }> = ({ onPay }) => (
    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg shadow-md mb-6" role="alert">
        <h3 className="font-bold text-lg">Access Restricted</h3>
        <p className="text-sm mb-3">Your access to lessons is currently restricted. Please complete your payment to unlock all subjects, videos, and live classes.</p>
        <Button onClick={onPay} className="!bg-yellow-500 !text-white !py-2 !px-4 text-sm hover:!bg-yellow-600 focus:!ring-yellow-300">
            Pay Now
        </Button>
    </div>
);

const StudentDashboard: React.FC<{ 
    user: User;
    isPaid: boolean;
    allSubjects: Subject[];
    allLessons: VideoLesson[];
    allLiveClasses: LiveClass[];
    lessonCompletions: LessonCompletion[];
    activeLiveClass: LiveClass | null;
    onSelectSubject: (subject: Subject) => void; 
    onJoinLiveClass: (liveClass: LiveClass) => void;
    onPayForLessons: () => void;
    onWatchLesson: (lesson: VideoLesson) => void;
}> = ({ user, isPaid, allSubjects, allLessons, allLiveClasses, lessonCompletions, activeLiveClass, onSelectSubject, onJoinLiveClass, onPayForLessons, onWatchLesson }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const recentLessons = allLessons.slice(0, 4);

    const filteredSubjects = allSubjects.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-6 animate-fade-in-up">
            <div className="relative">
                <input 
                    type="text"
                    placeholder="Search subjects or teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            
            {!isPaid && <PaymentPrompt onPay={onPayForLessons} />}

            {isPaid ? (
                <>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Continue Watching</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4">
                            {recentLessons.map((lesson, index) => {
                                const subject = allSubjects.find(s => s.id === lesson.subjectId);
                                const progress = (60 + (index * 10)) % 100;
                                return (
                                     <div key={lesson.id} onClick={() => onWatchLesson(lesson)} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden cursor-pointer w-48 flex-shrink-0 transition-transform hover:scale-105 duration-300">
                                        <img className="h-24 w-full object-cover" src={lesson.thumbnail} alt={lesson.title} />
                                        <div className="p-3">
                                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{lesson.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{subject?.name}</p>
                                            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Upcoming Live Classes</h2>
                        <div className="space-y-3">
                            {allLiveClasses.map(lc => (
                                <div key={lc.id} className="bg-gradient-to-r from-blue-600 to-sky-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between hover-lift">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-full"><RssIcon className="w-5 h-5"/></div>
                                        <div>
                                            <h3 className="font-bold">{lc.title}</h3>
                                            <p className="text-sm text-blue-200">{lc.teacherName} - {lc.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => onJoinLiveClass(lc)} className="py-2 px-4 text-sm !bg-white !text-blue-600 hover:!bg-blue-50 focus:!ring-blue-200">Join</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : null }

            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Your Subjects</h2>
                <div className="grid grid-cols-2 gap-4">
                    {filteredSubjects.map(subject => {
                         const lessonsForSubject = allLessons.filter(l => l.subjectId === subject.id);
                         const completedLessonsCount = lessonCompletions.filter(
                             c => c.studentId === user.id && lessonsForSubject.some(l => l.id === c.lessonId)
                         ).length;
                         const progress = lessonsForSubject.length > 0 
                             ? Math.round((completedLessonsCount / lessonsForSubject.length) * 100) 
                             : 0;
                        const isLiveNow = activeLiveClass?.subjectId === subject.id;

                        return (
                            <SubjectCard 
                                key={subject.id} 
                                subject={subject} 
                                onClick={() => onSelectSubject(subject)} 
                                progress={progress}
                                isLocked={!isPaid}
                                isLive={isLiveNow}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ActivityFeed: React.FC<{ logs: ActivityLog[], users: User[] }> = ({ logs, users }) => {
    const getLogIcon = (type: ActivityType) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case ActivityType.NewEnrollment: return <UserGroupIcon className={`${iconClass} text-blue-500`} />;
            case ActivityType.QuizSubmission: return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
            case ActivityType.NewLesson: return <VideoCameraIcon className={`${iconClass} text-purple-500`} />;
            case ActivityType.LiveReminder: return <RssIcon className={`${iconClass} text-red-500`} />;
            case ActivityType.PaymentReceived: return <WalletIcon className={`${iconClass} text-indigo-500`} />;
            default: return null;
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h2>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3 max-h-60 overflow-y-auto">
                {logs.length > 0 ? logs.map(log => (
                     <div key={log.id} className="flex items-start gap-3">
                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1">
                            {getLogIcon(log.type)}
                        </div>
                        <div>
                            <p className="text-sm text-slate-700 dark:text-slate-200">{log.text}</p>
                            <p className="text-xs text-slate-400">{log.timestamp.toLocaleString()}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-slate-500 text-sm py-3">No recent activity.</p>
                )}
            </div>
        </div>
    );
};

const OwnerDashboard: React.FC<{
    user: User;
    allUsers: User[];
    allPayments: PaymentRecord[];
    jobApplications: JobApplication[];
    allBooks: Book[];
    withdrawals: Withdrawal[];
    onApproveApplication: (appId: string) => void;
    onRejectApplication: (appId: string) => void;
    onViewApplication: (app: JobApplication) => void;
    setAllBooks: React.Dispatch<React.SetStateAction<Book[]>>;
    setWithdrawals: React.Dispatch<React.SetStateAction<Withdrawal[]>>;
    addToast: (message: string, type?: ToastMessage['type']) => void;
    allSubjects: Subject[];
    allLessons: VideoLesson[];
    enrollments: Enrollment[];
    directMessages: DirectMessage[];
    onSendMessage: (receiverId: string, text: string) => void;
}> = ({ user, allUsers, allPayments, jobApplications, allBooks, withdrawals, onApproveApplication, onRejectApplication, onViewApplication, setAllBooks, setWithdrawals, addToast, allSubjects, allLessons, enrollments, directMessages, onSendMessage }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'bookstore' | 'applications' | 'teachers' | 'chat' >('overview');
    const [userTab, setUserTab] = useState<'students' | 'teachers'>('students');
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [bookToEdit, setBookToEdit] = useState<Book | 'new' | null>(null);
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalRevenue - totalWithdrawn;
    const totalStudents = allUsers.filter(u => u.role === Role.Student).length;
    const totalTeachers = allUsers.filter(u => u.role === Role.Teacher).length;
    const pendingApplications = jobApplications.filter(a => a.status === ApplicationStatus.Pending).length;

    const handleAddBook = (bookData: Omit<Book, 'id'>) => {
        const newBook: Book = {
            ...bookData,
            id: `book-${Date.now()}`,
            coverPhoto: `https://picsum.photos/seed/book${Date.now()}/300/400`,
        };
        setAllBooks(prev => [newBook, ...prev]);
        addToast(`Book "${newBook.title}" added successfully.`, 'success');
        setBookToEdit(null);
    };

    const handleEditBook = (updatedBook: Book) => {
        setAllBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
        addToast(`Book "${updatedBook.title}" updated.`, 'success');
        setBookToEdit(null);
    };

    const handleDeleteBook = (bookId: string) => {
        const book = allBooks.find(b => b.id === bookId);
        setAllBooks(prev => prev.filter(b => b.id !== bookId));
        addToast(`Book "${book?.title}" deleted.`, 'info');
        setBookToDelete(null);
    };

    const handleWithdraw = (amount: number, method: 'Airtel Money' | 'TNM Mpamba', phoneNumber: string) => {
        const newWithdrawal: Withdrawal = {
            id: `wd-${Date.now()}`,
            amount,
            method,
            phoneNumber,
            timestamp: new Date(),
        };
        setWithdrawals(prev => [...prev, newWithdrawal]);
        addToast(`Withdrawal of MWK ${amount.toLocaleString()} initiated.`, 'success');
        setWithdrawModalOpen(false);
    };

    return (
        <>
            <div className="p-4 space-y-6 animate-fade-in-up">
                <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                    {['overview', 'bookstore', 'applications', 'teachers', 'chat'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-max py-2 px-3 font-semibold text-center text-sm capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                            {tab}{tab === 'applications' ? ` (${pendingApplications})` : ''}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="text-white">
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard icon={<CurrencyDollarIcon/>} title="Total Revenue" value={`MWK ${totalRevenue.toLocaleString()}`} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                                <StatCard icon={<UsersIcon/>} title="Total Users" value={totalStudents + totalTeachers} gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
                                <StatCard icon={<AcademicCapIcon/>} title="Active Students" value={totalStudents} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
                                <StatCard icon={<BriefcaseIcon/>} title="Pending Applications" value={pendingApplications} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Finances</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Available Balance:</span> <span className="font-bold text-green-600">MWK {availableBalance.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Total Withdrawn:</span> <span className="font-bold">MWK {totalWithdrawn.toLocaleString()}</span></div>
                            </div>
                            <Button onClick={() => setWithdrawModalOpen(true)} className="w-full mt-4 !bg-indigo-600">
                                <div className="flex items-center justify-center gap-2"><BanknotesIcon className="w-5 h-5" /> Withdraw Funds</div>
                            </Button>
                        </div>
                        
                        {withdrawals.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Withdrawal History</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {withdrawals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(withdrawal => (
                                        <div key={withdrawal.id} className="flex items-center gap-3 p-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                {withdrawal.method === 'Airtel Money' ? <AirtelMoneyIcon className="w-6 h-6" /> : <TnmMpambaIcon className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 dark:text-slate-100">MWK {withdrawal.amount.toLocaleString()}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{withdrawal.method} - {withdrawal.phoneNumber}</p>
                                            </div>
                                            <div className="text-right text-xs text-slate-400">
                                                {withdrawal.timestamp.toLocaleDateString()}<br/>
                                                {withdrawal.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                 {activeTab === 'bookstore' && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Manage Bookstore</h3>
                            <Button onClick={() => setBookToEdit('new')} className="!py-1.5 !px-3 text-xs flex items-center gap-1">
                                <PlusIcon className="w-4 h-4" /> Add Book
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {allBooks.map(book => (
                                <div key={book.id} className="flex items-center gap-3 p-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <img src={book.coverPhoto} alt={book.title} className="w-12 h-16 object-cover rounded" />
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{book.title}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">by {book.author}</p>
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">MWK {book.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setBookToEdit(book)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"><PencilIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                                        <button onClick={() => setBookToDelete(book)} className="p-2 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900"><TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 {activeTab === 'applications' && (
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3 max-h-96 overflow-y-auto">
                        {jobApplications.filter(a => a.status === ApplicationStatus.Pending).map(app => (
                            <div key={app.id} className="border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                                <p className="font-bold text-slate-800 dark:text-slate-100">{app.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{app.email}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Subjects: <span className="font-medium">{app.subjects.join(', ')}</span></p>
                                <div className="flex gap-2 mt-2">
                                    <Button onClick={() => onViewApplication(app)} variant="secondary" className="!py-1 !px-3 text-xs flex items-center gap-1">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        View Details
                                    </Button>
                                    <Button onClick={() => onApproveApplication(app.id)} className="!py-1 !px-3 text-xs !bg-green-500 hover:!bg-green-600 focus:!ring-green-300">Approve</Button>
                                    <Button onClick={() => onRejectApplication(app.id)} className="!py-1 !px-3 text-xs !bg-red-500 hover:!bg-red-600 focus:!ring-red-300">Reject</Button>
                                </div>
                            </div>
                        ))}
                        {pendingApplications === 0 && (
                            <p className="text-center text-slate-500 text-sm py-3">No pending applications.</p>
                        )}
                    </div>
                 )}
                 {activeTab === 'teachers' && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3 max-h-[60vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Teacher Overview</h3>
                         {allUsers.filter(u => u.role === Role.Teacher).map(teacher => {
                            const teacherSubjects = allSubjects.filter(s => s.teacherId === teacher.id);
                            const teacherLessons = allLessons.filter(l => teacherSubjects.some(s => s.id === l.subjectId));
                            const teacherStudentsCount = new Set(enrollments.filter(e => teacherSubjects.some(s => s.id === e.subjectId)).map(e => e.studentId)).size;
                             return (
                                <div key={teacher.id} className="border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex items-center gap-4">
                                     <img src={teacher.profilePicture} alt={teacher.name} className="w-12 h-12 rounded-full object-cover" />
                                     <div className="flex-1">
                                         <p className="font-bold text-slate-800 dark:text-slate-100">{teacher.name}</p>
                                         <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                             <span>Subjects: <span className="font-semibold">{teacherSubjects.length}</span></span>
                                             <span>Lessons: <span className="font-semibold">{teacherLessons.length}</span></span>
                                             <span>Students: <span className="font-semibold">{teacherStudentsCount}</span></span>
                                         </div>
                                     </div>
                                </div>
                             )
                         })}
                    </div>
                 )}
                 {activeTab === 'chat' && (
                    <ChatInterface 
                        currentUser={user}
                        users={allUsers}
                        messages={directMessages}
                        onSendMessage={onSendMessage}
                    />
                 )}
            </div>
            
            <WithdrawModal 
                isOpen={isWithdrawModalOpen}
                onClose={() => setWithdrawModalOpen(false)}
                onWithdraw={handleWithdraw}
                availableBalance={availableBalance}
            />
            <AddEditBookModal
                book={bookToEdit}
                onClose={() => setBookToEdit(null)}
                onAdd={handleAddBook}
                onEdit={handleEditBook}
            />
            <DeleteConfirmationModal
                item={bookToDelete}
                onClose={() => setBookToDelete(null)}
                onConfirm={() => handleDeleteBook(bookToDelete!.id)}
                itemName={bookToDelete?.title}
                itemType="book"
            />
        </>
    );
};

// FIX: Added missing modal component definitions.
const WithdrawModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onWithdraw: (amount: number, method: 'Airtel Money' | 'TNM Mpamba', phoneNumber: string) => void;
    availableBalance: number;
}> = ({ isOpen, onClose, onWithdraw, availableBalance }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'Airtel Money' | 'TNM Mpamba'>('Airtel Money');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleWithdraw = () => {
        const numAmount = parseFloat(amount);
        if (numAmount > 0 && numAmount <= availableBalance && phoneNumber.trim()) {
            onWithdraw(numAmount, method, phoneNumber);
            setAmount('');
            setPhoneNumber('');
        } else {
            alert('Invalid amount or phone number.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
            <div className="space-y-4">
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Available Balance</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">MWK {availableBalance.toLocaleString()}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Amount (MWK)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        max={availableBalance}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Withdrawal Method</label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as 'Airtel Money' | 'TNM Mpamba')}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option>Airtel Money</option>
                        <option>TNM Mpamba</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Phone Number</label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g., 0991234567"
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleWithdraw}>Confirm Withdrawal</Button>
                </div>
            </div>
        </Modal>
    );
};

const AddEditBookModal: React.FC<{
    book: Book | 'new' | null;
    onClose: () => void;
    onAdd: (bookData: Omit<Book, 'id'>) => void;
    onEdit: (updatedBook: Book) => void;
}> = ({ book, onClose, onAdd, onEdit }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [subject, setSubject] = useState('');
    const [price, setPrice] = useState('');
    const isEditing = book && book !== 'new';

    useEffect(() => {
        if (isEditing) {
            setTitle(book.title);
            setAuthor(book.author);
            setSubject(book.subject);
            setPrice(String(book.price));
        } else {
            setTitle('');
            setAuthor('');
            setSubject('');
            setPrice('');
        }
    }, [book, isEditing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price);
        if (title.trim() && author.trim() && subject.trim() && !isNaN(numPrice)) {
            if (isEditing) {
                onEdit({ ...book, title, author, subject, price: numPrice });
            } else {
                // The type Omit<Book, 'id'> requires a coverPhoto property.
                // handleAddBook will generate a new one, so we can pass an empty string.
                onAdd({ title, author, subject, price: numPrice, coverPhoto: '' });
            }
        } else {
            alert('Please fill all fields correctly.');
        }
    };
    
    if (!book) return null;

    return (
        <Modal isOpen={!!book} onClose={onClose} title={isEditing ? 'Edit Book' : 'Add New Book'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Book Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Author</label>
                    <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Price (MWK)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{isEditing ? 'Save Changes' : 'Add Book'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const DeleteConfirmationModal: React.FC<{
    item: { id: string } | null;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
    itemType: string;
}> = ({ item, onClose, onConfirm, itemName, itemType }) => {
    if (!item) return null;

    return (
        <Modal isOpen={!!item} onClose={onClose} title={`Confirm Deletion`}>
            <div className="text-center">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Are you sure?</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                    Do you really want to delete this {itemType}?
                    {itemName && <span className="font-bold block mt-1">"{itemName}"</span>}
                </p>
                <p className="text-sm text-slate-500 mt-2">This process cannot be undone.</p>
                <div className="flex justify-center gap-4 mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={onConfirm} className="!bg-red-500 hover:!bg-red-600 focus:!ring-red-300">
                        Yes, Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};


// FIX: Added `allUsers` to the props for `TeacherDashboard` to fix a scope issue.
const TeacherDashboard: React.FC<{ 
    user: User; 
    students: User[];
    allSubjects: Subject[];
    allLessons: VideoLesson[];
    allLiveClasses: LiveClass[];
    quizAttempts: QuizAttempt[];
    activityLogs: ActivityLog[];
    onEditStudent: (student: User) => void;
    enrollments: Enrollment[];
    paymentRecords: PaymentRecord[];
    onAddStudentClick: () => void;
    onViewStudentDetails: (student: User) => void;
    onDeleteLesson: (lesson: VideoLesson) => void;
    onUploadLessonClick: (subjectId: string) => void;
    onGoLive: (liveClass: LiveClass) => void;
    onStartQuickLive: () => void;
    onEditLiveClass: (liveClass: LiveClass) => void;
    directMessages: DirectMessage[];
    onSendMessage: (receiverId: string, text: string) => void;
    allUsers: User[];
}> = ({ user, students, allSubjects, allLessons, allLiveClasses, quizAttempts, activityLogs, onEditStudent, enrollments, paymentRecords, onAddStudentClick, onViewStudentDetails, onDeleteLesson, onUploadLessonClick, onGoLive, onStartQuickLive, onEditLiveClass, directMessages, onSendMessage, allUsers }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  
  const teacherSubjects = allSubjects.filter(s => s.teacherId === user.id);
  const teacherSubjectIds = teacherSubjects.map(s => s.id);
  
  const teacherLessons = allLessons.filter(l => teacherSubjectIds.includes(l.subjectId));

  const upcomingLiveClasses = allLiveClasses.filter(lc => teacherSubjectIds.includes(lc.subjectId));

  const enrolledStudentIds = [...new Set(
    enrollments
      .filter(e => teacherSubjectIds.includes(e.subjectId))
      .map(e => e.studentId)
  )];

  const enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));

  const recentAttempts = quizAttempts
    .filter(attempt => teacherLessons.map(l => l.id).includes(attempt.lessonId))
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 5);
  
  const teacherActivityLogs = activityLogs.filter(log => log.userId === user.id);

  const totalStudents = enrolledStudents.length;
  const averageRating = 4.7;
  const engagementRate = 82;

  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
       <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 font-semibold text-center text-sm capitalize ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 font-semibold text-center text-sm capitalize ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Chat</button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<UserGroupIcon />} title="Total Students" value={totalStudents} />
            <StatCard icon={<VideoCameraIcon />} title="Lessons Uploaded" value={teacherLessons.length} />
            <StatCard icon={<StarIcon />} title="Average Rating" value={averageRating} />
            <StatCard icon={<ChartBarIcon />} title="Engagement" value={`${engagementRate}%`} />
          </div>

          <ActivityFeed logs={teacherActivityLogs} users={students} />

          <div className="grid grid-cols-1 gap-4">
              <Button onClick={onStartQuickLive} className="!bg-red-500 hover:!bg-red-600 focus:!ring-red-300 w-full">Start a Quick Live Session</Button>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">My Upcoming Live Classes</h2>
            <div className="space-y-3">
              {upcomingLiveClasses.length > 0 ? upcomingLiveClasses.map(lc => (
                <div key={lc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between gap-2 hover-lift">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{lc.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {allSubjects.find(s => s.id === lc.subjectId)?.name} - {lc.startTime.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => onEditLiveClass(lc)} className="text-slate-500 hover:text-blue-600 p-2 rounded-full transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <Button onClick={() => onGoLive(lc)} className="py-2 px-3 text-sm !bg-red-500 !text-white hover:!bg-red-600 focus:!ring-red-300">
                        <div className="flex items-center justify-center gap-1">
                            <RssIcon className="w-4 h-4" />
                            <span>Start</span>
                        </div>
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm text-center">
                    <p className="text-slate-500 dark:text-slate-400">No upcoming live classes scheduled.</p>
                </div>
              )}
            </div>
          </div>

           <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Students</h2>
               <button 
                    onClick={onAddStudentClick}
                    className="flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold text-sm py-1.5 px-3 rounded-full hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add Student
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
              {enrolledStudents.length > 0 ? (
                <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {enrolledStudents.map(student => {
                        const hasPaid = paymentRecords.some(p => p.studentId === student.id);
                        return (
                            <li key={student.id} className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2 last:border-b-0">
                                <button onClick={() => onViewStudentDetails(student)} className="text-left flex-1 group flex items-center gap-2">
                                    {hasPaid ? (
                                        <span title="Paid">
                                            <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                                        </span>
                                    ) : (
                                        <span title="Payment Pending">
                                            <XCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                                        </span>
                                    )}
                                    <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{student.name}</p>
                                </button>
                                <button onClick={() => onEditStudent(student)} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full transition-colors ml-2">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No students are enrolled in your subjects yet.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Quiz Results</h2>
            <div className="space-y-3">
              {recentAttempts.length > 0 ? (
                recentAttempts.map(attempt => {
                  const student = students.find(s => s.id === attempt.studentId);
                  const studentName = student ? student.name : attempt.studentName;
                  return (
                  <div key={attempt.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover-lift">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{studentName}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{attempt.lessonTitle}</p>
                          </div>
                          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{attempt.score}/{attempt.totalQuestions}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                          Completed on: {attempt.completedAt.toLocaleDateString()}
                      </p>
                  </div>
                  );
                })
              ) : (
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm text-center">
                    <p className="text-slate-500 dark:text-slate-400">No recent quiz attempts from your students.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">My Content</h2>
            <div className="space-y-4">
                {teacherSubjects.map(subject => (
                    <div key={subject.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{subject.name}</h3>
                            <Button onClick={() => onUploadLessonClick(subject.id)} className="!py-1.5 !px-3 text-xs flex items-center gap-1">
                                <CloudArrowUpIcon className="w-4 h-4" />
                                Upload
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {teacherLessons.filter(l => l.subjectId === subject.id).map(lesson => (
                                <div key={lesson.id} className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                                    <img src={lesson.thumbnail} alt={lesson.title} className="w-20 h-12 object-cover rounded-md" />
                                    <p className="flex-1 font-semibold text-sm text-slate-700 dark:text-slate-200">{lesson.title}</p>
                                    <button onClick={() => onDeleteLesson(lesson)} className="text-red-500 hover:text-red-700 p-2 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/50 dark:hover:bg-red-900/80 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                             {teacherLessons.filter(l => l.subjectId === subject.id).length === 0 && (
                                <p className="text-center text-sm text-slate-400 py-2">No lessons uploaded for this subject yet.</p>
                             )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <ChatInterface 
            currentUser={user}
            users={[allUsers.find(u => u.id === APP_OWNER_ID)!]}
            messages={directMessages}
            onSendMessage={onSendMessage}
        />
      )}
    </div>
  );
};

const VideoLessonList: React.FC<{ lessons: VideoLesson[], onWatchLesson: (lesson: VideoLesson) => void, onTakeQuiz: (lesson: VideoLesson) => void }> = ({ lessons, onWatchLesson, onTakeQuiz }) => {
    if (lessons.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <p className="text-slate-500 dark:text-slate-400 font-semibold">No lessons match your criteria.</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Try adjusting your search or filter.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {lessons.map(lesson => (
                <div key={lesson.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden flex items-center gap-4 p-3 hover-lift">
                    <img src={lesson.thumbnail} alt={lesson.title} className="w-28 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lesson.title}</h3>
                            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                <ClockIcon className="w-4 h-4" />
                                <span>{lesson.duration}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <div className="flex items-center gap-1"><VideoCameraIcon className="w-4 h-4" /><span>Lesson</span></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                         <Button onClick={() => onWatchLesson(lesson)} className="py-2 px-4 text-sm !rounded-lg">Watch</Button>
                         <Button onClick={() => onTakeQuiz(lesson)} variant="secondary" className="py-2 px-4 text-sm !rounded-lg">Take Quiz</Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const VideoPlayerModal: React.FC<{ 
    lesson: VideoLesson | null; 
    onClose: () => void; 
    user: User | null;
    onLessonViewed: (lessonId: string) => void;
}> = ({ lesson, onClose, user, onLessonViewed }) => {
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [comments, setComments] = useState<ChatMessage[]>([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    
    // Video player state
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<number | null>(null);

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => {
            setIsMuted(video.muted);
            setVolume(video.volume);
        };
        const handleLoadedMetadata = () => setDuration(video.duration);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handlePause);
        video.addEventListener('volumechange', handleVolumeChange);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handlePause);
            video.removeEventListener('volumechange', handleVolumeChange);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    
    useEffect(() => {
        if (lesson) {
            onLessonViewed(lesson.id);
            setIsPlaying(false); // Reset play state
            setComments([
                { sender: 'student', name: 'Bob', text: 'This was really helpful!', timestamp: new Date() },
                { sender: 'student', name: 'Alice', text: 'Great explanation.', timestamp: new Date() },
            ]);
            setNewComment('');
            setRating(0);
            setHoverRating(0);
            setRatingSubmitted(false);
            
            const DESCRIPTION_LENGTH_THRESHOLD = 100;
            if (lesson.description.length > DESCRIPTION_LENGTH_THRESHOLD) {
                setIsSummaryLoading(true);
                const generateSummary = async () => {
                    const prompt = `Summarize this lesson description in 1-2 concise bullet points:\n\n"${lesson.description}"`;
                    try {
                        const result = await runAiTutor(prompt);
                        setSummary(result);
                    } catch (error) {
                        console.error("Failed to generate summary:", error);
                        setSummary("Could not generate summary at this time.");
                    } finally {
                        setIsSummaryLoading(false);
                    }
                };
                generateSummary();
            } else {
                setSummary(lesson.description);
                setIsSummaryLoading(false);
            }
        }
    }, [lesson, onLessonViewed]);
    
    const handlePostComment = () => {
        if (newComment.trim() && user) {
            const commentToAdd: ChatMessage = {
                sender: 'student',
                name: user.name,
                text: newComment.trim(),
                timestamp: new Date()
            };
            setComments(prev => [...prev, commentToAdd]);
            setNewComment('');
        }
    };
    
    // Video control handlers
    const handlePlayPause = () => {
        if (videoRef.current) {
            isPlaying ? videoRef.current.pause() : videoRef.current.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            videoRef.current.currentTime = (Number(e.target.value) / 100) * duration;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const newVolume = Number(e.target.value);
            videoRef.current.volume = newVolume;
            videoRef.current.muted = newVolume === 0;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
        }
    };

    const toggleFullScreen = () => {
        if (!isFullscreen) {
            videoContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    
    const handleMouseMove = () => {
        setAreControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (isPlaying) {
                setAreControlsVisible(false);
            }
        }, 3000);
    };


    if (!lesson) return null;
    return (
        <Modal isOpen={!!lesson} onClose={onClose} title={lesson.title}>
            <div className="space-y-4">
                <div 
                    ref={videoContainerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => { if(isPlaying) setAreControlsVisible(false) }}
                    className="relative aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden group"
                >
                    <video 
                        ref={videoRef} 
                        src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder video
                        className="w-full h-full"
                        onClick={handlePlayPause}
                    />

                    <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${areControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                        <button onClick={handlePlayPause} className="text-white bg-black/50 p-4 rounded-full">
                            {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                        </button>
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white transition-opacity duration-300 ${areControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                       <input 
                           type="range"
                           min="0"
                           max="100"
                           value={progress}
                           onChange={handleSeek}
                           className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                       />
                       <div className="flex justify-between items-center mt-1">
                           <div className="flex items-center gap-3">
                               <button onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
                                   {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                               </button>
                               <div className="flex items-center gap-2 group/volume">
                                   <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                                       {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5"/> : <SpeakerWaveIcon className="w-5 h-5"/>}
                                   </button>
                                   <input
                                       type="range"
                                       min="0" max="1" step="0.05"
                                       value={isMuted ? 0 : volume}
                                       onChange={handleVolumeChange}
                                       className="w-0 group-hover/volume:w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                   />
                               </div>
                               <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                           </div>
                           <button onClick={toggleFullScreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                               {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5"/> : <ArrowsPointingOutIcon className="w-5 h-5"/>}
                           </button>
                       </div>
                    </div>
                </div>
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">About this lesson</h3>
                    {isSummaryLoading ? (
                        <p className="text-slate-500 dark:text-slate-400 mt-1 animate-pulse">Generating summary...</p>
                    ) : (
                        <p className="text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{summary}</p>
                    )}
                </div>

                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Rate this lesson</h3>
                    {ratingSubmitted ? (
                         <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-6 h-6" />
                            <p className="font-semibold">Thank you for your feedback!</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => {
                                        setRating(star);
                                        setRatingSubmitted(true);
                                    }}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    aria-label={`Rate ${star} stars`}
                                    className="focus:outline-none"
                                >
                                    <StarIcon
                                        className={`w-8 h-8 transition-colors ${
                                            (hoverRating || rating) >= star
                                                ? 'text-amber-400'
                                                : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Comments ({comments.length})</h3>
                    <div className="space-y-3 max-h-32 overflow-y-auto mb-4 pr-2">
                        {comments.map((comment, index) => (
                            <div key={index} className="text-sm text-slate-700 dark:text-slate-200">
                                <p><span className="font-semibold">{comment.name}:</span> {comment.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                            placeholder="Add a comment..."
                            className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handlePostComment} className="bg-blue-600 rounded-full p-2.5 text-white hover:bg-blue-700 transition-colors shrink-0">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const LiveQualitySelector: React.FC<{ onSelect: (q: string) => void }> = ({ onSelect }) => {
    const qualities = ["Auto", "4K", "1080p", "720p", "480p"];
    return (
        <div className="absolute bottom-16 right-4 bg-slate-700 rounded-lg shadow-lg p-2 animate-fade-in-up">
            {qualities.map(q => (
                <button key={q} onClick={() => onSelect(q)} className="w-full text-left px-3 py-1.5 text-sm text-white rounded hover:bg-slate-600">{q}</button>
            ))}
        </div>
    );
};

const LiveControls: React.FC<{ onLeave: () => void; isTeacher: boolean }> = ({ onLeave, isTeacher }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState("Auto");

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm p-3 flex justify-center items-center gap-3 relative">
            <button onClick={() => setIsMuted(p => !p)} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-slate-600'} text-white`}>
                <MicrophoneIcon className="w-6 h-6" />
            </button>
            <button onClick={() => setIsCameraOff(p => !p)} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-slate-600'} text-white`}>
                {isCameraOff ? <VideoCameraSlashIcon className="w-6 h-6" /> : <VideoCameraIcon className="w-6 h-6" />}
            </button>
            {isTeacher && (
                <button onClick={() => setIsSharingScreen(p => !p)} className={`p-3 rounded-full ${isSharingScreen ? 'bg-blue-500' : 'bg-slate-600'} text-white`}>
                    <ComputerDesktopIcon className="w-6 h-6" />
                </button>
            )}
            <div className="relative">
                <button onClick={() => setIsQualityMenuOpen(p => !p)} className="p-3 rounded-full bg-slate-600 text-white flex items-center gap-1">
                    <Cog6ToothIcon className="w-6 h-6" />
                    <span className="text-xs font-bold">{selectedQuality}</span>
                    <ChevronUpIcon className={`w-4 h-4 transition-transform ${isQualityMenuOpen ? '' : 'rotate-180'}`} />
                </button>
                {isQualityMenuOpen && <LiveQualitySelector onSelect={(q) => { setSelectedQuality(q); setIsQualityMenuOpen(false); }} />}
            </div>
            <button onClick={onLeave} className="absolute right-4 bg-red-500 text-white font-bold py-2 px-4 rounded-full text-sm">
                {isTeacher ? 'End Session' : 'Leave'}
            </button>
        </div>
    );
};

const LiveVideoFeed: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please check permissions.");
            }
        };
        startCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    if (error) {
        return <div className="text-red-400 font-semibold">{error}</div>;
    }

    return <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />;
};

const NetworkStatusIndicator: React.FC<{ isTeacher?: boolean }> = ({ isTeacher }) => (
    <div className="flex items-center gap-4 text-xs font-semibold">
        {isTeacher && (
            <div className="flex items-center gap-1.5 text-slate-300">
                <EyeIcon className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 150) + 25}</span>
            </div>
        )}
        <div className="flex items-center gap-1.5 text-green-400">
            <WifiIcon className="w-4 h-4" />
            <span>Connection: Excellent</span>
        </div>
    </div>
);


const StudentLiveView: React.FC<{ 
    liveClass: LiveClass, 
    onLeave: () => void, 
    user: User,
    messages: ChatMessage[],
    onSendMessage: (msg: ChatMessage) => void,
}> = ({ liveClass, onLeave, user, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            onSendMessage({ sender: 'student', name: user.name, text: newMessage, timestamp: new Date() });
            setNewMessage('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white">
            <div className="p-4 flex justify-between items-center bg-slate-800">
                <div>
                    <h2 className="font-bold">{liveClass.title}</h2>
                    <p className="text-sm text-slate-300">with {liveClass.teacherName}</p>
                </div>
                <div className="flex items-center gap-1 text-red-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="font-bold text-sm">LIVE</span>
                </div>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center text-center p-4 relative">
                <LiveVideoFeed />
                <div className="absolute top-3 left-4">
                    <NetworkStatusIndicator />
                </div>
            </div>
            <LiveControls onLeave={onLeave} isTeacher={false} />
            <div className="h-1/3 flex flex-col bg-slate-800">
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {messages.map((msg, i) => (
                        <div key={i} className="text-sm">
                            <span className={`font-bold ${msg.sender === 'teacher' ? 'text-blue-400' : 'text-green-400'}`}>{msg.name}: </span>
                            <span>{msg.text}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-2 border-t border-slate-700 flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-slate-700 rounded-full px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSendMessage} className="bg-blue-600 rounded-full p-2 text-white">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const TeacherLiveView: React.FC<{ 
  liveClass: LiveClass, 
  onEnd: () => void, 
  user: User,
  messages: ChatMessage[],
  onSendMessage: (msg: ChatMessage) => void,
}> = ({ liveClass, onEnd, user, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            onSendMessage({ sender: 'teacher', name: user.name, text: newMessage, timestamp: new Date() });
            setNewMessage('');
        }
    };
    
    return (
        <div className="h-full flex flex-col bg-slate-900 text-white">
            <div className="p-4 flex justify-between items-center bg-slate-800">
                <div>
                    <h2 className="font-bold">You are live: {liveClass.title}</h2>
                    <p className="text-sm text-slate-300">Broadcasting to students</p>
                </div>
                 <div className="flex items-center gap-1 text-red-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="font-bold text-sm">LIVE</span>
                </div>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center text-center p-4 relative">
                <LiveVideoFeed />
                 <div className="absolute top-3 left-4">
                    <NetworkStatusIndicator isTeacher />
                </div>
            </div>
            <LiveControls onLeave={onEnd} isTeacher={true} />
             <div className="h-1/3 flex flex-col bg-slate-800">
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {messages.map((msg, i) => (
                        <div key={i} className="text-sm">
                            <span className={`font-bold ${msg.sender === 'teacher' ? 'text-blue-400' : 'text-green-400'}`}>{msg.name}: </span>
                            <span>{msg.text}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-2 border-t border-slate-700 flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-700 rounded-full px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSendMessage} className="bg-blue-600 rounded-full p-2 text-white">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const AiTutorModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: "Hi there, my name is Bright Titan", timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMessage: ChatMessage = { sender: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const aiResponseText = await runAiTutor(input);
        const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Tutor 'Bright Titan'">
            <div className="flex flex-col h-[60vh]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-xl px-4 py-2 max-w-xs ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="rounded-xl px-4 py-2 max-w-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                                <span className="animate-pulse">...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me anything..."
                        className="w-full px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="bg-blue-600 text-white p-3 rounded-full disabled:bg-slate-400">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const PaymentScreen: React.FC<{ 
    user: User;
    onBack: () => void;
    onPaymentSuccess: (newRecord: PaymentRecord) => void;
    purchaseItem?: { type: 'book', item: Book } | { type: 'tuition', amount: number };
}> = ({ user, onBack, onPaymentSuccess, purchaseItem }) => {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [phoneOrAccount, setPhoneOrAccount] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState(purchaseItem ? (purchaseItem.type === 'book' ? purchaseItem.item.price : purchaseItem.amount) : 15000);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    useEffect(() => {
        if (paymentSuccess) {
            const isTuitionPayment = purchaseItem?.type === 'tuition' || !purchaseItem;
            if (isTuitionPayment) {
                const timer = setTimeout(() => {
                    onBack();
                }, 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [paymentSuccess, onBack, purchaseItem]);


    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentError('');
        if (!selectedMethod || !phoneOrAccount || pin.length < 4 || amount <= 0) {
            setPaymentError('Please fill all fields correctly.');
            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            if (pin === '0000') {
                setPaymentError('Payment Failed! Please check your details and try again.');
                setIsProcessing(false);
                return;
            }
            
            const newPaymentRecord: PaymentRecord = { 
                id: `pay-${Date.now()}`,
                studentId: user.id, 
                amount, 
                method: selectedMethod!, 
                date: new Date().toISOString(),
                phoneNumber: selectedMethod !== 'National Bank' ? phoneOrAccount : undefined,
                accountNumber: selectedMethod === 'National Bank' ? phoneOrAccount : undefined,
                purchaseType: purchaseItem?.type || 'tuition',
                purchaseId: purchaseItem?.type === 'book' ? purchaseItem.item.id : undefined,
            };

            onPaymentSuccess(newPaymentRecord);
            setIsProcessing(false);
            setPaymentSuccess(true);
        }, 2500);
    };

    if (paymentSuccess) {
        const isTuitionPayment = purchaseItem?.type === 'tuition' || !purchaseItem;
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full animate-fade-in-up">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4 animate-bounce-in" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">✅ Payment Successful!</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {isTuitionPayment
                        ? "Thank you for your payment. You now have full access to all lessons!"
                        : `You have successfully purchased "${(purchaseItem as any)?.item?.title}".`
                    }
                </p>
                {isTuitionPayment && (
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 animate-pulse">
                        Redirecting you to the dashboard...
                    </p>
                )}
                <Button onClick={onBack}>
                    {isTuitionPayment ? "Go to Dashboard Now" : "Back to Bookstore"}
                </Button>
            </div>
        );
    }

    const paymentOptions = [
        { name: "Airtel Money", icon: <AirtelMoneyIcon className="w-8 h-8" /> },
        { name: "TNM Mpamba", icon: <TnmMpambaIcon className="w-8 h-8" /> },
        { name: "National Bank", icon: <NationalBankIcon className="w-8 h-8" /> },
    ];

    const purchaseTitle = purchaseItem?.type === 'book'
        ? `For: ${purchaseItem.item.title}`
        : 'For: School Fees';
        
    return (
        <div className="p-4 space-y-4 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Complete Your Payment</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{purchaseTitle}</p>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl shadow-lg space-y-4">
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">1. Select a payment method</h3>
                <div className="grid grid-cols-3 gap-3">
                    {paymentOptions.map(option => (
                        <button 
                            key={option.name} 
                            onClick={() => setSelectedMethod(option.name)}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${selectedMethod === option.name ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-200' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400'}`}
                        >
                            {option.icon}
                            <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 text-center">{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {selectedMethod && (
                <form onSubmit={handlePayment} className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl shadow-lg space-y-4 animate-fade-in-up">
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">2. Enter your details</h3>
                    {paymentError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-sm" role="alert">
                           <strong className="font-bold">❌ Payment Failed! </strong>
                           <span className="block sm:inline">{paymentError}</span>
                        </div>
                    )}
                    <InputWithIcon 
                        icon={<PhoneIcon className="w-5 h-5 text-slate-400" />}
                        type="tel"
                        placeholder={selectedMethod === 'National Bank' ? 'Bank Account Number' : 'Payment Phone Number'}
                        value={phoneOrAccount}
                        onChange={e => setPhoneOrAccount(e.target.value)}
                    />
                     <InputWithIcon 
                        icon={<LockClosedIcon className="w-5 h-5 text-slate-400" />}
                        type="password"
                        placeholder="PIN or Password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                    />
                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Amount to Pay (MWK)</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <WalletIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                readOnly={purchaseItem?.type === 'book'}
                            />
                        </div>
                    </div>
                     <Button 
                        type="submit"
                        disabled={!selectedMethod || isProcessing}
                        className="w-full !bg-blue-600 !text-white disabled:bg-slate-400 disabled:cursor-not-allowed"
                     >
                        {isProcessing ? 'Processing...' : `Pay Now`}
                     </Button>
                </form>
            )}
        </div>
    );
};


const QuizModal: React.FC<{ 
    lesson: VideoLesson | null; 
    onClose: () => void;
    user: User;
    onQuizComplete: (attemptData: { lessonId: string, score: number, totalQuestions: number, completedAt: Date, studentId: string }) => void 
}> = ({ lesson, onClose, user, onQuizComplete }) => {
    const quiz = lesson ? QUIZZES.find(q => q.lessonId === lesson.id) : null;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showScore, setShowScore] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (lesson) {
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowScore(false);
            setScore(0);
        }
    }, [lesson]);

    if (!lesson) return null;

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    };

    const handleNext = () => {
        const isLastQuestion = currentQuestionIndex === (quiz?.questions.length ?? 0) - 1;
        if (isLastQuestion) {
            let correctCount = 0;
            quiz?.questions.forEach((q, index) => {
                if (q.correctAnswer === selectedAnswers[index]) {
                    correctCount++;
                }
            });
            setScore(correctCount);
            onQuizComplete({
                lessonId: lesson.id,
                score: correctCount,
                totalQuestions: quiz.questions.length,
                completedAt: new Date(),
                studentId: user.id,
            });
            setShowScore(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const renderContent = () => {
        if (!quiz) {
            return (
                <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-300">A quiz for this lesson is not yet available.</p>
                    <Button onClick={onClose} variant="secondary" className="mt-4">Close</Button>
                </div>
            );
        }

        if (showScore) {
            return (
                <div className="text-center animate-fade-in-up">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quiz Completed!</h3>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
                        You scored <span className="font-bold text-blue-600">{score}</span> out of <span className="font-bold">{quiz.questions.length}</span>
                    </p>
                    <Button onClick={onClose} className="mt-6">Back to Lessons</Button>
                </div>
            );
        }

        const currentQuestion = quiz.questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

        return (
            <div>
                <p className="text-slate-600 dark:text-slate-400 mb-2 font-semibold">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                <h4 className="text-lg text-slate-800 dark:text-slate-100 mb-4">{currentQuestion.questionText}</h4>
                <div className="space-y-3">
                    {currentQuestion.options.map(option => (
                        <button
                            key={option}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full text-left p-4 rounded-lg border-2 font-semibold transition-all ${
                                selectedAnswers[currentQuestionIndex] === option 
                                ? 'border-blue-600 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <Button 
                    onClick={handleNext} 
                    disabled={!selectedAnswers[currentQuestionIndex]}
                    className="mt-6 w-full disabled:bg-slate-400"
                >
                    {isLastQuestion ? 'Submit & View Score' : 'Next Question'}
                </Button>
            </div>
        );
    };

    return (
        <Modal isOpen={!!lesson} onClose={onClose} title={`Quiz: ${lesson.title}`}>
            {renderContent()}
        </Modal>
    );
};


const EditStudentModal: React.FC<{
  student: User | null;
  onClose: () => void;
  onSave: (studentId: string, newName: string) => void;
}> = ({ student, onClose, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name);
    }
  }, [student]);

  const handleSave = () => {
    if (student && name.trim()) {
      onSave(student.id, name.trim());
    }
  };
  
  if (!student) return null;

  return (
    <Modal isOpen={!!student} onClose={onClose} title={`Edit Student: ${student.name}`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Student Name
          </label>
          <input
            type="text"
            id="studentName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

const StudentDetailsModal: React.FC<{
  student: User | null;
  onClose: () => void;
  allSubjects: Subject[];
  quizAttempts: QuizAttempt[];
  videoLessons: VideoLesson[];
}> = ({ student, onClose, allSubjects, quizAttempts, videoLessons }) => {
    if (!student) return null;

    const studentAttempts = quizAttempts
        .filter(qa => qa.studentId === student.id)
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    
    const recentActivityLessonIds = [...new Set(studentAttempts.map(qa => qa.lessonId))];
    const recentActivityLessons = videoLessons.filter(vl => recentActivityLessonIds.includes(vl.id));

    return (
        <Modal isOpen={!!student} onClose={onClose} title={student.name}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Recent Quiz Scores</h3>
                    {studentAttempts.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {studentAttempts.map(attempt => (
                                <div key={attempt.id} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{attempt.lessonTitle}</p>
                                        <p className="font-bold text-blue-600 dark:text-blue-400">{attempt.score}/{attempt.totalQuestions}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{attempt.completedAt.toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No recent quiz scores found.</p>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Recent Lesson Activity</h3>
                    {recentActivityLessons.length > 0 ? (
                         <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {recentActivityLessons.map(lesson => (
                                <div key={lesson.id} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex items-center gap-3">
                                    <img src={lesson.thumbnail} alt={lesson.title} className="w-16 h-12 object-cover rounded-md" />
                                    <div>
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{lesson.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{allSubjects.find(s => s.id === lesson.subjectId)?.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No recent lesson activity found.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const AddStudentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, email: string, subjectIds: string[]) => void;
  teacherSubjects: Subject[];
}> = ({ isOpen, onClose, onAdd, teacherSubjects }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    
    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev => 
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSubmit = () => {
        if (name.trim() && email.trim() && selectedSubjects.length > 0) {
            onAdd(name.trim(), email.trim(), selectedSubjects);
            // Reset form
            setName('');
            setEmail('');
            setSelectedSubjects([]);
        } else {
            alert("Please fill in all fields and select at least one subject.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Student">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Student Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Student Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Enroll in Subjects</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md p-2">
                        {teacherSubjects.map(subject => (
                            <div key={subject.id} className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id={`subj-${subject.id}`}
                                    checked={selectedSubjects.includes(subject.id)}
                                    onChange={() => handleSubjectToggle(subject.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={`subj-${subject.id}`} className="ml-3 text-sm text-slate-700 dark:text-slate-200">{subject.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add Student</Button>
                </div>
            </div>
        </Modal>
    );
};

const SubjectDetailsModal: React.FC<{
  subject: Subject | null;
  onClose: () => void;
  onProceed: () => void;
}> = ({ subject, onClose, onProceed }) => {
  if (!subject) return null;

  return (
    <Modal isOpen={!!subject} onClose={onClose} title={subject.name}>
      <div className="space-y-4">
        <img src={subject.coverPhoto} alt={subject.name} className="w-full h-40 object-cover rounded-lg" />
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Taught by <span className="font-semibold text-slate-700 dark:text-slate-200">{subject.teacherName}</span></p>
          <p className="text-slate-600 dark:text-slate-300 mt-2">{subject.description}</p>
        </div>
        <Button onClick={onProceed} className="w-full">
            Enter Classroom
        </Button>
      </div>
    </Modal>
  );
};


const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
        role="switch"
        aria-checked={enabled}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

const SettingsRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
        <span className="font-medium text-white">{label}</span>
        {children}
    </div>
);


const SettingsScreen: React.FC<{ 
    user: User;
    activityLogs: ActivityLog[];
    onUpdateProfilePicture: (dataUrl: string) => void;
}> = ({ user, activityLogs, onUpdateProfilePicture }) => {
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [studentNotifications, setStudentNotifications] = useState({ lessons: true, live: true });
    const [teacherNotifications, setTeacherNotifications] = useState({ enrollments: true, quizzes: true });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleThemeToggle = (enabled: boolean) => {
        setIsDarkMode(enabled);
        if (enabled) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('smartlearn-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('smartlearn-theme', 'light');
        }
    };
    
    const userLogs = activityLogs
        .filter(log => log.userId === user.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const getLogIcon = (type: ActivityType) => {
        const iconClass = "w-6 h-6 text-blue-300";
        switch (type) {
            case ActivityType.NewLesson: return <BookOpenIcon className={iconClass} />;
            case ActivityType.LiveReminder: return <VideoCameraIcon className={iconClass} />;
            case ActivityType.NewEnrollment: return <UserGroupIcon className={iconClass} />;
            case ActivityType.QuizSubmission: return <DocumentCheckIcon className={iconClass} />;
            case ActivityType.PaymentReceived: return <WalletIcon className={iconClass} />;
            default: return null;
        }
    };


    return (
        <div className="p-6 space-y-8 animated-gradient text-white h-full overflow-y-auto">
            <h2 className="text-3xl font-bold text-center">Settings</h2>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Profile</h3>
                <div className="bg-white/10 p-4 rounded-lg flex items-center gap-4">
                    <div className="relative">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-16 h-16 text-slate-300" />
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleProfilePicChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full text-white hover:bg-blue-600 transition-colors"
                            aria-label="Change profile picture"
                        >
                            <CameraIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <p className="font-medium text-lg">{user.name}</p>
                        <p className="text-sm text-blue-200">{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Appearance</h3>
                <SettingsRow label="Dark Mode">
                    <ToggleSwitch enabled={isDarkMode} onChange={handleThemeToggle} />
                </SettingsRow>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Notifications</h3>
                {user.role === Role.Student && (
                    <>
                        <SettingsRow label="New Lesson Alerts">
                            <ToggleSwitch enabled={studentNotifications.lessons} onChange={(e) => setStudentNotifications(p => ({...p, lessons: e}))} />
                        </SettingsRow>
                         <SettingsRow label="Live Class Reminders">
                            <ToggleSwitch enabled={studentNotifications.live} onChange={(e) => setStudentNotifications(p => ({...p, live: e}))} />
                        </SettingsRow>
                    </>
                )}
                 {user.role === Role.Teacher && (
                    <>
                        <SettingsRow label="New Student Enrollment">
                            <ToggleSwitch enabled={teacherNotifications.enrollments} onChange={(e) => setTeacherNotifications(p => ({...p, enrollments: e}))} />
                        </SettingsRow>
                         <SettingsRow label="Quiz Submissions">
                            <ToggleSwitch enabled={teacherNotifications.quizzes} onChange={(e) => setTeacherNotifications(p => ({...p, quizzes: e}))} />
                        </SettingsRow>
                    </>
                )}
            </div>

             <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Log and Activities</h3>
                <div className="bg-white/10 p-4 rounded-lg space-y-3 max-h-48 overflow-y-auto">
                    {userLogs.length > 0 ? userLogs.map(log => (
                        <div key={log.id} className="flex items-start gap-3">
                            <div className="bg-white/10 p-2 rounded-full mt-1">
                                {getLogIcon(log.type)}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{log.type}</p>
                                <p className="text-xs text-blue-200">{log.text}</p>
                                <p className="text-xs text-blue-300/70 mt-0.5">{log.timestamp.toLocaleString()}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-sm text-blue-200 py-4">No recent activity.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const UploadLessonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpload: (lessonData: { title: string; description: string; subjectId: string }) => void;
  subjects: Subject[];
  defaultSubjectId?: string;
}> = ({ isOpen, onClose, onUpload, subjects, defaultSubjectId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || subjects[0]?.id || '');
    const [fileName, setFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (defaultSubjectId) setSubjectId(defaultSubjectId);
    }, [defaultSubjectId])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !subjectId || !fileName) {
            alert('Please fill all fields and select a file.');
            return;
        }
        setIsUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            onUpload({ title, description, subjectId });
            setIsUploading(false);
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setSubjectId(defaultSubjectId || subjects[0]?.id || '');
            setFileName('');
        }, 1500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload New Lesson">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Lesson Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Video File</label>
                    <label htmlFor="video-upload" className="cursor-pointer bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors">
                        <CloudArrowUpIcon className="w-10 h-10 text-slate-400" />
                        <span className="mt-2 text-sm text-slate-600 dark:text-slate-300">{fileName || 'Click to select a file'}</span>
                        <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
                    </label>
                </div>
                <Button className="w-full" type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload Lesson'}
                </Button>
            </form>
        </Modal>
    );
};

const DeleteLessonConfirmationModal: React.FC<{
  lesson: VideoLesson | null;
  onClose: () => void;
  onConfirm: (lessonId: string) => void;
}> = ({ lesson, onClose, onConfirm }) => {
  if (!lesson) return null;
  return (
    <Modal isOpen={!!lesson} onClose={onClose} title="Confirm Deletion">
        <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-1">Are you sure you want to delete the lesson:</p>
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-6">"{lesson.title}"?</p>
            <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={() => onConfirm(lesson.id)} className="!bg-red-500 hover:!bg-red-600 focus:!ring-red-300">Delete</Button>
            </div>
        </div>
    </Modal>
  );
};

const StartLiveModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onStart: (title: string, subjectId: string) => void;
  teacherSubjects: Subject[];
  user: User;
}> = ({ isOpen, onClose, onStart, teacherSubjects, user }) => {
    const [title, setTitle] = useState('');
    const [subjectId, setSubjectId] = useState(teacherSubjects[0]?.id || '');

    const handleStart = () => {
        if (title.trim() && subjectId) {
            onStart(title.trim(), subjectId);
            setTitle('');
            onClose();
        } else {
            alert('Please provide a title and select a subject.');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Start a Live Session">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Live Session Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <Button onClick={handleStart} className="w-full !bg-red-500 hover:!bg-red-600 focus:!ring-red-300">Go Live Now</Button>
            </div>
        </Modal>
    );
};

const EditLiveClassModal: React.FC<{
  liveClass: LiveClass | null;
  onClose: () => void;
  onSave: (id: string, newTitle: string) => void;
}> = ({ liveClass, onClose, onSave }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (liveClass) {
      setTitle(liveClass.title);
    }
  }, [liveClass]);

  if (!liveClass) return null;

  const handleSave = () => {
    if (title.trim()) {
        onSave(liveClass.id, title.trim());
        onClose();
    }
  };

  return (
    <Modal isOpen={!!liveClass} onClose={onClose} title="Edit Live Class">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Live Session Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

const BookstoreScreen: React.FC<{ 
    books: Book[],
    purchasedBookIds: string[],
    onBuyBook: (book: Book) => void,
    onReadBook: (book: Book) => void,
}> = ({ books, purchasedBookIds, onBuyBook, onReadBook }) => {
    return (
        <div className="p-4 animate-fade-in-up">
            <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">SmartLearn Bookstore</h2>
                <p className="text-slate-500 dark:text-slate-400">Textbooks for the Malawi Curriculum</p>
            </div>

            {books.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {books.map(book => {
                        const isPurchased = purchasedBookIds.includes(book.id);
                        return (
                            <div key={book.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col hover-lift">
                                <img src={book.coverPhoto} alt={book.title} className="h-48 w-full object-cover" />
                                <div className="p-3 flex flex-col flex-grow">
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{book.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{book.author}</p>
                                    <div className="mt-auto pt-2">
                                        <p className="font-bold text-blue-600 dark:text-blue-400 mb-2">MWK {book.price.toLocaleString()}</p>
                                        {isPurchased ? (
                                            <Button onClick={() => onReadBook(book)} variant="secondary" className="w-full !py-2 text-xs">Read Now</Button>
                                        ) : (
                                            <Button onClick={() => onBuyBook(book)} className="w-full !py-2 text-xs">Buy Now</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="text-center py-10 px-4">
                    <BookOpenIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 font-semibold">The bookstore is currently empty.</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Please check back later.</p>
                </div>
            )}
        </div>
    );
};

const ClassroomFeed: React.FC<{
  user: User;
  subject: Subject;
  posts: SubjectPost[];
  onAddPost: (post: Omit<SubjectPost, 'id'>) => void;
}> = ({ user, subject, posts, onAddPost }) => {
    const [newPostText, setNewPostText] = useState('');
    const [postType, setPostType] = useState<PostType>(PostType.Announcement);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const isTeacher = user.id === subject.teacherId || user.role === Role.Owner;

    const handlePost = () => {
        if (!newPostText.trim()) return;
        onAddPost({
            subjectId: subject.id,
            teacherId: user.id,
            teacherName: user.name,
            teacherProfilePic: user.profilePicture,
            type: postType,
            text: newPostText,
            timestamp: new Date(),
        });
        setNewPostText('');
    };
    
    const handleAiSuggest = async () => {
        if (!newPostText.trim()) return;
        setIsAiLoading(true);
        const result = await generateQuizOptions(newPostText);
        if (result && result.options.length > 0) {
            const optionsText = result.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
            const fullText = `${newPostText}\n\n${optionsText}\n\nCorrect Answer: ${result.correctAnswer}`;
            setNewPostText(fullText);
        }
        setIsAiLoading(false);
    };

    return (
        <div className="p-4 space-y-4">
            {isTeacher && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    <textarea
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        placeholder="Post an announcement or ask a question..."
                        rows={3}
                        className="w-full p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPostType(PostType.Announcement)} className={`px-3 py-1 text-xs rounded-full font-semibold ${postType === PostType.Announcement ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>Announcement</button>
                            <button onClick={() => setPostType(PostType.Question)} className={`px-3 py-1 text-xs rounded-full font-semibold ${postType === PostType.Question ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>Question</button>
                        </div>
                        <div className="flex items-center gap-2">
                             {postType === PostType.Question && (
                                <button onClick={handleAiSuggest} disabled={isAiLoading || !newPostText} className="flex items-center gap-1 text-sm text-blue-600 font-semibold disabled:opacity-50">
                                    <LightBulbIcon className="w-4 h-4"/> {isAiLoading ? 'Thinking...' : 'AI Suggest'}
                                </button>
                            )}
                            <Button onClick={handlePost} disabled={!newPostText} className="!py-2 !px-4 text-sm">Post</Button>
                        </div>
                    </div>
                </div>
            )}
            {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                        <img src={post.teacherProfilePic} alt={post.teacherName} className="w-10 h-10 rounded-full object-cover"/>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 dark:text-slate-100">{post.teacherName}</p>
                                {post.type === PostType.Question && <QuestionMarkCircleIcon className="w-5 h-5 text-blue-500" title="Question"/>}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{post.timestamp.toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="mt-3 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{post.text}</p>
                </div>
            ))}
        </div>
    );
};

const SubjectView: React.FC<{
  user: User;
  subject: Subject;
  lessons: VideoLesson[];
  posts: SubjectPost[];
  onWatchLesson: (lesson: VideoLesson) => void;
  onTakeQuiz: (lesson: VideoLesson) => void;
  onAddPost: (post: Omit<SubjectPost, 'id'>) => void;
}> = ({ user, subject, lessons, posts, onWatchLesson, onTakeQuiz, onAddPost }) => {
    const [activeTab, setActiveTab] = useState<'lessons' | 'feed'>('lessons');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
    const difficulties: Array<typeof selectedDifficulty> = ['All', 'Beginner', 'Intermediate', 'Advanced'];
    
    const lessonsForSubject = lessons.filter(l => l.subjectId === subject.id);
    const filteredLessons = lessonsForSubject.filter(lesson => {
        const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (lesson.tags && lesson.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesDifficulty = selectedDifficulty === 'All' || lesson.difficulty === selectedDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    const postsForSubject = posts.filter(p => p.subjectId === subject.id).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div>
            <div className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{subject.name}</h2>
                <p className="text-slate-500 dark:text-slate-400">with {subject.teacherName}</p>
            </div>
            <div className="flex border-b bg-white dark:bg-slate-800 dark:border-slate-700 sticky top-[65px] z-10">
                <button onClick={() => setActiveTab('lessons')} className={`flex-1 py-3 font-semibold text-center ${activeTab === 'lessons' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>Lessons</button>
                <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 font-semibold text-center ${activeTab === 'feed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>Classroom Feed</button>
            </div>
            {activeTab === 'lessons' ? (
                <div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder="Search lessons by title or topic..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">Difficulty:</span>
                            {difficulties.map(difficulty => (
                                <button
                                    key={difficulty}
                                    onClick={() => setSelectedDifficulty(difficulty)}
                                    className={`px-3 py-1 text-xs rounded-full font-semibold ${
                                        selectedDifficulty === difficulty
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {difficulty}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4">
                        <VideoLessonList lessons={filteredLessons} onWatchLesson={onWatchLesson} onTakeQuiz={onTakeQuiz} />
                    </div>
                </div>
            ) : (
                <ClassroomFeed user={user} subject={subject} posts={postsForSubject} onAddPost={onAddPost} />
            )}
        </div>
    );
};

const JobApplicationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, email: string, phoneNumber: string, subjects: string[], cvFile: File | null) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [subjects, setSubjects] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCvFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email && phoneNumber && subjects) {
            const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s);
            onSubmit(name, email, phoneNumber, subjectList, cvFile);
            // Reset form
            setName('');
            setEmail('');
            setPhoneNumber('');
            setSubjects('');
            setCvFile(null);
            onClose();
        } else {
            alert('Please fill out all fields.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Apply to Teach">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <InputWithIcon icon={<UserIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                 <InputWithIcon icon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                 <InputWithIcon icon={<PhoneIcon className="w-5 h-5 text-slate-400" />} type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subjects you can teach</label>
                    <input type="text" value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="e.g., Mathematics, Physics" className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Separate subjects with a comma.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Upload CV</label>
                     <label htmlFor="cv-upload" className="cursor-pointer bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors">
                        <CloudArrowUpIcon className="w-8 h-8 text-slate-400" />
                        <span className="mt-2 text-sm text-slate-600 dark:text-slate-300 truncate max-w-full">{cvFile?.name || 'Click to select a file (.pdf, .doc, .docx)'}</span>
                        <input id="cv-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    </label>
                </div>
                <Button className="w-full" type="submit">Submit Application</Button>
            </form>
        </Modal>
    );
};

const StudentProgressScreen: React.FC<{
    user: User;
    allSubjects: Subject[];
    allLessons: VideoLesson[];
    lessonCompletions: LessonCompletion[];
    quizAttempts: QuizAttempt[];
    enrollments: Enrollment[];
    onNavigateToSubject: (subject: Subject) => void;
    books: Book[];
    purchasedBookIds: string[];
    onReadBook: (book: Book) => void;
}> = ({ user, allSubjects, allLessons, lessonCompletions, quizAttempts, enrollments, onNavigateToSubject, books, purchasedBookIds, onReadBook }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'books'>('overview');

    const enrolledSubjectIds = enrollments.filter(e => e.studentId === user.id).map(e => e.subjectId);
    const enrolledSubjects = allSubjects.filter(s => enrolledSubjectIds.includes(s.id));

    const totalLessonsInEnrolledSubjects = allLessons.filter(l => enrolledSubjectIds.includes(l.subjectId)).length;
    const completedLessonsCount = lessonCompletions.filter(c => c.studentId === user.id).length;
    const overallProgress = totalLessonsInEnrolledSubjects > 0 ? Math.round((completedLessonsCount / totalLessonsInEnrolledSubjects) * 100) : 0;
    
    const totalQuizzesTaken = quizAttempts.filter(qa => qa.studentId === user.id).length;
    
    const recentlyCompleted = lessonCompletions
        .filter(c => c.studentId === user.id)
        .sort((a,b) => b.completedAt.getTime() - a.timestamp.getTime())
        .slice(0, 3)
        .map(c => allLessons.find(l => l.id === c.lessonId))
        .filter((l): l is VideoLesson => l !== undefined);
        
    const purchasedBooks = books.filter(b => purchasedBookIds.includes(b.id));

    return (
        <div className="animate-fade-in-up">
            <div className="p-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Progress</h2>
            </div>
            
            <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-[65px] bg-slate-100 dark:bg-slate-900 z-10">
                 <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 font-semibold text-center ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>Overview</button>
                 <button onClick={() => setActiveTab('books')} className={`flex-1 py-3 font-semibold text-center ${activeTab === 'books' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>My Books ({purchasedBooks.length})</button>
            </div>

            {activeTab === 'overview' && (
                <div className="p-4 space-y-6">
                    <div>
                        <div className="grid grid-cols-2 gap-4 text-white">
                            <StatCard icon={<CheckBadgeIcon/>} title="Overall Completion" value={`${overallProgress}%`} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                            <StatCard icon={<DocumentTextIcon/>} title="Quizzes Taken" value={totalQuizzesTaken} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                            <StatCard icon={<BookOpenIcon/>} title="Lessons Completed" value={completedLessonsCount} gradient="bg-gradient-to-br from-purple-500 to-pink-600" />
                            <StatCard icon={<ClockIcon/>} title="Time Spent" value="~14 Hrs" gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recently Completed Lessons</h3>
                        {recentlyCompleted.length > 0 ? (
                            <div className="space-y-3">
                                {recentlyCompleted.map(lesson => (
                                    <div key={lesson.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm flex items-center gap-3">
                                        <img src={lesson.thumbnail} alt={lesson.title} className="w-20 h-12 object-cover rounded-md" />
                                        <div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">{lesson.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {allSubjects.find(s => s.id === lesson.subjectId)?.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">You haven't completed any lessons yet.</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Enrolled Subjects</h3>
                        <div className="space-y-3">
                            {enrolledSubjects.map(subject => {
                                const lessonsForSubject = allLessons.filter(l => l.subjectId === subject.id);
                                const completedCount = lessonCompletions.filter(c => c.studentId === user.id && lessonsForSubject.some(l => l.id === c.lessonId)).length;
                                const progress = lessonsForSubject.length > 0 ? Math.round((completedCount / lessonsForSubject.length) * 100) : 0;
                                return (
                                    <div key={subject.id} onClick={() => onNavigateToSubject(subject)} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm cursor-pointer hover-lift">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{subject.name}</p>
                                            <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{progress}%</p>
                                        </div>
                                        <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'books' && (
                <div className="p-4">
                    {purchasedBooks.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {purchasedBooks.map(book => (
                                <div key={book.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col hover-lift">
                                    <img src={book.coverPhoto} alt={book.title} className="h-48 w-full object-cover" />
                                    <div className="p-3 flex flex-col flex-grow">
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{book.title}</h3>
                                        <div className="mt-auto pt-2">
                                            <Button onClick={() => onReadBook(book)} variant="secondary" className="w-full !py-2 text-xs">Read Now</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4">
                            <BookOpenIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">You haven't purchased any books yet.</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">Visit the bookstore to get started.</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

// FIX: Added the main App component to structure the application and fix the missing default export error.
const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // Data state, initialized from constants
    const [allUsers, setAllUsers] = useState<User[]>(USERS);
    const [allSubjects, setAllSubjects] = useState<Subject[]>(SUBJECTS);
    const [allLessons, setAllLessons] = useState<VideoLesson[]>(VIDEO_LESSONS);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>(INITIAL_LIVE_CLASSES);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(PAYMENT_HISTORY);
    const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(QUIZ_ATTEMPTS);
    const [enrollments, setEnrollments] = useState<Enrollment[]>(ENROLLMENTS);
    const [lessonCompletions, setLessonCompletions] = useState<LessonCompletion[]>(LESSON_COMPLETIONS);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(ACTIVITY_LOGS);
    const [allBooks, setAllBooks] = useState<Book[]>(BOOKS);
    const [bookPurchases, setBookPurchases] = useState<BookPurchase[]>([]);
    const [subjectPosts, setSubjectPosts] = useState<SubjectPost[]>(SUBJECT_POSTS);
    const [jobApplications, setJobApplications] = useState<JobApplication[]>(INITIAL_JOB_APPLICATIONS);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>(INITIAL_DIRECT_MESSAGES);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // UI/View state
    const [viewStack, setViewStack] = useState<string[]>(['dashboard']);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedLessonForVideo, setSelectedLessonForVideo] = useState<VideoLesson | null>(null);
    const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState<VideoLesson | null>(null);
    const [activeLiveClass, setActiveLiveClass] = useState<LiveClass | null>(null);
    const [liveChatMessages, setLiveChatMessages] = useState<ChatMessage[]>([]);
    const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
    const [isJobApplicationModalOpen, setJobApplicationModalOpen] = useState(false);
    
    const [purchaseItem, setPurchaseItem] = useState<{ type: 'book', item: Book } | { type: 'tuition', amount: number } | null>(null);
    const [modalStudent, setModalStudent] = useState<User | null>(null);
    const [modalStudentForDetails, setModalStudentForDetails] = useState<User | null>(null);
    const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<VideoLesson | null>(null);
    const [isUploadLessonModalOpen, setUploadLessonModalOpen] = useState(false);
    const [uploadDefaultSubjectId, setUploadDefaultSubjectId] = useState<string | undefined>();
    const [isStartLiveModalOpen, setStartLiveModalOpen] = useState(false);
    const [liveClassToEdit, setLiveClassToEdit] = useState<LiveClass | null>(null);
    const [applicationToView, setApplicationToView] = useState<JobApplication | null>(null);

    const currentView = viewStack[viewStack.length - 1];
    
    useEffect(() => {
        const savedTheme = localStorage.getItem('smartlearn-theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const addToast = (message: string, type: ToastMessage['type'] = 'success') => {
        const newToast: ToastMessage = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
    };
  
    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    // --- HANDLERS ---
    const handleLogin = (email: string, pass: string, role: Role) => {
        const user = allUsers.find(u => u.email === email && u.password === pass && u.role === role);
        if (user) {
            setCurrentUser(user);
            addToast(`Welcome back, ${user.name}!`);
        } else {
            addToast('Invalid credentials. Please try again.', 'error');
        }
    };

    const handleSignUp = (name: string, email: string, pass: string, role: Role) => {
        if (allUsers.some(u => u.email === email)) {
            addToast('An account with this email already exists.', 'error');
            return;
        }
        const newUser: User = { id: `user-${Date.now()}`, name, email, role, password: pass, profilePicture: `https://i.pravatar.cc/150?u=user-${Date.now()}`};
        setAllUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        addToast(`Account created successfully! Welcome, ${name}.`);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setViewStack(['dashboard']);
        addToast('You have been logged out.');
    };
    
    const navigateTo = (view: string) => setViewStack(prev => [...prev, view]);
    const goBack = () => {
        if (viewStack.length > 1) {
            setViewStack(prev => prev.slice(0, -1));
            if(currentView === 'subject') setSelectedSubject(null);
            if(currentView === 'payment') setPurchaseItem(null);
        }
    };
  
    // Student specific handlers
    const handleSelectSubject = (subject: Subject) => {
        const isPaid = paymentHistory.some(p => p.studentId === currentUser?.id);
        if (!isPaid && currentUser?.role === Role.Student) {
            addToast('Please pay tuition to access subjects.', 'info');
            setPurchaseItem({ type: 'tuition', amount: 15000 });
            navigateTo('payment');
            return;
        }
        setSelectedSubject(subject);
        navigateTo('subject');
    };
    
    const handlePaymentSuccess = (newRecord: PaymentRecord) => {
        setPaymentHistory(prev => [newRecord, ...prev]);
        if (newRecord.purchaseType === 'book' && newRecord.purchaseId) {
            setBookPurchases(prev => [...prev, { studentId: newRecord.studentId, bookId: newRecord.purchaseId! }]);
        }
        addToast('Payment successful!', 'success');
    };

    const handleQuizComplete = (attemptData: { lessonId: string, score: number, totalQuestions: number, studentId: string }) => {
        if(!currentUser) return;
        const newAttempt: QuizAttempt = {
            id: `qa-${Date.now()}`,
            studentName: currentUser.name,
            lessonTitle: allLessons.find(l => l.id === attemptData.lessonId)?.title || 'Lesson',
            ...attemptData,
            completedAt: new Date(),
        };
        setQuizAttempts(prev => [...prev, newAttempt]);
        setSelectedLessonForQuiz(null);
    };

    const handleLessonViewed = (lessonId: string) => {
        if (currentUser && !lessonCompletions.some(c => c.studentId === currentUser.id && c.lessonId === lessonId)) {
            const completion: LessonCompletion = { studentId: currentUser.id, lessonId, completedAt: new Date() };
            setLessonCompletions(prev => [...prev, completion]);
        }
    };
    
    const handleApplyForJob = (name: string, email: string, phoneNumber: string, subjects: string[], cvFile: File | null) => {
        const createApplication = (cvDataUrl?: string) => {
            const newApp: JobApplication = {
                id: `app-${Date.now()}`,
                name,
                email,
                phoneNumber,
                subjects,
                status: ApplicationStatus.Pending,
                timestamp: new Date(),
                cvFileName: cvFile?.name,
                cvDataUrl,
            };
            setJobApplications(prev => [newApp, ...prev]);
            addToast('Your application has been submitted successfully!', 'success');
        };

        if (cvFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                createApplication(reader.result as string);
            };
            reader.readAsDataURL(cvFile);
        } else {
            createApplication();
        }
    };
    
    // Teacher handlers
    const handleAddStudent = (name: string, email: string, subjectIds: string[]) => {
        const newStudent: User = { id: `user-${Date.now()}`, name, email, role: Role.Student, password: 'password123' };
        setAllUsers(prev => [...prev, newStudent]);
        const newEnrollments = subjectIds.map(subjectId => ({ studentId: newStudent.id, subjectId }));
        setEnrollments(prev => [...prev, ...newEnrollments]);
        addToast(`Student ${name} added and enrolled.`, 'success');
        setAddStudentModalOpen(false);
    };
    
    const handleUploadLesson = (lessonData: { title: string; description: string; subjectId: string }) => {
        const newLesson: VideoLesson = {
            id: `vl-${Date.now()}`,
            ...lessonData,
            thumbnail: `https://picsum.photos/seed/vl-${Date.now()}/400/225`,
            duration: '15:00',
            difficulty: 'Beginner',
        };
        setAllLessons(prev => [newLesson, ...prev]);
        addToast(`Lesson "${lessonData.title}" uploaded successfully.`, 'success');
    };
    
    const handleStartLiveClass = (title: string, subjectId: string) => {
        if (!currentUser) return;
        const newLiveClass: LiveClass = {
            id: `lc-${Date.now()}`,
            title, subjectId, teacherId: currentUser.id, teacherName: currentUser.name, startTime: new Date()
        };
        setLiveClasses(p => [...p, newLiveClass]);
        setActiveLiveClass(newLiveClass);
    }
    
    // Owner handlers
    const handleApproveApplication = (appId: string) => {
        const app = jobApplications.find(a => a.id === appId);
        if(!app) return;
        
        const newTeacher: User = {
            id: `user-${Date.now()}`,
            name: app.name,
            email: app.email,
            role: Role.Teacher,
            password: 'teacherpassword',
        };
        setAllUsers(prev => [...prev, newTeacher]);
        setJobApplications(prev => prev.map(a => a.id === appId ? {...a, status: ApplicationStatus.Approved} : a));
        addToast(`Application for ${app.name} approved. Teacher account created.`, 'success');
    };

    const handleRejectApplication = (appId: string) => {
        setJobApplications(prev => prev.map(a => a.id === appId ? {...a, status: ApplicationStatus.Rejected} : a));
        addToast('Application rejected.', 'info');
    };

    const handleSendMessage = (receiverId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: DirectMessage = {
            id: `dm-${Date.now()}`,
            senderId: currentUser.id,
            receiverId,
            text,
            timestamp: new Date(),
        };
        setDirectMessages(prev => [...prev, newMessage]);
    };

    // --- RENDER LOGIC ---
    const renderContent = () => {
        if (!currentUser) {
            return <AuthScreen 
                onLogin={handleLogin}
                onSignUp={handleSignUp}
                onGoogleAuth={() => addToast("Google Auth is not implemented.", "info")}
                onApply={() => setJobApplicationModalOpen(true)}
            />;
        }

        if (activeLiveClass) {
            return currentUser.role === Role.Teacher || currentUser.role === Role.Owner
                ? <TeacherLiveView liveClass={activeLiveClass} onEnd={() => setActiveLiveClass(null)} user={currentUser} messages={liveChatMessages} onSendMessage={(msg) => setLiveChatMessages(p => [...p, msg])} />
                : <StudentLiveView liveClass={activeLiveClass} onLeave={() => setActiveLiveClass(null)} user={currentUser} messages={liveChatMessages} onSendMessage={(msg) => setLiveChatMessages(p => [...p, msg])} />;
        }

        switch (currentView) {
            case 'subject':
                return selectedSubject ? <SubjectView user={currentUser} subject={selectedSubject} lessons={allLessons} posts={subjectPosts} onWatchLesson={setSelectedLessonForVideo} onTakeQuiz={setSelectedLessonForQuiz} onAddPost={(p) => setSubjectPosts(prev => [{...p, id: `post-${Date.now()}`}, ...prev])} /> : <div>Subject not found</div>;
            case 'payment':
                return <PaymentScreen user={currentUser} onBack={goBack} onPaymentSuccess={handlePaymentSuccess} purchaseItem={purchaseItem || undefined} />;
            case 'settings':
                return <SettingsScreen user={currentUser} activityLogs={activityLogs} onUpdateProfilePicture={(dataUrl) => {
                    setCurrentUser(p => p ? {...p, profilePicture: dataUrl} : null);
                    setAllUsers(p => p.map(u => u.id === currentUser.id ? {...u, profilePicture: dataUrl} : u));
                    addToast("Profile picture updated!");
                }} />;
            case 'bookstore':
                return <BookstoreScreen books={allBooks} purchasedBookIds={bookPurchases.filter(p => p.studentId === currentUser.id).map(p => p.bookId)} onBuyBook={(book) => {setPurchaseItem({ type: 'book', item: book }); navigateTo('payment');}} onReadBook={(book) => addToast(`Reading "${book.title}"... (not implemented)`)} />;
            case 'progress':
                return <StudentProgressScreen user={currentUser} allSubjects={allSubjects} allLessons={allLessons} lessonCompletions={lessonCompletions} quizAttempts={quizAttempts} enrollments={enrollments} onNavigateToSubject={handleSelectSubject} books={allBooks} purchasedBookIds={bookPurchases.filter(p => p.studentId === currentUser.id).map(p => p.bookId)} onReadBook={(book) => addToast(`Reading "${book.title}"... (not implemented)`)} />;
            case 'dashboard':
            default:
                switch (currentUser.role) {
                    case Role.Student:
                        return <StudentDashboard 
                                    user={currentUser}
                                    isPaid={paymentHistory.some(p => p.studentId === currentUser.id)}
                                    allSubjects={allSubjects}
                                    allLessons={allLessons}
                                    allLiveClasses={liveClasses}
                                    lessonCompletions={lessonCompletions}
                                    activeLiveClass={activeLiveClass}
                                    onSelectSubject={handleSelectSubject}
                                    onJoinLiveClass={setActiveLiveClass}
                                    onPayForLessons={() => { setPurchaseItem({ type: 'tuition', amount: 15000 }); navigateTo('payment'); }}
                                    onWatchLesson={setSelectedLessonForVideo}
                                />;
                    case Role.Teacher:
                        return <TeacherDashboard 
                                    user={currentUser}
                                    students={allUsers.filter(u => u.role === Role.Student)}
                                    allUsers={allUsers}
                                    allSubjects={allSubjects}
                                    allLessons={allLessons}
                                    allLiveClasses={liveClasses}
                                    quizAttempts={quizAttempts}
                                    activityLogs={activityLogs}
                                    enrollments={enrollments}
                                    paymentRecords={paymentHistory}
                                    onEditStudent={setModalStudent}
                                    onAddStudentClick={() => setAddStudentModalOpen(true)}
                                    onViewStudentDetails={setModalStudentForDetails}
                                    onDeleteLesson={setLessonToDelete}
                                    onUploadLessonClick={(subjectId) => { setUploadDefaultSubjectId(subjectId); setUploadLessonModalOpen(true); }}
                                    onGoLive={setActiveLiveClass}
                                    onStartQuickLive={() => setStartLiveModalOpen(true)}
                                    onEditLiveClass={setLiveClassToEdit}
                                    directMessages={directMessages}
                                    onSendMessage={handleSendMessage}
                                />;
                    case Role.Owner:
                        return <OwnerDashboard 
                                    user={currentUser}
                                    allUsers={allUsers}
                                    allPayments={paymentHistory}
                                    jobApplications={jobApplications}
                                    allBooks={allBooks}
                                    withdrawals={withdrawals}
                                    onApproveApplication={handleApproveApplication}
                                    onRejectApplication={handleRejectApplication}
                                    onViewApplication={setApplicationToView}
                                    setAllBooks={setAllBooks}
                                    setWithdrawals={setWithdrawals}
                                    addToast={addToast}
                                    allSubjects={allSubjects}
                                    allLessons={allLessons}
                                    enrollments={enrollments}
                                    directMessages={directMessages}
                                    onSendMessage={handleSendMessage}
                                />;
                }
        }
    };

    return (
        <div className={`bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen font-sans ${activeLiveClass ? 'overflow-hidden h-screen' : ''}`}>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            
            <AiTutorModal isOpen={isAiTutorOpen} onClose={() => setIsAiTutorOpen(false)} />
            <JobApplicationModal isOpen={isJobApplicationModalOpen} onClose={() => setJobApplicationModalOpen(false)} onSubmit={handleApplyForJob} />
            <ApplicationDetailModal application={applicationToView} onClose={() => setApplicationToView(null)} />
            <VideoPlayerModal lesson={selectedLessonForVideo} onClose={() => setSelectedLessonForVideo(null)} user={currentUser} onLessonViewed={handleLessonViewed} />
            <QuizModal lesson={selectedLessonForQuiz} onClose={() => setSelectedLessonForQuiz(null)} user={currentUser!} onQuizComplete={handleQuizComplete} />
            {currentUser && <EditStudentModal student={modalStudent} onClose={() => setModalStudent(null)} onSave={(id, name) => {
                setAllUsers(p => p.map(u => u.id === id ? {...u, name} : u));
                setModalStudent(null);
                addToast("Student updated.");
            }} />}
            <StudentDetailsModal student={modalStudentForDetails} onClose={() => setModalStudentForDetails(null)} allSubjects={allSubjects} quizAttempts={quizAttempts} videoLessons={allLessons} />
            {currentUser?.role === Role.Teacher && <AddStudentModal isOpen={isAddStudentModalOpen} onClose={() => setAddStudentModalOpen(false)} onAdd={handleAddStudent} teacherSubjects={allSubjects.filter(s => s.teacherId === currentUser?.id)} />}
            <DeleteLessonConfirmationModal lesson={lessonToDelete} onClose={() => setLessonToDelete(null)} onConfirm={(id) => {
                setAllLessons(p => p.filter(l => l.id !== id));
                setLessonToDelete(null);
                addToast("Lesson deleted.", "info");
            }} />
            {currentUser?.role === Role.Teacher && <UploadLessonModal isOpen={isUploadLessonModalOpen} onClose={() => setUploadLessonModalOpen(false)} onUpload={handleUploadLesson} subjects={allSubjects.filter(s => s.teacherId === currentUser?.id)} defaultSubjectId={uploadDefaultSubjectId} />}
            {currentUser?.role === Role.Teacher && <StartLiveModal isOpen={isStartLiveModalOpen} onClose={() => setStartLiveModalOpen(false)} onStart={handleStartLiveClass} teacherSubjects={allSubjects.filter(s => s.teacherId === currentUser?.id)} user={currentUser} />}
            <EditLiveClassModal liveClass={liveClassToEdit} onClose={() => setLiveClassToEdit(null)} onSave={(id, title) => {
                setLiveClasses(p => p.map(lc => lc.id === id ? {...lc, title} : lc));
                addToast("Live class updated.");
            }} />
            <SubjectDetailsModal subject={selectedSubject && currentView === 'subject' ? selectedSubject : null} onClose={goBack} onProceed={() => {}} />

            <div className={`transition-all duration-300 ${activeLiveClass ? 'h-screen' : 'max-w-4xl mx-auto'}`}>
                {currentUser && !activeLiveClass && (
                    <Header 
                        user={currentUser}
                        onLogout={handleLogout}
                        currentView={currentView}
                        onBack={goBack}
                        onNavigateToSettings={() => navigateTo('settings')}
                        unreadCount={activityLogs.filter(l => !l.read && l.userId === currentUser.id).length}
                        onToggleNotifications={() => {}}
                    />
                )}
                <main className={!activeLiveClass ? "pb-20" : 'h-full'}>
                    {renderContent()}
                </main>
                {currentUser && !activeLiveClass && (
                     <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 max-w-4xl mx-auto flex justify-around p-2 z-20">
                        {currentUser.role === Role.Student && <>
                            <button onClick={() => setViewStack(['dashboard'])} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}><HomeIcon className="w-6 h-6"/> <span className="text-xs">Home</span></button>
                            <button onClick={() => navigateTo('progress')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentView === 'progress' ? 'text-blue-600' : 'text-slate-500'}`}><ChartBarIcon className="w-6 h-6"/> <span className="text-xs">Progress</span></button>
                            <button onClick={() => setIsAiTutorOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-500"><SparklesIcon className="w-6 h-6"/> <span className="text-xs">AI Tutor</span></button>
                            <button onClick={() => navigateTo('bookstore')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${currentView === 'bookstore' ? 'text-blue-600' : 'text-slate-500'}`}><BuildingStorefrontIcon className="w-6 h-6"/> <span className="text-xs">Bookstore</span></button>
                        </>}
                    </nav>
                )}
            </div>
        </div>
    );
};

const ApplicationDetailModal: React.FC<{ application: JobApplication | null, onClose: () => void }> = ({ application, onClose }) => {
    if (!application) return null;

    const handleDownloadCv = () => {
        if (application.cvDataUrl && application.cvFileName) {
            const link = document.createElement('a');
            link.href = application.cvDataUrl;
            link.download = application.cvFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('CV data is not available for download.');
        }
    };

    const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
        <div className="flex items-start gap-3">
            <div className="text-slate-400 mt-1">{icon}</div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );

    return (
        <Modal isOpen={!!application} onClose={onClose} title={`Application: ${application.name}`}>
            <div className="space-y-4">
                <DetailItem icon={<EnvelopeIcon className="w-5 h-5"/>} label="Email" value={application.email} />
                <DetailItem icon={<PhoneIcon className="w-5 h-5"/>} label="Phone Number" value={application.phoneNumber} />
                <DetailItem icon={<BookOpenIcon className="w-5 h-5"/>} label="Subjects" value={application.subjects.join(', ')} />
                {application.cvFileName && (
                    <div className="pt-2">
                        <Button variant="secondary" className="w-full" onClick={handleDownloadCv}>
                            <div className="flex items-center justify-center gap-2">
                                <DocumentTextIcon className="w-5 h-5" />
                                Download CV ({application.cvFileName})
                            </div>
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const ChatInterface: React.FC<{
    currentUser: User;
    users: User[];
    messages: DirectMessage[];
    onSendMessage: (receiverId: string, text: string) => void;
}> = ({ currentUser, users, messages, onSendMessage }) => {
    const isOwner = currentUser.role === Role.Owner;
    const teachers = users.filter(u => u.role === Role.Teacher);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(isOwner ? teachers[0]?.id : APP_OWNER_ID);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedTeacherId]);

    const handleSend = () => {
        if (newMessage.trim() && selectedTeacherId) {
            onSendMessage(selectedTeacherId, newMessage.trim());
            setNewMessage('');
        }
    };

    const currentChatMessages = messages.filter(
        m => (m.senderId === currentUser.id && m.receiverId === selectedTeacherId) || (m.senderId === selectedTeacherId && m.receiverId === currentUser.id)
    ).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const selectedTeacher = users.find(u => u.id === selectedTeacherId);

    const chatPanel = (
         <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            {selectedTeacher ? (
                <>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                        <img src={selectedTeacher.profilePicture} alt={selectedTeacher.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{selectedTeacher.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Online
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {currentChatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-xl px-4 py-2 max-w-xs ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                    <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                         <input
                            type="text" value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-full disabled:bg-slate-400">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">{isOwner ? 'Select a teacher to start chatting.' : 'No chat available.'}</p>
                </div>
            )}
         </div>
    );

    return (
        <div className="h-[70vh] flex gap-4">
            {isOwner && (
                <div className="w-1/3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm overflow-y-auto space-y-1">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 p-2 mb-2">Teachers</h3>
                    {teachers.map(teacher => (
                        <button key={teacher.id} onClick={() => setSelectedTeacherId(teacher.id)} 
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-3 ${selectedTeacherId === teacher.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                            <img src={teacher.profilePicture} alt={teacher.name} className="w-10 h-10 rounded-full object-cover" />
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{teacher.name}</span>
                        </button>
                    ))}
                </div>
            )}
            <div className={isOwner ? "w-2/3" : "w-full"}>
                {chatPanel}
            </div>
        </div>
    );
};

export default App;