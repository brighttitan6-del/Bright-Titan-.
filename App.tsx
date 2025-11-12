

import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Subject, VideoLesson, LiveClass, ChatMessage, PaymentRecord, QuizAttempt, Enrollment, LessonCompletion, ActivityType, ActivityLog, Book, SubjectPost, PostType, JobApplication, ApplicationStatus, BookPurchase, ToastMessage } from './types';
import { USERS, SUBJECTS, VIDEO_LESSONS, INITIAL_LIVE_CLASSES, PAYMENT_HISTORY, QUIZZES, QUIZ_ATTEMPTS, ENROLLMENTS, LESSON_COMPLETIONS, ACTIVITY_LOGS, BOOKS, SUBJECT_POSTS, INITIAL_JOB_APPLICATIONS } from './constants';
import { runAiTutor, generateQuizOptions } from './services/geminiService';
// FIX: Imported CheckBadgeIcon to resolve 'Cannot find name' error.
import { UserCircleIcon, BellIcon, ArrowLeftIcon, SearchIcon, VideoCameraIcon, ClockIcon, SendIcon, SparklesIcon, WalletIcon, CheckCircleIcon, CheckBadgeIcon, AirtelMoneyIcon, TnmMpambaIcon, NationalBankIcon, StarIcon, UserGroupIcon, ChartBarIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon, CloseIcon, LockClosedIcon, Cog6ToothIcon, CameraIcon, BookOpenIcon, DocumentCheckIcon, CloudArrowUpIcon, TrashIcon, RssIcon, XCircleIcon, ComputerDesktopIcon, MicrophoneIcon, VideoCameraSlashIcon, ChevronUpIcon, WifiIcon, EyeIcon, BuildingStorefrontIcon, LightBulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, GoogleIcon, EnvelopeIcon, UserIcon, PhoneIcon, DocumentTextIcon, HomeIcon, AcademicCapIcon, ShoppingCartIcon, SmartLearnLogo, BriefcaseIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon } from './components/icons';
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
    
    const RoleCard: React.FC<{icon: React.ReactNode, title: Role, description: string, onClick: () => void}> = ({ icon, title, description, onClick }) => (
        <div onClick={onClick} className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 rounded-2xl text-white text-center cursor-pointer transition-all duration-300 hover-lift shadow-lg hover:shadow-xl animate-float-subtle">
            <div className="flex justify-center mb-3">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm text-blue-100 mt-1">{description}</p>
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
                        <RoleCard icon={<AcademicCapIcon className="w-12 h-12 text-white"/>} title={Role.Student} description="Access courses, lessons, and your AI tutor." onClick={() => {setAuthRole(Role.Student); setMode('login')}} />
                        <RoleCard icon={<BriefcaseIcon className="w-12 h-12 text-white"/>} title={Role.Teacher} description="Manage your content and engage with students." onClick={() => {setAuthRole(Role.Teacher); setMode('login')}} />
                        <RoleCard icon={<ShieldCheckIcon className="w-12 h-12 text-white"/>} title={Role.Owner} description="Oversee the entire platform and its users." onClick={() => setAuthRole(Role.Owner)} />
                    </div>
                    <div className="mt-10 pt-6 border-t border-blue-100/20">
                        <h3 className="text-xl font-semibold text-white">Join Our Team</h3>
                        <p className="text-blue-100 mt-2 mb-4">Are you a passionate educator? We're looking for talented teachers to join our platform.</p>
                        <Button onClick={onApply} variant="secondary" className="!bg-white !text-blue-600 hover:!bg-blue-50 focus:!ring-blue-300 dark:!bg-slate-100 dark:!text-blue-700">
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

const ManagerDashboard: React.FC<{
    user: User;
    allUsers: User[];
    allPayments: PaymentRecord[];
    jobApplications: JobApplication[];
    onApproveApplication: (appId: string) => void;
    onRejectApplication: (appId: string) => void;
    onViewCv: (app: JobApplication) => void;
}> = ({ user, allUsers, allPayments, jobApplications, onApproveApplication, onRejectApplication, onViewCv }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'payments' | 'users'>('overview');
    const [userTab, setUserTab] = useState<'students' | 'teachers'>('students');

    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalStudents = allUsers.filter(u => u.role === Role.Student).length;
    const totalTeachers = allUsers.filter(u => u.role === Role.Teacher).length;
    const pendingApplications = jobApplications.filter(a => a.status === ApplicationStatus.Pending).length;

    const renderUserList = (role: Role) => {
        return allUsers.filter(u => u.role === role).map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                <div className="flex items-center gap-3">
                    <img src={u.profilePicture} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in-up">
            <div className="text-white">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard icon={<CurrencyDollarIcon/>} title="Total Revenue" value={`MWK ${totalRevenue.toLocaleString()}`} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                    <StatCard icon={<UsersIcon/>} title="Total Users" value={totalStudents + totalTeachers} gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
                    <StatCard icon={<AcademicCapIcon/>} title="Active Students" value={totalStudents} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
                    <StatCard icon={<BriefcaseIcon/>} title="Pending Applications" value={pendingApplications} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                </div>
            </div>
            
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                 <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                     <button onClick={() => setActiveTab('applications')} className={`flex-1 py-2 font-semibold text-center text-sm ${activeTab === 'applications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Applications ({pendingApplications})</button>
                     <button onClick={() => setActiveTab('payments')} className={`flex-1 py-2 font-semibold text-center text-sm ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Payments</button>
                     <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 font-semibold text-center text-sm ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Users</button>
                 </div>

                 {activeTab === 'applications' && (
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {jobApplications.filter(a => a.status === ApplicationStatus.Pending).map(app => (
                            <div key={app.id} className="border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                                <p className="font-bold text-slate-800 dark:text-slate-100">{app.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{app.email}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Subjects: <span className="font-medium">{app.subjects.join(', ')}</span></p>
                                <div className="flex gap-2 mt-2">
                                    <Button onClick={() => onApproveApplication(app.id)} className="!py-1 !px-3 text-xs !bg-green-500 hover:!bg-green-600 focus:!ring-green-300">Approve</Button>
                                    <Button onClick={() => onRejectApplication(app.id)} className="!py-1 !px-3 text-xs !bg-red-500 hover:!bg-red-600 focus:!ring-red-300">Reject</Button>
                                    {app.cvFileName && (
                                        <Button onClick={() => onViewCv(app)} variant="secondary" className="!py-1 !px-3 text-xs flex items-center gap-1">
                                            <DocumentTextIcon className="w-4 h-4" />
                                            View CV
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {pendingApplications === 0 && (
                            <p className="text-center text-slate-500 text-sm py-3">No pending applications.</p>
                        )}
                    </div>
                 )}
                 {activeTab === 'payments' && (
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {allPayments.map(p => {
                            const student = allUsers.find(u => u.id === p.studentId);
                            return (
                                <div key={p.id} className="p-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-slate-800 dark:text-slate-100">MWK {p.amount.toLocaleString()}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{p.method}</p>
                                    </div>
                                     <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">From: {student?.name || 'Unknown Student'}</p>
                                     <p className="text-xs text-slate-400 mt-1">{new Date(p.date).toLocaleString()}</p>
                                </div>
                            );
                        })}
                     </div>
                 )}
                 {activeTab === 'users' && (
                     <div>
                         <div className="flex border-b border-slate-200 dark:border-slate-700 mb-2">
                             <button onClick={() => setUserTab('students')} className={`flex-1 py-2 font-semibold text-center text-sm ${userTab === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Students ({totalStudents})</button>
                             <button onClick={() => setUserTab('teachers')} className={`flex-1 py-2 font-semibold text-center text-sm ${userTab === 'teachers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Teachers ({totalTeachers})</button>
                         </div>
                         <div className="max-h-96 overflow-y-auto">
                            {userTab === 'students' ? renderUserList(Role.Student) : renderUserList(Role.Teacher)}
                         </div>
                     </div>
                 )}

             </div>
        </div>
    );
};


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
}> = ({ user, students, allSubjects, allLessons, allLiveClasses, quizAttempts, activityLogs, onEditStudent, enrollments, paymentRecords, onAddStudentClick, onViewStudentDetails, onDeleteLesson, onUploadLessonClick, onGoLive, onStartQuickLive, onEditLiveClass }) => {
  
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
    onSubmit: (name: string, email: string, subjects: string[], cvFile: File | null) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subjects, setSubjects] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCvFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email && subjects) {
            const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s);
            onSubmit(name, email, subjectList, cvFile);
            // Reset form
            setName('');
            setEmail('');
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
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
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
}> = ({ user, allSubjects, allLessons, lessonCompletions, quizAttempts, enrollments, onNavigateToSubject }) => {
    
    const enrolledSubjectIds = enrollments.filter(e => e.studentId === user.id).map(e => e.subjectId);
    const enrolledSubjects = allSubjects.filter(s => enrolledSubjectIds.includes(s.id));

    const totalLessonsInEnrolledSubjects = allLessons.filter(l => enrolledSubjectIds.includes(l.subjectId)).length;
    const completedLessonsCount = lessonCompletions.filter(c => c.studentId === user.id).length;
    const overallProgress = totalLessonsInEnrolledSubjects > 0 ? Math.round((completedLessonsCount / totalLessonsInEnrolledSubjects) * 100) : 0;
    
    const totalQuizzesTaken = quizAttempts.filter(qa => qa.studentId === user.id).length;
    
    const recentlyCompleted = lessonCompletions
        .filter(c => c.studentId === user.id)
        .sort((a,b) => b.completedAt.getTime() - a.completedAt.getTime())
        .slice(0, 3)
        .map(c => allLessons.find(l => l.id === c.lessonId))
        .filter((l): l is VideoLesson => l !== undefined);

    return (
        <div className="p-4 space-y-6 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">My Progress</h2>
                <div className="grid grid-cols-2 gap-4 text-white">
                    <StatCard icon={<CheckBadgeIcon/>} title="Overall Completion" value={`${overallProgress}%`} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                    <StatCard icon={<DocumentTextIcon/>} title="Quizzes Taken" value={totalQuizzesTaken} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                    <StatCard icon={<BookOpenIcon/>} title="Lessons Completed" value={completedLessonsCount} gradient="bg-gradient-to-br from-purple-500 to-pink-600" />
                    <StatCard icon={<ClockIcon/>} title="Time Spent" value="~14 Hrs" gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Subject Breakdown</h3>
                <div className="space-y-3">
                    {enrolledSubjects.map(subject => {
                        const lessonsForSubject = allLessons.filter(l => l.subjectId === subject.id);
                        const completedInSubject = lessonCompletions.filter(c => c.studentId === user.id && lessonsForSubject.some(l => l.id === c.lessonId)).length;
                        const progress = lessonsForSubject.length > 0 ? Math.round((completedInSubject / lessonsForSubject.length) * 100) : 0;
                        
                        return (
                            <div key={subject.id} onClick={() => onNavigateToSubject(subject)} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm cursor-pointer hover-lift">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{subject.name}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{subject.teacherName}</p>
                                    </div>
                                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{progress}%</span>
                                </div>
                                <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recently Completed</h3>
                <div className="space-y-3">
                    {recentlyCompleted.length > 0 ? recentlyCompleted.map(lesson => (
                        <div key={lesson.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm flex items-center gap-3">
                            <img src={lesson.thumbnail} alt={lesson.title} className="w-20 h-14 object-cover rounded-md" />
                            <div>
                                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{lesson.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{allSubjects.find(s => s.id === lesson.subjectId)?.name}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 text-sm py-4">You haven't completed any lessons recently.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotificationPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  user: User;
}> = ({ isOpen, onClose, logs, user }) => {
    const userLogs = logs
        .filter(log => log.userId === user.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const getLogIcon = (type: ActivityType) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case ActivityType.NewLesson: return <BookOpenIcon className={`${iconClass} text-purple-500`} />;
            case ActivityType.LiveReminder: return <RssIcon className={`${iconClass} text-red-500`} />;
            case ActivityType.NewEnrollment: return <UserGroupIcon className={`${iconClass} text-blue-500`} />;
            case ActivityType.QuizSubmission: return <DocumentCheckIcon className={`${iconClass} text-green-500`} />;
            case ActivityType.PaymentReceived: return <WalletIcon className={`${iconClass} text-indigo-500`} />;
            default: return <BellIcon className={`${iconClass} text-slate-500`} />;
        }
    };
    
    return (
        <div className={`fixed inset-0 z-30 transition-opacity ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`} />
            <div className={`fixed top-0 right-0 bottom-0 w-full max-w-sm bg-slate-100 dark:bg-slate-900 shadow-xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {userLogs.length > 0 ? (
                        <div className="space-y-3">
                            {userLogs.map(log => (
                                <div key={log.id} className="flex items-start gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1">
                                        {getLogIcon(log.type)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{log.type}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{log.text}</p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                            <BellIcon className="w-12 h-12 text-slate-400 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">No notifications yet.</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">We'll let you know when something new happens.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----- Main App Component -----

export default function App() {
  const [allUsers, setAllUsers] = useState<User[]>(USERS);
  const [allSubjects, setAllSubjects] = useState<Subject[]>(SUBJECTS);
  const [allVideoLessons, setAllVideoLessons] = useState<VideoLesson[]>(VIDEO_LESSONS);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>(ENROLLMENTS);
  const [allPaymentRecords, setAllPaymentRecords] = useState<PaymentRecord[]>(PAYMENT_HISTORY);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(ACTIVITY_LOGS);
  const [allQuizAttempts, setAllQuizAttempts] = useState<QuizAttempt[]>(QUIZ_ATTEMPTS);
  const [allLessonCompletions, setAllLessonCompletions] = useState<LessonCompletion[]>(LESSON_COMPLETIONS);
  const [allLiveClasses, setAllLiveClasses] = useState<LiveClass[]>(INITIAL_LIVE_CLASSES);
  const [allBooks, setAllBooks] = useState<Book[]>(BOOKS);
  const [allSubjectPosts, setAllSubjectPosts] = useState<SubjectPost[]>(SUBJECT_POSTS);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>(INITIAL_JOB_APPLICATIONS);
  const [bookPurchases, setBookPurchases] = useState<BookPurchase[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isStudentPaid, setIsStudentPaid] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'lessons', 'live', 'payment', 'settings'
  const [activeStudentView, setActiveStudentView] = useState<'dashboard' | 'progress' | 'bookstore'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectDetailsModalSubject, setSubjectDetailsModalSubject] = useState<Subject | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<VideoLesson | null>(null);
  const [quizForLesson, setQuizForLesson] = useState<VideoLesson | null>(null);
  const [activeLiveClass, setActiveLiveClass] = useState<LiveClass | null>(null);
  const [isAiTutorOpen, setAiTutorOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<User | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<User | null>(null);
  const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDefaultSubject, setUploadDefaultSubject] = useState<string | undefined>();
  const [lessonToDelete, setLessonToDelete] = useState<VideoLesson | null>(null);
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false);
  const [liveClassToEdit, setLiveClassToEdit] = useState<LiveClass | null>(null);
  const [isJobApplicationModalOpen, setJobApplicationModalOpen] = useState(false);
  const [liveChatMessages, setLiveChatMessages] = useState<ChatMessage[]>([]);
  const [paymentPurchaseItem, setPaymentPurchaseItem] = useState<any>(null);
  const [bookToRead, setBookToRead] = useState<Book | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = document.getElementById('background-music') as HTMLAudioElement;
    if (audioRef.current) {
        audioRef.current.volume = 0.2;
        audioRef.current.play().catch(error => console.log("Autoplay was prevented.", error));
        setIsMuted(audioRef.current.muted);
    }
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
        audioRef.current.muted = !audioRef.current.muted;
        setIsMuted(audioRef.current.muted);
    }
  };


  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };
  
  const checkPaymentStatus = (studentId: string, records: PaymentRecord[]): boolean => {
    return records.some(p => p.studentId === studentId && p.purchaseType === 'tuition');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === Role.Student) {
        const paid = checkPaymentStatus(user.id, allPaymentRecords);
        setIsStudentPaid(paid);
        if (!paid) {
            setPaymentPurchaseItem({ type: 'tuition', amount: 15000 });
            setCurrentView('payment');
            addToast(`Welcome, ${user.name}! Please complete payment to access lessons.`, 'info');
            return;
        }
    }
    setCurrentView('dashboard');
    addToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleLogin = (email: string, pass: string, role: Role) => {
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass && u.role === role);
    if (user) {
        handleLoginSuccess(user);
    } else {
        addToast("Invalid email, password, or role.", 'error');
    }
  };
  
  const handleSignUp = (name: string, email: string, pass: string, role: Role) => {
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        addToast("An account with this email already exists.", 'error');
        return;
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: pass,
        role,
        profilePicture: `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    setAllUsers(prev => [...prev, newUser]);
    handleLoginSuccess(newUser);
  };
  
  const handleGoogleAuth = () => {
    const studentUser = allUsers.find(u => u.email === 'brightnason19@gmail.com');
    if (studentUser) {
        handleLoginSuccess(studentUser);
    } else {
        addToast("Could not sign in with Google.", 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsStudentPaid(false);
    setActiveLiveClass(null);
  };
  
  const handleSelectSubject = (subject: Subject) => {
      if (!isStudentPaid) {
          handleNavigateToPayment();
          return;
      }
      setSubjectDetailsModalSubject(subject);
  }

  const handleProceedToLessons = () => {
    if (subjectDetailsModalSubject) {
      setSelectedSubject(subjectDetailsModalSubject);
      setCurrentView('lessons');
      setSubjectDetailsModalSubject(null);
    }
  };

  const handleBackToDashboard = () => {
      setSelectedSubject(null);
      setCurrentView('dashboard');
  }
  
  const handleJoinLiveClass = (liveClass: LiveClass) => {
      if (!isStudentPaid) {
          handleNavigateToPayment();
          return;
      }
      setLiveChatMessages([
        { sender: 'teacher', name: liveClass.teacherName, text: 'Welcome everyone! Ask your questions here.', timestamp: new Date() },
        { sender: 'student', name: 'Alice Smith', text: 'Hi! Looking forward to this.', timestamp: new Date(Date.now() + 1000) },
      ]);
      setActiveLiveClass(liveClass);
      setCurrentView('live');
  }

  const handleGoLive = (liveClass: LiveClass) => {
    setLiveChatMessages([
        { sender: 'teacher', name: liveClass.teacherName, text: 'The live session has started! Feel free to ask questions.', timestamp: new Date() }
    ]);
    setActiveLiveClass(liveClass);
    const enrolledStudentIds = allEnrollments
        .filter(e => e.subjectId === liveClass.subjectId)
        .map(e => e.studentId);
    const newNotifications: ActivityLog[] = enrolledStudentIds.map(studentId => ({
        id: `log-${Date.now()}-${studentId}`,
        userId: studentId,
        type: ActivityType.LiveReminder,
        text: `${liveClass.teacherName} is now live for ${liveClass.title}!`,
        timestamp: new Date(),
        read: false,
    }));
    setActivityLogs(prev => [...prev, ...newNotifications]);
  };

  const handleStartQuickLive = (title: string, subjectId: string) => {
    if (!currentUser || (currentUser.role !== Role.Teacher && currentUser.role !== Role.Owner)) return;
    const newLiveClass: LiveClass = {
      id: `live-${Date.now()}`,
      subjectId,
      title,
      teacherName: currentUser.name,
      teacherId: currentUser.id,
      startTime: new Date(),
    };
    handleGoLive(newLiveClass);
  };

  const handleUpdateLiveClassTitle = (id: string, newTitle: string) => {
    setAllLiveClasses(prev => prev.map(lc => lc.id === id ? {...lc, title: newTitle} : lc));
  };


  const handleEndLive = () => {
      setActiveLiveClass(null);
      setCurrentView('dashboard');
      setLiveChatMessages([]);
  };

  const handleWatchLesson = (lesson: VideoLesson) => {
    if (!isStudentPaid) {
        handleNavigateToPayment();
        return;
    }
    setSelectedLesson(lesson);
  };

  const handleLeaveLiveClass = () => {
      setActiveLiveClass(null);
      setCurrentView('dashboard');
      setLiveChatMessages([]);
  }
  
  const handleNavigateToPayment = (item?: any) => {
    setPaymentPurchaseItem(item || { type: 'tuition', amount: 15000 });
    setCurrentView('payment');
  }
  const handleNavigateToSettings = () => setCurrentView('settings');
  
  const handlePaymentSuccess = (newRecord: PaymentRecord) => {
      setAllPaymentRecords(prev => [newRecord, ...prev]);
      
      if(newRecord.purchaseType === 'book' && newRecord.purchaseId && currentUser) {
          setBookPurchases(prev => [...prev, { studentId: currentUser.id, bookId: newRecord.purchaseId! }]);
          const book = allBooks.find(b => b.id === newRecord.purchaseId);
          addToast(`Successfully purchased "${book?.title}"!`, 'success');
      } else {
          setIsStudentPaid(true);
          addToast('Payment successful! All features unlocked.', 'success');
      }


      if (currentUser) {
          const adminNotification: ActivityLog = {
              id: `log-${Date.now()}-adminpay`,
              userId: APP_OWNER_ID,
              type: ActivityType.PaymentReceived,
              text: `Payment from ${currentUser.name} (MWK ${newRecord.amount.toLocaleString()}) via ${newRecord.method}.`,
              timestamp: new Date(),
              read: false,
          };
          setActivityLogs(prev => [adminNotification, ...prev]);
      }
  };

  const handleSaveStudentName = (studentId: string, newName: string) => {
    setAllUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === studentId ? { ...user, name: newName } : user
      )
    );
    if (currentUser?.id === studentId) {
      setCurrentUser(prev => (prev ? { ...prev, name: newName } : null));
    }
    setStudentToEdit(null);
    addToast("Student name updated.", 'success');
  };

  const handleUpdateProfilePicture = (dataUrl: string) => {
    if (currentUser) {
        const userId = currentUser.id;
        setAllUsers(prev => prev.map(u => u.id === userId ? {...u, profilePicture: dataUrl} : u));
        setCurrentUser(prev => prev ? {...prev, profilePicture: dataUrl} : null);
        addToast("Profile picture updated!", 'success');
    }
  };

  const handleAddStudent = (name: string, email: string, subjectIds: string[]) => {
    const newStudentId = `user-${Date.now()}`;
    const newStudent: User = {
        id: newStudentId,
        name,
        email,
        role: Role.Student,
        profilePicture: `https://i.pravatar.cc/150?u=${newStudentId}`,
    };
    const newEnrollments: Enrollment[] = subjectIds.map(subjectId => ({
        studentId: newStudentId,
        subjectId,
    }));
    setAllUsers(prev => [...prev, newStudent]);
    setAllEnrollments(prev => [...prev, ...newEnrollments]);
    setAddStudentModalOpen(false);
    addToast(`Student "${name}" added successfully.`, 'success');
  };

  const handleAddLesson = (lessonData: { title: string; description: string; subjectId: string }) => {
    const newLesson: VideoLesson = {
        ...lessonData,
        id: `lesson-${Date.now()}`,
        thumbnail: `https://picsum.photos/seed/${Date.now()}/400/225`,
        duration: `${Math.floor(Math.random() * 30) + 10}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        difficulty: 'Beginner', // Default difficulty
    };
    setAllVideoLessons(prev => [newLesson, ...prev]);
    addToast(`New lesson "${lessonData.title}" uploaded.`, 'success');
  };

  const handleDeleteLesson = (lessonId: string) => {
    setAllVideoLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
    setLessonToDelete(null);
    addToast("Lesson deleted.", 'info');
  };

  const handleOpenUploadModal = (subjectId: string) => {
      setUploadDefaultSubject(subjectId);
      setIsUploadModalOpen(true);
  };

  const handleAddPost = (post: Omit<SubjectPost, 'id'>) => {
    const newPost: SubjectPost = { ...post, id: `post-${Date.now()}`};
    setAllSubjectPosts(prev => [newPost, ...prev]);
  };

  const handleLessonViewed = (lessonId: string) => {
    if (currentUser?.role === Role.Student) {
        const alreadyCompleted = allLessonCompletions.some(
            c => c.studentId === currentUser.id && c.lessonId === lessonId
        );
        if (!alreadyCompleted) {
            const newCompletion: LessonCompletion = {
                studentId: currentUser.id,
                lessonId,
                completedAt: new Date(),
            };
            setAllLessonCompletions(prev => [...prev, newCompletion]);
        }
    }
  };

  const handleQuizComplete = (attemptData: { lessonId: string, score: number, totalQuestions: number, completedAt: Date, studentId: string }) => {
    if (currentUser?.role === Role.Student) {
        const lesson = allVideoLessons.find(l => l.id === attemptData.lessonId);
        if (!lesson) return;

        const newAttempt: QuizAttempt = {
            ...attemptData,
            id: `qa-${Date.now()}`,
            studentName: currentUser.name,
            lessonTitle: lesson.title,
        };
        setAllQuizAttempts(prev => [newAttempt, ...prev]);
    }
  };

  const handleJobApplicationSubmit = (name: string, email: string, subjects: string[], cvFile: File | null) => {
      const processApplication = (cvDataUrl?: string, cvFileName?: string) => {
          const newApplication: JobApplication = {
              id: `app-${Date.now()}`,
              name,
              email,
              subjects,
              status: ApplicationStatus.Pending,
              timestamp: new Date(),
              cvDataUrl,
              cvFileName,
          };
          setJobApplications(prev => [newApplication, ...prev]);
          addToast("Application submitted! We'll review it shortly.", 'success');
      };

      if (cvFile) {
          const reader = new FileReader();
          reader.onload = (e) => {
              processApplication(e.target?.result as string, cvFile.name);
          };
          reader.readAsDataURL(cvFile);
      } else {
          processApplication();
      }
  };

  const handleApproveApplication = (appId: string) => {
      const app = jobApplications.find(a => a.id === appId);
      if (!app) return;

      const newTeacherId = `user-${Date.now()}`;
      const newTeacher: User = {
          id: newTeacherId,
          name: app.name,
          email: app.email,
          role: Role.Teacher,
          profilePicture: `https://i.pravatar.cc/150?u=${newTeacherId}`,
          password: 'password123', // Assign a default password
      };

      setAllUsers(prev => {
        const updatedUsers = [...prev, newTeacher];
        const userToLogin = updatedUsers.find(u => u.id === newTeacherId);
        if (userToLogin) {
            setTimeout(() => handleLoginSuccess(userToLogin), 0);
        }
        return updatedUsers;
      });

      const newSubjects: Subject[] = app.subjects.map((subjName, index) => ({
          id: `subj-${Date.now()}-${index}`,
          name: subjName,
          coverPhoto: `https://picsum.photos/seed/${subjName.toLowerCase()}${Date.now()}/600/400`,
          teacherName: newTeacher.name,
          teacherId: newTeacher.id,
          description: `An exciting course on ${subjName} taught by ${newTeacher.name}.`
      }));
      setAllSubjects(prev => [...prev, ...newSubjects]);
      
      setJobApplications(prev => prev.map(a => a.id === appId ? {...a, status: ApplicationStatus.Approved} : a));
  };

  const handleRejectApplication = (appId: string) => {
      setJobApplications(prev => prev.map(a => a.id === appId ? {...a, status: ApplicationStatus.Rejected} : a));
  };
  
  const handleViewCv = (app: JobApplication) => {
      if (!app.cvDataUrl || !app.cvFileName) return;
      const link = document.createElement('a');
      link.href = app.cvDataUrl;
      link.download = app.cvFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleSendLiveChatMessage = (message: ChatMessage) => {
    setLiveChatMessages(prev => [...prev, message]);
  };

  const unreadNotificationsCount = currentUser ? activityLogs.filter(log => log.userId === currentUser.id && !log.read).length : 0;

  const handleToggleNotifications = () => {
    setNotificationPanelOpen(prev => !prev);
    if (!isNotificationPanelOpen) { // If opening
        setActivityLogs(prevLogs => 
            prevLogs.map(log => 
                log.userId === currentUser?.id ? { ...log, read: true } : log
            )
        );
    }
  };

  const handleNavigateToSubjectFromProgress = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentView('lessons');
  };

  if (!currentUser) {
    return (
        <>
            <AuthScreen 
                onLogin={handleLogin}
                onSignUp={handleSignUp}
                onGoogleAuth={handleGoogleAuth}
                onApply={() => setJobApplicationModalOpen(true)}
            />
            <JobApplicationModal 
                isOpen={isJobApplicationModalOpen}
                onClose={() => setJobApplicationModalOpen(false)}
                onSubmit={handleJobApplicationSubmit}
            />
            <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(p => p.filter(t => t.id !== id))} />
        </>
    );
  }
  
  if (currentView === 'live' && activeLiveClass && currentUser.role === Role.Student) {
      return <StudentLiveView 
        liveClass={activeLiveClass} 
        onLeave={handleLeaveLiveClass} 
        user={currentUser} 
        messages={liveChatMessages}
        onSendMessage={handleSendLiveChatMessage}
      />
  }
  
  if (activeLiveClass && (currentUser.role === Role.Teacher || currentUser.role === Role.Owner)) {
    return <TeacherLiveView 
        liveClass={activeLiveClass} 
        onEnd={handleEndLive} 
        user={currentUser}
        messages={liveChatMessages}
        onSendMessage={handleSendLiveChatMessage}
     />
  }

  const renderStudentMainContent = () => {
      switch(activeStudentView) {
          case 'dashboard':
            return <StudentDashboard 
                    user={currentUser} 
                    isPaid={isStudentPaid} 
                    allSubjects={allSubjects}
                    allLessons={allVideoLessons} 
                    allLiveClasses={allLiveClasses}
                    lessonCompletions={allLessonCompletions}
                    activeLiveClass={activeLiveClass}
                    onSelectSubject={handleSelectSubject} 
                    onJoinLiveClass={handleJoinLiveClass} 
                    onPayForLessons={() => handleNavigateToPayment()}
                    onWatchLesson={handleWatchLesson} 
                />
          case 'progress':
            return <StudentProgressScreen
                    user={currentUser}
                    allSubjects={allSubjects}
                    allLessons={allVideoLessons}
                    lessonCompletions={allLessonCompletions}
                    quizAttempts={allQuizAttempts}
                    enrollments={allEnrollments}
                    onNavigateToSubject={handleNavigateToSubjectFromProgress}
                />
          case 'bookstore':
            return <BookstoreScreen 
                        books={allBooks} 
                        purchasedBookIds={bookPurchases.filter(p => p.studentId === currentUser.id).map(p => p.bookId)}
                        onBuyBook={(book) => handleNavigateToPayment({ type: 'book', item: book })}
                        onReadBook={setBookToRead}
                    />
      }
  }

  const renderMainContent = () => {
    if (currentView !== 'dashboard') {
        switch (currentView) {
            case 'lessons':
                 return currentUser.role === Role.Student && selectedSubject && isStudentPaid && (
                  <SubjectView 
                    user={currentUser}
                    subject={selectedSubject}
                    lessons={allVideoLessons}
                    posts={allSubjectPosts}
                    onWatchLesson={setSelectedLesson}
                    onTakeQuiz={setQuizForLesson}
                    onAddPost={handleAddPost}
                  />
                );
            case 'payment':
                return <PaymentScreen user={currentUser} onBack={handleBackToDashboard} onPaymentSuccess={handlePaymentSuccess} purchaseItem={paymentPurchaseItem} />;
            case 'settings':
                return <SettingsScreen user={currentUser} activityLogs={activityLogs} onUpdateProfilePicture={handleUpdateProfilePicture} />;
            default:
                return null;
        }
    }
    
    switch (currentUser.role) {
        case Role.Student:
            return renderStudentMainContent();
        case Role.Teacher:
            return <TeacherDashboard 
                    user={currentUser} 
                    students={allUsers.filter(u => u.role === Role.Student)}
                    allSubjects={allSubjects}
                    allLessons={allVideoLessons}
                    allLiveClasses={allLiveClasses}
                    quizAttempts={allQuizAttempts}
                    activityLogs={activityLogs}
                    onEditStudent={setStudentToEdit} 
                    enrollments={allEnrollments}
                    paymentRecords={allPaymentRecords} 
                    onAddStudentClick={() => setAddStudentModalOpen(true)} 
                    onViewStudentDetails={setSelectedStudentForDetails}
                    onDeleteLesson={setLessonToDelete}
                    onUploadLessonClick={handleOpenUploadModal}
                    onGoLive={handleGoLive}
                    onStartQuickLive={() => setIsStartLiveModalOpen(true)}
                    onEditLiveClass={setLiveClassToEdit}
                />
        case Role.Owner:
            return <ManagerDashboard
                    user={currentUser}
                    allUsers={allUsers}
                    allPayments={allPaymentRecords}
                    jobApplications={jobApplications}
                    onApproveApplication={handleApproveApplication}
                    onRejectApplication={handleRejectApplication}
                    onViewCv={handleViewCv}
                />
        default:
            return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-900 min-h-screen shadow-2xl flex flex-col relative">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        currentView={currentView} 
        onBack={
            (currentView !== 'dashboard' || (currentUser.role === Role.Student && activeStudentView !== 'dashboard'))
            ? handleBackToDashboard
            : undefined
        }
        onNavigateToSettings={handleNavigateToSettings}
        unreadCount={unreadNotificationsCount}
        onToggleNotifications={handleToggleNotifications}
        />
      <main className="flex-1 overflow-y-auto pb-16">
        {renderMainContent()}
      </main>
      
      {currentUser.role === Role.Student && (
          <div className="w-full max-w-md mx-auto grid grid-cols-4 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm fixed bottom-0 left-1/2 -translate-x-1/2 z-10">
             <button onClick={() => setActiveStudentView('dashboard')} className={`flex flex-col items-center justify-center p-2 text-xs ${activeStudentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <HomeIcon className="w-6 h-6 mb-0.5" />
                <span>Dashboard</span>
            </button>
             <button onClick={() => setActiveStudentView('progress')} className={`flex flex-col items-center justify-center p-2 text-xs ${activeStudentView === 'progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <ChartBarIcon className="w-6 h-6 mb-0.5" />
                <span>My Progress</span>
            </button>
             <button onClick={() => setActiveStudentView('bookstore')} className={`flex flex-col items-center justify-center p-2 text-xs ${activeStudentView === 'bookstore' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <ShoppingCartIcon className="w-6 h-6 mb-0.5" />
                <span>Bookstore</span>
            </button>
             <button onClick={() => setAiTutorOpen(true)} className={`flex flex-col items-center justify-center p-2 text-xs text-slate-500 dark:text-slate-400`}>
                <SparklesIcon className="w-6 h-6 mb-0.5" />
                <span>AI Tutor</span>
            </button>
          </div>
      )}

      <button
        onClick={toggleMute}
        className="fixed bottom-20 right-4 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm p-3 rounded-full text-white z-50 transition-transform hover:scale-110"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        {isMuted ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}
      </button>

      <NotificationPanel 
        isOpen={isNotificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        logs={activityLogs}
        user={currentUser}
      />
      <VideoPlayerModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} user={currentUser} onLessonViewed={handleLessonViewed} />
      <AiTutorModal isOpen={isAiTutorOpen} onClose={() => setAiTutorOpen(false)} />
      <QuizModal lesson={quizForLesson} onClose={() => setQuizForLesson(null)} user={currentUser} onQuizComplete={handleQuizComplete} />
      <EditStudentModal student={studentToEdit} onClose={() => setStudentToEdit(null)} onSave={handleSaveStudentName} />
      <StudentDetailsModal 
        student={selectedStudentForDetails} 
        onClose={() => setSelectedStudentForDetails(null)} 
        allSubjects={allSubjects}
        quizAttempts={allQuizAttempts}
        videoLessons={allVideoLessons}
      />
      <AddStudentModal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => setAddStudentModalOpen(false)}
        onAdd={handleAddStudent}
        teacherSubjects={currentUser.role === Role.Owner ? allSubjects : allSubjects.filter(s => s.teacherId === currentUser.id)}
    />
    <UploadLessonModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleAddLesson}
        subjects={currentUser.role === Role.Owner ? allSubjects : allSubjects.filter(s => s.teacherId === currentUser.id)}
        defaultSubjectId={uploadDefaultSubject}
    />
     <DeleteLessonConfirmationModal
        lesson={lessonToDelete}
        onClose={() => setLessonToDelete(null)}
        onConfirm={handleDeleteLesson}
     />
    <SubjectDetailsModal 
        subject={subjectDetailsModalSubject} 
        onClose={() => setSubjectDetailsModalSubject(null)} 
        onProceed={handleProceedToLessons} 
      />
    <StartLiveModal
        isOpen={isStartLiveModalOpen}
        onClose={() => setIsStartLiveModalOpen(false)}
        onStart={handleStartQuickLive}
        teacherSubjects={currentUser.role === Role.Owner ? allSubjects : allSubjects.filter(s => s.teacherId === currentUser.id)}
        user={currentUser}
    />
    <EditLiveClassModal
        liveClass={liveClassToEdit}
        onClose={() => setLiveClassToEdit(null)}
        onSave={handleUpdateLiveClassTitle}
    />
    <JobApplicationModal 
        isOpen={isJobApplicationModalOpen}
        onClose={() => setJobApplicationModalOpen(false)}
        onSubmit={handleJobApplicationSubmit}
    />
    <Modal isOpen={!!bookToRead} onClose={() => setBookToRead(null)} title={bookToRead?.title || 'Book'}>
        <div className="text-center">
            <img src={bookToRead?.coverPhoto} alt={bookToRead?.title} className="w-40 h-auto mx-auto rounded-lg shadow-lg mb-4" />
            <p className="text-slate-600 dark:text-slate-300">You are now reading <span className="font-bold">{bookToRead?.title}</span>.</p>
            <p className="text-sm text-slate-500 mt-1">(Digital reader content would be displayed here)</p>
        </div>
    </Modal>
    <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}