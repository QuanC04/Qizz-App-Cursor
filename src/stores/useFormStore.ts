import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Form, FormInput } from '../types';

interface FormState {
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUserForms: (userId: string) => Promise<void>;
  fetchAllPublishedForms: () => Promise<void>;
  fetchFormById: (formId: string) => Promise<Form | null>;
  createForm: (userId: string, formData: FormInput) => Promise<string>;
  updateForm: (formId: string, formData: Partial<FormInput>) => Promise<void>;
  updateFormSilent: (formId: string, formData: Partial<FormInput>) => Promise<void>;
  deleteForm: (formId: string) => Promise<void>;
  setCurrentForm: (form: Form | null) => void;
  clearError: () => void;
}

export const useFormStore = create<FormState>((set, get) => ({
  forms: [],
  currentForm: null,
  loading: false,
  error: null,

  fetchUserForms: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'forms'),
        where('createdBy', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const forms: Form[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Form));
      // Sort client-side to avoid needing composite index
      forms.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });
      set({ forms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAllPublishedForms: async () => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'forms'),
        where('status', '==', 'published')
      );
      const querySnapshot = await getDocs(q);
      const forms: Form[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Form));
      // Sort client-side to avoid needing composite index
      forms.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
      set({ forms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchFormById: async (formId: string) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, 'forms', formId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const form: Form = {
          id: docSnap.id,
          ...docSnap.data()
        } as Form;
        set({ currentForm: form, loading: false });
        return form;
      } else {
        set({ error: 'Form not found', loading: false });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createForm: async (userId: string, formData: FormInput) => {
    try {
      set({ loading: true, error: null });
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'forms'), {
        ...formData,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateForm: async (formId: string, formData: Partial<FormInput>) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, 'forms', formId);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: Timestamp.now(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Silent update without changing loading state (for auto-save)
  updateFormSilent: async (formId: string, formData: Partial<FormInput>) => {
    try {
      const docRef = doc(db, 'forms', formId);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Auto-save error:', error);
    }
  },

  deleteForm: async (formId: string) => {
    try {
      set({ loading: true, error: null });

      // Delete all submissions in the subcollection first
      const submissionsRef = collection(db, 'forms', formId, 'submissions');
      const submissionsSnapshot = await getDocs(submissionsRef);

      // Delete each submission document
      const deletePromises = submissionsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Then delete the form document itself
      await deleteDoc(doc(db, 'forms', formId));

      set({
        forms: get().forms.filter(f => f.id !== formId),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentForm: (form: Form | null) => {
    set({ currentForm: form });
  },

  clearError: () => {
    set({ error: null });
  },
}));
