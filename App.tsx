import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Subject, VideoLesson, LiveClass, ChatMessage, PaymentRecord, QuizAttempt, Enrollment, LessonCompletion, ActivityType, ActivityLog, Book, SubjectPost, PostType, JobApplication, ApplicationStatus, BookPurchase, ToastMessage, Withdrawal, DirectMessage, Examination, ExaminationAttempt, ExaminationQuestion, Quiz, SubscriptionPlan, StudentSubscription, LessonBookmark } from './types';
import { USERS, SUBJECTS, VIDEO_LESSONS, INITIAL_LIVE_CLASSES, PAYMENT_HISTORY, QUIZZES, QUIZ_ATTEMPTS, ENROLLMENTS, LESSON_COMPLETIONS, ACTIVITY_LOGS, BOOKS, SUBJECT_POSTS, INITIAL_JOB_APPLICATIONS, INITIAL_DIRECT_MESSAGES, EXAMINATIONS, EXAMINATION_ATTEMPTS, BOOK_PURCHASES, WITHDRAWALS, BOOKMARKS } from './constants';
import { runAiTutor, generateQuizOptions } from './services/geminiService';
import { UserCircleIcon, BellIcon, ArrowLeftIcon, SearchIcon, VideoCameraIcon, ClockIcon, SendIcon, SparklesIcon, WalletIcon, CheckCircleIcon, CheckBadgeIcon, AirtelMoneyIcon, TnmMpambaIcon, NationalBankIcon, StarIcon, UserGroupIcon, ChartBarIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon, CloseIcon, LockClosedIcon, Cog6ToothIcon, CameraIcon, BookOpenIcon, DocumentCheckIcon, CloudArrowUpIcon, TrashIcon, RssIcon, XCircleIcon, ComputerDesktopIcon, MicrophoneIcon, VideoCameraSlashIcon, ChevronUpIcon, WifiIcon, EyeIcon, BuildingStorefrontIcon, LightBulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, GoogleIcon, EnvelopeIcon, UserIcon, PhoneIcon, DocumentTextIcon, HomeIcon, AcademicCapIcon, ShoppingCartIcon, SmartLearnLogo, BriefcaseIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon, BanknotesIcon, CalendarDaysIcon, TrophyIcon, ClipboardDocumentCheckIcon, BookmarkIcon } from './components/icons';
import { Button, Modal, ToastContainer } from './components/common';

const APP_OWNER_ID = 'user-7'; // Mr. Nyalugwe's ID

// ----- Helper Functions -----
type SubscriptionStatus = 'Active' | 'Expired' | 'None';
const getSubscriptionStatus = (user: User | null): { status: SubscriptionStatus; plan: SubscriptionPlan } => {
    if (!user || !user.subscription || user.subscription.plan === SubscriptionPlan.None) {
        return { status: 'None', plan: SubscriptionPlan.None };
    }
    // This is the core access control logic. It checks if the current time
    // has passed the subscription's pre-calculated end date.
    // This works for all plans (Daily, Weekly, Monthly) as the endDate is set correctly upon purchase.
    if (user.subscription.endDate.getTime() < Date.now()) {
        return { status: 'Expired', plan: user.subscription.plan };
    }
    return { status: 'Active', plan: user.subscription.plan };
};

// ----- Reusable Components -----

const InputWithIcon: React.FC<{ icon: React.ReactNode, type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean }> = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input {...props} className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
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
                    <p className="text-teal-100 mb-8">Please select your role to continue.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <RoleCard icon={<AcademicCapIcon className="w-12 h-12 text-white"/>} title={Role.Student} description="Access courses, lessons, and your AI tutor." onClick={() => {setAuthRole(Role.Student); setMode('login')}} gradient="bg-gradient-to-br from-teal-500 to-cyan-600" />
                        <RoleCard icon={<BriefcaseIcon className="w-12 h-12 text-white"/>} title={Role.Teacher} description="Manage your content and engage with students." onClick={() => {setAuthRole(Role.Teacher); setMode('login')}} gradient="bg-gradient-to-br from-emerald-500 to-green-600" />
                        <RoleCard icon={<ShieldCheckIcon className="w-12 h-12 text-white"/>} title={Role.Owner} description="Oversee the entire platform and its users." onClick={() => setAuthRole(Role.Owner)} gradient="bg-gradient-to-br from-slate-600 to-gray-700" />
                    </div>
                    <div className="mt-10 pt-6 border-t border-teal-100/20">
                        <h3 className="text-xl font-semibold text-white">Join Our Team</h3>
                        <p className="text-teal-100 mt-2 mb-4">Are you a passionate educator? We're looking for talented teachers to join our platform.</p>
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
          <button onClick={onBack} className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400" aria-label="Go back">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        ) : (
            <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400">SmartLearn</h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onToggleNotifications} className="text-slate-500 dark:text-slate-400 relative" aria-label="View notifications">
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>}
        </button>
        {showSettingsButton && (
             <button onClick={onNavigateToSettings} className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400" aria-label="Open settings">
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
        <img className={`h-32 w-full object-cover ${isLocked ? 'grayscale' : ''}`} src={subject.coverPhoto} alt={subject.name} />
        <div className={`p-4 flex flex-col flex-grow`}>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{subject.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subject.teacherName}</p>
            <div className="mt-auto pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{isLocked ? 0 : progress}%</span>
                </div>
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${isLocked ? 0 : progress}%` }}></div>
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

const PaymentPrompt: React.FC<{ onPay: () => void, status: SubscriptionStatus, plan: SubscriptionPlan }> = ({ onPay, status, plan }) => {
    let title = "Access Restricted";
    let message = "Please select a plan to unlock all subjects, videos, and live classes.";
    let buttonText = "Pay Now";

    if (status === 'Expired') {
        title = `Access Expired`;
        message = `Your ${plan.toLowerCase()} access has expired. Please pay again to continue learning.`;
        buttonText = "Renew Payment";
    }

    return (
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg shadow-md mb-6" role="alert">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm mb-3">{message}</p>
            <Button onClick={onPay} className="!bg-yellow-500 !text-white !py-2 !px-4 text-sm hover:!bg-yellow-600 focus:!ring-yellow-300">
                {buttonText}
            </Button>
        </div>
    );
};

const StudentDashboard: React.FC<{ 
    user: User;
    subscriptionStatus: SubscriptionStatus;
    subscriptionPlan: SubscriptionPlan;
    allSubjects: Subject[];
    allLessons: VideoLesson[];
    allLiveClasses: LiveClass[];
    lessonCompletions: LessonCompletion[];
    bookmarks: LessonBookmark[];
    activeLiveClass: LiveClass | null;
    onSelectSubject: (subject: Subject) => void; 
    onJoinLiveClass: (liveClass: LiveClass) => void;
    onPayForLessons: () => void;
    onWatchLesson: (lesson: VideoLesson) => void;
    onNavigateToBookstore: () => void;
}> = ({ user, subscriptionStatus, subscriptionPlan, allSubjects, allLessons, allLiveClasses, lessonCompletions, bookmarks, activeLiveClass, onSelectSubject, onJoinLiveClass, onPayForLessons, onWatchLesson, onNavigateToBookstore }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const recentLessons = allLessons.slice(0, 4);
    const hasActiveSubscription = subscriptionStatus === 'Active';

    const filteredSubjects = allSubjects.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const userBookmarks = bookmarks.filter(b => b.studentId === user.id);

    return (
        <div className="p-4 space-y-6 animate-fade-in-up">
            {activeLiveClass && hasActiveSubscription && (
                <div 
                    onClick={() => onJoinLiveClass(activeLiveClass)}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between hover-lift cursor-pointer animate-fade-in-up mb-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </div>
                        <div>
                            <h3 className="font-bold">LIVE NOW: {activeLiveClass.title}</h3>
                            <p className="text-sm text-red-100">{activeLiveClass.teacherName} is live for {allSubjects.find(s => s.id === activeLiveClass.subjectId)?.name}</p>
                        </div>
                    </div>
                    <Button className="py-2 px-4 text-sm !bg-white !text-red-600 hover:!bg-red-50 focus:!ring-red-200">Join Now</Button>
                </div>
            )}
            
            <div className="relative">
                <input 
                    type="text"
                    placeholder="Search subjects or teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            
            {!hasActiveSubscription && <PaymentPrompt onPay={onPayForLessons} status={subscriptionStatus} plan={subscriptionPlan} />}

            {hasActiveSubscription ? (
                <>
                    {userBookmarks.length > 0 && (
                        <div>
                             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Bookmarked Lessons</h2>
                             <div className="space-y-3">
                                {userBookmarks.map(bookmark => {
                                    const lesson = allLessons.find(l => l.id === bookmark.lessonId);
                                    const subject = lesson ? allSubjects.find(s => s.id === lesson.subjectId) : null;
                                    if (!lesson || !subject) return null;

                                    return (
                                        <div key={bookmark.lessonId} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex items-center gap-4 shadow-sm hover-lift">
                                            <img src={lesson.thumbnail} alt={lesson.title} className="w-20 h-12 object-cover rounded-md" />
                                            <div className="flex-grow">
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{lesson.title}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{subject.name}</p>
                                            </div>
                                            <Button onClick={() => onWatchLesson(lesson)} className="!py-2 !px-4 text-sm">Watch Now</Button>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    )}
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
                                                <div className="bg-teal-500 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
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
                            {allLiveClasses.filter(lc => lc.startTime > new Date()).map(lc => (
                                <div key={lc.id} className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between hover-lift">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-full"><RssIcon className="w-5 h-5"/></div>
                                        <div>
                                            <h3 className="font-bold">{lc.title}</h3>
                                            <p className="text-sm text-teal-200">{lc.teacherName} - {lc.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => onJoinLiveClass(lc)} className="py-2 px-4 text-sm !bg-white !text-teal-600 hover:!bg-teal-50 focus:!ring-teal-200">Join</Button>
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
                                isLocked={!hasActiveSubscription}
                                isLive={isLiveNow}
                            />
                        );
                    })}
                </div>
            </div>

            {hasActiveSubscription && (
                <div className="mt-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Resources</h2>
                    <div
                        onClick={onNavigateToBookstore}
                        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center gap-4 cursor-pointer hover-lift"
                    >
                        <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-full">
                            <BuildingStorefrontIcon className="w-8 h-8 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">SmartLearn Bookstore</h3>
                            <p className="text-slate-500 dark:text-slate-400">Browse and purchase official textbooks.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActivityFeed: React.FC<{ logs: ActivityLog[], users: User[] }> = ({ logs, users }) => {
    const getLogIcon = (type: ActivityType) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case ActivityType.NewEnrollment: return <UserGroupIcon className={`${iconClass} text-teal-500`} />;
            case ActivityType.QuizSubmission: return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
            case ActivityType.NewLesson: return <VideoCameraIcon className={`${iconClass} text-purple-500`} />;
            case ActivityType.LiveClassStarted:
            case ActivityType.LiveReminder: return <RssIcon className={`${iconClass} text-red-500`} />;
            case ActivityType.PaymentReceived: return <WalletIcon className={`${iconClass} text-indigo-500`} />;
            case ActivityType.NewApplication: return <BriefcaseIcon className={`${iconClass} text-blue-500`} />;
            default: return null;
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h2>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3 max-h-60 overflow-y-auto">
                {logs.length > 0 ? logs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(log => (
                     <div key={log.id} className="flex items-start gap-3">
                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1">
                            {getLogIcon(log.type)}
                        </div>
                        <div>
                            <p className="text-sm text-slate-700 dark:text-slate-200">{log.text}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                     </div>
                )) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">No recent activity.</p>
                )}
            </div>
        </div>
    );
};

// ----- New Components for different views -----

const TeacherDashboard: React.FC<{ 
    user: User; 
    subjects: Subject[];
    onStartLiveClass: (subjectId: string, title: string) => void;
}> = ({ user, subjects, onStartLiveClass }) => {
    const [liveClassModalOpen, setLiveClassModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [liveClassTitle, setLiveClassTitle] = useState('');

    const handleOpenModal = (subject: Subject) => {
        setSelectedSubject(subject);
        setLiveClassTitle('');
        setLiveClassModalOpen(true);
    };

    const handleCloseModal = () => {
        setLiveClassModalOpen(false);
        setSelectedSubject(null);
    };

    const handleConfirmStartLive = () => {
        if (selectedSubject && liveClassTitle) {
            onStartLiveClass(selectedSubject.id, liveClassTitle);
            handleCloseModal();
        }
    };

    return (
        <div className="p-4 text-slate-800 dark:text-slate-100 animate-fade-in-up space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome, {user.name}. Manage your subjects and go live here.</p>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-4">Your Subjects</h2>
                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map(subject => (
                            <div key={subject.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{subject.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{subject.description}</p>
                                </div>
                                <Button onClick={() => handleOpenModal(subject)} className="!py-2 !px-4 text-sm !bg-red-500 hover:!bg-red-600 focus:!ring-red-300 flex items-center gap-2">
                                    <RssIcon className="w-5 h-5"/>
                                    Go Live
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">You are not assigned to any subjects yet.</p>
                )}
            </div>
            
            {selectedSubject && (
                <Modal isOpen={liveClassModalOpen} onClose={handleCloseModal} title={`Start Live Class for ${selectedSubject.name}`}>
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">Enter a title for your live session. All students will be notified when you go live.</p>
                        <InputWithIcon 
                            icon={<PencilIcon className="w-5 h-5 text-slate-400" />}
                            type="text"
                            placeholder="e.g., Chapter 5 Review Session"
                            value={liveClassTitle}
                            onChange={(e) => setLiveClassTitle(e.target.value)}
                        />
                        <Button onClick={handleConfirmStartLive} className="w-full" disabled={!liveClassTitle}>
                            Confirm & Go Live
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const OwnerDashboard: React.FC<{
    user: User;
    allUsers: User[];
    payments: PaymentRecord[];
    withdrawals: Withdrawal[];
    messages: DirectMessage[];
    applications: JobApplication[];
    activityLogs: ActivityLog[];
    onUpdateApplicationStatus: (id: string, status: ApplicationStatus) => void;
}> = ({ user, allUsers, payments, withdrawals, messages, applications, activityLogs, onUpdateApplicationStatus }) => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const tabs = ['Dashboard', 'Students', 'Teachers', 'Finance', 'Communication', 'Applications'];

    const TabButton: React.FC<{ name: string }> = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 font-semibold transition-colors duration-200 whitespace-nowrap ${
                activeTab === name
                    ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
            {name}
        </button>
    );

    const DashboardTabContent = () => {
         const students = allUsers.filter(u => u.role === Role.Student);
         return (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={<UsersIcon />} title="Total Students" value={students.length} gradient="text-white bg-gradient-to-br from-blue-500 to-indigo-600" />
                    <StatCard icon={<BanknotesIcon />} title="Total Revenue" value={`K${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`} gradient="text-white bg-gradient-to-br from-green-500 to-emerald-600" />
                    <StatCard icon={<RssIcon />} title="Active Plans" value={students.filter(s => getSubscriptionStatus(s).status === 'Active').length} gradient="text-white bg-gradient-to-br from-purple-500 to-violet-600" />
                </div>
                <ActivityFeed logs={activityLogs} users={allUsers} />
            </div>
         );
    };
    
    const UserTable: React.FC<{users: User[], title: string}> = ({users, title}) => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-left bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b dark:border-slate-700">
                                <td className="p-2 font-medium">{u.name}</td>
                                <td className="p-2 text-slate-500">{u.email}</td>
                                <td className="p-2"><Button variant="secondary" className="!py-1 !px-3 text-xs">View</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const FinanceTabContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {payments.sort((a,b) => b.date.getTime() - a.date.getTime()).map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                            <div><p className="font-semibold">{p.studentName}</p><p className="text-xs text-slate-500">{p.date.toLocaleString()}</p></div>
                            <div className="text-right"><p className="font-bold text-green-600 dark:text-green-400">+K{p.amount.toLocaleString()}</p><p className="text-xs text-slate-500">{p.plan} via {p.method}</p></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Withdrawal Requests</h2>
                 <div className="space-y-3 max-h-96 overflow-y-auto">
                    {withdrawals.map(w => (
                        <div key={w.id} className="flex justify-between items-center">
                            <div><p className="font-semibold">{w.method} - {w.phoneNumber}</p><p className="text-xs text-slate-500">{w.timestamp.toLocaleString()}</p></div>
                            <div className="text-right"><p className="font-bold text-red-600 dark:text-red-400">-K{w.amount.toLocaleString()}</p><Button variant="secondary" className="!py-1 !px-3 text-xs mt-1">Process</Button></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const CommunicationTabContent = () => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Direct Messaging</h2>
            <p className="text-slate-500">Chat functionality is under development.</p>
            {/* A simple representation of messages */}
            <div className="mt-4 space-y-2 border-t pt-4 dark:border-slate-700">
                {messages.map(msg => {
                    const sender = allUsers.find(u => u.id === msg.senderId);
                    return (
                        <div key={msg.id} className="text-sm">
                           <span className="font-bold">{sender?.name || 'Unknown'}: </span>
                           <span>{msg.text}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
    
    const ApplicationsTabContent = () => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Teacher Job Applications</h2>
            <div className="space-y-4">
                {applications.map(app => (
                    <div key={app.id} className="border dark:border-slate-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{app.name} <span className="text-sm font-normal text-slate-500"> - {app.email}</span></p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Subjects: {app.subjects.join(', ')}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${app.status === ApplicationStatus.Pending ? 'bg-yellow-100 text-yellow-800' : app.status === ApplicationStatus.Approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{app.status}</span>
                        </div>
                        {app.status === ApplicationStatus.Pending && (
                             <div className="flex gap-2 mt-2">
                                <Button onClick={() => onUpdateApplicationStatus(app.id, ApplicationStatus.Approved)} className="!py-1 !px-3 text-xs !bg-green-500 hover:!bg-green-600">Approve</Button>
                                <Button onClick={() => onUpdateApplicationStatus(app.id, ApplicationStatus.Rejected)} variant="secondary" className="!py-1 !px-3 text-xs !bg-red-500 text-white hover:!bg-red-600">Reject</Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardTabContent />;
            case 'Students': return <UserTable users={allUsers.filter(u => u.role === Role.Student)} title="All Students" />;
            case 'Teachers': return <UserTable users={allUsers.filter(u => u.role === Role.Teacher)} title="All Teachers" />;
            case 'Finance': return <FinanceTabContent />;
            case 'Communication': return <CommunicationTabContent />;
            case 'Applications': return <ApplicationsTabContent />;
            default: return null;
        }
    };
    
    return (
        <div className="p-4 text-slate-800 dark:text-slate-100 animate-fade-in-up space-y-6">
             <div>
                <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome, {user.name}. Oversee platform activity here.</p>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <div className="flex -mb-px">
                    {tabs.map(tab => <TabButton key={tab} name={tab} />)}
                </div>
            </div>
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
}

const VideoPlayerModal: React.FC<{ lesson: VideoLesson, subject: Subject, onClose: () => void }> = ({ lesson, subject, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={lesson.title}>
            <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <PlayIcon className="w-16 h-16 text-white/70 cursor-pointer" />
                    </div>
                </div>
                <div>
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{subject.name}</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{lesson.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lesson.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' : lesson.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{lesson.difficulty}</span>
                    <span><ClockIcon className="w-4 h-4 inline mr-1" />{lesson.duration}</span>
                </div>
            </div>
        </Modal>
    );
};

const SubjectDetailView: React.FC<{
    user: User;
    subject: Subject;
    lessons: VideoLesson[];
    completions: LessonCompletion[];
    bookmarks: LessonBookmark[];
    onWatchLesson: (lesson: VideoLesson) => void;
    onToggleBookmark: (lessonId: string) => void;
}> = ({ user, subject, lessons, completions, bookmarks, onWatchLesson, onToggleBookmark }) => {
    const isLessonCompleted = (lessonId: string) => {
        return completions.some(c => c.studentId === user.id && c.lessonId === lessonId);
    };

    const isBookmarked = (lessonId: string) => {
        return bookmarks.some(b => b.studentId === user.id && b.lessonId === lessonId);
    }

    return (
        <div className="animate-fade-in-up">
            <div className="h-40 relative">
                <img src={subject.coverPhoto} alt={subject.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
                     <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
                     <p className="text-slate-200">Taught by {subject.teacherName}</p>
                </div>
            </div>
            <div className="p-4 space-y-4">
                <p className="text-slate-600 dark:text-slate-300">{subject.description}</p>
                
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-t pt-4 border-slate-200 dark:border-slate-700">Lessons</h2>
                <div className="space-y-3">
                    {lessons.map(lesson => (
                        <div key={lesson.id} onClick={() => onWatchLesson(lesson)} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex items-center gap-4 shadow-sm cursor-pointer hover-lift">
                            <div className="flex-shrink-0">
                                {isLessonCompleted(lesson.id) ? 
                                    <CheckCircleIcon className="w-8 h-8 text-green-500" /> :
                                    <PlayIcon className="w-8 h-8 text-teal-500" />
                                }
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{lesson.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.duration}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(lesson.id); }} className="p-2 text-slate-400 hover:text-yellow-500">
                                <BookmarkIcon filled={isBookmarked(lesson.id)} className="w-6 h-6" />
                            </button>
                             <img src={lesson.thumbnail} alt={lesson.title} className="w-24 h-14 object-cover rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelectPlan: (plan: SubscriptionPlan) => void; }> = ({ isOpen, onClose, onSelectPlan }) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const plans = [
        { plan: SubscriptionPlan.Daily, title: 'Daily Class', price: 2000, duration: '24 hours', features: ['Watch lesson videos', 'Read materials'] },
        { plan: SubscriptionPlan.Weekly, title: 'Weekly Class', price: 10000, duration: '7 days', features: ['Watch lesson videos', 'Read materials'] },
        { plan: SubscriptionPlan.Monthly, title: 'Monthly Class', price: 35000, duration: '30 days', features: ['All videos & materials', 'Join live classes', 'Download materials'] },
    ];

    const handlePay = () => {
        if (selectedPlan) {
            onSelectPlan(selectedPlan);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Plan">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {plans.map(p => (
                        <div key={p.plan} onClick={() => setSelectedPlan(p.plan)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPlan === p.plan ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-slate-300 dark:border-slate-600 hover:border-teal-400'}`}>
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{p.title}</h3>
                                <p className="font-bold text-teal-600 dark:text-teal-400">K{p.price.toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{p.duration} access</p>
                            <ul className="text-xs list-disc list-inside mt-2 text-slate-600 dark:text-slate-300">
                                {p.features.map(f => <li key={f}>{f}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
                {selectedPlan && (
                    <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                        <h4 className="font-semibold">Select Payment Method</h4>
                        {/* This is a simulated payment form */}
                        <div className="space-y-2">
                             <InputWithIcon icon={<PhoneIcon className="w-5 h-5 text-slate-400" />} type="tel" placeholder="Phone Number" value="" onChange={() => {}} />
                             <InputWithIcon icon={<LockClosedIcon className="w-5 h-5 text-slate-400" />} type="password" placeholder="PIN" value="" onChange={() => {}} />
                        </div>
                        <Button onClick={handlePay} className="w-full">Pay K{plans.find(p=>p.plan===selectedPlan)?.price.toLocaleString()}</Button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

const LiveStreamTopUpModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; liveClass: LiveClass }> = ({ isOpen, onClose, onConfirm, liveClass }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Join Live Class: ${liveClass.title}`}>
        <div className="text-center space-y-4">
            <RssIcon className="w-16 h-16 mx-auto text-red-500" />
            <p className="text-slate-600 dark:text-slate-300">
                Live streaming is free for monthly members. To join this session, a one-time payment is required.
            </p>
            <Button onClick={onConfirm} className="w-full !bg-red-500 hover:!bg-red-600 focus:!ring-red-300">
                Pay K500 to Join Now
            </Button>
        </div>
    </Modal>
)

const BookCard: React.FC<{ book: Book; onBuy: () => void; isOwned: boolean; }> = ({ book, onBuy, isOwned }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col">
        <img className="h-56 w-full object-cover" src={book.coverPhoto} alt={book.title} />
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{book.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">by {book.author}</p>
            <div className="mt-auto pt-3 flex justify-between items-center">
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">K{book.price.toLocaleString()}</p>
                <Button
                    onClick={onBuy}
                    disabled={isOwned}
                    className={isOwned ? '!bg-green-600 !cursor-not-allowed' : ''}
                    variant={isOwned ? 'primary' : 'secondary'}
                >
                    {isOwned ? 'Owned' : 'Buy Now'}
                </Button>
            </div>
        </div>
    </div>
);

const BookStoreView: React.FC<{
    books: Book[];
    purchases: BookPurchase[];
    studentId: string;
    onBuyBook: (book: Book) => void;
}> = ({ books, purchases, studentId, onBuyBook }) => {
    const ownedBookIds = new Set(purchases.filter(p => p.studentId === studentId).map(p => p.bookId));

    return (
        <div className="p-4 animate-fade-in-up space-y-4">
             <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">SmartLearn Bookstore</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Get recommended textbooks and study guides.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map(book => (
                    <BookCard
                        key={book.id}
                        book={book}
                        onBuy={() => onBuyBook(book)}
                        isOwned={ownedBookIds.has(book.id)}
                    />
                ))}
            </div>
        </div>
    );
};

const JobApplicationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string, email: string, phoneNumber: string, subjects: string, cvFile: { name: string, dataUrl: string } | null }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [subjects, setSubjects] = useState('');
    const [cvFile, setCvFile] = useState<{ name: string, dataUrl: string } | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File size cannot exceed 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCvFile({
                    name: file.name,
                    dataUrl: reader.result as string,
                });
                setError('');
            };
            reader.onerror = () => {
                setError('Failed to read file.');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !phoneNumber || !subjects || !cvFile) {
            setError('Please fill all fields and upload your CV.');
            return;
        }
        onSubmit({ name, email, phoneNumber, subjects, cvFile });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Apply for a Teaching Position">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">We're excited to have you on board! Please fill out the form below.</p>
                <InputWithIcon icon={<UserIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                <InputWithIcon icon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                <InputWithIcon icon={<PhoneIcon className="w-5 h-5 text-slate-400" />} type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                <InputWithIcon icon={<BookOpenIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Subjects (comma-separated)" value={subjects} onChange={e => setSubjects(e.target.value)} required />
                <div>
                    <label htmlFor="cv-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload CV</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                <label htmlFor="cv-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                                    <span>Upload a file</span>
                                    <input id="cv-upload" name="cv-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 5MB</p>
                        </div>
                    </div>
                     {cvFile && (
                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                           <DocumentCheckIcon className="w-5 h-5 text-green-500" />
                           <span>{cvFile.name}</span>
                        </div>
                     )}
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">Submit Application</Button>
            </form>
        </Modal>
    );
};

export const App: React.FC = () => {
    // Data state
    const [users, setUsers] = useState<User[]>(USERS);
    const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS);
    const [lessons, setLessons] = useState<VideoLesson[]>(VIDEO_LESSONS);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>(INITIAL_LIVE_CLASSES);
    const [payments, setPayments] = useState<PaymentRecord[]>(PAYMENT_HISTORY);
    const [completions, setCompletions] = useState<LessonCompletion[]>(LESSON_COMPLETIONS);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(ACTIVITY_LOGS);
    const [bookPurchases, setBookPurchases] = useState<BookPurchase[]>(BOOK_PURCHASES);
    const [bookmarks, setBookmarks] = useState<LessonBookmark[]>(BOOKMARKS);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(WITHDRAWALS);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>(INITIAL_DIRECT_MESSAGES);
    const [jobApplications, setJobApplications] = useState<JobApplication[]>(INITIAL_JOB_APPLICATIONS);

    // Auth and UI state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<VideoLesson | null>(null);
    const [pendingLiveClass, setPendingLiveClass] = useState<LiveClass | null>(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isApplicationModalOpen, setApplicationModalOpen] = useState(false);
    
    // Derived state
    const { status: subscriptionStatus, plan: subscriptionPlan } = getSubscriptionStatus(currentUser);
    const unreadNotifications = activityLogs.filter(log => !log.read).length;

    // Toast handlers
    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Auth handlers
    const handleLogin = (email: string, pass: string, role: Role) => {
        const user = users.find(u => u.email === email && u.password === pass && u.role === role);
        if (user) {
            setCurrentUser(user);
            addToast(`Welcome back, ${user.name}!`, 'success');
        } else {
            addToast('Invalid credentials or role.', 'error');
        }
    };
    const handleSignUp = (name: string, email: string, pass: string, role: Role) => {
        if (users.some(u => u.email === email)) {
            addToast('An account with this email already exists.', 'error');
            return;
        }
        const newUser: User = { 
            id: `user-${Date.now()}`, name, email, password: pass, role, 
            profilePicture: `https://i.pravatar.cc/150?u=${Date.now()}`,
            subscription: { plan: SubscriptionPlan.None, startDate: new Date(), endDate: new Date() }
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        addToast('Account created successfully!', 'success');
    };
    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('dashboard');
        setSelectedSubject(null);
        addToast("You've been logged out.", 'info');
    };

    const handleUpdateApplicationStatus = (id: string, status: ApplicationStatus) => {
        setJobApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
        const app = jobApplications.find(a => a.id === id);
        if (app) {
            addToast(`Application from ${app.name} has been ${status.toLowerCase()}.`, 'success');
        }
    };
    
    const handleJobApplicationSubmit = (formData: { name: string, email: string, phoneNumber: string, subjects: string, cvFile: { name: string, dataUrl: string } | null }) => {
        const newApplication: JobApplication = {
            id: `app-${Date.now()}`,
            name: formData.name,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
            status: ApplicationStatus.Pending,
            timestamp: new Date(),
            cvFileName: formData.cvFile?.name,
            cvDataUrl: formData.cvFile?.dataUrl,
        };
    
        setJobApplications(prev => [newApplication, ...prev]);
    
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: APP_OWNER_ID,
            type: ActivityType.NewApplication,
            text: `New job application received from ${formData.name}.`,
            timestamp: new Date(),
            read: false,
        };
    
        setActivityLogs(prev => [newLog, ...prev]);
        setApplicationModalOpen(false);
        addToast('Your application has been submitted successfully!', 'success');
    };

    const handleBack = () => {
        if (selectedSubject || currentView === 'bookstore') {
            setSelectedSubject(null);
            setCurrentView('dashboard');
        } else {
            setCurrentView('dashboard');
        }
    };

    const handleSelectSubject = (subject: Subject) => {
        if (subscriptionStatus !== 'Active') {
            addToast("Please subscribe to access subjects.", "info");
            setPaymentModalOpen(true);
            return;
        }
        setSelectedSubject(subject);
        setCurrentView('subject');
    }

    const handleJoinLiveClass = (liveClass: LiveClass) => {
        if (!currentUser) return;

        if (subscriptionPlan === SubscriptionPlan.Monthly) {
            addToast(`Joining live class: ${liveClass.title}`, 'success');
            // Navigate to live class view (not implemented)
        } else if (subscriptionStatus === 'Active') {
            // Daily or Weekly plan, needs top-up
            setPendingLiveClass(liveClass);
        } else {
            addToast("You need an active subscription to join live classes.", "error");
            setPaymentModalOpen(true);
        }
    };

    const handleStartLiveClass = (subjectId: string, title: string) => {
        if (!currentUser || currentUser.role !== Role.Teacher) return;
    
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) {
            addToast("Could not find the selected subject.", "error");
            return;
        }
    
        const newLiveClass: LiveClass = {
            id: `lc-${Date.now()}`,
            subjectId,
            title,
            teacherName: currentUser.name,
            teacherId: currentUser.id,
            startTime: new Date(), // Starts now
        };
    
        setLiveClasses(prev => [newLiveClass, ...prev]);
    
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: 'all', // Broadcast to everyone
            type: ActivityType.LiveClassStarted,
            text: `${currentUser.name} has started a live class for ${subject.name}: "${title}". Join now!`,
            timestamp: new Date(),
            read: false,
        };
        setActivityLogs(prev => [newLog, ...prev]);
    
        addToast(`Live class "${title}" has started!`, 'success');
    };

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        if (!currentUser) return;

        const prices = { [SubscriptionPlan.Daily]: 2000, [SubscriptionPlan.Weekly]: 10000, [SubscriptionPlan.Monthly]: 35000 };
        const durations = { [SubscriptionPlan.Daily]: 1, [SubscriptionPlan.Weekly]: 7, [SubscriptionPlan.Monthly]: 30 };
        
        const amount = prices[plan];
        const durationDays = durations[plan];

        const newSubscription: StudentSubscription = {
            plan,
            startDate: new Date(),
            // The endDate is calculated from the startDate (Date.now()) and the plan's duration.
            // For a Daily plan, this sets the expiration to exactly 24 hours from purchase.
            endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        };
        
        const updatedUser = { ...currentUser, subscription: newSubscription };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));

        // Create payment record and admin notification
        const newPayment: PaymentRecord = { id: `pay-${Date.now()}`, studentId: currentUser.id, studentName: currentUser.name, date: new Date(), amount, method: 'Airtel Money', plan };
        setPayments(prev => [newPayment, ...prev]);
        
        const newLog: ActivityLog = { id: `log-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.PaymentReceived, text: `Payment from ${currentUser.name} (K${amount}) for ${plan} plan.`, timestamp: new Date(), read: false };
        setActivityLogs(prev => [newLog, ...prev]);
        
        setPaymentModalOpen(false);
        addToast(`Payment successful! You now have ${plan} access.`, 'success');
    }

    const handleLiveStreamTopUp = () => {
        if (!currentUser || !pendingLiveClass) return;

        const updatedSubscription = { ...currentUser.subscription, liveClassAccessId: pendingLiveClass.id };
        const updatedUser = { ...currentUser, subscription: updatedSubscription as StudentSubscription };
        
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));

        const newPayment: PaymentRecord = { id: `pay-${Date.now()}`, studentId: currentUser.id, studentName: currentUser.name, date: new Date(), amount: 500, method: 'TNM Mpamba', plan: 'LiveStreamTopUp' };
        setPayments(prev => [newPayment, ...prev]);

        const newLog: ActivityLog = { id: `log-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.PaymentReceived, text: `${currentUser.name} paid K500 to join live class "${pendingLiveClass.title}".`, timestamp: new Date(), read: false };
        setActivityLogs(prev => [newLog, ...prev]);

        addToast(`Payment successful! Joining ${pendingLiveClass.title}...`, 'success');
        setPendingLiveClass(null);
    };

    const handleBuyBook = (book: Book) => {
        if (!currentUser) return;

        if (bookPurchases.some(p => p.studentId === currentUser.id && p.bookId === book.id)) {
            addToast("You already own this book.", "info");
            return;
        }

        // Add to purchases
        const newPurchase: BookPurchase = { studentId: currentUser.id, bookId: book.id };
        setBookPurchases(prev => [...prev, newPurchase]);

        // Create payment record
        const newPayment: PaymentRecord = {
            id: `pay-book-${Date.now()}`,
            studentId: currentUser.id,
            studentName: currentUser.name,
            date: new Date(),
            amount: book.price,
            method: 'Airtel Money', // Placeholder
            plan: 'BookPurchase'
        };
        setPayments(prev => [newPayment, ...prev]);

        // Create admin notification
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: APP_OWNER_ID,
            type: ActivityType.NewBookPurchase,
            text: `${currentUser.name} purchased the book: "${book.title}".`,
            timestamp: new Date(),
            read: false,
        };
        setActivityLogs(prev => [newLog, ...prev]);

        addToast(`Successfully purchased "${book.title}"!`, 'success');
    };

    const handleToggleBookmark = (lessonId: string) => {
        if (!currentUser) return;

        const existingBookmarkIndex = bookmarks.findIndex(b => b.studentId === currentUser.id && b.lessonId === lessonId);
        
        if (existingBookmarkIndex > -1) {
            // Remove bookmark
            setBookmarks(prev => prev.filter((_, index) => index !== existingBookmarkIndex));
            addToast('Bookmark removed.', 'info');
        } else {
            // Add bookmark
            const newBookmark: LessonBookmark = { studentId: currentUser.id, lessonId };
            setBookmarks(prev => [...prev, newBookmark]);
            addToast('Lesson bookmarked!', 'success');
        }
    };

    if (!currentUser) {
        return (
            <>
                <ToastContainer toasts={toasts} onDismiss={dismissToast} />
                <JobApplicationModal 
                    isOpen={isApplicationModalOpen}
                    onClose={() => setApplicationModalOpen(false)}
                    onSubmit={handleJobApplicationSubmit}
                />
                <AuthScreen 
                    onLogin={handleLogin} 
                    onSignUp={handleSignUp}
                    onGoogleAuth={() => addToast('Google Auth is not implemented yet.', 'info')}
                    onApply={() => setApplicationModalOpen(true)}
                />
            </>
        );
    }
    
    const renderContent = () => {
        switch (currentUser.role) {
            case Role.Student:
                const now = new Date();
                const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                const recentLiveClass = liveClasses
                    .filter(lc => lc.startTime > anHourAgo)
                    .sort((a,b) => b.startTime.getTime() - a.startTime.getTime())[0] || null;

                if (currentView === 'bookstore') {
                    return <BookStoreView
                        books={BOOKS}
                        purchases={bookPurchases}
                        studentId={currentUser.id}
                        onBuyBook={handleBuyBook}
                    />;
                }
                if (currentView === 'subject' && selectedSubject) {
                    const subjectLessons = lessons.filter(l => l.subjectId === selectedSubject.id);
                    return <SubjectDetailView 
                                user={currentUser} 
                                subject={selectedSubject} 
                                lessons={subjectLessons} 
                                completions={completions}
                                bookmarks={bookmarks}
                                onWatchLesson={setSelectedLesson}
                                onToggleBookmark={handleToggleBookmark}
                            />
                }
                return <StudentDashboard 
                            user={currentUser} 
                            subscriptionStatus={subscriptionStatus}
                            subscriptionPlan={subscriptionPlan}
                            allSubjects={subjects}
                            allLessons={lessons}
                            allLiveClasses={liveClasses}
                            lessonCompletions={completions}
                            bookmarks={bookmarks}
                            activeLiveClass={recentLiveClass}
                            onSelectSubject={handleSelectSubject}
                            onJoinLiveClass={handleJoinLiveClass}
                            onPayForLessons={() => setPaymentModalOpen(true)}
                            onWatchLesson={setSelectedLesson}
                            onNavigateToBookstore={() => setCurrentView('bookstore')}
                        />;
            case Role.Teacher:
                const teacherSubjects = subjects.filter(s => s.teacherId === currentUser.id);
                return <TeacherDashboard 
                    user={currentUser} 
                    subjects={teacherSubjects}
                    onStartLiveClass={handleStartLiveClass}
                />;
            case Role.Owner:
                return <OwnerDashboard 
                            user={currentUser} 
                            allUsers={users} 
                            payments={payments}
                            withdrawals={withdrawals}
                            messages={directMessages}
                            applications={jobApplications}
                            activityLogs={activityLogs}
                            onUpdateApplicationStatus={handleUpdateApplicationStatus}
                        />;
            default:
                return <div>Error: Unknown user role.</div>
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onSelectPlan={handleSelectPlan} />

            {pendingLiveClass && (
                <LiveStreamTopUpModal 
                    isOpen={true} 
                    onClose={() => setPendingLiveClass(null)} 
                    onConfirm={handleLiveStreamTopUp}
                    liveClass={pendingLiveClass}
                />
            )}

            {selectedLesson && selectedSubject && (
                <VideoPlayerModal 
                    lesson={selectedLesson} 
                    subject={subjects.find(s => s.id === selectedLesson.subjectId)!}
                    onClose={() => setSelectedLesson(null)} 
                />
            )}
            
            <Header
                user={currentUser}
                onLogout={handleLogout}
                currentView={currentView}
                onBack={handleBack}
                onNavigateToSettings={() => addToast('Settings page coming soon.', 'info')}
                unreadCount={unreadNotifications}
                onToggleNotifications={() => addToast('Notifications panel coming soon.', 'info')}
            />
            <main className="max-w-4xl mx-auto pb-16">
                {renderContent()}
            </main>
        </div>
    );
};