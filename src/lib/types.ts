// Personal Fit - Tipos TypeScript

export type Gender = 'masculino' | 'feminino' | 'outro';
export type Goal = 'perder_peso' | 'ganhar_massa' | 'definir' | 'saude' | 'resistencia';
export type FitnessLevel = 'iniciante' | 'intermediario' | 'avancado';
export type EquipmentCategory = 'maquina_guiada' | 'peso_livre' | 'polia' | 'cardio' | 'funcional';
export type WorkoutDifficulty = 'facil' | 'medio' | 'dificil';
export type SubscriptionPlan = 'free' | 'basic' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  goal: Goal;
  weeklyFrequency: number;
  hasBariatricSurgery: boolean;
  usesGLP1Medication: boolean;
  bmi: number;
  fitnessLevel: FitnessLevel;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  targetMuscles: string[];
  imageUrl: string;
  userId: string;
  recognizedByAI: boolean;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  equipmentId: string;
  sets: number;
  reps: number;
  restTime: number; // segundos
  instructions: string;
  targetMuscles: string[];
  videoUrl?: string;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  dayOfWeek: number; // 0-6
  exercises: Exercise[];
  estimatedDuration: number; // minutos
  specialNotes?: string;
  motivationalMessage: string;
  createdAt: Date;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  completedAt: Date;
  difficulty: WorkoutDifficulty;
  notes?: string;
}

export interface NutritionPlan {
  id: string;
  userId: string;
  dailyCalories: number;
  protein: number; // gramas
  carbs: number;
  fats: number;
  meals: Meal[];
  specialNotes?: string;
  createdAt: Date;
}

export interface Meal {
  name: string;
  time: string;
  foods: string[];
  calories: number;
}

export interface AdBanner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  location: 'home' | 'workout' | 'partners';
  active: boolean;
  createdAt: Date;
}

export interface Progress {
  id: string;
  userId: string;
  date: Date;
  weight: number;
  bmi: number;
  photoUrl?: string;
  notes?: string;
}
