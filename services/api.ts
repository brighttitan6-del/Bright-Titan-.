import { GoogleGenAI, Type } from "@google/genai";
import { USERS, SUBJECTS, VIDEO_LESSONS, INITIAL_LIVE_CLASSES, PAYMENT_HISTORY, QUIZZES, QUIZ_ATTEMPTS, ENROLLMENTS, LESSON_COMPLETIONS, ACTIVITY_LOGS, BOOKS, BOOK_PURCHASES, BOOK_READINGS, BOOKMARKS, SUBJECT_POSTS, POST_COMMENTS, INITIAL_DIRECT_MESSAGES, EXAMINATIONS, EXAMINATION_ATTEMPTS, WITHDRAWALS, PLANS, BOOK_RATINGS, BOOK_NOTES } from '../constants';
import { User, Role, ActivityLog, ActivityType, Enrollment, SubscriptionPlan, LiveClass, VideoLesson } from '../types';

// Simulate network delay
const MOCK_DELAY = 500;
const mockFetch = <T>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), MOCK_DELAY));


// --- DATA FETCHING API (MOCKED) ---

export const fetchAllInitialData = () => {
    return mockFetch({
        users: USERS,
        subjects: SUBJECTS,
        videoLessons: VIDEO_LESSONS,
        liveClasses: INITIAL_LIVE_CLASSES,
        payments: PAYMENT_HISTORY,
        quizzes: QUIZZES,
        quizAttempts: QUIZ_ATTEMPTS,
        enrollments: ENROLLMENTS,
        lessonCompletions: LESSON_COMPLETIONS,
        activityLogs: ACTIVITY_LOGS,
        books: BOOKS,
        bookPurchases: BOOK_PURCHASES,
        bookRatings: BOOK_RATINGS,
        bookNotes: BOOK_NOTES,
        bookReadings: BOOK_READINGS,
        bookmarks: BOOKMARKS,
        subjectPosts: SUBJECT_POSTS,
        postComments: POST_COMMENTS,
        directMessages: INITIAL_DIRECT_MESSAGES,
        examinations: EXAMINATIONS,
        examinationAttempts: EXAMINATION_ATTEMPTS,
        withdrawals: WITHDRAWALS,
        plans: PLANS,
    });
};

export const login = async (email: string, pass: string, role: Role): Promise<User | null> => {
    // In a real app, this would be a POST request to /api/auth/login
    const data = await fetchAllInitialData();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass && u.role === role);
    return mockFetch(user || null);
};

export const googleAuth = async (role: Role): Promise<User | null> => {
    const data = await fetchAllInitialData();
    const defaultUser = data.users.find(u => u.role === role);
    return mockFetch(defaultUser || null);
}

export const signUp = async (name: string, email: string, pass: string, role: Role, cvFile: File | null, message: string): Promise<{ newUser: User, ownerLog?: ActivityLog } | { error: string }> => {
    const data = await fetchAllInitialData();
    if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return mockFetch({ error: 'An account with this email already exists.' });
    }
    
    const newUser: User = { 
        id: `user-${data.users.length + 1}`, 
        name, 
        email, 
        password: pass, 
        role, 
        profilePicture: `https://i.pravatar.cc/150?u=user-${data.users.length + 1}`,
        ...(role === Role.Student && { 
            subscription: { plan: SubscriptionPlan.None, startDate: new Date(), endDate: new Date() },
            oneTimeClassPasses: [],
            notificationSettings: {
                [ActivityType.NewLesson]: true,
                [ActivityType.LiveReminder]: true,
            }
        })
    };
    
    let ownerLog: ActivityLog | undefined = undefined;
    if (role === Role.Teacher) {
        newUser.teacherApplication = {
            cvUrl: cvFile ? `/path/to/${cvFile.name}` : '/path/to/default_cv.pdf',
            message: message,
            status: 'Pending',
        };
        ownerLog = { id: `log-${data.activityLogs.length + 1}`, userId: 'user-7', type: ActivityType.TeacherApplication, text: `${name} has applied to be a teacher.`, timestamp: new Date(), read: false };
    }
    
    return mockFetch({ newUser, ownerLog });
};


export const enrollInSubject = async (studentId: string, subjectId: string): Promise<{newEnrollment: Enrollment, ownerLog: ActivityLog, teacherLog: ActivityLog} | {error: string}> => {
    const data = await fetchAllInitialData();
    if (data.enrollments.some(e => e.studentId === studentId && e.subjectId === subjectId)) {
        return mockFetch({ error: "You are already enrolled in this subject." });
    }
    const student = data.users.find(u => u.id === studentId);
    const subject = data.subjects.find(s => s.id === subjectId);

    if(!student || !subject) {
        return mockFetch({ error: "Student or subject not found." });
    }

    const newEnrollment: Enrollment = { studentId, subjectId };
    const ownerLog: ActivityLog = { id: `log-${data.activityLogs.length + 1}`, userId: 'user-7', type: ActivityType.NewEnrollment, text: `${student.name} enrolled in ${subject.name}.`, timestamp: new Date(), read: false };
    const teacherLog: ActivityLog = { id: `log-${data.activityLogs.length + 2}`, userId: subject.teacherId, type: ActivityType.NewEnrollmentInClass, text: `${student.name} has enrolled in your ${subject.name} class.`, timestamp: new Date(), read: false };
    
    return mockFetch({ newEnrollment, ownerLog, teacherLog });
};


// --- GEMINI API (SHOULD BE ON BACKEND) ---

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI Tutor will not function.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const TUTOR_SYSTEM_INSTRUCTION = "You are an expert AI Tutor for secondary school students. Your name is Bright Titan. Explain concepts clearly, concisely, and accurately. When asked to summarize a topic, provide key bullet points. Be friendly and encouraging.";

export const runAiTutor = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI Tutor is currently unavailable. Please check the API key configuration.";
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, I encountered an error. Please try again later.";
  }
};


const QUIZ_MAKER_SYSTEM_INSTRUCTION = "You are an intelligent assistant for teachers. Given a question, generate three plausible multiple-choice distractors and identify the correct answer. The output must be in JSON format.";

export const generateQuizOptions = async (question: string): Promise<{ options: string[], correctAnswer: string } | null> => {
    if (!process.env.API_KEY) {
        console.error("API key not configured for quiz generation.");
        return null;
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate multiple choice options for this question: "${question}"`,
            config: {
                systemInstruction: QUIZ_MAKER_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 4 strings: 3 distractors and the correct answer."
                        },
                        correctAnswer: {
                            type: Type.STRING,
                            description: "The correct answer from the options array."
                        }
                    },
                    required: ["options", "correctAnswer"]
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (parsed && Array.isArray(parsed.options) && typeof parsed.correctAnswer === 'string') {
            return parsed;
        }
        return null;

    } catch (error) {
        console.error("Gemini API error in generateQuizOptions:", error);
        return null;
    }
};

export const getMotivationalQuote = async (): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Believe you can and you're halfway there."; // Fallback quote
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, one-sentence motivational quote for a secondary school student.",
    });
    return response.text.replace(/"/g, '');
  } catch (error) {
    console.error("Gemini API error (getMotivationalQuote):", error);
    return "The future belongs to those who believe in the beauty of their dreams."; // Fallback quote
  }
};

export const getRecommendedLessons = async (enrolledSubjectIds: string[], allLessons: {id: string, title: string, subjectId: string}[], completedLessonIds: string[]): Promise<string[]> => {
    if (!process.env.API_KEY) {
        return [];
    }

    const availableLessons = allLessons
        .filter(lesson => enrolledSubjectIds.includes(lesson.subjectId) && !completedLessonIds.includes(lesson.id))
        .map(l => ({ id: l.id, title: l.title }));

    if (availableLessons.length === 0) {
        return [];
    }

    const prompt = `A student is enrolled in subjects with these IDs: ${enrolledSubjectIds.join(', ')}. They have already completed lessons with these IDs: ${completedLessonIds.join(', ')}. From the following list of available lessons, please recommend up to 3 relevant lessons for them. Only return the IDs.
    
    Available Lessons: ${JSON.stringify(availableLessons)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a recommendation engine for a learning platform. Your task is to suggest relevant video lessons to a student based on their enrolled subjects and completed lessons. Return only a JSON object with a key 'recommendations' containing an array of the recommended lesson IDs.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendations: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of recommended lesson IDs (strings)."
                        }
                    },
                    required: ["recommendations"]
                },
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed && Array.isArray(parsed.recommendations)) {
            const validLessonIds = new Set(availableLessons.map(l => l.id));
            return parsed.recommendations.filter((id: string) => validLessonIds.has(id)).slice(0, 3);
        }
        return [];

    } catch (error) {
        console.error("Gemini API error in getRecommendedLessons:", error);
        return availableLessons.slice(0, 3).map(l => l.id);
    }
};
