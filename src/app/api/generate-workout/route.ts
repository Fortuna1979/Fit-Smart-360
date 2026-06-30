import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Forçar rota dinâmica - evita erro de build quando env var não está presente
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface EquipmentInput {
  name: string;
}

interface UserProfile {
  goal?: string;
  level?: string;
  conditions?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { equipment, userProfile } = (await request.json()) as {
      equipment: EquipmentInput[];
      userProfile?: UserProfile;
    };

    if (!equipment || equipment.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum equipamento fornecido' },
        { status: 400 }
      );
    }

    // Verificar se a API key está configurada
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API Gemini não configurada. Configure a variável GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const equipmentList = equipment.map((eq) => eq.name).join(', ');

    const prompt = `Você é um personal trainer especializado em criar treinos personalizados. Sempre retorne respostas em JSON válido.

Crie um treino completo e detalhado baseado nos seguintes equipamentos disponíveis: ${equipmentList}.

${userProfile ? `
Perfil do usuário:
- Objetivo: ${userProfile.goal || 'Não especificado'}
- Nível: ${userProfile.level || 'Iniciante'}
- Condições especiais: ${userProfile.conditions || 'Nenhuma'}
` : ''}

Retorne APENAS um JSON válido no seguinte formato:
{
  "workout": {
    "name": "Nome do Treino",
    "description": "Descrição breve do treino",
    "duration": "Duração estimada em minutos",
    "difficulty": "Iniciante/Intermediário/Avançado",
    "exercises": [
      {
        "id": "unique-id",
        "name": "Nome do exercício",
        "equipment": "Equipamento usado",
        "sets": número de séries,
        "reps": "número de repetições ou tempo",
        "rest": "tempo de descanso em segundos",
        "instructions": "Instruções detalhadas de execução",
        "tips": "Dicas importantes"
      }
    ],
    "warmup": "Aquecimento recomendado",
    "cooldown": "Alongamento final recomendado"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const content = response.text || '{}';

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let parsedData;

    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Resposta inválida da IA');
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro ao gerar treino:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar treino' },
      { status: 500 }
    );
  }
}
