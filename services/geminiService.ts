import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  // This is a placeholder for the real API key which is expected to be in the environment variables.
  // In a real application, you'd handle this more gracefully, but for this context, we'll log a warning.
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
        // Basic validation
        if (parsed && Array.isArray(parsed.options) && typeof parsed.correctAnswer === 'string') {
            return parsed;
        }
        return null;

    } catch (error) {
        console.error("Gemini API error in generateQuizOptions:", error);
        return null;
    }
};