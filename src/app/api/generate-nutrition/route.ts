import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUDGET_LABELS: Record<string, string> = {
  economico: 'Econômico — até R$150/semana (arroz, feijão, ovo, frango, legumes simples)',
  moderado: 'Moderado — R$150 a R$350/semana (variedade maior, proteínas variadas)',
  sem_restricao: 'Sem restrição — acima de R$350/semana (qualquer alimento)',
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Gemini não configurada.' }, { status: 500 });
    }

    const body = await request.json();
    const { userProfile, budgetLevel, dietaryRestrictions, mealFrequency } = body;

    const bmi = userProfile?.weight && userProfile?.height
      ? (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1) : null;

    const specialConditions: string[] = [];
    if (userProfile?.hasBariatricSurgery) specialConditions.push(
      'CIRURGIA BARIÁTRICA: porções muito reduzidas (100-200ml/refeição), proteína em todas as refeições (mínimo 60g/dia), alimentos macios e de fácil digestão, sem líquidos durante refeição, incluir suplementos: B12, cálcio, ferro, vitamina D. Dividir em 5-6 mini-refeições.'
    );
    if (userProfile?.usesGLP1Medication) specialConditions.push(
      'MEDICAÇÃO GLP-1 (Ozempic/Mounjaro/Wegovy): priorizar proteína para evitar perda muscular (mínimo 1,2g por kg de peso), porções pequenas mesmo sem fome, hidratação reforçada (risco de desidratação), evitar gordura saturada e açúcar (agravam náuseas), comer nos horários mesmo sem apetite.'
    );
    if (userProfile?.takesMedication && userProfile?.medicationName) specialConditions.push(
      `MEDICAMENTO CONTÍNUO: ${userProfile.medicationName} — verificar e alertar sobre possíveis interações alimentares conhecidas.`
    );
    if (userProfile?.hasChronicConditions) specialConditions.push(
      'PRESSÃO ALTA/DIABETES/COLESTEROL: reduzir sódio, açúcar refinado e gordura saturada. Preferir alimentos integrais.'
    );

    const prompt = `Você é um nutricionista clínico especializado. Crie um plano alimentar personalizado, seguro e REALISTA para o Brasil. Retorne APENAS JSON válido.

PERFIL DO CLIENTE:
- Objetivo: ${userProfile?.goal || 'saúde geral'}
- Idade: ${userProfile?.age || '?'} anos | Sexo: ${userProfile?.gender || '?'}
- Peso: ${userProfile?.weight || '?'}kg | Altura: ${userProfile?.height || '?'}cm${bmi ? ` | IMC: ${bmi}` : ''}
- Frequência de treino: ${userProfile?.weeklyFrequency || '?'}x por semana
- Tempo sem treinar: ${userProfile?.timeWithoutTraining?.replace(/_/g, ' ') || 'não informado'}
- Estresse: ${userProfile?.stressLevel?.replace(/_/g, ' ') || 'não informado'} | Sono: ${userProfile?.sleepQuality || 'não informado'}
${userProfile?.smokes ? '- Fumante' : ''}${userProfile?.drinksAlcohol ? ' | Consome álcool' : ''}

ORÇAMENTO ALIMENTAR:
${BUDGET_LABELS[budgetLevel] || 'Moderado'}

RESTRIÇÕES E PREFERÊNCIAS:
- Restrições: ${dietaryRestrictions?.length ? dietaryRestrictions.join(', ') : 'Nenhuma'}
- Refeições por dia: ${mealFrequency || 4}

${specialConditions.length ? `CONDIÇÕES ESPECIAIS — SIGA RIGOROSAMENTE:\n${specialConditions.map(c => `• ${c}`).join('\n')}` : ''}

REGRAS IMPORTANTES:
1. Use APENAS alimentos facilmente encontrados em supermercados brasileiros
2. Sugira alimentos condizentes com o orçamento informado
3. Forneça porções em medidas caseiras (colheres, xícaras, unidades, gramas)
4. Inclua 1 opção de substituição para cada alimento
5. Calcule calorias e macros de cada refeição
6. Se houver condições especiais, adapte TODOS os alimentos e porções a elas
7. Inclua alerta no campo "notes" se detectar riscos ou interações medicamentosas

Retorne APENAS este JSON:
{
  "daily_calories": 2000,
  "protein_g": 150,
  "carbs_g": 200,
  "fats_g": 60,
  "protein_pct": 30,
  "carbs_pct": 40,
  "fats_pct": 30,
  "water_liters": 2.5,
  "notes": "Observações importantes e alertas para este perfil específico",
  "special_alerts": ["Alerta 1 se houver condição especial"],
  "meals": [
    {
      "name": "Café da manhã",
      "icon": "🌅",
      "time": "07:00",
      "calories": 400,
      "protein_g": 30,
      "foods": [
        {
          "name": "Ovos mexidos",
          "quantity": "2 unidades",
          "calories": 140,
          "substitute": "Atum enlatado em água (1 lata pequena)"
        }
      ]
    }
  ]
}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.6 },
    });

    const content = response.text || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta inválida da IA');
    const plan = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Erro ao gerar plano nutricional:', error);
    return NextResponse.json({ error: 'Erro ao gerar plano nutricional' }, { status: 500 });
  }
}
