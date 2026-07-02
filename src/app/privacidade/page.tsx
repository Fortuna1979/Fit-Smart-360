'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-yellow-500">Fit Smart 360º</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-8 text-gray-300">
          <div>
            <h1 className="font-heading text-4xl text-white mb-2">Política de Privacidade</h1>
            <p className="text-sm text-gray-500">Última atualização: junho de 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">1. Quais dados coletamos</h2>
            <p>
              Para criar sua conta e personalizar seus treinos, coletamos: e-mail e senha (cadastro),
              e dados de perfil informados por você no onboarding — nome, idade, peso, altura, gênero,
              objetivo e frequência de treino.
            </p>
            <p>
              Também coletamos dois dados sensíveis de saúde, conforme definido pela LGPD (Lei
              13.709/2018): se você passou por cirurgia bariátrica e se utiliza medicação para
              emagrecimento (como Ozempic, Mounjaro ou Wegovy). Esses dados só são usados para adaptar
              a intensidade e o tipo de exercício recomendado, e nunca são compartilhados com terceiros.
            </p>
            <p>
              Quando você fotografa um equipamento de treino, a imagem é processada por um serviço de
              inteligência artificial para identificar o aparelho e gerar exercícios — a imagem não é
              usada para nenhuma outra finalidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">2. Como seus dados são protegidos</h2>
            <p>
              Seus dados ficam armazenados no Supabase, com uma regra de segurança (Row Level Security)
              que garante que apenas você, autenticado com sua própria conta, pode ler ou alterar os seus
              próprios dados — nenhum outro usuário tem acesso a eles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">3. Seus direitos (LGPD)</h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-4 sm:pl-6 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar os dados que temos sobre você;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a exclusão dos seus dados;</li>
              <li>Revogar o consentimento dado para o tratamento de dados sensíveis de saúde, a qualquer momento.</li>
            </ul>
            <p>
              Você pode excluir sua conta e todos os seus dados diretamente em{' '}
              <span className="text-yellow-500">Configurações → Excluir minha conta</span>. A exclusão é
              permanente e remove seus dados de perfil, equipamentos escaneados e treinos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">4. Contato</h2>
            <p>
              Para dúvidas sobre o tratamento dos seus dados ou para exercer qualquer um dos direitos
              acima, entre em contato pelo e-mail de suporte informado no aplicativo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
