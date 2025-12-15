import { create } from 'zustand';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Response, Form } from '../types';

interface ResponseState {
  responses: Response[];
  loading: boolean;
  error: string | null;

  // Actions
  submitResponse: (formId: string, userId: string, userName: string, answers: Record<string, number | number[] | string>, timeSpent?: number) => Promise<void>;
  fetchResponsesByForm: (formId: string) => Promise<void>;
  calculateScore: (formId: string, answers: Record<string, number | number[] | string>) => Promise<number>;
  clearError: () => void;
}

export const useResponseStore = create<ResponseState>((set, get) => ({
  responses: [],
  loading: false,
  error: null,

  submitResponse: async (
    formId: string,
    userId: string,
    userName: string,
    answers: Record<string, number | number[] | string>,
    timeSpent?: number
  ) => {
    try {
      set({ loading: true, error: null });

      // Calculate score
      const calculatedScore = await get().calculateScore(formId, answers);

      // Save response to subcollection: forms/{formId}/submissions/{submissionId}
      const submissionData: any = {
        userId,
        userEmail: userName,
        answers,
        score: calculatedScore,
        submittedAt: Timestamp.now(),
      };

      // Add timeSpent if provided
      if (timeSpent !== undefined) {
        submissionData.timeSpent = timeSpent;
      }

      await addDoc(collection(db, 'forms', formId, 'submissions'), submissionData);

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchResponsesByForm: async (formId: string) => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'forms', formId, 'submissions'),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const responses: Response[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Response));
      set({ responses, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  calculateScore: async (formId: string, answers: Record<string, number | number[] | string>) => {
    try {
      // Fetch the form to get correct answers
      const formDoc = await getDoc(doc(db, 'forms', formId));
      if (!formDoc.exists()) {
        throw new Error('Form not found');
      }

      const form = formDoc.data() as Form;
      let totalScore = 0;

      // Calculate score based on correct answers
      form.questions.forEach(question => {
        const userAnswer = answers[question.id];
        const correctAnswer = question.correctAnswer;

        // Skip if question not answered (but allow 0 as valid answer)
        if (userAnswer === undefined || userAnswer === null || userAnswer === -1) {
          return;
        }

        // Skip if no correct answer set (but allow 0 as valid correct answer)
        if (correctAnswer === undefined || correctAnswer === null) {
          return;
        }

        // Handle different question types
        if (question.type === 'radio') {
          // Radio: compare as numbers to handle type mismatch (string "0" vs number 0)
          if (Number(userAnswer) === Number(correctAnswer)) {
            totalScore += question.points;
          }
        } else if (question.type === 'checkbox') {
          // Checkbox: both should be number arrays
          const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          const correctAnswerArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

          if (
            userAnswerArray.length === correctAnswerArray.length &&
            userAnswerArray.every(ans => correctAnswerArray.includes(ans as never))
          ) {
            totalScore += question.points;
          }
        } else if (question.type === 'text') {
          // Text: correctAnswer is string[], userAnswer is string
          const correctAnswerArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
          const userAnswerStr = String(userAnswer).toLowerCase().trim();

          // Check if user answer matches any of the correct answers
          if (correctAnswerArray.some((ans) => String(ans).toLowerCase().trim() === userAnswerStr)) {
            totalScore += question.points;
          }
        }
      });

      return totalScore;
    } catch (error: any) {
      console.error('Error calculating score:', error);
      return 0;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
