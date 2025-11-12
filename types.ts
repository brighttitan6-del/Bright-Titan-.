// FIX: Removed self-import of `Role` and added the `Role` enum definition to fix a circular dependency.
export enum Role {
  Student = 'Student',
  Teacher = 'Teacher',
  Owner = 'Owner',
}

export enum ApplicationStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
}

export interface JobApplication {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    subjects: string[]; // e.g., ["Mathematics", "Physics"]
    status: ApplicationStatus;
    timestamp: Date;
    cvFileName?: string;
    cvDataUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profilePicture?: string;
  password?: string;
}

export interface Teacher extends User {
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  coverPhoto: string;
  teacherName: string;
  teacherId: string;
  description: string;
}

export interface VideoLesson {
  id: string;
  subjectId: string;
  title: string;
  thumbnail: string;
  description: string;
  duration: string; // e.g., "15:30"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string[];
}

export interface LiveClass {
  id: string;
  subjectId: string;
  title: string;
  teacherName: string;
  // FIX: Added teacherId to LiveClass to allow for filtering by teacher.
  teacherId: string;
  startTime: Date;
}

export interface ChatMessage {
  sender: 'user' | 'ai' | 'student' | 'teacher';
  text: string;
  timestamp: Date;
  name?: string; // For student/teacher chat
}

export interface PaymentRecord {
  id:string;
  studentId: string;
  date: string; // ISO string
  amount: number;
  method: string;
  phoneNumber?: string;
  accountNumber?: string;
  purchaseType?: 'tuition' | 'book';
  purchaseId?: string; // e.g., bookId
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  lessonId: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
}

export interface Enrollment {
  studentId: string;
  subjectId: string;
}

export interface LessonCompletion {
  studentId: string;
  lessonId: string;
  completedAt: Date;
}

export enum ActivityType {
  NewLesson = 'New Lesson Alert',
  LiveReminder = 'Live Class Reminder',
  NewEnrollment = 'New Student Enrollment',
  QuizSubmission = 'Quiz Submission',
  PaymentReceived = 'Payment Received',
  NewQuizCreated = 'New Quiz Created',
  NewBookPurchase = 'New Book Purchase',
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    subject: string;
    price: number;
    coverPhoto: string;
}

export interface BookPurchase {
    studentId: string;
    bookId: string;
}

export enum PostType {
    Announcement = 'Announcement',
    Question = 'Question',
}

export interface SubjectPost {
    id: string;
    subjectId: string;
    teacherId: string;
    teacherName: string;
    teacherProfilePic?: string;
    type: PostType;
    text: string;
    timestamp: Date;
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface Withdrawal {
  id: string;
  amount: number;
  method: 'Airtel Money' | 'TNM Mpamba';
  phoneNumber: string;
  timestamp: Date;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
}