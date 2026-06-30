import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Forçar rota dinâmica - evita erro de build quando env var não está presente
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROMPT = `Você é um personal trainer especializado. Analise esta imagem e identifique se há um equipamento de academia/fitness.

Se houver um equipamento, você DEVE retornar um JSON completo com PELO MENOS 3-5 EXERCÍCIOS DIFERENTES que podem ser realizados neste equipamento.

IMPORTANTE: Gere exercícios variados, com diferentes níveis de dificuldade e variações de execução.

Formato obrigatório:
{
  "detected": true,
  "equipmentName": "Nome completo do equipamento",
  "category": "Categoria (ex: Cardio, Musculação, Peso Livre, Funcional, etc)",
  "muscleGroups": ["Grupo muscular principal", "Grupo muscular secundário", "Grupo muscular terciário"],
  "description": "Descrição detalhada do equipamento, benefícios e como posicionar-se corretamente",
  "exercises": [
    {
      "name": "Nome do exercício 1",
      "sets": "3-4",
      "reps": "10-12",
      "rest": "60-90 segundos",
      "difficulty": "Iniciante/Intermediário/Avançado",
      "description": "Instruções detalhadas de execução, postura correta, respiração e dicas de segurança"
    },
    {
      "name": "Nome do exercício 2",
      "sets": "3-4",
      "reps": "8-10",
      "rest": "90 segundos",
      "difficulty": "Intermediário",
      "description": "Instruções detalhadas..."
    },
    {
      "name": "Nome do exercício 3 (variação)",
      "sets": "3",
      "reps": "12-15",
      "rest": "60 segundos",
      "difficulty": "Iniciante",
      "description": "Instruções detalhadas..."
    }
  ],
  "tips": [
    "Dica de segurança 1",
    "Dica de execução 2",
    "Dica de progressão 3"
  ],
  "commonMistakes": [
    "Erro comum 1 e como evitar",
    "Erro comum 2 e como evitar"
  ]
}

Se NÃO houver equipamento de academia na imagem, retorne:
{
  "detected": false,
  "message": "Nenhum equipamento de academia foi detectado na imagem. Por favor, tire uma foto de um equipamento de treino."
}

REGRAS OBRIGATÓRIAS:
1. SEMPRE gere NO MÍNIMO 3 exercícios diferentes
2. Inclua variações (pegadas diferentes, ângulos, intensidades)
3. Especifique séries, repetições, descanso e nível de dificuldade
4. Dê instruções detalhadas de execução
5. Inclua dicas de segurança e erros comuns

Retorne APENAS o JSON, sem texto adicional ou markdown.`;

export async function POST(request: NextRequest) {
  try {
    // Validar se a chave API está configurada
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave API do Gemini não configurada' },
        { status: 500 }
      );
    }

    // Receber dados do body
    const body = await request.json();
    const { imageBase64 } = body;

    // Validar se a imagem foi enviada
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Imagem não fornecida' },
        { status: 400 }
      );
    }

    // Validar formato Base64
    if (!imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagem inválido. Use Base64 com data URI' },
        { status: 400 }
      );
    }

    const [header, data] = imageBase64.split(',');
    const mimeType = header.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';

    // Instanciar Gemini apenas quando a variável de ambiente estiver disponível
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const content = response.text;

    if (!content) {
      return NextResponse.json(
        { error: 'Não foi possível gerar análise' },
        { status: 500 }
      );
    }

    // Parse do JSON retornado
    let result;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError);
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA' },
        { status: 500 }
      );
    }

    // Validar se exercícios foram gerados (quando equipamento detectado)
    if (result.detected && (!result.exercises || result.exercises.length === 0)) {
      return NextResponse.json(
        { error: 'Equipamento detectado, mas nenhum exercício foi gerado. Tente novamente.' },
        { status: 500 }
      );
    }

    // Retornar resultado
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro ao analisar equipamento:', error);

    const status = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : undefined;

    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: 'Chave API inválida' },
        { status: 401 }
      );
    }

    if (status === 429) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Tente novamente em alguns instantes' },
        { status: 429 }
      );
    }

    if (status === 400) {
      return NextResponse.json(
        { error: 'Requisição inválida. Verifique o formato da imagem' },
        { status: 400 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro ao processar análise',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Método não permitido para outras requisições
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST' },
    { status: 405 }
  );
}
