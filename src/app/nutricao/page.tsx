'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Apple, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getUserData, getNutritionPlan, saveNutritionPlan } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';

const BUDGET_OPTIONS = [
  { value: 'economico', label: 'Econômico', desc: 'até R$150/semana', icon: '💚', detail: 'Arroz, feijão, ovo, frango, legumes simples' },
  { value: 'moderado', label: 'Moderado', desc: 'R$150–R$350/semana', icon: '💛', detail: 'Variedade maior, proteínas diversas' },
  { value: 'sem_restricao', label: 'Sem restrição', desc: 'acima de R$350/semana', icon: '💜', detail: 'Qualquer alimento' },
];

const RESTRICTIONS = [
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
  { value: 'sem_lactose', label: 'Sem lactose' },
  { value: 'sem_gluten', label: 'Sem glúten' },
  { value: 'sem_frutos_do_mar', label: 'Sem frutos do mar' },
];

const MACRO_COLORS = ['#EAB308', '#3B82F6', '#10B981'];

interface Food { name: string; quantity: string; calories: number; substitute?: string; }
interface Meal { name: string; icon: string; time: string; calories: number; protein_g?: number; foods: Food[]; }
interface NutritionData {
  daily_calories: number; protein_g: number; carbs_g: number; fats_g: number;
  protein_pct: number; carbs_pct: number; fats_pct: number;
  water_liters: number; notes: string; special_alerts?: string[]; meals: Meal[];
}

export default function NutricaoPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<NutritionData | null>(null);
  const [planDate, setPlanDate] = useState<string | null>(null);
  const [budgetLevel, setBudgetLevel] = useState('moderado');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [mealFrequency, setMealFrequency] = useState(4);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isChecking) loadPlan();
  }, [isChecking]);

  const loadPlan = async () => {
    const existing = await getNutritionPlan();
    if (existing?.plan) {
      setPlan(existing.plan as NutritionData);
      setPlanDate(existing.created_at || null);
      setBudgetLevel(existing.budget_level || 'moderado');
      setMealFrequency(existing.meal_frequency || 4);
      setRestrictions(existing.dietary_restrictions || []);
    }
    setLoading(false);
  };

  const toggleRestriction = (v: string) =>
    setRestrictions(prev => prev.includes(v) ? prev.filter(r => r !== v) : [...prev, v]);

  const generatePlan = async () => {
    setGenerating(true); setError(null);
    try {
      const userData = await getUserData();
      const res = await fetch('/api/generate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            goal: userData?.goal, age: userData?.age, gender: userData?.gender,
            weight: userData?.weight, height: userData?.height,
            weeklyFrequency: userData?.weekly_frequency,
            hasBariatricSurgery: userData?.has_bariatric_surgery,
            usesGLP1Medication: userData?.uses_glp1_medication,
            takesMedication: userData?.takes_continuous_medication,
            medicationName: userData?.medication_name,
            hasChronicConditions: userData?.has_chronic_conditions,
            stressLevel: userData?.stress_level,
            sleepQuality: userData?.sleep_quality,
            smokes: userData?.smokes,
            drinksAlcohol: userData?.drinks_alcohol,
            timeWithoutTraining: userData?.time_without_training,
          },
          budgetLevel, dietaryRestrictions: restrictions, mealFrequency,
        }),
      });
      if (!res.ok) throw new Error('Erro ao gerar plano');
      const { plan: newPlan } = await res.json();
      await saveNutritionPlan({
        budget_level: budgetLevel, dietary_restrictions: restrictions,
        meal_frequency: mealFrequency, daily_calories: newPlan.daily_calories, plan: newPlan,
      });
      setPlan(newPlan);
      setPlanDate(new Date().toISOString());
    } catch {
      setError('Não foi possível gerar o plano. Tente novamente.');
    } finally { setGenerating(false); }
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Apple className="w-10 h-10 text-green-500 animate-pulse" />
    </div>
  );

  const macroData = plan ? [
    { name: 'Proteína', value: plan.protein_pct || 30 },
    { name: 'Carboidratos', value: plan.carbs_pct || 40 },
    { name: 'Gorduras', value: plan.fats_pct || 30 },
  ] : [];

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Plano Nutricional</h1>
            <p className="text-xs text-gray-500">Gerado pela IA com seu perfil</p>
          </div>
          <Apple className="w-6 h-6 text-green-500 ml-auto" />
        </div>
      </header>

      <div className="p-4 space-y-5 max-w-lg mx-auto">

        {/* Form to generate plan */}
        {!plan && (
          <div className="space-y-5">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
              <p className="text-sm text-green-400">
                🥗 Vou criar um plano alimentar personalizado baseado no seu perfil completo, objetivo e condições de saúde.
              </p>
            </div>

            {/* Budget */}
            <div>
              <h2 className="font-bold mb-3">Qual é o seu orçamento semanal com alimentação?</h2>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setBudgetLevel(opt.value)}
                    className={`w-full flex items-center gap-3 p-4 border-2 rounded-2xl text-left transition-all ${budgetLevel === opt.value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-800 hover:border-gray-700'}`}>
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{opt.label} <span className="text-gray-400 font-normal text-sm">— {opt.desc}</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.detail}</p>
                    </div>
                    {budgetLevel === opt.value && <div className="w-3 h-3 rounded-full bg-yellow-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Restrictions */}
            <div>
              <h2 className="font-bold mb-3">Restrições alimentares</h2>
              <div className="flex flex-wrap gap-2">
                {RESTRICTIONS.map(r => (
                  <button key={r.value} onClick={() => toggleRestriction(r.value)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${restrictions.includes(r.value) ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal frequency */}
            <div>
              <h2 className="font-bold mb-3">Quantas refeições por dia?</h2>
              <div className="grid grid-cols-3 gap-3">
                {[3, 4, 5].map(n => (
                  <button key={n} onClick={() => setMealFrequency(n)}
                    className={`p-4 border-2 rounded-2xl text-center transition-all ${mealFrequency === n ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-800 hover:border-gray-700'}`}>
                    <p className="text-2xl font-bold text-yellow-500">{n}</p>
                    <p className="text-xs text-gray-400">refeições</p>
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl"><p className="text-sm text-red-400 text-center">{error}</p></div>}

            <Button onClick={generatePlan} disabled={generating}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-5 rounded-2xl text-base">
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando plano...</> : '🥗 Gerar meu plano alimentar'}
            </Button>
          </div>
        )}

        {/* Existing plan */}
        {plan && (
          <div className="space-y-5">
            {/* Alerts */}
            {plan.special_alerts?.map((alert, i) => (
              <div key={i} className="flex gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-300">{alert}</p>
              </div>
            ))}

            {/* Calories + Macros */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-yellow-500">{plan.daily_calories}</p>
                <p className="text-sm text-gray-400">kcal por dia</p>
                <p className="text-xs text-blue-400 mt-1">💧 {plan.water_liters}L de água/dia</p>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                  <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { label: 'Proteína', g: plan.protein_g, color: 'text-yellow-500' },
                  { label: 'Carboidratos', g: plan.carbs_g, color: 'text-blue-400' },
                  { label: 'Gorduras', g: plan.fats_g, color: 'text-green-400' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={`text-lg font-bold ${m.color}`}>{m.g}g</p>
                    <p className="text-xs text-gray-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {plan.notes && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <p className="text-xs text-blue-400 font-semibold mb-1">📋 Observações do nutricionista</p>
                <p className="text-sm text-gray-300">{plan.notes}</p>
              </div>
            )}

            {/* Meals */}
            <div className="space-y-3">
              <h2 className="font-bold text-base">Refeições do dia</h2>
              {plan.meals?.map((meal, mi) => (
                <div key={mi} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedMeal(expandedMeal === mi ? null : mi)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meal.icon || '🍽️'}</span>
                      <div className="text-left">
                        <p className="font-semibold">{meal.name}</p>
                        <p className="text-xs text-gray-500">{meal.time} · {meal.calories} kcal{meal.protein_g ? ` · ${meal.protein_g}g proteína` : ''}</p>
                      </div>
                    </div>
                    {expandedMeal === mi ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {expandedMeal === mi && (
                    <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-2">
                      {meal.foods?.map((food, fi) => (
                        <div key={fi} className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{food.name}</p>
                            <p className="text-xs text-gray-500">{food.quantity}</p>
                            {food.substitute && (
                              <p className="text-xs text-yellow-600 mt-0.5">↔ Substituto: {food.substitute}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{food.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Plan date + regenerate */}
            <div className="text-center space-y-2">
              {planDate && <p className="text-xs text-gray-600">Plano gerado em {new Date(planDate).toLocaleDateString('pt-BR')}</p>}
              <Button onClick={() => setPlan(null)} variant="outline" className="border-gray-700 text-gray-400 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Gerar novo plano
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
