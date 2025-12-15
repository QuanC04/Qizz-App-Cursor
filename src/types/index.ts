import { Timestamp } from 'firebase/firestore';

// User type from Firebase
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

// Question types
export type QuestionType = 'radio' | 'checkbox' | 'text';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];        // For radio and checkbox
  correctAnswer?: number | number[] | string[];  // number for radio, number[] for checkbox, string[] for text
  points: number;
  order: number;
}

// Form/Quiz
export interface Form {
  id: string;
  title: string;
  description: string;
  createdBy: string;         // User uid
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'draft' | 'published';
  questions: Question[];
  requireLogin?: boolean;     // Require login to take quiz
  oneSubmissionOnly?: boolean; // Allow only one submission per user
  enableTimer?: boolean;      // Enable time limit
  timerMinutes?: number;      // Time limit in minutes
}

// Response/Submission
export interface Response {
  id: string;
  formId: string;
  userId: string;
  userName?: string;
  answers: Record<string, number | number[] | string>;  // questionId -> answer (number for radio, number[] for checkbox, string for text)
  score?: number;
  submittedAt: Timestamp;
  timeSpent?: number;         // Time spent in seconds
}

// Form creation/update input (without auto-generated fields)
export interface FormInput {
  title: string;
  description: string;
  status: 'draft' | 'published';
  questions: Question[];
  requireLogin?: boolean;
  oneSubmissionOnly?: boolean;
  enableTimer?: boolean;
  timerMinutes?: number;
}
