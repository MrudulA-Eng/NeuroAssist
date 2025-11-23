
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Model configuration
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Analyzes spoken text to determine if the user wants to add a routine,
 * log an emotion, or answer a question.
 */
export const analyzeVoiceIntent = async (transcript: string) => {
  if (!apiKey) {
    console.warn("No API Key provided. Mocking response.");
    return fallbackIntent(transcript);
  }

  const prompt = `
    You are an assistant for a neurodivergent individual. 
    Analyze the user's spoken input: "${transcript}".
    
    Determine the intent:
    1. 'ADD_ROUTINE': User wants to do something (e.g., "I need to eat breakfast", "Walk the dog").
    2. 'ADD_EMOTION': User is expressing feelings (e.g., "I am sad", "I feel happy").
    3. 'ANSWER': User is just chatting or answering a question.
    
    Return JSON.
    If intent is ADD_ROUTINE, provide a short label and a matching emoji.
    If intent is ADD_EMOTION, provide a label (Happy, Sad, Angry, etc.) and emoji.
    If intent is ANSWER, provide the text as the 'reply'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ['ADD_ROUTINE', 'ADD_EMOTION', 'ANSWER'] },
            label: { type: Type.STRING },
            emoji: { type: Type.STRING },
            reply: { type: Type.STRING, description: "The content of the answer or a reply." }
          },
          required: ['intent']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;

  } catch (error) {
    console.error("Gemini Intent Error:", error);
    return fallbackIntent(transcript);
  }
};

/**
 * Generates 2-3 simple questions for the user to gauge mental health status.
 */
export const generateDailyQuestions = async () => {
  if (!apiKey) {
    return [
      { id: '1', text: "How did you sleep last night?", emoji: "😴" },
      { id: '2', text: "What is making you happy today?", emoji: "😊" }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate 2 or 3 simple, friendly, short questions for a neurodivergent individual (child or adult) that will help a therapist understand their daily mental health status (e.g. sleep, anxiety, mood, social interaction). Return a JSON array of objects with 'id', 'text', and 'emoji'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              emoji: { type: Type.STRING }
            },
            required: ['id', 'text', 'emoji']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Gemini Question Error:", e);
    return [
      { id: '1', text: "How are you feeling right now?", emoji: "🤔" },
      { id: '2', text: "Did anything make you upset today?", emoji: "🌧️" }
    ];
  }
};

/**
 * Generates feedback for the parent based on the child's daily activity logs.
 */
export const generateTherapistFeedback = async (
  routines: any[],
  emotions: any[],
  questions: any[]
) => {
  if (!apiKey) {
    return {
        text: "Daily Report: Good effort on routines today. I noticed some happy emotions logged. Keep practicing the morning schedule.",
        points: 50
    };
  }

  const completed = routines.filter(r => r.completed).map(r => r.label).join(', ');
  const missed = routines.filter(r => !r.completed).map(r => r.label).join(', ');
  const emotionLog = emotions.map(e => `${e.label} (${e.emoji})`).join(', ');
  const qa = questions.map(q => `Q: "${q.text}" A: "${q.answer || 'No answer'}"`).join('; ');

  const prompt = `
    You are a professional, compassionate therapist for a neurodivergent individual.
    Analyze the following daily activity log to provide feedback to the parent/guardian.

    Data:
    - Completed Routines: ${completed || 'None'}
    - Missed Routines: ${missed || 'None'}
    - Emotions Logged: ${emotionLog || 'None'}
    - Daily Questions & Answers: ${qa}

    Task:
    1. Write a short, encouraging, and insightful message to the parent. Mention specific wins or areas to focus on based on the data.
    2. Assign "Points" (0-100) based on the level of engagement and completion.

    Return JSON: { "text": "string", "points": number }
  `;

  try {
     const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            points: { type: Type.NUMBER }
          },
          required: ['text', 'points']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Gemini Feedback Error:", e);
    return { text: "Activity log received. Great job today!", points: 20 };
  }
};

// Fallback for when API is missing or fails
const fallbackIntent = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('sad') || lower.includes('happy') || lower.includes('angry')) {
    return { intent: 'ADD_EMOTION', label: 'Emotion', emoji: '😐', reply: "I hear you." };
  }
  return { intent: 'ADD_ROUTINE', label: 'New Task', emoji: '📝', reply: "Added to your list." };
};
