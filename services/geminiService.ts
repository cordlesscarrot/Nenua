
import { GoogleGenAI, Type } from "@google/genai";
import { CornellNote, WeatherInfo, AnalysisResult, HealthAdvice, ChatMessage } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const is429 = error.status === 429 || 
                    error.code === 429 || 
                    error.error?.code === 429 ||
                    error.message?.includes('429') ||
                    error.message?.includes('RESOURCE_EXHAUSTED');

      if (is429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 3000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const startStudentChat = (history: ChatMessage[] = []) => {
  const ai = getAIClient();
  
  // Convert our flat ChatMessage format to Gemini's expected history format
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: msg.text }]
  }));

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: geminiHistory,
    config: {
      systemInstruction: 'You are Nenua AI, a witty and ultra-intelligent AI tutor for students. You help with study schedules, explain complex concepts simply, provide motivational roasts, and help brainstorm project ideas. Keep responses concise but impactful. Use emojis occasionally. Focus on being a supportive yet demanding academic companion.',
    },
  });
};

export const getHealthAdvice = async (symptoms: string): Promise<HealthAdvice> => {
  return withRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User says: "${symptoms}". Act as a student wellness AI. Provide advice for this symptom, considering common student issues like posture, screen time, or exams. Structure JSON as {advice: string, triageLevel: string (Self-Care, Consult Pharmacist, See a Doctor), tips: string[]}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            triageLevel: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["advice", "triageLevel", "tips"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const fetchWeatherPrep = async (location: string): Promise<WeatherInfo> => {
  return withRetry(async () => {
    const ai = getAIClient();
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Weather for ${location}. Also provide a 5-word snarky roast for a student.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const groundedText = searchResponse.text;
    const jsonResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Format this into JSON: "${groundedText}". Structure: {location, temperature, condition, humidity, forecast: [{day, temp, condition}], advisory}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            temperature: { type: Type.STRING },
            condition: { type: Type.STRING },
            humidity: { type: Type.STRING },
            advisory: { type: Type.STRING },
            forecast: { 
              type: Type.ARRAY, 
              items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, temp: { type: Type.STRING }, condition: { type: Type.STRING } } } 
            }
          },
          required: ["location", "temperature", "condition", "humidity", "forecast", "advisory"]
        }
      }
    });
    return { ...JSON.parse(jsonResponse.text || '{}'), sources: [] };
  });
};

export const generateCornellNotes = async (content: string): Promise<CornellNote> => {
  return withRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Synthesize this into Cornell Notes JSON: ${content.substring(0, 5000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            date: { type: Type.STRING },
            cues: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["title", "topic", "date", "cues", "notes", "summary"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeSmartCameraFrame = async (base64Image: string): Promise<AnalysisResult> => {
  return withRetry(async () => {
    const ai = getAIClient();
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } };
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, { text: "Explain visual. JSON: {title, explanation, keyPoints: string[]}" }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            explanation: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "explanation", "keyPoints"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};
