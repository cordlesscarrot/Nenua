
export enum AppView {
  WEATHER = 'WEATHER',
  NOTES = 'NOTES',
  CAMERA = 'CAMERA',
  DASHBOARD = 'DASHBOARD',
  HEALTH = 'HEALTH',
  CHAT = 'CHAT'
}

export type FocusedView = 'DASHBOARD' | 'WEATHER' | 'VISION' | 'STUDY_LAB' | 'HEALTH' | 'STUDENT_CHAT';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CornellNote {
  title: string;
  topic: string;
  date: string;
  cues: string[];
  notes: string[];
  summary: string;
}

export interface ForecastDay {
  day: string;
  temp: string;
  condition: string;
}

export interface WeatherInfo {
  location: string;
  temperature: string;
  condition: string;
  humidity: string;
  forecast: ForecastDay[];
  advisory: string;
  sources: { title: string; uri: string }[];
}

export interface AnalysisResult {
  title: string;
  explanation: string;
  keyPoints: string[];
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

export interface HealthAdvice {
  advice: string;
  triageLevel: 'Self-Care' | 'Consult Pharmacist' | 'See a Doctor';
  tips: string[];
}
