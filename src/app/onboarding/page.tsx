'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, User, Scale, Ruler, Calendar, Target,
  Activity, AlertCircle, CheckCircle2, Heart, Pill, Dumbbell,
  Coffee, Moon, Cigarette, Clock, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateBMI, getBMICategory, determineFitnessLevel, translateGoal, translateFitnessLevel } from '@/lib/utils';
import { saveUserData } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { Gender, Goal } from '@/lib/types';

type AnamneseMode = 'summary' | 'full';

interface FormData {
  name: string; age: string; weight: string; height: string;
  gender: Gender | ''; goal: Goal | ''; weeklyFrequency: string;
  hasBariatricSurgery: string; usesGLP1Medication: string;
  parQHeartCondition: string; parQChestPain: string; parQDizziness: string;
  hasChronicConditions: string; takesMedication: string; medicationName: string; hasFamilyHistory: string;
  hasPastInjuries: string; injuryDetails: string; hasJointPain: string; jointPainLocation: string;
  dailySittingHours: string; sleepQuality: string; stressLevel: string;
  smokes: string; drinksAlcohol: string; timeWithoutTraining: string;
}

const INITIAL_FORM: FormData = {
  name: '', age: '', weight: '', height: '', gender: '', goal: '', weeklyFrequency: '',
  hasBariatricSurgery: '', usesGLP1Medication: '',
  parQHeartCondition: '', parQChestPain: '', parQDizziness: '',
  hasChronicConditions: '', takesMedication: '', medicationName: '', hasFamilyHistory: '',
  hasPastInjuries: '', injuryDetails: '', hasJointPain: '', jointPainLocation: '',
  dailySittingHours: '', sleepQuality: '', stressLevel: '', smokes: '', drinksAlcohol: '', timeWithoutTraining: '',
};

const YesNo = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="grid grid-cols-2 gap-3">
    {['sim', 'nao'].map((opt) => (
      <label key={opt} className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${value === opt ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
        <RadioGroupItem value={opt} className="sr-only" />
        <span className="font-medium capitalize">{opt === 'sim' ? 'Sim' : 'Não'}</span>
      </label>
    ))}
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [mode, setMode] = useState<AnamneseMode | null>(null);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const totalSteps = mode === 'full' ? 9 : 5;
  const parQAlert = mode === 'full' && step === 5 &&
    (formData.parQHeartCondition === 'sim' || formData.parQChestPain === 'sim' || formData.parQDizziness === 'sim');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('onboarding_mode') as AnamneseMode | null;
      const savedStep = localStorage.getItem('onboarding_step');
      const savedForm = localStorage.getItem('onboarding_form_data');
      if (savedMode) setMode(savedMode);
      if (savedStep) setStep(Number(savedStep));
      if (savedForm) setFormData(JSON.parse(savedForm));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mode) return;
    try {
      localStorage.setItem('onboarding_mode', mode);
      localStorage.setItem('onboarding_step', step.toString());
      localStorage.setItem('onboarding_form_data', JSON.stringify(formData));
    } catch { /* ignore */ }
  }, [mode, step, formData]);

  const handle = (field: keyof FormData, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const getSpecialConditionsStep = () => (mode === 'full' ? 9 : 5);

  const isStepValid = (): boolean => {
    switch (step) {
      case 1: return !!(formData.name && formData.age && formData.gender);
      case 2: return !!(formData.weight && formData.height);
      case 3: return !!formData.goal;
      case 4: return !!formData.weeklyFrequency;
      case 5:
        if (mode === 'full') return !!(formData.parQHeartCondition && formData.parQChestPain && formData.parQDizziness);
        return !!(formData.hasBariatricSurgery && formData.usesGLP1Medication && consentGiven);
      case 6: return !!(formData.hasChronicConditions && formData.hasFamilyHistory &&
        (formData.takesMedication === 'nao' || (formData.takesMedication === 'sim' && formData.medicationName)));
      case 7: return !!(formData.hasPastInjuries && formData.hasJointPain);
      case 8: return !!(formData.dailySittingHours && formData.sleepQuality && formData.stressLevel &&
        formData.smokes && formData.drinksAlcohol && formData.timeWithoutTraining);
      case 9: return !!(formData.hasBariatricSurgery && formData.usesGLP1Medication && consentGiven);
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) { setStep(step + 1); return; }
    setIsSaving(true); setSaveError(null);
    try {
      const bmi = calculateBMI(Number(formData.weight), Number(formData.height));
      const saved = await saveUserData({
        name: formData.name, age: Number(formData.age),
        weight: Number(formData.weight), height: Number(formData.height),
        gender: formData.gender as Gender, goal: formData.goal as Goal,
        fitness_level: determineFitnessLevel(Number(formData.age), bmi, Number(formData.weeklyFrequency)),
        weekly_frequency: Number(formData.weeklyFrequency),
        has_bariatric_surgery: formData.hasBariatricSurgery === 'sim',
        uses_glp1_medication: formData.usesGLP1Medication === 'sim',
        health_data_consent_at: new Date().toISOString(),
        anamnese_type: mode ?? 'summary',
        // PAR-Q
        par_q_heart_condition: formData.parQHeartCondition === 'sim',
        par_q_chest_pain: formData.parQChestPain === 'sim',
        par_q_dizziness: formData.parQDizziness === 'sim',
        // Histórico médico
        has_chronic_conditions: formData.hasChronicConditions === 'sim',
        takes_continuous_medication: formData.takesMedication === 'sim',
        medication_name: formData.medicationName || undefined,
        has_family_disease_history: formData.hasFamilyHistory === 'sim',
        // Lesões
        has_past_injuries: formData.hasPastInjuries === 'sim',
        injury_details: formData.injuryDetails || undefined,
        has_joint_pain: formData.hasJointPain === 'sim',
        joint_pain_location: formData.jointPainLocation || undefined,
        // Estilo de vida
        daily_sitting_hours: formData.dailySittingHours ? Number(formData.dailySittingHours) : undefined,
        sleep_quality: formData.sleepQuality || undefined,
        stress_level: formData.stressLevel || undefined,
        smokes: formData.smokes === 'sim',
        drinks_alcohol: formData.drinksAlcohol === 'sim',
        time_without_training: formData.timeWithoutTraining || undefined,
      });
      if (!saved) { setSaveError('Não foi possível salvar seus dados. Verifique sua conexão e tente novamente.'); return; }
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_form_data');
      localStorage.removeItem('onboarding_mode');
      router.push('/dashboard');
    } catch {
      setSaveError('Ocorreu um erro ao salvar seus dados. Tente novamente.');
    } finally { setIsSaving(false); }
  };

  const bmi = formData.weight && formData.height ? calculateBMI(Number(formData.weight), Number(formData.height)) : 0;
  const fitnessLevel = formData.age && formData.weeklyFrequency
    ? determineFitnessLevel(Number(formData.age), bmi, Number(formData.weeklyFrequency)) : 'iniciante';

  if (isChecking) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Carregando...</p>
    </div>
  );

  // ── Tela de introdução ──────────────────────────────────────────────────────
  if (mode === null) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,0.1),transparent_60%)]" />
      <div className="relative w-full max-w-lg">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Dumbbell className="w-8 h-8 text-yellow-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">Fit Smart 360°</span>
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl text-center mb-4">Anamnese Fitness</h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed text-center mb-6">
            Para montar um projeto de treino <strong className="text-white">seguro e eficaz</strong>, vamos fazer uma triagem com perguntas sobre seu histórico de saúde, rotina e objetivos. Isso permite <span className="text-yellow-500">individualizar a prescrição e prevenir lesões</span>.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-400 text-center font-medium">
              ⭐ O questionário completo permite que a IA monte um projeto muito mais preciso e seguro para o seu perfil.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => { setMode('full'); setStep(1); }}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-5 rounded-2xl text-base"
            >
              Fazer completo <span className="ml-1 text-xs bg-black/20 px-2 py-0.5 rounded-full">Recomendado</span>
            </Button>
            <Button
              onClick={() => { setMode('summary'); setStep(1); }}
              variant="outline"
              className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 py-4 rounded-2xl"
            >
              Versão resumida (5 perguntas)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Passos ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Passo {step} de {totalSteps}</span>
            <span className="text-sm text-yellow-500 font-semibold">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-8 shadow-2xl">

          {/* STEP 1: Dados pessoais */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><User className="w-7 h-7 text-yellow-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Vamos nos conhecer!</h2>
                <p className="text-gray-400">Conte um pouco sobre você</p>
              </div>
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={formData.name} onChange={e => handle('name', e.target.value)} placeholder="Seu nome" className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input type="number" value={formData.age} onChange={e => handle('age', e.target.value)} placeholder="Ex: 25" className="pl-10 bg-gray-800 border-gray-700 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Sexo</Label>
                <RadioGroup value={formData.gender} onValueChange={v => handle('gender', v)}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['masculino', 'feminino', 'outro'].map(g => (
                      <label key={g} className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.gender === g ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                        <RadioGroupItem value={g} className="sr-only" />
                        <span className="font-medium capitalize">{g}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* STEP 2: Medidas */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Scale className="w-7 h-7 text-yellow-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Suas medidas</h2>
                <p className="text-gray-400">Precisamos saber seu peso e altura</p>
              </div>
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input type="number" step="0.1" value={formData.weight} onChange={e => handle('weight', e.target.value)} placeholder="Ex: 70.5" className="pl-10 bg-gray-800 border-gray-700 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Altura (cm)</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input type="number" value={formData.height} onChange={e => handle('height', e.target.value)} placeholder="Ex: 175" className="pl-10 bg-gray-800 border-gray-700 text-white" />
                </div>
              </div>
              {bmi > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-5 h-5 text-yellow-500" /><span className="font-semibold text-yellow-500">Seu IMC</span></div>
                  <p className="text-2xl font-bold">{bmi}</p>
                  <p className="text-sm text-gray-400">{getBMICategory(bmi)}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Objetivo */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Target className="w-7 h-7 text-yellow-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Qual seu objetivo?</h2>
                <p className="text-gray-400">Vamos criar treinos focados no que você quer</p>
              </div>
              <RadioGroup value={formData.goal} onValueChange={v => handle('goal', v)}>
                <div className="space-y-3">
                  {[
                    { value: 'perder_peso', label: 'Perder Peso', desc: 'Reduzir gordura corporal' },
                    { value: 'ganhar_massa', label: 'Ganhar Massa', desc: 'Aumentar músculos' },
                    { value: 'definir', label: 'Definir', desc: 'Tonificar e definir' },
                    { value: 'saude', label: 'Saúde', desc: 'Melhorar condicionamento' },
                    { value: 'resistencia', label: 'Resistência', desc: 'Aumentar stamina' },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.goal === opt.value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                      <RadioGroupItem value={opt.value} className="sr-only" />
                      <div className="flex-1"><p className="font-semibold">{opt.label}</p><p className="text-sm text-gray-400">{opt.desc}</p></div>
                      {formData.goal === opt.value && <CheckCircle2 className="w-5 h-5 text-yellow-500" />}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* STEP 4: Frequência */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Activity className="w-7 h-7 text-yellow-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Frequência semanal</h2>
                <p className="text-gray-400">Quantos dias por semana você pode treinar?</p>
              </div>
              <RadioGroup value={formData.weeklyFrequency} onValueChange={v => handle('weeklyFrequency', v)}>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 3, 4, 5, 6].map(d => (
                    <label key={d} className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl cursor-pointer transition-all ${formData.weeklyFrequency === String(d) ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                      <RadioGroupItem value={String(d)} className="sr-only" />
                      <span className="text-3xl font-bold mb-1">{d}x</span>
                      <span className="text-xs text-gray-400">por semana</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* STEP 5 FULL: PAR-Q */}
          {step === 5 && mode === 'full' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Heart className="w-7 h-7 text-red-400" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">PAR-Q</h2>
                <p className="text-gray-400 text-sm">Prontidão para Atividade Física — identifica riscos cardíacos</p>
              </div>
              {parQAlert && (
                <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">Recomendamos que consulte um médico antes de iniciar o programa de exercícios. Você pode prosseguir, mas faça acompanhamento médico.</p>
                  </div>
                </div>
              )}
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300 leading-relaxed">Algum médico já disse que você possui problema de coração e que só deveria fazer exercícios supervisionados?</Label>
                  <RadioGroup value={formData.parQHeartCondition} onValueChange={v => handle('parQHeartCondition', v)}>
                    <YesNo value={formData.parQHeartCondition} onChange={v => handle('parQHeartCondition', v)} />
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300 leading-relaxed">Você sente dores no peito ao praticar atividades físicas ou sentiu dor no peito em repouso no último mês?</Label>
                  <RadioGroup value={formData.parQChestPain} onValueChange={v => handle('parQChestPain', v)}>
                    <YesNo value={formData.parQChestPain} onChange={v => handle('parQChestPain', v)} />
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300 leading-relaxed">Você apresenta desequilíbrio por tontura ou já perdeu a consciência?</Label>
                  <RadioGroup value={formData.parQDizziness} onValueChange={v => handle('parQDizziness', v)}>
                    <YesNo value={formData.parQDizziness} onChange={v => handle('parQDizziness', v)} />
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Histórico médico */}
          {step === 6 && mode === 'full' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Pill className="w-7 h-7 text-yellow-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Histórico médico</h2>
                <p className="text-gray-400 text-sm">Condições preexistentes e fatores de risco</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300">Você possui pressão alta, diabetes ou colesterol alto?</Label>
                  <RadioGroup value={formData.hasChronicConditions} onValueChange={v => handle('hasChronicConditions', v)}>
                    <YesNo value={formData.hasChronicConditions} onChange={v => handle('hasChronicConditions', v)} />
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300">Toma algum medicamento de uso contínuo atualmente?</Label>
                  <RadioGroup value={formData.takesMedication} onValueChange={v => handle('takesMedication', v)}>
                    <YesNo value={formData.takesMedication} onChange={v => handle('takesMedication', v)} />
                  </RadioGroup>
                  {formData.takesMedication === 'sim' && (
                    <Input value={formData.medicationName} onChange={e => handle('medicationName', e.target.value)} placeholder="Qual medicamento?" className="bg-gray-800 border-gray-700 text-white mt-2" />
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300">Tem histórico familiar de doenças graves (infartos, diabetes, AVC)?</Label>
                  <RadioGroup value={formData.hasFamilyHistory} onValueChange={v => handle('hasFamilyHistory', v)}>
                    <YesNo value={formData.hasFamilyHistory} onChange={v => handle('hasFamilyHistory', v)} />
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Lesões e dores */}
          {step === 7 && mode === 'full' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-orange-400" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Lesões e dores</h2>
                <p className="text-gray-400 text-sm">Movimentos que precisamos evitar ou adaptar</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300">Sofreu alguma lesão grave, cirurgia ou fratura recentemente ou no passado?</Label>
                  <RadioGroup value={formData.hasPastInjuries} onValueChange={v => handle('hasPastInjuries', v)}>
                    <YesNo value={formData.hasPastInjuries} onChange={v => handle('hasPastInjuries', v)} />
                  </RadioGroup>
                  {formData.hasPastInjuries === 'sim' && (
                    <Input value={formData.injuryDetails} onChange={e => handle('injuryDetails', e.target.value)} placeholder="Descreva brevemente (ex: joelho direito, 2024)" className="bg-gray-800 border-gray-700 text-white mt-2" />
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-gray-300">Sente dores frequentes ou desconforto nas articulações, coluna ou joelhos?</Label>
                  <RadioGroup value={formData.hasJointPain} onValueChange={v => handle('hasJointPain', v)}>
                    <YesNo value={formData.hasJointPain} onChange={v => handle('hasJointPain', v)} />
                  </RadioGroup>
                  {formData.hasJointPain === 'sim' && (
                    <Input value={formData.jointPainLocation} onChange={e => handle('jointPainLocation', e.target.value)} placeholder="Onde? (ex: coluna lombar, joelho esquerdo)" className="bg-gray-800 border-gray-700 text-white mt-2" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Estilo de vida */}
          {step === 8 && mode === 'full' && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Coffee className="w-7 h-7 text-blue-400" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Rotina e estilo de vida</h2>
                <p className="text-gray-400 text-sm">Calibra a intensidade e o volume do treino</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300 flex items-center gap-2"><Clock className="w-4 h-4" /> Quantas horas por dia você passa sentado?</Label>
                <RadioGroup value={formData.dailySittingHours} onValueChange={v => handle('dailySittingHours', v)}>
                  <div className="grid grid-cols-2 gap-2">
                    {[['2', 'Menos de 2h'], ['4', '2 a 4h'], ['6', '4 a 6h'], ['8', '6 a 8h'], ['10', 'Mais de 8h']].map(([v, l]) => (
                      <label key={v} className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer text-sm transition-all ${formData.dailySittingHours === v ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                        <RadioGroupItem value={v} className="sr-only" />{l}
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300 flex items-center gap-2"><Moon className="w-4 h-4" /> Qualidade do sono e nível de estresse</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Sono</p>
                    <RadioGroup value={formData.sleepQuality} onValueChange={v => handle('sleepQuality', v)}>
                      <div className="space-y-2">
                        {[['ruim', 'Ruim'], ['regular', 'Regular'], ['boa', 'Boa'], ['excelente', 'Excelente']].map(([v, l]) => (
                          <label key={v} className={`flex items-center justify-center p-2 border-2 rounded-lg cursor-pointer text-xs transition-all ${formData.sleepQuality === v ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700'}`}>
                            <RadioGroupItem value={v} className="sr-only" />{l}
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Estresse</p>
                    <RadioGroup value={formData.stressLevel} onValueChange={v => handle('stressLevel', v)}>
                      <div className="space-y-2">
                        {[['baixo', 'Baixo'], ['moderado', 'Moderado'], ['alto', 'Alto'], ['muito_alto', 'Muito alto']].map(([v, l]) => (
                          <label key={v} className={`flex items-center justify-center p-2 border-2 rounded-lg cursor-pointer text-xs transition-all ${formData.stressLevel === v ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700'}`}>
                            <RadioGroupItem value={v} className="sr-only" />{l}
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300 flex items-center gap-2"><Cigarette className="w-4 h-4" /> Fuma?</Label>
                  <RadioGroup value={formData.smokes} onValueChange={v => handle('smokes', v)}>
                    <YesNo value={formData.smokes} onChange={v => handle('smokes', v)} />
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Álcool regular?</Label>
                  <RadioGroup value={formData.drinksAlcohol} onValueChange={v => handle('drinksAlcohol', v)}>
                    <YesNo value={formData.drinksAlcohol} onChange={v => handle('drinksAlcohol', v)} />
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">Há quanto tempo está sem treinar?</Label>
                <RadioGroup value={formData.timeWithoutTraining} onValueChange={v => handle('timeWithoutTraining', v)}>
                  <div className="space-y-2">
                    {[
                      ['menos_1_mes', 'Menos de 1 mês'],
                      ['1_3_meses', '1 a 3 meses'],
                      ['3_6_meses', '3 a 6 meses'],
                      ['mais_6_meses', 'Mais de 6 meses'],
                      ['nunca_treinou', 'Nunca treinei'],
                    ].map(([v, l]) => (
                      <label key={v} className={`flex items-center p-3 border-2 rounded-xl cursor-pointer text-sm transition-all ${formData.timeWithoutTraining === v ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                        <RadioGroupItem value={v} className="sr-only" />{l}
                        {formData.timeWithoutTraining === v && <CheckCircle2 className="w-4 h-4 text-yellow-500 ml-auto" />}
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* STEP 5 SUMMARY ou STEP 9 FULL: Condições especiais + LGPD */}
          {step === getSpecialConditionsStep() && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-yellow-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Informações importantes</h2>
                <p className="text-gray-400">Isso nos ajuda a personalizar ainda mais seu treino</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label>Você realizou cirurgia bariátrica?</Label>
                  <RadioGroup value={formData.hasBariatricSurgery} onValueChange={v => handle('hasBariatricSurgery', v)}>
                    <YesNo value={formData.hasBariatricSurgery} onChange={v => handle('hasBariatricSurgery', v)} />
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Você usa medicamentos para emagrecimento?</Label>
                  <p className="text-sm text-gray-400">(Ozempic, Mounjaro, Wegovy)</p>
                  <RadioGroup value={formData.usesGLP1Medication} onValueChange={v => handle('usesGLP1Medication', v)}>
                    <YesNo value={formData.usesGLP1Medication} onChange={v => handle('usesGLP1Medication', v)} />
                  </RadioGroup>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <Checkbox id="consent" checked={consentGiven} onCheckedChange={c => setConsentGiven(c === true)} className="mt-0.5" />
                  <Label htmlFor="consent" className="text-sm text-gray-300 font-normal leading-relaxed cursor-pointer">
                    Concordo com o uso dos meus dados de saúde para personalizar meu treino, conforme a{' '}
                    <button type="button" onClick={() => router.push('/privacidade')} className="text-yellow-500 hover:underline">Política de Privacidade</button>.
                  </Label>
                </div>
                {isStepValid() && (
                  <div className="p-5 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl space-y-3">
                    <h3 className="font-bold text-yellow-500">Seu Perfil</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-gray-400">IMC</p><p className="font-semibold">{bmi}</p></div>
                      <div><p className="text-gray-400">Nível</p><p className="font-semibold">{translateFitnessLevel(fitnessLevel)}</p></div>
                      <div><p className="text-gray-400">Objetivo</p><p className="font-semibold">{translateGoal(formData.goal as Goal)}</p></div>
                      <div><p className="text-gray-400">Frequência</p><p className="font-semibold">{formData.weeklyFrequency}x/semana</p></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {saveError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-center text-red-400">{saveError}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6 sm:mt-8">
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
            <Button onClick={handleNext} disabled={!isStepValid() || isSaving}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-50">
              {isSaving ? 'Salvando...' : step === totalSteps ? 'Finalizar' : 'Continuar'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
