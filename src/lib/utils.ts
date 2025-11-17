import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Gender, Goal, FitnessLevel } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cálculo de IMC
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

// Classificação do IMC
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade grau I';
  if (bmi < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

// Determinar nível de condicionamento físico
export function determineFitnessLevel(
  age: number,
  bmi: number,
  weeklyFrequency: number
): FitnessLevel {
  let score = 0;

  // Pontuação por frequência
  if (weeklyFrequency >= 5) score += 3;
  else if (weeklyFrequency >= 3) score += 2;
  else score += 1;

  // Pontuação por IMC
  if (bmi >= 18.5 && bmi < 25) score += 2;
  else if (bmi >= 25 && bmi < 30) score += 1;

  // Pontuação por idade
  if (age < 30) score += 1;
  else if (age >= 50) score -= 1;

  if (score >= 5) return 'avancado';
  if (score >= 3) return 'intermediario';
  return 'iniciante';
}

// Calcular gasto calórico diário (TMB + atividade)
export function calculateDailyCalories(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  goal: Goal,
  weeklyFrequency: number
): number {
  // Fórmula de Harris-Benedict
  let bmr: number;
  
  if (gender === 'masculino') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Fator de atividade
  let activityFactor = 1.2;
  if (weeklyFrequency >= 5) activityFactor = 1.725;
  else if (weeklyFrequency >= 3) activityFactor = 1.55;
  else if (weeklyFrequency >= 1) activityFactor = 1.375;

  let tdee = bmr * activityFactor;

  // Ajustar por objetivo
  switch (goal) {
    case 'perder_peso':
      tdee *= 0.8; // Déficit de 20%
      break;
    case 'ganhar_massa':
      tdee *= 1.15; // Superávit de 15%
      break;
    case 'definir':
      tdee *= 0.9; // Déficit leve de 10%
      break;
  }

  return Math.round(tdee);
}

// Calcular macros
export function calculateMacros(
  calories: number,
  goal: Goal,
  weight: number
): { protein: number; carbs: number; fats: number } {
  let proteinRatio = 0.3;
  let carbsRatio = 0.4;
  let fatsRatio = 0.3;

  switch (goal) {
    case 'ganhar_massa':
      proteinRatio = 0.35;
      carbsRatio = 0.45;
      fatsRatio = 0.2;
      break;
    case 'perder_peso':
    case 'definir':
      proteinRatio = 0.4;
      carbsRatio = 0.3;
      fatsRatio = 0.3;
      break;
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbsRatio) / 4),
    fats: Math.round((calories * fatsRatio) / 9)
  };
}

// Traduzir objetivo
export function translateGoal(goal: Goal): string {
  const goals = {
    perder_peso: 'Perder Peso',
    ganhar_massa: 'Ganhar Massa',
    definir: 'Definir',
    saude: 'Saúde',
    resistencia: 'Resistência'
  };
  return goals[goal];
}

// Traduzir nível
export function translateFitnessLevel(level: FitnessLevel): string {
  const levels = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado'
  };
  return levels[level];
}

// Formatar moeda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
