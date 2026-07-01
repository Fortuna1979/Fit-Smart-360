import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface EquipmentInput { name: string; brand?: string; }

interface UserProfile {
  goal?: string; level?: string; age?: number; weight?: number; height?: number;
  gender?: string; weeklyFrequency?: number;
  // Condições especiais
  hasBariatricSurgery?: boolean; usesGLP1Medication?: boolean;
  // PAR-Q
  parQHeartCondition?: boolean; parQChestPain?: boolean; parQDizziness?: boolean;
  // Histórico médico
  hasChronicConditions?: boolean; takesMedication?: boolean; medicationName?: string; hasFamilyHistory?: boolean;
  // Lesões
  hasPastInjuries?: boolean; injuryDetails?: string; hasJointPain?: boolean; jointPainLocation?: string;
  // Estilo de vida
  dailySittingHours?: number; sleepQuality?: string; stressLevel?: string;
  smokes?: boolean; drinksAlcohol?: boolean; timeWithoutTraining?: string;
}

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
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').trim();
}

function findExerciseImages(db: FreeExercise[], exerciseName: string): string[] {
  const name = normalize(exerciseName);
  const words = name.split(' ').filter(w => w.length > 3);

  let best: FreeExercise | null = null;
  let bestScore = 0;

  for (const ex of db) {
    const exName = normalize(ex.name);
    let score = 0;
    for (const w of words) if (exName.includes(w)) score++;
    if (score > bestScore) { bestScore = score; best = ex; }
  }

  if (!best || bestScore === 0 || !best.images?.length) return [];
  const base = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${best.id}/images/`;
  return best.images.slice(0, 2).map(img => base + img);
}

function buildHealthContext(profile: UserProfile): string {
  const lines: string[] = [];
  if (profile.age) lines.push(`Idade: ${profile.age} anos`);
  if (profile.gender) lines.push(`Sexo: ${profile.gender}`);
  if (profile.weight && profile.height) {
    const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
    lines.push(`Peso: ${profile.weight}kg | Altura: ${profile.height}cm | IMC: ${bmi}`);
  }
  if (profile.weeklyFrequency) lines.push(`Frequência: ${profile.weeklyFrequency}x por semana`);
  if (profile.timeWithoutTraining) lines.push(`Tempo sem treinar: ${profile.timeWithoutTraining.replace(/_/g, ' ')}`);

  const alerts: string[] = [];
  if (profile.parQHeartCondition) alerts.push('ALERTA: problema cardíaco — exercício supervisionado');
  if (profile.parQChestPain) alerts.push('ALERTA: dor no peito durante exercício');
  if (profile.parQDizziness) alerts.push('ALERTA: tontura ou desmaio');
  if (profile.hasChronicConditions) alerts.push('Possui pressão alta, diabetes ou colesterol alto');
  if (profile.takesMedication && profile.medicationName) alerts.push(`Usa medicamento: ${profile.medicationName}`);
  if (profile.hasBariatricSurgery) alerts.push('Cirurgia bariátrica — evitar impacto excessivo');
  if (profile.usesGLP1Medication) alerts.push('Usa medicação GLP-1 (Ozempic/Mounjaro) — cautela com hipoglicemia');
  if (profile.hasPastInjuries && profile.injuryDetails) alerts.push(`Lesão/cirurgia: ${profile.injuryDetails}`);
  if (profile.hasJointPain && profile.jointPainLocation) alerts.push(`Dor articular: ${profile.jointPainLocation}`);
  if (profile.smokes) alerts.push('Fumante — capacidade cardiorrespiratória reduzida');
  if (profile.drinksAlcohol) alerts.push('Consome álcool regularmente');
  if (profile.stressLevel === 'alto' || profile.stressLevel === 'muito_alto') alerts.push(`Estresse ${profile.stressLevel.replace('_', ' ')} — evitar sobretreinamento`);
  if (profile.sleepQuality === 'ruim' || profile.sleepQuality === 'regular') alerts.push(`Sono ${profile.sleepQuality} — reduzir volume para recuperação`);
  if (profile.dailySittingHours && profile.dailySittingHours >= 8) alerts.push('Sedentário (8h+ sentado/dia) — focar em mobilidade');

  if (alerts.length) lines.push('\nALERTAS E RESTRIÇÕES:\n' + alerts.map(a => `- ${a}`).join('\n'));
  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { equipment, userProfile } = (await request.json()) as {
      equipment: EquipmentInput[];
      userProfile?: UserProfile;
    };

    if (!equipment || equipment.length === 0) {
      return NextResponse.json({ error: 'Nenhum equipamento fornecido' }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Gemini não configurada.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const equipmentList = equipment.map(e => e.brand ? `${e.name} (marca: ${e.brand})` : e.name).join(', ');
    const healthContext = userProfile ? buildHealthContext(userProfile) : '';

    const prompt = `Você é um personal trainer especializado. Crie um treino completo e seguro. Retorne APENAS JSON válido.

EQUIPAMENTOS DISPONÍVEIS: ${equipmentList}

PERFIL DO CLIENTE:
Objetivo: ${userProfile?.goal || 'Não especificado'}
Nível: ${userProfile?.level || 'Iniciante'}
${healthContext}

INSTRUÇÕES:
- Adapte exercícios e intensidade conforme os alertas de saúde acima
- Evite movimentos que agravem lesões informadas
- Para iniciantes ou longa pausa: comece com cargas e volumes baixos
- Para condições cardíacas: inclua aquecimento longo e intensidade moderada

Formato JSON:
{
  "workout": {
    "name": "Nome do Treino",
    "description": "Descrição considerando o perfil de saúde",
    "duration": "duração em minutos",
    "difficulty": "Iniciante/Intermediário/Avançado",
    "exercises": [
      {
        "id": "ex-1",
        "name": "Nome do exercício em português",
        "equipment": "equipamento usado",
        "sets": 3,
        "reps": "12",
        "rest": "60",
        "instructions": "Instrução detalhada de execução",
        "tips": "Dicas de segurança relevantes ao perfil do cliente",
        "musculo_alvo": "Músculo principal",
        "dica_rapida": "Dica técnica de execução",
        "youtube_search_query": "Technogym leg press exercise tutorial proper form"
      }
    ],
    "warmup": "Aquecimento recomendado",
    "cooldown": "Alongamento final"
  }
}

Para youtube_search_query de cada exercício: escreva em INGLÊS incluindo a marca se disponível (ex: "Technogym leg press exercise tutorial", "Life Fitness cable row proper form", "barbell bench press technique"). Inglês maximiza os resultados de vídeos dos fabricantes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.7 },
    });

    const content = response.text || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta inválida da IA');
    const parsed = JSON.parse(jsonMatch[0]);

    // Enriquecer exercícios com imagens demonstrativas
    if (parsed.workout?.exercises?.length) {
      const db = await getExerciseDB();
      if (db.length > 0) {
        for (const ex of parsed.workout.exercises) {
          ex.imageUrls = findExerciseImages(db, ex.name);
        }
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Erro ao gerar treino:', error);
    return NextResponse.json({ error: 'Erro ao gerar treino' }, { status: 500 });
  }
}
