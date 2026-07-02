import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface FreeExercise {
  id: string; name: string; equipment: string;
  images: string[]; primaryMuscles: string[];
}

let exerciseDBCache: FreeExercise[] | null = null;

async function getExerciseDB(): Promise<FreeExercise[]> {
  if (exerciseDBCache) return exerciseDBCache;
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    exerciseDBCache = await res.json();
    return exerciseDBCache ?? [];
  } catch { return []; }
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();
}

function findExerciseImages(db: FreeExercise[], exerciseName: string): string[] {
  const name = normalize(exerciseName);
  const words = name.split(' ').filter(w => w.length > 3);
  let best: FreeExercise | null = null;
  let bestScore = 0;
  for (const ex of db) {
    if (ex.equipment && ex.equipment !== 'body only' && ex.equipment !== 'none') continue;
    const exName = normalize(ex.name);
    let score = 0;
    if (exName === name) score = 100;
    else {
      for (const w of words) if (exName.includes(w)) score += 10;
    }
    if (score > bestScore) { bestScore = score; best = ex; }
  }
  if (!best || bestScore === 0) return [];
  const base = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
  return best.images.slice(0, 2).map(img => `${base}/${best!.id}/${img}`);
}

export async function POST(req: NextRequest) {
  try {
    const { muscleGroup, userProfile } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Chave da API não configurada' }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });

    const healthContext = userProfile ? `
Perfil do atleta:
- Objetivo: ${userProfile.goal || 'condicionamento geral'}
- Nível: ${userProfile.level || 'iniciante'}
- Idade: ${userProfile.age || '?'} anos | Peso: ${userProfile.weight || '?'}kg
- PAR-Q cardíaco: ${userProfile.parQHeartCondition ? 'SIM (baixa intensidade)' : 'não'}
- Lesões/dores: ${userProfile.hasPastInjuries ? userProfile.injuryDetails || 'sim' : 'não'} | Dor articular: ${userProfile.hasJointPain ? userProfile.jointPainLocation || 'sim' : 'não'}
- Sem treino há: ${userProfile.timeWithoutTraining || 'não informado'}
` : '';

    const groupLabel: Record<string, string> = {
      peito: 'peito (peitoral, tríceps auxiliar)',
      costas: 'costas (dorsais, bíceps auxiliar)',
      pernas: 'pernas (quadríceps, posterior, glúteos, panturrilha)',
      ombros: 'ombros (deltoides, trapézio superior)',
      core: 'core (abdominais, oblíquos, lombar)',
      bracos: 'braços (bíceps, tríceps, antebraço)',
      corpo_inteiro: 'corpo inteiro (cardio + força, circuito completo)',
    };

    const prompt = `Você é personal trainer especialista em calistenia (treino sem equipamentos).
Crie um treino de calistenia focado em: ${groupLabel[muscleGroup] || muscleGroup}.
${healthContext}
Regras:
- SOMENTE exercícios com peso corporal (zero equipamento)
- 6 a 8 exercícios progressivos
- Adeque intensidade ao nível do atleta
- Se PAR-Q cardíaco ou lesão: reduza intensidade, evite saltos, sem isometrias longas

Retorne JSON puro (sem markdown):
{
  "name": "Calistenia - [Grupo Muscular]",
  "type": "calistenia",
  "duration": "X minutos",
  "exercises": [
    {
      "name": "nome em português",
      "sets": "3",
      "reps": "12-15 ou 30s",
      "rest": "45",
      "difficulty": "Iniciante|Intermediário|Avançado",
      "description": "execução correta do exercício",
      "musculo_alvo": "músculo principal",
      "dica_rapida": "dica técnica essencial",
      "youtube_search_query": "exercise name in English calisthenics tutorial"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const plan = JSON.parse(cleaned);

    const db = await getExerciseDB();
    plan.exercises = plan.exercises.map((ex: { name: string; [key: string]: unknown }) => ({
      ...ex,
      imageUrls: findExerciseImages(db, ex.name),
    }));

    return NextResponse.json({ plan });
  } catch (e) {
    console.error('Erro generate-calistenia:', e);
    return NextResponse.json({ error: 'Erro ao gerar treino de calistenia' }, { status: 500 });
  }
}
