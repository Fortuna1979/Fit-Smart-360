import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface FreeExercise {
  id: string; name: string; equipment: string;
  images: string[]; primaryMuscles: string[];
}

async function searchWorkoutX(exerciseEnglishName: string): Promise<string | null> {
  const key = process.env.WORKOUTX_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.workoutxapp.com/v1/exercises/name/${encodeURIComponent(exerciseEnglishName)}?limit=1`;
    const res = await fetch(url, { headers: { 'X-WorkoutX-Key': key } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data?.[0]?.gifUrl as string) ?? null;
  } catch { return null; }
}

async function searchExerciseDB(exerciseName: string): Promise<string | null> {
  try {
    const url = `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(exerciseName.toLowerCase())}&limit=10`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const exercises: Array<{ name: string; gifUrl: string }> = data.data ?? [];
    if (!exercises.length) return null;
    const searchNorm = exerciseName.toLowerCase().replace(/-/g, ' ').trim();
    const searchWords = searchNorm.split(/\s+/).filter(w => w.length > 2);
    let best = exercises[0];
    let bestScore = -Infinity;
    for (const ex of exercises) {
      const exNorm = ex.name.toLowerCase().replace(/-/g, ' ');
      let score = exNorm === searchNorm ? 1000 : (searchWords.filter(w => exNorm.includes(w)).length / Math.max(searchWords.length, 1)) * 100 - ex.name.length * 0.5;
      if (score > bestScore) { bestScore = score; best = ex; }
    }
    return best?.gifUrl ?? null;
  } catch { return null; }
}

async function searchYouTube(query: string): Promise<string | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=1&relevanceLanguage=en&safeSearch=strict&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.items?.[0]?.id?.videoId as string) ?? null;
  } catch { return null; }
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
      "exercise_english_name": "Standard English exercise name, e.g. 'Push Up', 'Squat', 'Plank'",
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
    await Promise.all(
      plan.exercises.map(async (ex: { name: string; exercise_english_name?: string; youtube_search_query?: string; gifUrl?: string; videoId?: string; imageUrls?: string[]; [key: string]: unknown }) => {
        if (db.length > 0) ex.imageUrls = findExerciseImages(db, ex.exercise_english_name || ex.name);
        const [wxGifUrl, videoId] = await Promise.all([
          ex.exercise_english_name ? searchWorkoutX(ex.exercise_english_name) : Promise.resolve(null),
          ex.youtube_search_query ? searchYouTube(ex.youtube_search_query) : Promise.resolve(null),
        ]);
        let gifUrl = wxGifUrl;
        if (!gifUrl && ex.exercise_english_name) {
          gifUrl = await searchExerciseDB(ex.exercise_english_name);
        }
        if (gifUrl) {
          const m = (gifUrl as string).match(/\/gifs\/(\d+)\.gif/);
          ex.gifUrl = m ? `/api/gif-proxy?id=${m[1]}` : gifUrl;
        }
        if (videoId) ex.videoId = videoId;
      })
    );

    return NextResponse.json({ plan });
  } catch (e) {
    console.error('Erro generate-calistenia:', e);
    return NextResponse.json({ error: 'Erro ao gerar treino de calistenia' }, { status: 500 });
  }
}
