import { Role, User, Subject, VideoLesson, LiveClass, PaymentRecord, Quiz, QuizAttempt, Enrollment, LessonCompletion, ActivityLog, ActivityType, Book, SubjectPost, PostType, JobApplication, ApplicationStatus, DirectMessage } from './types';

export const USERS: User[] = [
  { id: 'user-1', name: 'Alice Smith', email: 'alice@example.com', role: Role.Student, profilePicture: 'https://i.pravatar.cc/150?u=user-1', password: 'password123' },
  { id: 'user-2', name: 'Emily Carter', email: 'emily@example.com', role: Role.Teacher, profilePicture: 'https://i.pravatar.cc/150?u=user-2', password: 'teacherpassword' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com', role: Role.Student, profilePicture: 'https://i.pravatar.cc/150?u=user-3', password: 'password123' },
  { id: 'user-6', name: 'Bright Nason', email: 'brightnason19@gmail.com', role: Role.Student, profilePicture: 'https://i.pravatar.cc/150?u=user-6', password: 'grax2650' },
  { id: 'user-7', name: 'Bright Nason (Owner)', email: 'brightnason19@gmail.com', role: Role.Owner, profilePicture: 'https://i.pravatar.cc/150?u=user-7', password: 'grax2650' },
  { id: 'user-8', name: 'Bright Nason (Teacher)', email: 'brightnason19@gmail.com', role: Role.Teacher, profilePicture: 'https://i.pravatar.cc/150?u=user-8', password: 'grax2650' },
];

export const SUBJECTS: Subject[] = [
  { id: 'subj-1', name: 'Mathematics', coverPhoto: 'https://picsum.photos/seed/math/600/400', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', description: 'Explore the world of numbers, from basic algebra to advanced calculus.' },
  { id: 'subj-2', name: 'English', coverPhoto: 'https://picsum.photos/seed/english/600/400', teacherName: 'Emily Carter', teacherId: 'user-2', description: 'Master the English language, from grammar and composition to literary analysis.' },
  { id: 'subj-3', name: 'Biology', coverPhoto: 'https://picsum.photos/seed/biology/600/400', teacherName: 'Emily Carter', teacherId: 'user-2', description: 'Discover the science of life, from microscopic cells to complex ecosystems.' },
  { id: 'subj-4', name: 'Chemistry', coverPhoto: 'https://picsum.photos/seed/chem/600/400', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', description: 'Uncover the building blocks of matter and the reactions that transform them.' },
  { id: 'subj-5', name: 'Physics', coverPhoto: 'https://picsum.photos/seed/physics/600/400', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', description: 'Understand the fundamental principles of motion, energy, and the universe.' },
  { id: 'subj-6', name: 'History', coverPhoto: 'https://picsum.photos/seed/history/600/400', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', description: 'Journey through the past and learn about the events that shaped our world.' },
  { id: 'subj-7', name: 'Agriculture', coverPhoto: 'https://picsum.photos/seed/agriculture/600/400', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', description: 'Learn the science and art of cultivating plants and livestock.' },
  { id: 'subj-8', name: 'Geography', coverPhoto: 'https://picsum.photos/seed/geography/600/400', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', description: 'Explore Earth\'s landscapes, environments, and the relationships between people and their environments.' },
];

export const VIDEO_LESSONS: VideoLesson[] = [
  { id: 'vl-1', subjectId: 'subj-1', title: 'Introduction to Algebra', thumbnail: 'https://picsum.photos/seed/vl-1/400/225', description: 'Learn the basics of algebraic expressions and equations.', duration: '12:45', difficulty: 'Beginner' },
  { id: 'vl-2', subjectId: 'subj-1', title: 'Quadratic Equations', thumbnail: 'https://picsum.photos/seed/vl-2/400/225', description: 'Solving quadratic equations using various methods.', duration: '18:20', difficulty: 'Intermediate' },
  { id: 'vl-3', subjectId: 'subj-2', title: 'Understanding Shakespeare', thumbnail: 'https://picsum.photos/seed/vl-3/400/225', description: 'An introduction to the language and themes of Shakespeare.', duration: '25:10', difficulty: 'Advanced' },
  { id: 'vl-4', subjectId: 'subj-2', title: 'Grammar Essentials: Punctuation', thumbnail: 'https://picsum.photos/seed/vl-4/400/225', description: 'Master the use of commas, semicolons, and periods.', duration: '10:05', difficulty: 'Beginner' },
  { id: 'vl-5', subjectId: 'subj-3', title: 'Cell Structure and Function', thumbnail: 'https://picsum.photos/seed/vl-5/400/225', description: 'Explore the different organelles within a eukaryotic cell.', duration: '22:30', difficulty: 'Intermediate' },
];

export const INITIAL_LIVE_CLASSES: LiveClass[] = [
  { id: 'lc-1', subjectId: 'subj-1', title: 'Live Q&A: Calculus Problems', teacherName: 'Bright Nason (Owner)', teacherId: 'user-7', startTime: new Date(Date.now() + 2 * 60 * 60 * 1000) },
  { id: 'lc-2', subjectId: 'subj-2', title: 'Poetry Analysis Workshop', teacherName: 'Emily Carter', teacherId: 'user-2', startTime: new Date(Date.now() + 24 * 60 * 60 * 1000) },
];

export const PAYMENT_HISTORY: PaymentRecord[] = [
  { id: 'pay-1', studentId: 'user-1', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), amount: 15000, method: 'Airtel Money', purchaseType: 'tuition' },
  { id: 'pay-2', studentId: 'user-6', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), amount: 15000, method: 'TNM Mpamba', purchaseType: 'tuition' },
];

export const QUIZZES: Quiz[] = [
  {
    lessonId: 'vl-1',
    questions: [
      { questionText: 'What is the value of x in 2x + 3 = 7?', options: ['1', '2', '3', '4'], correctAnswer: '2' },
      { questionText: 'Which of these is a variable?', options: ['5', '+', '=', 'y'], correctAnswer: 'y' },
    ]
  },
  {
    lessonId: 'vl-4',
    questions: [
      { questionText: 'Which punctuation mark is used to separate two independent clauses?', options: ['Comma', 'Semicolon', 'Colon', 'Period'], correctAnswer: 'Semicolon' },
    ]
  }
];

export const QUIZ_ATTEMPTS: QuizAttempt[] = [
  { id: 'qa-1', studentId: 'user-1', studentName: 'Alice Smith', lessonId: 'vl-1', lessonTitle: 'Introduction to Algebra', score: 1, totalQuestions: 2, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
];

export const ENROLLMENTS: Enrollment[] = [
  { studentId: 'user-1', subjectId: 'subj-1' },
  { studentId: 'user-1', subjectId: 'subj-2' },
  { studentId: 'user-3', subjectId: 'subj-1' },
  { studentId: 'user-6', subjectId: 'subj-1' },
  { studentId: 'user-6', subjectId: 'subj-4' },
  { studentId: 'user-6', subjectId: 'subj-5' },
];

export const LESSON_COMPLETIONS: LessonCompletion[] = [
  { studentId: 'user-1', lessonId: 'vl-1', completedAt: new Date() },
  { studentId: 'user-6', lessonId: 'vl-2', completedAt: new Date() },
];

export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'log-1', userId: 'user-2', type: ActivityType.NewLesson, text: 'Emily Carter uploaded a new lesson: "Understanding Shakespeare"', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), read: false },
  { id: 'log-2', userId: 'user-1', type: ActivityType.LiveReminder, text: 'Live Q&A: Calculus Problems is starting in 2 hours.', timestamp: new Date(Date.now() + 10000), read: false },
  { id: 'log-3', userId: 'user-7', type: ActivityType.NewEnrollment, text: 'Alice Smith enrolled in Mathematics.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), read: false },
  { id: 'log-4', userId: 'user-7', type: ActivityType.PaymentReceived, text: 'Payment from Alice Smith (MWK 15,000) via Airtel Money.', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), read: false },
  { id: 'log-5', userId: 'user-2', type: ActivityType.QuizSubmission, text: 'Alice Smith scored 1/2 on "Introduction to Algebra" quiz.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), read: false },
];

export const BOOKS: Book[] = [
  { id: 'book-1', title: 'Comprehensive Mathematics Form 1 & 2', author: 'Dr. John Phiri', subject: 'Mathematics', price: 5000, coverPhoto: 'https://picsum.photos/seed/book1/300/400' },
  { id: 'book-2', title: 'English Grammar Guide', author: 'Jane Banda', subject: 'English', price: 4500, coverPhoto: 'https://picsum.photos/seed/book2/300/400' },
  { id: 'book-3', title: 'Introduction to Malawian Biology', author: 'Dr. Emily Carter', subject: 'Biology', price: 5500, coverPhoto: 'https://picsum.photos/seed/book3/300/400' },
  { id: 'book-4', title: 'Chemistry Matters', author: 'Prof. Peter Moyo', subject: 'Chemistry', price: 6000, coverPhoto: 'https://picsum.photos/seed/book4/300/400' },
];

export const SUBJECT_POSTS: SubjectPost[] = [
    { id: 'post-1', subjectId: 'subj-1', teacherId: 'user-7', teacherName: 'Bright Nason (Owner)', teacherProfilePic: 'https://i.pravatar.cc/150?u=user-7', type: PostType.Announcement, text: 'Welcome to Mathematics class! Please review the syllabus in the course materials section.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'post-2', subjectId: 'subj-1', teacherId: 'user-7', teacherName: 'Bright Nason (Owner)', teacherProfilePic: 'https://i.pravatar.cc/150?u=user-7', type: PostType.Question, text: 'Quiz on Friday will cover the first two lessons. Any questions?', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

export const INITIAL_JOB_APPLICATIONS: JobApplication[] = [
    { id: 'app-1', name: 'John Doe', email: 'johndoe@example.com', phoneNumber: '0991234567', subjects: ['Physics', 'Chemistry'], status: ApplicationStatus.Pending, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

export const INITIAL_DIRECT_MESSAGES: DirectMessage[] = [
  { id: 'dm-1', senderId: 'user-7', receiverId: 'user-2', text: 'Hi Emily, just checking in. How are the English classes going?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'dm-2', senderId: 'user-2', receiverId: 'user-7', text: 'Hi! They are going well. The students are very engaged with the new poetry unit.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
];