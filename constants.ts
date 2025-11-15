import { Role, User, Subject, VideoLesson, LiveClass, PaymentRecord, Quiz, QuizAttempt, Enrollment, LessonCompletion, ActivityLog, ActivityType, Book, SubjectPost, PostType, DirectMessage, ExaminationQuestion, Examination, ExaminationAttempt, SubscriptionPlan, BookPurchase, Withdrawal, LessonBookmark, BookReading, PostComment } from './types';

export const USERS: User[] = [
  // Student with an expired weekly plan
  { 
    id: 'user-1', 
    name: 'Alice Smith', 
    email: 'alice@example.com', 
    role: Role.Student, 
    profilePicture: 'https://i.pravatar.cc/150?u=user-1', 
    password: 'password123',
    subscription: {
      plan: SubscriptionPlan.Weekly,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Expired 3 days ago
    }
  },
  { 
    id: 'user-2', 
    name: 'Emily Carter', 
    email: 'emily@example.com', 
    role: Role.Teacher, 
    profilePicture: 'https://i.pravatar.cc/150?u=user-2', 
    password: 'teacherpassword',
    teacherApplication: {
      cvUrl: '/path/to/emily_carter_cv.pdf',
      message: 'I am an experienced English teacher with a passion for literature and helping students find their voice.',
      status: 'Approved',
    }
  },
  // Student with no payment history
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com', role: Role.Student, profilePicture: 'https://i.pravatar.cc/150?u=user-3', password: 'password123', subscription: { plan: SubscriptionPlan.None, startDate: new Date(), endDate: new Date() } },
  // Student with an expired daily plan to test 24-hour lockout
  { 
    id: 'user-4', 
    name: 'Charlie Davis', 
    email: 'charlie@example.com', 
    role: Role.Student, 
    profilePicture: 'https://i.pravatar.cc/150?u=user-4', 
    password: 'password123',
    subscription: {
      plan: SubscriptionPlan.Daily,
      startDate: new Date(Date.now() - 25 * 60 * 60 * 1000), // Started 25 hours ago
      endDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // Expired 1 hour ago
    }
  },
  // Student with an active monthly plan
  { 
    id: 'user-6', 
    name: 'Bright Nason', 
    email: 'brightnason19@gmail.com', 
    role: Role.Student, 
    profilePicture: 'https://i.pravatar.cc/150?u=user-6', 
    password: 'grax2650',
    subscription: {
      plan: SubscriptionPlan.Monthly,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Expires in 25 days
    }
  },
  { id: 'user-7', name: 'Bright Nason (Owner)', email: 'brightnason19@gmail.com', role: Role.Owner, profilePicture: 'https://i.pravatar.cc/150?u=user-7', password: 'grax2650' },
  { 
    id: 'user-8', 
    name: 'Bright Nason (Teacher)', 
    email: 'brightnason19@gmail.com', 
    role: Role.Teacher, 
    profilePicture: 'https://i.pravatar.cc/150?u=user-8', 
    password: 'grax2650',
    teacherApplication: {
      cvUrl: '/path/to/bn_cv.pdf',
      message: 'Experienced Maths and Chemistry teacher looking to make a difference.',
      status: 'Approved',
    }
  },
  // Student with an expired daily plan to verify 24-hour access lock
  { 
    id: 'user-9', 
    name: 'Eve Adams', 
    email: 'eve@example.com', 
    role: Role.Student, 
    profilePicture: 'https://i.pravatar.cc/150?u=user-9', 
    password: 'password123',
    subscription: {
      plan: SubscriptionPlan.Daily,
      startDate: new Date(Date.now() - 26 * 60 * 60 * 1000), // Paid 26 hours ago
      endDate: new Date(Date.now() - 2 * 60 * 60 * 1000),   // Expired 2 hours ago
    }
  },
  {
    id: 'user-10',
    name: 'Frank Green',
    email: 'frank@example.com',
    role: Role.Teacher,
    profilePicture: 'https://i.pravatar.cc/150?u=user-10',
    password: 'password123',
    teacherApplication: {
      cvUrl: '/path/to/frank_green_cv.pdf',
      message: 'I am a certified Biology teacher with 5 years of experience and I am excited about the opportunity to contribute to the SmartLearn platform.',
      status: 'Pending',
    },
  },
];

export const SUBJECTS: Subject[] = [
  { id: 'subj-1', name: 'Mathematics', coverPhoto: 'https://picsum.photos/seed/math/600/400', teacherName: 'Bright Nason (Teacher)', teacherId: 'user-8', description: 'Explore the world of numbers, from basic algebra to advanced calculus.' },
  { id: 'subj-2', name: 'English', coverPhoto: 'https://picsum.photos/seed/english/600/400', teacherName: 'Emily Carter', teacherId: 'user-2', description: 'Master the English language, from grammar and composition to literary analysis.' },
  { id: 'subj-3', name: 'Biology', coverPhoto: 'https://picsum.photos/seed/biology/600/400', teacherName: 'Emily Carter', teacherId: 'user-2', description: 'Discover the science of life, from microscopic cells to complex ecosystems.' },
  { id: 'subj-4', name: 'Chemistry', coverPhoto: 'https://picsum.photos/seed/chem/600/400', teacherName: 'Bright Nason (Teacher)', teacherId: 'user-8', description: 'Uncover the building blocks of matter and the reactions that transform them.' },
  { id: 'subj-5', name: 'Chichewa', coverPhoto: 'https://picsum.photos/seed/chichewa/600/400', teacherName: 'Emily Carter', teacherId: 'user-2', description: 'Phunzirani zoyambira za chilankhulo chathu, Chichewa.' },
  { id: 'subj-6', name: 'History', coverPhoto: 'https://picsum.photos/seed/history/600/400', teacherName: 'Bright Nason (Teacher)', teacherId: 'user-8', description: 'Journey through the past and learn about the events that shaped our world.' },
  { id: 'subj-7', name: 'Agriculture', coverPhoto: 'https://picsum.photos/seed/agriculture/600/400', teacherName: 'Bright Nason (Teacher)', teacherId: 'user-8', description: 'Learn the science and art of cultivating plants and livestock.' },
  { id: 'subj-8', name: 'Geography', coverPhoto: 'https://picsum.photos/seed/geography/600/400', teacherName: 'Bright Nason (Teacher)', teacherId: 'user-8', description: 'Explore Earth\'s landscapes, environments, and the relationships between people and their environments.' },
];

export const VIDEO_LESSONS: VideoLesson[] = [
  { 
    id: 'vl-1', 
    subjectId: 'subj-1', 
    title: 'Introduction to Algebra', 
    thumbnail: 'https://picsum.photos/seed/vl-1/400/225', 
    description: 'Learn the basics of algebraic expressions and equations.', 
    duration: '12:45', 
    difficulty: 'Beginner',
    chapters: [
        { time: 0, title: 'Introduction' },
        { time: 120, title: 'What is a Variable?' },
        { time: 350, title: 'Solving Simple Equations' },
        { time: 615, title: 'Example Problems' },
    ]
  },
  { id: 'vl-2', subjectId: 'subj-1', title: 'Quadratic Equations', thumbnail: 'https://picsum.photos/seed/vl-2/400/225', description: 'Solving quadratic equations using various methods.', duration: '18:20', difficulty: 'Intermediate' },
  { id: 'vl-3', subjectId: 'subj-2', title: 'Understanding Shakespeare', thumbnail: 'https://picsum.photos/seed/vl-3/400/225', description: 'An introduction to the language and themes of Shakespeare.', duration: '25:10', difficulty: 'Advanced' },
  { id: 'vl-4', subjectId: 'subj-2', title: 'Grammar Essentials: Punctuation', thumbnail: 'https://picsum.photos/seed/vl-4/400/225', description: 'Master the use of commas, semicolons, and periods.', duration: '10:05', difficulty: 'Beginner' },
  { id: 'vl-5', subjectId: 'subj-3', title: 'Cell Structure and Function', thumbnail: 'https://picsum.photos/seed/vl-5/400/225', description: 'Explore the different organelles within a eukaryotic cell.', duration: '22:30', difficulty: 'Intermediate' },
  { id: 'vl-6', subjectId: 'subj-5', title: 'Mawu Oyamba a Chichewa', thumbnail: 'https://picsum.photos/seed/vl-6/400/225', description: 'Kufotokozera za ulemerero wa chilankhulo cha Chichewa.', duration: '14:00', difficulty: 'Beginner' },
  { id: 'vl-7', subjectId: 'subj-7', title: 'Basics of Farming', thumbnail: 'https://picsum.photos/seed/vl-7/400/225', description: 'Learn the fundamentals of agriculture and crop science.', duration: '20:15', difficulty: 'Beginner' },
  { id: 'vl-8', subjectId: 'subj-8', title: 'World Climates', thumbnail: 'https://picsum.photos/seed/vl-8/400/225', description: 'An overview of the different climate zones around the globe.', duration: '17:50', difficulty: 'Intermediate' },
];

export const INITIAL_LIVE_CLASSES: LiveClass[] = [
  { id: 'lc-1', subjectId: 'subj-1', title: 'Live Q&A: Calculus Problems', teacherName: 'Bright Nason (Teacher)', teacherId: 'user-8', startTime: new Date(Date.now() + 2 * 60 * 60 * 1000) },
  { id: 'lc-2', subjectId: 'subj-2', title: 'Poetry Analysis Workshop', teacherName: 'Emily Carter', teacherId: 'user-2', startTime: new Date(Date.now() + 24 * 60 * 60 * 1000) },
];

export const PAYMENT_HISTORY: PaymentRecord[] = [
  { id: 'pay-1', studentId: 'user-1', studentName: 'Alice Smith', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), amount: 10000, method: 'Airtel Money', plan: SubscriptionPlan.Weekly },
  { id: 'pay-2', studentId: 'user-6', studentName: 'Bright Nason', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), amount: 35000, method: 'TNM Mpamba', plan: SubscriptionPlan.Monthly },
  { id: 'pay-3', studentId: 'user-4', studentName: 'Charlie Davis', date: new Date(Date.now() - 25 * 60 * 60 * 1000), amount: 2000, method: 'National Bank', plan: SubscriptionPlan.Daily },
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
  { studentId: 'user-4', subjectId: 'subj-1' },
  { studentId: 'user-6', subjectId: 'subj-1' },
  { studentId: 'user-6', subjectId: 'subj-4' },
  { studentId: 'user-6', subjectId: 'subj-5' },
  { studentId: 'user-9', subjectId: 'subj-3' },
];

export const LESSON_COMPLETIONS: LessonCompletion[] = [
  { studentId: 'user-1', lessonId: 'vl-1', completedAt: new Date() },
  { studentId: 'user-6', lessonId: 'vl-2', completedAt: new Date() },
];

export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'log-1', userId: 'user-2', type: ActivityType.NewLesson, text: 'Emily Carter uploaded a new lesson: "Understanding Shakespeare"', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), read: true },
  { id: 'log-2', userId: 'all', type: ActivityType.LiveReminder, text: 'Live Q&A: Calculus Problems is starting in 2 hours.', timestamp: new Date(Date.now() + 10000), read: false },
  { id: 'log-3', userId: 'user-7', type: ActivityType.NewEnrollment, text: 'Alice Smith enrolled in Mathematics.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), read: false },
  { id: 'log-4', userId: 'user-7', type: ActivityType.PaymentReceived, text: 'Payment from Alice Smith (K10,000) via Airtel Money.', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), read: true },
  { id: 'log-5', userId: 'user-2', type: ActivityType.QuizSubmission, text: 'Alice Smith scored 1/2 on "Introduction to Algebra" quiz.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), read: false },
  { id: 'log-6', userId: 'all', type: ActivityType.NewExamination, text: 'The "End of Term 1 Examination" is now available for all students.', timestamp: new Date(Date.now() - 60 * 60 * 1000), read: false },
  { id: 'log-7', userId: 'user-8', type: ActivityType.NewPostComment, text: 'Bright Nason commented on your post in Mathematics.', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), read: false },
  { id: 'log-8', userId: 'user-8', type: ActivityType.NewDirectMessage, text: 'You have a new message from Alice Smith.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), read: false },
  { id: 'log-9', userId: 'user-8', type: ActivityType.NewCommentOnPostTeacher, text: 'Bright Nason commented on your post "Quiz on Friday will cover..."', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), read: false },
  { id: 'log-10', userId: 'user-2', type: ActivityType.NewEnrollmentInClass, text: 'Alice Smith has enrolled in your English class.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), read: false },
  { id: 'log-11', userId: 'user-7', type: ActivityType.TeacherApplication, text: 'Frank Green has applied to be a teacher.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), read: false },

];

export const BOOKS: Book[] = [
  { id: 'book-1', title: 'Comprehensive Mathematics Form 1 & 2', author: 'Dr. John Phiri', subject: 'Mathematics', price: 5000, coverPhoto: 'https://picsum.photos/seed/book1/300/400' },
  { id: 'book-2', title: 'English Grammar Guide', author: 'Jane Banda', subject: 'English', price: 4500, coverPhoto: 'https://picsum.photos/seed/book2/300/400' },
  { id: 'book-3', title: 'Introduction to Malawian Biology', author: 'Dr. Emily Carter', subject: 'Biology', price: 5500, coverPhoto: 'https://picsum.photos/seed/book3/300/400' },
  { id: 'book-4', title: 'Chemistry Matters', author: 'Prof. Peter Moyo', subject: 'Chemistry', price: 6000, coverPhoto: 'https://picsum.photos/seed/book4/300/400' },
];

export const BOOK_PURCHASES: BookPurchase[] = [];

export const BOOK_READINGS: BookReading[] = [];

export const BOOKMARKS: LessonBookmark[] = [
    { studentId: 'user-6', lessonId: 'vl-3' },
    { studentId: 'user-6', lessonId: 'vl-5' },
];

export const SUBJECT_POSTS: SubjectPost[] = [
    { id: 'post-1', subjectId: 'subj-1', teacherId: 'user-8', teacherName: 'Bright Nason (Teacher)', teacherProfilePic: 'https://i.pravatar.cc/150?u=user-8', type: PostType.Announcement, text: 'Welcome to Mathematics class! Please review the syllabus in the course materials section.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'post-2', subjectId: 'subj-1', teacherId: 'user-8', teacherName: 'Bright Nason (Teacher)', teacherProfilePic: 'https://i.pravatar.cc/150?u=user-8', type: PostType.Question, text: 'Quiz on Friday will cover the first two lessons. Any questions?', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

export const POST_COMMENTS: PostComment[] = [
    { id: 'comment-1', postId: 'post-2', authorId: 'user-6', authorName: 'Bright Nason', authorProfilePic: 'https://i.pravatar.cc/150?u=user-6', text: 'I do have a question about quadratic equations. Can we review that?', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) }
];

export const INITIAL_DIRECT_MESSAGES: DirectMessage[] = [
  { id: 'dm-1', senderId: 'user-7', receiverId: 'user-2', text: 'Hi Emily, just checking in. How are the English classes going?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'dm-2', senderId: 'user-2', receiverId: 'user-7', text: 'Hi! They are going well. The students are very engaged with the new poetry unit.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { id: 'dm-3', senderId: 'user-1', receiverId: 'user-8', text: 'Good morning sir, I was having trouble with the algebra homework, specifically question 3.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
];

export const EXAMINATION_QUESTIONS: ExaminationQuestion[] = [
    // Mathematics
    { id: 'exq-m1', subjectId: 'subj-1', questionText: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4'},
    { id: 'exq-m2', subjectId: 'subj-1', questionText: 'Solve for x: 2x = 10', options: ['2', '4', '5', '10'], correctAnswer: '5'},
    // English
    { id: 'exq-e1', subjectId: 'subj-2', questionText: 'Which is a synonym for "happy"?', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correctAnswer: 'Joyful'},
    { id: 'exq-e2', subjectId: 'subj-2', questionText: 'What is the plural of "mouse"?', options: ['Mouses', 'Mice', 'Mouse', 'Meese'], correctAnswer: 'Mice'},
    // Biology
    { id: 'exq-b1', subjectId: 'subj-3', questionText: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Chloroplast'], correctAnswer: 'Mitochondrion'},
    // Chemistry
    { id: 'exq-c1', subjectId: 'subj-4', questionText: 'What is the chemical symbol for water?', options: ['O2', 'H2O', 'CO2', 'NaCl'], correctAnswer: 'H2O'},
    // Chichewa
    { id: 'exq-ch1', subjectId: 'subj-5', questionText: 'Moni amatanthauza chiyani mu Chingerezi?', options: ['Goodbye', 'Thank you', 'Hello', 'Sorry'], correctAnswer: 'Hello'},
];

export const EXAMINATIONS: Examination[] = [
    { id: 'exam-1', title: 'End of Term 1 Examination', questions: EXAMINATION_QUESTIONS, durationMinutes: 10 },
];

export const EXAMINATION_ATTEMPTS: ExaminationAttempt[] = [
    {
        id: 'exatt-1',
        studentId: 'user-6',
        studentName: 'Bright Nason',
        examinationId: 'exam-1',
        examinationTitle: 'End of Term 1 Examination',
        answers: { 'exq-m1': '4', 'exq-e1': 'Joyful', 'exq-b1': 'Mitochondrion', 'exq-c1': 'H2O', 'exq-m2': '2', 'exq-e2': 'Mice', 'exq-ch1': 'Hello' },
        score: 6,
        totalQuestions: 7,
        scoresBySubject: {
            'subj-1': { score: 1, total: 2 },
            'subj-2': { score: 2, total: 2 },
            'subj-3': { score: 1, total: 1 },
            'subj-4': { score: 1, total: 1 },
            'subj-5': { score: 1, total: 1 },
        },
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
];

export const WITHDRAWALS: Withdrawal[] = [
  { id: 'wd-1', amount: 15000, method: 'Airtel Money', phoneNumber: '0991234567', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 'wd-2', amount: 25000, method: 'TNM Mpamba', phoneNumber: '0888765432', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: 'wd-3', amount: 8000, method: 'Airtel Money', phoneNumber: '0999876543', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
];

export const PLANS = [
  {
    plan: SubscriptionPlan.Daily,
    name: 'Daily Pass',
    price: 2000,
    durationDays: 1,
    description: '24 hours of full access.'
  },
  {
    plan: SubscriptionPlan.Weekly,
    name: 'Weekly Pass',
    price: 10000,
    durationDays: 7,
    description: 'Full access for a week.'
  },
  {
    plan: SubscriptionPlan.Monthly,
    name: 'Monthly Pass',
    price: 35000,
    durationDays: 30,
    description: 'Best value for a full month.'
  }
];