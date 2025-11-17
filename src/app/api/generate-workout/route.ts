import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Forçar rota dinâmica - evita erro de build quando env var não está presente
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Instanciar OpenAI apenas quando a variável de ambiente estiver disponível
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }
  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    const { equipment, userProfile } = await request.json();

    if (!equipment || equipment.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum equipamento fornecido' },
        { status: 400 }
      );
    }

    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API OpenAI não configurada. Configure a variável OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const openai = getOpenAIClient();

    const equipmentList = equipment.map((eq: any) => eq.name).join(', ');
    
    const prompt = `Você é um personal trainer especializado. Crie um treino completo e detalhado baseado nos seguintes equipamentos disponíveis: ${equipmentList}.

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um personal trainer especializado em criar treinos personalizados. Sempre retorne respostas em JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Extrair JSON da resposta
    let jsonMatch = content.match(/\{[\s\S]*\}/);
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
