import OpenAI from 'openai';

// Cliente OpenAI configurado com a chave de ambiente
export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Permite uso no browser para demo
});

// Função para analisar imagem de equipamento
export async function analyzeEquipment(imageBase64: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de equipamento de academia e retorne APENAS um JSON válido no seguinte formato:
{
  "equipmentName": "nome do equipamento em português",
  "category": "categoria (ex: musculação, cardio, peso livre)",
  "muscleGroups": ["grupos musculares trabalhados"],
  "description": "breve descrição do equipamento",
  "detected": true/false
}

Se não for um equipamento de academia, retorne detected: false.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Nenhuma resposta da API');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao analisar equipamento:', error);
    throw error;
  }
}
