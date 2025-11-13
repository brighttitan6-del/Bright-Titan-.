import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Subject, VideoLesson, LiveClass, ChatMessage, PaymentRecord, QuizAttempt, Enrollment, LessonCompletion, ActivityType, ActivityLog, Book, SubjectPost, PostType, JobApplication, ApplicationStatus, BookPurchase, ToastMessage, Withdrawal, DirectMessage, Examination, ExaminationAttempt, ExaminationQuestion, Quiz, SubscriptionPlan, StudentSubscription, LessonBookmark, BookReading } from './types';
import { USERS, SUBJECTS, VIDEO_LESSONS, INITIAL_LIVE_CLASSES, PAYMENT_HISTORY, QUIZZES, QUIZ_ATTEMPTS, ENROLLMENTS, LESSON_COMPLETIONS, ACTIVITY_LOGS, BOOKS, SUBJECT_POSTS, INITIAL_JOB_APPLICATIONS, INITIAL_DIRECT_MESSAGES, EXAMINATIONS, EXAMINATION_ATTEMPTS, BOOK_PURCHASES, WITHDRAWALS, BOOKMARKS, BOOK_READINGS } from './constants';
import { runAiTutor, generateQuizOptions } from './services/geminiService';
// FIX: Added InformationCircleIcon to the import to fix a missing component error.
import { UserCircleIcon, BellIcon, ArrowLeftIcon, SearchIcon, VideoCameraIcon, ClockIcon, SendIcon, SparklesIcon, WalletIcon, CheckCircleIcon, CheckBadgeIcon, AirtelMoneyIcon, TnmMpambaIcon, NationalBankIcon, StarIcon, UserGroupIcon, ChartBarIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon, CloseIcon, LockClosedIcon, Cog6ToothIcon, CameraIcon, BookOpenIcon, DocumentCheckIcon, CloudArrowUpIcon, TrashIcon, RssIcon, XCircleIcon, ComputerDesktopIcon, MicrophoneIcon, VideoCameraSlashIcon, ChevronUpIcon, WifiIcon, EyeIcon, BuildingStorefrontIcon, LightBulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, GoogleIcon, EnvelopeIcon, UserIcon, PhoneIcon, DocumentTextIcon, HomeIcon, AcademicCapIcon, ShoppingCartIcon, SmartLearnLogo, BriefcaseIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon, BanknotesIcon, CalendarDaysIcon, TrophyIcon, ClipboardDocumentCheckIcon, BookmarkIcon, InformationCircleIcon } from './components/icons';
import { Button, Modal, ToastContainer, PaymentModal } from './components/common';

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

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

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
         <button onClick={onNavigateToSettings} className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400" aria-label="Open settings">
            <Cog6ToothIcon className="w-6 h-6" />
        </button>
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
    onNavigate: (view: string) => void;
}> = ({ user, subscriptionStatus, subscriptionPlan, allSubjects, allLessons, allLiveClasses, lessonCompletions, bookmarks, activeLiveClass, onSelectSubject, onJoinLiveClass, onPayForLessons, onWatchLesson, onNavigate }) => {
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

            {userBookmarks.length > 0 && (
                <div>
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Bookmarked Lessons</h2>
                     <div className="space-y-3">
                        {userBookmarks.map(bookmark => {
                            const lesson = allLessons.find(l => l.id === bookmark.lessonId);
                            const subject = lesson ? allSubjects.find(s => s.id === lesson.subjectId) : null;
                            if (!lesson || !subject) return null;

                            return (
                                <div key={bookmark.lessonId} className={`bg-white dark:bg-slate-800 p-3 rounded-lg flex items-center gap-4 shadow-sm hover-lift transition-all ${!hasActiveSubscription ? 'opacity-70' : ''}`}>
                                    <img src={lesson.thumbnail} alt={lesson.title} className={`w-20 h-12 object-cover rounded-md ${!hasActiveSubscription ? 'grayscale' : ''}`} />
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{lesson.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{subject.name}</p>
                                    </div>
                                    {hasActiveSubscription ? (
                                         <Button onClick={() => onWatchLesson(lesson)} className="!py-2 !px-4 text-sm">Watch Now</Button>
                                    ) : (
                                         <Button onClick={onPayForLessons} className="!py-2 !px-4 text-sm !bg-yellow-500 !text-white hover:!bg-yellow-600 focus:!ring-yellow-300">Renew to Watch</Button>
                                    )}
                                </div>
                            )
                        })}
                     </div>
                </div>
            )}

            {hasActiveSubscription ? (
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
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => onNavigate('bookstore')}
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center gap-4 cursor-pointer hover-lift"
                        >
                            <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-full">
                                <BuildingStorefrontIcon className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Bookstore</h3>
                                <p className="text-slate-500 dark:text-slate-400">Browse and purchase textbooks.</p>
                            </div>
                        </div>
                         <div
                            onClick={() => onNavigate('examinations')}
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center gap-4 cursor-pointer hover-lift"
                        >
                            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-full">
                                <TrophyIcon className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Examinations</h3>
                                <p className="text-slate-500 dark:text-slate-400">Test your knowledge.</p>
                            </div>
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
            case ActivityType.NewBookPurchase: return <ShoppingCartIcon className={`${iconClass} text-orange-500`} />;
            case ActivityType.NewBookReading: return <BookOpenIcon className={`${iconClass} text-cyan-500`} />;
            case ActivityType.NewExamination: return <TrophyIcon className={`${iconClass} text-indigo-500`} />;
            case ActivityType.ExaminationSubmission: return <ClipboardDocumentCheckIcon className={`${iconClass} text-green-500`} />;
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

const UploadLessonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<VideoLesson, 'id' | 'thumbnail'>) => void;
    teacherSubjects: Subject[];
}> = ({ isOpen, onClose, onSubmit, teacherSubjects }) => {
    const [subjectId, setSubjectId] = useState(teacherSubjects[0]?.id || '');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectId || !title || !description || !duration) {
            setError('Please fill all required fields.');
            return;
        }
        onSubmit({ subjectId, title, description, duration, difficulty });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload New Video Lesson">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                    <select id="subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                        {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <InputWithIcon icon={<PencilIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Lesson Title" value={title} onChange={e => setTitle(e.target.value)} required />
                <div>
                     <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md" placeholder="A brief description of the lesson content."></textarea>
                </div>
                 <InputWithIcon icon={<ClockIcon className="w-5 h-5 text-slate-400" />} type="text" placeholder="Duration (e.g., 15:30)" value={duration} onChange={e => setDuration(e.target.value)} required />
                 <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</label>
                    <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                    </select>
                </div>
                 {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">Upload Lesson</Button>
            </form>
        </Modal>
    );
};

const CreatePostModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { subjectId: string; type: PostType; text: string }) => void;
    teacherSubjects: Subject[];
}> = ({ isOpen, onClose, onSubmit, teacherSubjects }) => {
    const [subjectId, setSubjectId] = useState(teacherSubjects[0]?.id || '');
    const [type, setType] = useState<PostType>(PostType.Announcement);
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectId || !text) {
            setError('Please select a subject and write your post.');
            return;
        }
        onSubmit({ subjectId, type, text });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Post">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="post-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                    <select id="post-subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                        {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="post-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Post Type</label>
                    <select id="post-type" value={type} onChange={e => setType(e.target.value as PostType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                        <option value={PostType.Announcement}>Announcement</option>
                        <option value={PostType.Question}>Question</option>
                    </select>
                </div>
                 <div>
                     <label htmlFor="post-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                    <textarea id="post-text" value={text} onChange={e => setText(e.target.value)} rows={4} className="mt-1 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md" placeholder="Write your announcement or question here..."></textarea>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">Create Post</Button>
            </form>
        </Modal>
    );
}

const TeacherDashboard: React.FC<{
    user: User;
    subjects: Subject[];
    lessons: VideoLesson[];
    onStartLiveClass: (subjectId: string, title: string) => void;
    onUploadLesson: (data: Omit<VideoLesson, 'id' | 'thumbnail'>) => void;
    onCreatePost: (data: { subjectId: string; type: PostType; text: string }) => void;
}> = ({ user, subjects, lessons, onStartLiveClass, onUploadLesson, onCreatePost }) => {
    const [liveClassModalOpen, setLiveClassModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [postModalOpen, setPostModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [liveClassTitle, setLiveClassTitle] = useState('');

    const teacherLessonIds = new Set(subjects.map(s => s.id));
    const myLessons = lessons.filter(l => teacherLessonIds.has(l.subjectId));

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
                <p className="text-slate-500 dark:text-slate-400">Welcome, {user.name}. Manage your subjects and content here.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
                <h2 className="text-xl font-bold">Quick Actions</h2>
                <Button onClick={() => setUploadModalOpen(true)} variant="secondary" className="flex items-center gap-2">
                    <CloudArrowUpIcon className="w-5 h-5"/> Upload Lesson
                </Button>
                <Button onClick={() => setPostModalOpen(true)} variant="secondary" className="flex items-center gap-2">
                    <PencilIcon className="w-5 h-5"/> Create Post
                </Button>
            </div>
            
            <UploadLessonModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onSubmit={onUploadLesson} teacherSubjects={subjects} />
            <CreatePostModal isOpen={postModalOpen} onClose={() => setPostModalOpen(false)} onSubmit={onCreatePost} teacherSubjects={subjects} />

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
            
             <div>
                <h2 className="text-xl font-bold mb-4">My Uploaded Lessons</h2>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3">
                    {myLessons.length > 0 ? myLessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center gap-4">
                            <img src={lesson.thumbnail} alt={lesson.title} className="w-20 h-12 object-cover rounded" />
                            <div>
                                <h4 className="font-semibold">{lesson.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{subjects.find(s=>s.id === lesson.subjectId)?.name} - {lesson.duration}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-slate-500 dark:text-slate-400">You haven't uploaded any lessons yet.</p>
                    )}
                </div>
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
    onInitiateDeposit: (amount: number, method: 'Airtel Money' | 'TNM Mpamba') => void;
}> = ({ user, allUsers, payments, withdrawals, messages, applications, activityLogs, onUpdateApplicationStatus, onInitiateDeposit }) => {
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
    
    const FinanceTabContent = () => {
        const [depositAmount, setDepositAmount] = useState('');
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        const availableBalance = totalRevenue - totalWithdrawals;

        const handleDeposit = (method: 'Airtel Money' | 'TNM Mpamba') => {
            const amount = parseFloat(depositAmount);
            if (!amount || amount <= 0) {
                alert("Please enter a valid amount.");
                return;
            }
            if (amount > availableBalance) {
                alert("Deposit amount cannot exceed available balance.");
                return;
            }
            onInitiateDeposit(amount, method);
            setDepositAmount('');
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Platform Balance & Deposits</h2>
                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                        <div><p className="text-slate-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">K{totalRevenue.toLocaleString()}</p></div>
                        <div><p className="text-slate-500">Total Withdrawals</p><p className="text-2xl font-bold text-red-600">K{totalWithdrawals.toLocaleString()}</p></div>
                        <div><p className="text-slate-500">Available Balance</p><p className="text-2xl font-bold text-blue-600">K{availableBalance.toLocaleString()}</p></div>
                    </div>
                     <div className="border-t dark:border-slate-700 pt-4">
                        <h3 className="font-semibold mb-2">Initiate Deposit</h3>
                         <div className="flex items-center gap-4">
                            <InputWithIcon icon={<BanknotesIcon className="w-5 h-5 text-slate-400" />} type="number" placeholder="Amount to deposit" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                             <Button onClick={() => handleDeposit('Airtel Money')} disabled={!depositAmount || parseFloat(depositAmount) > availableBalance}>To Airtel</Button>
                             <Button onClick={() => handleDeposit('TNM Mpamba')} disabled={!depositAmount || parseFloat(depositAmount) > availableBalance}>To TNM</Button>
                        </div>
                    </div>
                </div>

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
                    <h2 className="text-xl font-bold mb-4">Withdrawal History</h2>
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {withdrawals.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(w => (
                            <div key={w.id} className="flex justify-between items-center">
                                <div><p className="font-semibold">{w.method} - {w.phoneNumber}</p><p className="text-xs text-slate-500">{w.timestamp.toLocaleString()}</p></div>
                                <div className="text-right"><p className="font-bold text-red-600 dark:text-red-400">-K{w.amount.toLocaleString()}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };
    
    const handleProgress = () => {
        if (videoRef.current) {
            const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(percentage);
        }
    };

    const handleScrub = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (videoRef.current) {
            const scrubTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * videoRef.current.duration;
            videoRef.current.currentTime = scrubTime;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };
    
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <Modal isOpen={true} onClose={onClose} title={lesson.title}>
            <div className="space-y-4">
                 <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                    <video ref={videoRef} className="w-full h-full" onTimeUpdate={handleProgress} onEnded={() => setIsPlaying(false)}>
                        <source src={`https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        <div></div> {/* Top spacer */}
                        <div className="flex items-center justify-center">
                            <button onClick={togglePlay} className="text-white p-4 bg-black/50 rounded-full">
                                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                            </button>
                        </div>
                        <div>
                             <div className="w-full bg-white/20 h-1.5 rounded-full cursor-pointer" onClick={handleScrub}>
                                <div className="bg-red-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <button onClick={togglePlay} className="text-white">{isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}</button>
                                    <button onClick={toggleMute} className="text-white">{isMuted ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}</button>
                                </div>
                                <button onClick={toggleFullscreen} className="text-white">{isFullscreen ? <ArrowsPointingInIcon className="w-6 h-6" /> : <ArrowsPointingOutIcon className="w-6 h-6" />}</button>
                            </div>
                        </div>
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
    posts: SubjectPost[];
    completions: LessonCompletion[];
    bookmarks: LessonBookmark[];
    onWatchLesson: (lesson: VideoLesson) => void;
    onToggleBookmark: (lessonId: string) => void;
}> = ({ user, subject, lessons, posts, completions, bookmarks, onWatchLesson, onToggleBookmark }) => {
    const [activeTab, setActiveTab] = useState('Lessons');

    const isLessonCompleted = (lessonId: string) => {
        return completions.some(c => c.studentId === user.id && c.lessonId === lessonId);
    };

    const isBookmarked = (lessonId: string) => {
        return bookmarks.some(b => b.studentId === user.id && b.lessonId === lessonId);
    }
    
    const TabButton: React.FC<{ name: string }> = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-3 font-semibold text-center transition-colors duration-200 ${
                activeTab === name
                    ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
            {name}
        </button>
    );
    
    const PostCard: React.FC<{ post: SubjectPost }> = ({ post }) => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
                <img src={post.teacherProfilePic || 'https://i.pravatar.cc/150'} alt={post.teacherName} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{post.teacherName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(post.timestamp).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${post.type === PostType.Announcement ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{post.type}</span>
                    </div>
                    <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{post.text}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up">
            <div className="h-40 relative">
                <img src={subject.coverPhoto} alt={subject.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
                     <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
                     <p className="text-slate-200">Taught by {subject.teacherName}</p>
                </div>
            </div>
             <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 backdrop-blur-sm sticky top-[73px] z-10">
                <div className="flex -mb-px">
                    <TabButton name="Lessons" />
                    <TabButton name="Posts" />
                </div>
            </div>
            <div className="p-4 space-y-4">
                {activeTab === 'Lessons' && (
                    <>
                        <p className="text-slate-600 dark:text-slate-300">{subject.description}</p>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-t pt-4 border-slate-200 dark:border-slate-700">All Lessons</h2>
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
                    </>
                )}
                 {activeTab === 'Posts' && (
                    <div className="space-y-4">
                       {posts.length > 0 ? posts.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(post => <PostCard key={post.id} post={post} />) : <p className="text-center text-slate-500 dark:text-slate-400 py-8">No posts from the teacher yet.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const LiveStreamTopUpModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; liveClass: LiveClass }> = ({ isOpen, onClose, onConfirm, liveClass }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Join Live Class: ${liveClass.title}`}>
        <div className="text-center space-y-4">
            <RssIcon className="w-16 h-16 mx-auto text-red-500" />
            <p className="text-slate-600 dark:text-slate-300">
                Live streaming is free for monthly members. To join this session, a one-time payment of K500 is required.
            </p>
            <Button onClick={onConfirm} className="w-full !bg-red-500 hover:!bg-red-600 focus:!ring-red-300">
                Confirm and Pay K500
            </Button>
        </div>
    </Modal>
)

const BookCard: React.FC<{ book: Book; onBuy: () => void; onRead: () => void; isOwned: boolean; }> = ({ book, onBuy, onRead, isOwned }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col">
        <img className="h-56 w-full object-cover" src={book.coverPhoto} alt={book.title} />
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{book.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">by {book.author}</p>
            <div className="mt-auto pt-3 flex justify-between items-center">
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">K{book.price.toLocaleString()}</p>
                <Button
                    onClick={isOwned ? onRead : onBuy}
                    className={isOwned ? '!bg-green-600' : ''}
                    variant={isOwned ? 'primary' : 'secondary'}
                >
                    {isOwned ? 'Read Book' : 'Buy Now'}
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
    onReadBook: (book: Book) => void;
}> = ({ books, purchases, studentId, onBuyBook, onReadBook }) => {
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
                        onRead={() => onReadBook(book)}
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
    const [bookReadings, setBookReadings] = useState<BookReading[]>(BOOK_READINGS);
    const [bookmarks, setBookmarks] = useState<LessonBookmark[]>(BOOKMARKS);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(WITHDRAWALS);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>(INITIAL_DIRECT_MESSAGES);
    const [jobApplications, setJobApplications] = useState<JobApplication[]>(INITIAL_JOB_APPLICATIONS);
    const [subjectPosts, setSubjectPosts] = useState<SubjectPost[]>(SUBJECT_POSTS);
    const [examinationAttempts, setExaminationAttempts] = useState<ExaminationAttempt[]>(EXAMINATION_ATTEMPTS);


    // Auth and UI state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<VideoLesson | null>(null);
    const [pendingLiveClass, setPendingLiveClass] = useState<LiveClass | null>(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isApplicationModalOpen, setApplicationModalOpen] = useState(false);
    const [pendingSignUp, setPendingSignUp] = useState<{ name: string; email: string; pass: string; } | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isNotificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
    const [selectedBookToRead, setSelectedBookToRead] = useState<Book | null>(null);
    const [confirmationState, setConfirmationState] = useState<{
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        confirmText: string;
    } | null>(null);
    const [activeExamState, setActiveExamState] = useState<{
        exam: Examination;
        answers: Record<string, string>;
        currentQuestionIndex: number;
        timeLeft: number;
    } | null>(null);
    const [lastExamResult, setLastExamResult] = useState<ExaminationAttempt | null>(null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    
    // Derived state
    const { status: subscriptionStatus, plan: subscriptionPlan } = getSubscriptionStatus(currentUser);
    const unreadNotifications = activityLogs.filter(log => !log.read).length;
    
    // Refs
    const notificationsRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Get audio element on mount
    useEffect(() => {
        audioRef.current = document.getElementById('background-music') as HTMLAudioElement;
    }, []);

    // Theme management
    useEffect(() => {
        const savedTheme = localStorage.getItem('smartlearn-theme') as 'light' | 'dark' | null;
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (userPrefersDark) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('smartlearn-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('smartlearn-theme', 'light');
        }
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleMusic = () => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
            setIsMusicPlaying(!isMusicPlaying);
        }
    };

    // Close notifications panel on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationsRef]);


    // Open payment modal when a sign-up is pending
    useEffect(() => {
        if (pendingSignUp) {
            setPaymentModalOpen(true);
        }
    }, [pendingSignUp]);

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
        if (role === Role.Student) {
            // Store registration data and trigger payment flow
            setPendingSignUp({ name, email, pass });
        } else {
            addToast('Sign-up is currently only available for students.', 'info');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('dashboard');
        setSelectedSubject(null);
        setSettingsModalOpen(false);
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
        if (activeExamState) return; // Cannot go back during an exam
        
        if (lastExamResult) {
            setLastExamResult(null);
            setCurrentView('examinations');
        } else if (selectedBookToRead) {
            setSelectedBookToRead(null);
        } else if (selectedSubject || currentView !== 'dashboard') {
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
        const prices = { [SubscriptionPlan.Daily]: 2000, [SubscriptionPlan.Weekly]: 10000, [SubscriptionPlan.Monthly]: 35000, [SubscriptionPlan.None]: 0 };
        const amount = prices[plan];

        setConfirmationState({
            title: 'Confirm Subscription',
            message: <p>Proceed to pay K{amount.toLocaleString()} for the {plan} plan?</p>,
            onConfirm: () => executePayment(plan),
            confirmText: 'Confirm & Pay'
        });
    };

    const executePayment = (plan: SubscriptionPlan) => {
        const prices = { [SubscriptionPlan.Daily]: 2000, [SubscriptionPlan.Weekly]: 10000, [SubscriptionPlan.Monthly]: 35000, [SubscriptionPlan.None]: 0 };
        const durations = { [SubscriptionPlan.Daily]: 1, [SubscriptionPlan.Weekly]: 7, [SubscriptionPlan.Monthly]: 30, [SubscriptionPlan.None]: 0 };
        
        const amount = prices[plan];
        const durationDays = durations[plan];

        const newSubscription: StudentSubscription = {
            plan,
            startDate: new Date(),
            endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        };
        
        if (pendingSignUp) {
            const { name, email, pass } = pendingSignUp;
            const newUser: User = { 
                id: `user-${Date.now()}`, name, email, password: pass, role: Role.Student, 
                profilePicture: `https://i.pravatar.cc/150?u=${Date.now()}`,
                subscription: newSubscription
            };
            setUsers(prev => [...prev, newUser]);
            setCurrentUser(newUser);

            const newPayment: PaymentRecord = { id: `pay-${Date.now()}`, studentId: newUser.id, studentName: newUser.name, date: new Date(), amount, method: 'Airtel Money', plan };
            setPayments(prev => [newPayment, ...prev]);
            
            const paymentLog: ActivityLog = { id: `log-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.PaymentReceived, text: `Payment from ${newUser.name} (K${amount}) for ${plan} plan.`, timestamp: new Date(), read: false };
            const enrollmentLog: ActivityLog = { id: `log-enroll-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.NewEnrollment, text: `${newUser.name} created an account and subscribed.`, timestamp: new Date(), read: false };
            setActivityLogs(prev => [paymentLog, enrollmentLog, ...prev]);
            
            setPaymentModalOpen(false);
            setPendingSignUp(null);
            addToast(`Welcome, ${name}! Your account is created with a ${plan} plan.`, 'success');

        } else if (currentUser) {
            const updatedUser = { ...currentUser, subscription: newSubscription };
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));

            const newPayment: PaymentRecord = { id: `pay-${Date.now()}`, studentId: currentUser.id, studentName: currentUser.name, date: new Date(), amount, method: 'Airtel Money', plan };
            setPayments(prev => [newPayment, ...prev]);
            
            const newLog: ActivityLog = { id: `log-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.PaymentReceived, text: `Payment from ${currentUser.name} (K${amount}) for ${plan} plan.`, timestamp: new Date(), read: false };
            setActivityLogs(prev => [newLog, ...prev]);
            
            setPaymentModalOpen(false);
            addToast(`Payment successful! You now have ${plan} access.`, 'success');
        }
        setConfirmationState(null);
    }


    const handleLiveStreamTopUp = () => {
        if (!currentUser || !pendingLiveClass) return;

        setConfirmationState({
            title: 'Confirm Live Class Fee',
            message: <p>Confirm payment of K500 to join the live class: "{pendingLiveClass.title}"?</p>,
            onConfirm: () => {
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
                setConfirmationState(null);
            },
            confirmText: 'Confirm & Pay K500'
        })
    };
    
    const handleBuyBook = (book: Book) => {
        if (!currentUser) return;
        if (bookPurchases.some(p => p.studentId === currentUser.id && p.bookId === book.id)) {
            addToast("You already own this book.", "info");
            return;
        }
        setConfirmationState({
            title: 'Confirm Purchase',
            message: <p>Are you sure you want to buy "{book.title}" for K{book.price.toLocaleString()}?</p>,
            onConfirm: () => handleConfirmBookPurchase(book),
            confirmText: 'Confirm & Pay'
        });
    };

    const handleConfirmBookPurchase = (book: Book) => {
        if (!currentUser) return;

        const newPurchase: BookPurchase = { studentId: currentUser.id, bookId: book.id };
        setBookPurchases(prev => [...prev, newPurchase]);

        const newPayment: PaymentRecord = {
            id: `pay-book-${Date.now()}`, studentId: currentUser.id, studentName: currentUser.name,
            date: new Date(), amount: book.price, method: 'Airtel Money', plan: 'BookPurchase'
        };
        setPayments(prev => [newPayment, ...prev]);

        const newLog: ActivityLog = {
            id: `log-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.NewBookPurchase,
            text: `${currentUser.name} purchased the book: "${book.title}".`, timestamp: new Date(), read: false,
        };
        setActivityLogs(prev => [newLog, ...prev]);

        addToast(`Successfully purchased "${book.title}"!`, 'success');
        setConfirmationState(null);
    };

    const handleOpenBookReader = (book: Book) => {
        if (!currentUser) return;
        setSelectedBookToRead(book);

        const hasReadBefore = bookReadings.some(r => r.studentId === currentUser.id && r.bookId === book.id);
        
        const newReading: BookReading = { studentId: currentUser.id, bookId: book.id, lastReadAt: new Date() };
        setBookReadings(prev => [...prev.filter(r => !(r.studentId === currentUser.id && r.bookId === book.id)), newReading]);

        if (!hasReadBefore) {
            const newLog: ActivityLog = {
                id: `log-${Date.now()}`, userId: APP_OWNER_ID, type: ActivityType.NewBookReading,
                text: `${currentUser.name} started reading "${book.title}".`, timestamp: new Date(), read: false,
            };
            setActivityLogs(prev => [newLog, ...prev]);
        }
    };


    const handleToggleBookmark = (lessonId: string) => {
        if (!currentUser) return;

        const existingBookmarkIndex = bookmarks.findIndex(b => b.studentId === currentUser.id && b.lessonId === lessonId);
        
        if (existingBookmarkIndex > -1) {
            setBookmarks(prev => prev.filter((_, index) => index !== existingBookmarkIndex));
            addToast('Bookmark removed.', 'info');
        } else {
            const newBookmark: LessonBookmark = { studentId: currentUser.id, lessonId };
            setBookmarks(prev => [...prev, newBookmark]);
            addToast('Lesson bookmarked!', 'success');
        }
    };

     const handleUploadLesson = (data: Omit<VideoLesson, 'id' | 'thumbnail'>) => {
        if (!currentUser || currentUser.role !== Role.Teacher) return;

        const newLesson: VideoLesson = {
            ...data,
            id: `vl-${Date.now()}`,
            thumbnail: `https://picsum.photos/seed/vl-${Date.now()}/400/225`,
        };

        setLessons(prev => [newLesson, ...prev]);

        const subjectName = subjects.find(s => s.id === data.subjectId)?.name || 'a subject';
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: APP_OWNER_ID,
            type: ActivityType.NewLesson,
            text: `${currentUser.name} uploaded a new lesson for ${subjectName}: "${data.title}".`,
            timestamp: new Date(),
            read: false,
        };
        setActivityLogs(prev => [newLog, ...prev]);
        addToast("New lesson uploaded successfully!", 'success');
    };

    const handleCreatePost = (data: { subjectId: string; type: PostType; text: string }) => {
        if (!currentUser || currentUser.role !== Role.Teacher) return;
        
        const newPost: SubjectPost = {
            id: `post-${Date.now()}`,
            subjectId: data.subjectId,
            teacherId: currentUser.id,
            teacherName: currentUser.name,
            teacherProfilePic: currentUser.profilePicture,
            type: data.type,
            text: data.text,
            timestamp: new Date(),
        };

        setSubjectPosts(prev => [newPost, ...prev]);
        addToast("Post created successfully!", 'success');
    };

    const handleMarkNotificationsRead = () => {
        setActivityLogs(prev => prev.map(log => ({ ...log, read: true })));
        addToast("Notifications marked as read.", "info");
    };

    const handleInitiateDeposit = (amount: number, method: 'Airtel Money' | 'TNM Mpamba') => {
        const phoneNumbers = {
            'Airtel Money': '0997822385',
            'TNM Mpamba': '0888072607'
        }
        const newWithdrawal: Withdrawal = {
            id: `wd-${Date.now()}`,
            amount,
            method,
            phoneNumber: phoneNumbers[method],
            timestamp: new Date()
        };
        setWithdrawals(prev => [newWithdrawal, ...prev]);
        addToast(`Deposit of K${amount.toLocaleString()} to ${method} initiated.`, 'success');
    }

    // Examination Handlers
    const handleStartExam = (exam: Examination) => {
        setActiveExamState({
            exam,
            answers: {},
            currentQuestionIndex: 0,
            timeLeft: exam.durationMinutes * 60,
        });
        setCurrentView('takeExam');
    };

    const handleSelectExamAnswer = (questionId: string, answer: string) => {
        if (!activeExamState) return;
        setActiveExamState(prev => prev ? ({
            ...prev,
            answers: {
                ...prev.answers,
                [questionId]: answer
            }
        }) : null);
    };

    const handleSubmitExam = () => {
        if (!activeExamState || !currentUser) return;

        let score = 0;
        const scoresBySubject: Record<string, { score: number; total: number }> = {};
        
        activeExamState.exam.questions.forEach(q => {
            const subjectId = q.subjectId;
            if (!scoresBySubject[subjectId]) {
                scoresBySubject[subjectId] = { score: 0, total: 0 };
            }
            scoresBySubject[subjectId].total++;

            if (activeExamState.answers[q.id] === q.correctAnswer) {
                score++;
                scoresBySubject[subjectId].score++;
            }
        });

        const newAttempt: ExaminationAttempt = {
            id: `exatt-${Date.now()}`,
            studentId: currentUser.id,
            studentName: currentUser.name,
            examinationId: activeExamState.exam.id,
            examinationTitle: activeExamState.exam.title,
            answers: activeExamState.answers,
            score,
            totalQuestions: activeExamState.exam.questions.length,
            scoresBySubject,
            completedAt: new Date()
        };

        setExaminationAttempts(prev => [newAttempt, ...prev]);
        setLastExamResult(newAttempt);
        setActiveExamState(null);
        setCurrentView('examResults');
        
        const newLog: ActivityLog = {
            id: `log-exam-${Date.now()}`,
            userId: APP_OWNER_ID,
            type: ActivityType.ExaminationSubmission,
            text: `${currentUser.name} scored ${score}/${newAttempt.totalQuestions} on "${newAttempt.examinationTitle}".`,
            timestamp: new Date(),
            read: false,
        };
        setActivityLogs(prev => [newLog, ...prev]);
    };

    // ----- Modals and Panels -----
    const ConfirmationModal: React.FC = () => {
        if (!confirmationState) return null;
        return (
            <Modal isOpen={true} onClose={() => setConfirmationState(null)} title={confirmationState.title}>
                <div className="space-y-4">
                    <div className="text-slate-600 dark:text-slate-300">{confirmationState.message}</div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setConfirmationState(null)}>Cancel</Button>
                        <Button onClick={confirmationState.onConfirm}>{confirmationState.confirmText}</Button>
                    </div>
                </div>
            </Modal>
        );
    }
    
    const BookReaderModal: React.FC = () => {
        if (!selectedBookToRead) return null;
        return (
            <Modal isOpen={true} onClose={() => setSelectedBookToRead(null)} title={selectedBookToRead.title}>
                 <div className="space-y-4">
                    <img src={selectedBookToRead.coverPhoto} alt={selectedBookToRead.title} className="w-full h-64 object-contain rounded-lg" />
                    <p className="text-center font-semibold text-slate-700 dark:text-slate-200">by {selectedBookToRead.author}</p>
                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                        <p>The content of the book would be displayed here for in-app reading.</p>
                        <p className="mt-2 text-sm italic">This feature prevents downloading and ensures content security.</p>
                    </div>
                 </div>
            </Modal>
        );
    }

    const SettingsModal: React.FC = () => {
        if (!isSettingsModalOpen || !currentUser) return null;
        const {status, plan} = getSubscriptionStatus(currentUser);

        return (
             <Modal isOpen={true} onClose={() => setSettingsModalOpen(false)} title="Settings">
                 <div className="space-y-6">
                     <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Profile</h3>
                        <div className="flex items-center gap-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <img src={currentUser.profilePicture} alt={currentUser.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{currentUser.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                            </div>
                        </div>
                     </div>

                    {currentUser.role === Role.Student && (
                        <div>
                             <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">My Subscription</h3>
                              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <p>Status: <span className={`font-semibold ${status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{status}</span></p>
                                <p>Plan: <span className="font-semibold">{plan}</span></p>
                                {status === 'Active' && <p className="text-sm text-slate-500 dark:text-slate-400">Expires: {currentUser.subscription?.endDate.toLocaleDateString()}</p>}
                                <Button onClick={() => { setSettingsModalOpen(false); setPaymentModalOpen(true); }} className="mt-3 w-full text-sm !py-2">Manage Subscription</Button>
                              </div>
                        </div>
                    )}

                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Appearance & Sound</h3>
                         <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg divide-y dark:divide-slate-600">
                             <div className="flex items-center justify-between py-2">
                                <span>Theme</span>
                                <div className="flex items-center gap-2">
                                    <span>Light</span>
                                    <button onClick={handleThemeToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-teal-600' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span>Dark</span>
                                </div>
                             </div>
                             <div className="flex items-center justify-between py-2">
                                <span>Background Music</span>
                                <button onClick={toggleMusic} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                                    {isMusicPlaying ? <SpeakerWaveIcon className="w-6 h-6 text-teal-500"/> : <SpeakerXMarkIcon className="w-6 h-6 text-slate-500"/>}
                                </button>
                             </div>
                         </div>
                    </div>
                     <Button variant="secondary" onClick={handleLogout} className="w-full">Logout</Button>
                 </div>
             </Modal>
        );
    }
    
    const NotificationsPanel: React.FC = () => {
        if (!isNotificationsPanelOpen) return null;
        
        const getLogIcon = (type: ActivityType) => {
            const iconClass = "w-5 h-5";
            switch (type) {
                case ActivityType.NewEnrollment: return <UserGroupIcon className={`${iconClass} text-teal-500`} />;
                case ActivityType.QuizSubmission: return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
                case ActivityType.NewLesson: return <VideoCameraIcon className={`${iconClass} text-purple-500`} />;
                case ActivityType.LiveReminder: return <RssIcon className={`${iconClass} text-red-500`} />;
                case ActivityType.PaymentReceived: return <WalletIcon className={`${iconClass} text-indigo-500`} />;
                default: return <InformationCircleIcon className={`${iconClass} text-slate-500`} />;
            }
        };

        return (
            <div ref={notificationsRef} className="absolute top-16 right-4 w-80 max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 z-30 animate-fade-in-up">
                <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                    <button onClick={handleMarkNotificationsRead} className="text-sm text-teal-600 hover:underline disabled:text-slate-400" disabled={unreadNotifications === 0}>
                        Mark all as read
                    </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {activityLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(log => (
                        <div key={log.id} className={`p-3 border-b dark:border-slate-700 flex items-start gap-3 ${!log.read ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}>
                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1">{getLogIcon(log.type)}</div>
                            <div>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{log.text}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ----- Examination Views -----
    const ExaminationsView: React.FC = () => {
        if (!currentUser) return null;
        const myAttempts = examinationAttempts.filter(a => a.studentId === currentUser.id);

        return (
            <div className="p-4 animate-fade-in-up space-y-6">
                 <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Examination Center</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Test your knowledge and review your results.</p>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Available Examinations</h2>
                    {EXAMINATIONS.map(exam => (
                        <div key={exam.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">{exam.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{exam.questions.length} Questions | {exam.durationMinutes} Minutes</p>
                            </div>
                            <Button onClick={() => handleStartExam(exam)}>Start Exam</Button>
                        </div>
                    ))}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">My Past Attempts</h2>
                    {myAttempts.length > 0 ? (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3">
                            {myAttempts.sort((a,b) => b.completedAt.getTime() - a.completedAt.getTime()).map(attempt => {
                                const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                                return (
                                    <div key={attempt.id} className="flex justify-between items-center border-b dark:border-slate-700 pb-2 last:border-b-0">
                                        <div>
                                            <p className="font-semibold">{attempt.examinationTitle}</p>
                                            <p className="text-xs text-slate-500">{attempt.completedAt.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-right">{percentage}%</p>
                                            <p className="text-sm text-slate-500 text-right">{attempt.score}/{attempt.totalQuestions} Correct</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                         <p className="text-center text-slate-500 dark:text-slate-400 py-4">You have not attempted any examinations yet.</p>
                    )}
                </div>
            </div>
        );
    };

    const TakeExaminationView: React.FC = () => {
        // FIX: Changed NodeJS.Timeout to number for browser compatibility.
        const timerRef = useRef<number>();

        useEffect(() => {
            timerRef.current = setInterval(() => {
                setActiveExamState(prev => {
                    if (prev && prev.timeLeft > 0) {
                        return { ...prev, timeLeft: prev.timeLeft - 1 };
                    }
                    if (prev && prev.timeLeft <= 1) {
                        handleSubmitExam();
                    }
                    return prev;
                });
            }, 1000);
            return () => clearInterval(timerRef.current);
        }, []);
        
        if (!activeExamState) return <div>Error starting exam.</div>;

        const { exam, answers, currentQuestionIndex, timeLeft } = activeExamState;
        const currentQuestion = exam.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
        
        const goToQuestion = (index: number) => {
            setActiveExamState(prev => prev ? ({ ...prev, currentQuestionIndex: index }) : null);
        };

        return (
            <div className="p-4 animate-fade-in-up">
                 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-700 pb-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{exam.title}</h1>
                            <p className="text-slate-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-500 text-sm">Time Left</p>
                            <p className="text-2xl font-bold text-red-500">{formatTime(timeLeft)}</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-6">
                        <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">{currentQuestion.questionText}</h2>
                        <div className="space-y-3">
                            {currentQuestion.options.map(option => (
                                <label key={option} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${answers[currentQuestion.id] === option ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-slate-300 dark:border-slate-600 hover:border-teal-400'}`}>
                                    <input type="radio" name={currentQuestion.id} value={option} checked={answers[currentQuestion.id] === option} onChange={() => handleSelectExamAnswer(currentQuestion.id, option)} className="w-4 h-4 text-teal-600 bg-slate-100 border-slate-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600" />
                                    <span className="ml-3 text-slate-700 dark:text-slate-200">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-8">
                        <Button variant="secondary" onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>Previous</Button>
                        {currentQuestionIndex === exam.questions.length - 1 ? (
                             <Button onClick={handleSubmitExam} className="!bg-green-600 hover:!bg-green-700 focus:!ring-green-300">Submit Exam</Button>
                        ) : (
                             <Button onClick={() => goToQuestion(currentQuestionIndex + 1)}>Next</Button>
                        )}
                    </div>
                 </div>
            </div>
        );
    };

    const ExaminationResultsView: React.FC = () => {
        if (!lastExamResult) return <div>No result to display.</div>;
        const { score, totalQuestions, scoresBySubject } = lastExamResult;
        const percentage = Math.round((score / totalQuestions) * 100);
        const passed = percentage >= 50;
        
        return (
             <div className="p-4 animate-fade-in-up">
                 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Examination Results</h1>
                    <p className="text-slate-500 mb-6">{lastExamResult.examinationTitle}</p>

                    <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center ${passed ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        <div className={`w-28 h-28 rounded-full bg-white dark:bg-slate-800 flex flex-col items-center justify-center`}>
                           <span className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</span>
                           <span className="text-sm text-slate-500">{score}/{totalQuestions} Correct</span>
                        </div>
                    </div>

                     <p className={`text-2xl font-bold mt-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {passed ? 'Congratulations, you passed!' : 'Better luck next time.'}
                     </p>
                     
                     <div className="text-left mt-8">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Score by Subject</h3>
                        <div className="space-y-3">
                            {/* FIX: Cast result to the correct type to resolve property access errors. */}
                            {Object.entries(scoresBySubject).map(([subjectId, result]) => {
                                const subject = subjects.find(s => s.id === subjectId);
                                const subjectResult = result as { score: number; total: number };
                                const subjectPercentage = Math.round((subjectResult.score / subjectResult.total) * 100);
                                return (
                                    <div key={subjectId}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{subject?.name || 'Unknown Subject'}</span>
                                            <span>{subjectResult.score}/{subjectResult.total}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${subjectPercentage}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     </div>

                     <Button onClick={handleBack} className="mt-8">Back to Examinations</Button>
                 </div>
             </div>
        )
    };
    
    if (!currentUser) {
        return (
            <>
                <ToastContainer toasts={toasts} onDismiss={dismissToast} />
                <ConfirmationModal />
                <JobApplicationModal 
                    isOpen={isApplicationModalOpen}
                    onClose={() => setApplicationModalOpen(false)}
                    onSubmit={handleJobApplicationSubmit}
                />
                 <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setPendingSignUp(null); // Clear pending sign-up if user cancels
                    }}
                    onSelectPlan={handleSelectPlan}
                    isSignUpFlow={!!pendingSignUp}
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
                        onReadBook={handleOpenBookReader}
                    />;
                }
                 if (currentView === 'examinations') return <ExaminationsView />;
                 if (currentView === 'takeExam') return <TakeExaminationView />;
                 if (currentView === 'examResults') return <ExaminationResultsView />;
                if (currentView === 'subject' && selectedSubject) {
                    const subjectLessons = lessons.filter(l => l.subjectId === selectedSubject.id);
                    const subjectPostsForView = subjectPosts.filter(p => p.subjectId === selectedSubject.id);
                    return <SubjectDetailView 
                                user={currentUser} 
                                subject={selectedSubject} 
                                lessons={subjectLessons} 
                                posts={subjectPostsForView}
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
                            onNavigate={setCurrentView}
                        />;
            case Role.Teacher:
                const teacherSubjects = subjects.filter(s => s.teacherId === currentUser.id);
                return <TeacherDashboard 
                    user={currentUser} 
                    subjects={teacherSubjects}
                    lessons={lessons}
                    onStartLiveClass={handleStartLiveClass}
                    onUploadLesson={handleUploadLesson}
                    onCreatePost={handleCreatePost}
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
                            onInitiateDeposit={handleInitiateDeposit}
                        />;
            default:
                return <div>Error: Unknown user role.</div>
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <ConfirmationModal />
            <BookReaderModal />
            <SettingsModal />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                onSelectPlan={handleSelectPlan}
                isSignUpFlow={!!pendingSignUp}
            />

            {pendingLiveClass && (
                <LiveStreamTopUpModal 
                    isOpen={true} 
                    onClose={() => setPendingLiveClass(null)} 
                    onConfirm={handleLiveStreamTopUp}
                    liveClass={pendingLiveClass}
                />
            )}

            {selectedLesson && (
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
                onNavigateToSettings={() => setSettingsModalOpen(true)}
                unreadCount={unreadNotifications}
                onToggleNotifications={() => setNotificationsPanelOpen(p => !p)}
            />
            <div className="relative">
                <NotificationsPanel />
                <main className="max-w-4xl mx-auto pb-16">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};