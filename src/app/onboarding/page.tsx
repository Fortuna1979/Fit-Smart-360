'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, User, Scale, Ruler, Calendar, Target, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { calculateBMI, getBMICategory, determineFitnessLevel, translateGoal, translateFitnessLevel } from '@/lib/utils';
import { saveUserData } from '@/lib/supabase-helpers';
import type { Gender, Goal } from '@/lib/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: '' as Gender,
    goal: '' as Goal,
    weeklyFrequency: '',
    hasBariatricSurgery: '',
    usesGLP1Medication: ''
  });

  // Carregar dados salvos do localStorage ao montar o componente
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem('onboarding_step');
      const savedFormData = localStorage.getItem('onboarding_form_data');
      
      if (savedStep) {
        setStep(Number(savedStep));
      }
      
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do onboarding:', error);
    }
  }, []);

  // Salvar progresso no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('onboarding_step', step.toString());
      localStorage.setItem('onboarding_form_data', JSON.stringify(formData));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, [step, formData]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      try {
        // Salvar dados no Supabase
        await saveUserData({
          name: formData.name,
          age: Number(formData.age),
          weight: Number(formData.weight),
          height: Number(formData.height),
          gender: formData.gender,
          goal: formData.goal,
          fitness_level: determineFitnessLevel(Number(formData.age), calculateBMI(Number(formData.weight), Number(formData.height)), Number(formData.weeklyFrequency)),
          weekly_frequency: Number(formData.weeklyFrequency),
          has_bariatric_surgery: formData.hasBariatricSurgery === 'sim',
          uses_glp1_medication: formData.usesGLP1Medication === 'sim'
        });

        // Salvar flag de onboarding completo no localStorage (persiste entre sessões)
        localStorage.setItem('onboarding_completed', 'true');
        
        // Limpar dados temporários do onboarding
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_form_data');
        
        router.push('/dashboard');
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
        // Mesmo com erro, continuar para o dashboard
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_form_data');
        router.push('/dashboard');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.age && formData.gender;
      case 2:
        return formData.weight && formData.height;
      case 3:
        return formData.goal;
      case 4:
        return formData.weeklyFrequency;
      case 5:
        return formData.hasBariatricSurgery && formData.usesGLP1Medication;
      default:
        return false;
    }
  };

  // Cálculo do resumo final
  const bmi = formData.weight && formData.height 
    ? calculateBMI(Number(formData.weight), Number(formData.height))
    : 0;
  
  const fitnessLevel = formData.age && formData.weeklyFrequency
    ? determineFitnessLevel(Number(formData.age), bmi, Number(formData.weeklyFrequency))
    : 'iniciante';

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Passo {step} de {totalSteps}</span>
            <span className="text-sm text-yellow-500 font-semibold">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Vamos nos conhecer!</h2>
                <p className="text-gray-400">Conte um pouco sobre você</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Seu nome"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="Ex: 25"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Sexo</Label>
                <RadioGroup value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                  <div className="grid grid-cols-3 gap-3">
                    <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.gender === 'masculino' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                    }`}>
                      <RadioGroupItem value="masculino" className="sr-only" />
                      <span className="font-medium">Masculino</span>
                    </label>
                    <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.gender === 'feminino' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                    }`}>
                      <RadioGroupItem value="feminino" className="sr-only" />
                      <span className="font-medium">Feminino</span>
                    </label>
                    <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.gender === 'outro' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                    }`}>
                      <RadioGroupItem value="outro" className="sr-only" />
                      <span className="font-medium">Outro</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 2: Medidas */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Suas medidas</h2>
                <p className="text-gray-400">Precisamos saber seu peso e altura</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    placeholder="Ex: 70.5"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    placeholder="Ex: 175"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {formData.weight && formData.height && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-yellow-500">Seu IMC</span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{bmi}</p>
                  <p className="text-sm text-gray-400">{getBMICategory(bmi)}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Objetivo */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Qual seu objetivo?</h2>
                <p className="text-gray-400">Vamos criar treinos focados no que você quer</p>
              </div>

              <RadioGroup value={formData.goal} onValueChange={(value) => handleChange('goal', value)}>
                <div className="space-y-3">
                  {[
                    { value: 'perder_peso', label: 'Perder Peso', desc: 'Reduzir gordura corporal' },
                    { value: 'ganhar_massa', label: 'Ganhar Massa', desc: 'Aumentar músculos' },
                    { value: 'definir', label: 'Definir', desc: 'Tonificar e definir' },
                    { value: 'saude', label: 'Saúde', desc: 'Melhorar condicionamento' },
                    { value: 'resistencia', label: 'Resistência', desc: 'Aumentar stamina' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.goal === option.value
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <div className="flex-1">
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-sm text-gray-400">{option.desc}</p>
                      </div>
                      {formData.goal === option.value && (
                        <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Frequência */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Frequência semanal</h2>
                <p className="text-gray-400">Quantos dias por semana você pode treinar?</p>
              </div>

              <RadioGroup value={formData.weeklyFrequency} onValueChange={(value) => handleChange('weeklyFrequency', value)}>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <label
                      key={days}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.weeklyFrequency === String(days)
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <RadioGroupItem value={String(days)} className="sr-only" />
                      <span className="text-3xl font-bold mb-1">{days}x</span>
                      <span className="text-xs text-gray-400">por semana</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 5: Condições Especiais */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Informações importantes</h2>
                <p className="text-gray-400">Isso nos ajuda a personalizar ainda mais seu treino</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Você realizou cirurgia bariátrica?</Label>
                  <RadioGroup value={formData.hasBariatricSurgery} onValueChange={(value) => handleChange('hasBariatricSurgery', value)}>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.hasBariatricSurgery === 'sim' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                        <RadioGroupItem value="sim" className="sr-only" />
                        <span className="font-medium">Sim</span>
                      </label>
                      <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.hasBariatricSurgery === 'nao' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                        <RadioGroupItem value="nao" className="sr-only" />
                        <span className="font-medium">Não</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Você usa medicamentos para emagrecimento?</Label>
                  <p className="text-sm text-gray-400">(Ozempic, Mounjaro, Wegovy)</p>
                  <RadioGroup value={formData.usesGLP1Medication} onValueChange={(value) => handleChange('usesGLP1Medication', value)}>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.usesGLP1Medication === 'sim' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                        <RadioGroupItem value="sim" className="sr-only" />
                        <span className="font-medium">Sim</span>
                      </label>
                      <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.usesGLP1Medication === 'nao' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                        <RadioGroupItem value="nao" className="sr-only" />
                        <span className="font-medium">Não</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Resumo Final */}
                {isStepValid() && (
                  <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl space-y-4">
                    <h3 className="font-bold text-lg text-yellow-500">Seu Perfil</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">IMC</p>
                        <p className="font-semibold">{bmi}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Nível</p>
                        <p className="font-semibold">{translateFitnessLevel(fitnessLevel)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Objetivo</p>
                        <p className="font-semibold">{translateGoal(formData.goal)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Frequência</p>
                        <p className="font-semibold">{formData.weeklyFrequency}x/semana</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === totalSteps ? 'Finalizar' : 'Continuar'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
