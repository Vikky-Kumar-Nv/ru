
export interface College {
  id: string;
  name: string;
  logo?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  faculty: 'Science' | 'Social Science' | 'Humanities' | 'TRL' | 'Vocational';
}

export enum ResourceType {
  PYQ = 'Previous Year Question',
  NOTE = 'Lecture Note',
  SYLLABUS = 'Syllabus'
}

export enum CoursePattern {
  CBCS = 'CBCS',
  NEP = 'NEP'
}

export enum DegreeLevel {
  UG = 'UG',
  PG = 'PG'
}

export interface Resource {
  id: string;
  title: string;
  collegeId: string;
  subjectId: string;
  semester: number;
  year: number;
  type: ResourceType;
  pattern: CoursePattern;
  degreeLevel: DegreeLevel;
  downloadUrl: string;
  size: string;
  downloadCount: number;
  createdAt?: number; // Timestamp for latest sorting
}

export interface FilterState {
  collegeId: string;
  subjectId: string;
  semester: number | '';
  year: number | '';
  pattern: string;
  degreeLevel: string;
  resourceType: string;
  searchQuery: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface StudyGoal {
  id: string;
  text: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: number;
}

export interface AssessmentResult {
  id: string;
  subjectName: string;
  score: number;
  totalMarks: number;
  date: number;
  feedback: string;
}

export interface User {
  id: string;
  identifier: string; // email or phone
  name: string; // Added student name
  collegeId: string; // Added college selection
  isLoggedIn: boolean;
  credits: number;
  assessmentHistory?: AssessmentResult[];
  savedResources?: string[]; // Added: IDs of saved resources
}

export interface LoginRecord {
  id: string;
  identifier: string;
  timestamp: number;
  method: 'email' | 'phone';
}

export interface Submission {
  id: string;
  userId: string;
  userIdentifier: string;
  fileName: string;
  fileUrl?: string; // Blob URL for the session
  subjectId: string;
  subjectName: string;
  semester: number;
  type: ResourceType;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  creditsEarned?: number;
  pattern?: CoursePattern; // Added for conversion to Resource
  degreeLevel?: DegreeLevel; // Added for conversion to Resource
  collegeId?: string; // Added for conversion to Resource
}

export interface Order {
  id: string;
  userId: string;
  email: string;
  itemName: string;
  subject: string;
  semester: string;
  details: string;
  status: 'pending' | 'fulfilled';
  timestamp: number;
}

export type QuestionType = 'MCQ' | 'SUBJECTIVE';

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options?: string[]; // Only for MCQ
  correctAnswer?: string; // For internal checking if needed, or AI will judge
  maxMarks: number;
}

export interface TestConfig {
  subjectId: string;
  subjectName: string;
  semester: number;
  paperName: string;
  examType: 'Mid-Sem' | 'End-Sem' | 'Mock';
}
