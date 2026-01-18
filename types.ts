
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
  proTip: string;
  newsHeadline: string;
  sources: { title: string; uri: string }[];
}

export interface DiagramPart {
  id: string;
  name: string;
  description: string;
  points: number[][]; // Normalized 0-1000 [x, y] coordinates
  color: string;
  type: 'label' | 'flow_red' | 'flow_blue' | 'highlight';
}

export interface AnalysisResult {
  title: string;
  explanation: string;
  keyPoints: string[];
  diagramType: 'heart' | 'cell' | 'molecule' | 'general';
  parts: DiagramPart[];
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
