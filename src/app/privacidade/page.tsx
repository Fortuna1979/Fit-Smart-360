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
          <Button onClick={() => router.back()} variant="ghost" className="text-gray-400 hover:text-white">
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

      <div className="pt-20 sm:pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-8 text-gray-300">
          <div>
            <h1 className="font-heading text-4xl text-white mb-2">Política de Privacidade</h1>
            <p className="text-sm text-gray-500">Última atualização: julho de 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">1. Controlador dos dados</h2>
            <p>
              O aplicativo <strong className="text-white">Fit Smart 360°</strong> é controlado por Jean Speed Mello.
              Para exercer qualquer direito previsto nesta política ou para entrar em contato com o
              encarregado de dados (DPO), envie um e-mail para{' '}
              <a href="mailto:fitsmart360app@gmail.com" className="text-yellow-500 hover:underline">
                fitsmart360app@gmail.com
              </a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-yellow-500">2. Quais dados coletamos e para quê</h2>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.1 Dados de conta</h3>
              <p>E-mail e senha, coletados no cadastro para autenticar você no aplicativo. Base legal: execução de contrato (art. 7º, V da LGPD).</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.2 Dados de perfil e fitness</h3>
              <p>Nome, idade, peso, altura, gênero, objetivo de treino e frequência semanal. Usados para personalizar os planos de treino e calcular o IMC. Base legal: execução de contrato.</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.3 Dados sensíveis de saúde (requerem consentimento explícito)</h3>
              <p>
                Os itens abaixo são dados sensíveis conforme o art. 11 da LGPD. São coletados somente
                mediante seu consentimento expresso e utilizados exclusivamente para adequar a
                intensidade, o tipo e a segurança dos exercícios recomendados:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Resposta ao questionário PAR-Q: condição cardíaca, dor no peito, tontura ou desmaio</li>
                <li>Condições crônicas: pressão alta, diabetes ou colesterol alto</li>
                <li>Uso de medicamento contínuo (nome do medicamento)</li>
                <li>Histórico familiar de doenças graves (infarto, AVC, diabetes)</li>
                <li>Histórico de lesões, cirurgias ou fraturas e localização de dores articulares</li>
                <li>Cirurgia bariátrica prévia</li>
                <li>Uso de medicação para emagrecimento (GLP-1: Ozempic, Mounjaro, Wegovy)</li>
                <li>Hábitos de estilo de vida: tabagismo, consumo de álcool, qualidade do sono e nível de estresse</li>
              </ul>
              <p className="text-sm">Esses dados nunca são compartilhados com terceiros para fins comerciais ou de marketing.</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.4 Imagens de equipamentos</h3>
              <p>
                Fotos tiradas pelo usuário para identificar aparelhos de academia são enviadas ao serviço
                Google Gemini (IA generativa) para análise e geração de exercícios. As imagens são
                processadas em tempo real e não são armazenadas de forma permanente pelo Google para
                fins de treinamento de modelos neste contexto de API. Base legal: consentimento e
                execução de contrato.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.5 Dados de localização GPS</h3>
              <p>
                A funcionalidade <strong className="text-white">Destrava</strong> (corrida, caminhada e
                ciclismo) solicita acesso à localização GPS do dispositivo. Dados de rota e distância são
                armazenados localmente na sessão para calcular métricas do treino. As coordenadas
                geográficas aproximadas (grade de ~250m) são também registradas na funcionalidade
                Territórios, que exibe um mapa social de áreas conquistadas. Esse dado é coletado
                somente após consentimento específico e pode ser revogado a qualquer momento nas
                configurações do dispositivo. Base legal: consentimento (art. 7º, I da LGPD).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.6 Dados de atividade e treinos</h3>
              <p>
                Histórico de treinos, planos gerados, progresso, conquistas, registros de hidratação e
                plano nutricional. Usados para exibir evolução, sequências de treino e medalhas. Base
                legal: execução de contrato.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.7 Feed social (opcional)</h3>
              <p>
                Se você ativar o <strong className="text-white">perfil público</strong>, atividades
                concluídas (nome do treino, número de exercícios, duração) serão publicadas no feed
                social visível a outros usuários do aplicativo. O nome de usuário público também ficará
                visível. Essa funcionalidade é desativada por padrão. Base legal: consentimento.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white">2.8 Dados de pagamento</h3>
              <p>
                Transações de assinatura são processadas pela plataforma Kiwify. O Fit Smart 360° não
                armazena dados de cartão de crédito. O e-mail do comprador é recebido via webhook para
                atualizar o plano da conta. Base legal: execução de contrato.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">3. Operadores e terceiros que processam seus dados</h2>
            <p>Para operar o aplicativo, compartilhamos dados com os seguintes operadores:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 pr-4 text-gray-400 font-medium">Operador</th>
                    <th className="text-left py-2 pr-4 text-gray-400 font-medium">Dados transferidos</th>
                    <th className="text-left py-2 text-gray-400 font-medium">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="py-2 pr-4 text-white">Supabase (EUA)</td>
                    <td className="py-2 pr-4">Todos os dados de conta e treino</td>
                    <td className="py-2">Armazenamento e autenticação</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white">Google Gemini (EUA)</td>
                    <td className="py-2 pr-4">Imagens de equipamentos e perfil de saúde</td>
                    <td className="py-2">Identificação de equipamentos e geração de treinos</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white">YouTube Data API (EUA)</td>
                    <td className="py-2 pr-4">Consultas de busca por nome de exercício</td>
                    <td className="py-2">Exibição de vídeos demonstrativos</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white">WorkoutX (EUA)</td>
                    <td className="py-2 pr-4">Nome do exercício em inglês</td>
                    <td className="py-2">GIFs demonstrativos de exercícios</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white">Kiwify (Brasil)</td>
                    <td className="py-2 pr-4">E-mail do comprador</td>
                    <td className="py-2">Processamento de pagamentos e assinaturas</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white">Vercel (EUA)</td>
                    <td className="py-2 pr-4">Logs de requisições</td>
                    <td className="py-2">Hospedagem da aplicação</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500">
              Os operadores com sede nos EUA estão sujeitos ao Data Privacy Framework ou oferecem
              garantias contratuais equivalentes. Transferências internacionais ocorrem com base no
              art. 33 da LGPD.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">4. Retenção de dados</h2>
            <p>
              Seus dados ficam armazenados enquanto sua conta estiver ativa. Ao excluir sua conta, todos
              os dados pessoais são removidos permanentemente dos servidores em até 30 dias. Backups
              automáticos do Supabase são retidos por até 7 dias adicionais antes da exclusão definitiva.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">5. Segurança</h2>
            <p>
              Seus dados ficam armazenados com Row Level Security (RLS) ativado no Supabase — somente
              você, autenticado com a sua própria conta, consegue acessar ou modificar seus dados.
              A comunicação entre o aplicativo e os servidores é realizada via HTTPS/TLS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">6. Seus direitos (LGPD — art. 18)</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Acesso:</strong> saber quais dados temos sobre você.</li>
              <li><strong className="text-white">Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li><strong className="text-white">Exclusão:</strong> apagar todos os seus dados — disponível em <span className="text-yellow-500">Configurações → Excluir minha conta</span>.</li>
              <li><strong className="text-white">Portabilidade:</strong> exportar seus dados em formato legível — disponível em <span className="text-yellow-500">Configurações → Exportar meus dados</span>.</li>
              <li><strong className="text-white">Revogação de consentimento:</strong> retirar o consentimento para dados de saúde ou localização a qualquer momento, sem prejuízo das atividades já realizadas. Basta excluir a conta ou entrar em contato.</li>
              <li><strong className="text-white">Informação sobre compartilhamento:</strong> saber com quais operadores seus dados foram compartilhados (seção 3 desta política).</li>
              <li><strong className="text-white">Oposição:</strong> opor-se ao tratamento realizado sem seu consentimento.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">7. Menores de idade</h2>
            <p>
              Este aplicativo não é destinado a crianças menores de 13 anos. Usuários entre 13 e 17 anos
              devem obter autorização de um responsável legal antes de fornecer dados de saúde. Caso
              identifiquemos que dados de menores foram coletados sem autorização, os removeremos
              imediatamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-yellow-500">8. Contato e encarregado de dados</h2>
            <p>
              Para exercer qualquer direito listado acima, solicitar esclarecimentos ou registrar uma
              reclamação junto ao encarregado de dados (DPO) do Fit Smart 360°, envie um e-mail para:
            </p>
            <p>
              <a href="mailto:fitsmart360app@gmail.com" className="text-yellow-500 hover:underline font-semibold">
                fitsmart360app@gmail.com
              </a>
            </p>
            <p className="text-sm text-gray-500">
              Você também pode registrar reclamações perante a Autoridade Nacional de Proteção de Dados
              (ANPD) em <span className="text-gray-400">www.gov.br/anpd</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
