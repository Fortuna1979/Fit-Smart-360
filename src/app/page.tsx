'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Zap, TrendingUp, Apple, Droplet, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();
  const [showPricing, setShowPricing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleBasicPlanCheckout = () => {
    const url = billingCycle === 'monthly' 
      ? 'https://pay.kiwify.com.br/y5kh8ps'
      : 'https://pay.kiwify.com.br/a6u9cUX';
    window.open(url, '_blank');
  };

  const handlePremiumPlanCheckout = () => {
    const url = billingCycle === 'monthly' 
      ? 'https://pay.kiwify.com.br/3aKNiC9'
      : 'https://pay.kiwify.com.br/LBdYxub';
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
              Fit Smart 360º
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/auth')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section com Background de Pessoas Treinando */}
      <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center overflow-hidden">
        {/* Background Image com Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&q=80)',
            }}
          />
          {/* Overlay escuro para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-500 font-medium">Treino Inteligente com IA</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Seu treino, do seu jeito,<br />
              <span className="bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
                com os aparelhos que você tem
              </span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-10 max-w-2xl">
              Fotografe os equipamentos da sua academia e receba treinos personalizados 
              criados por IA, adaptados ao seu objetivo e condicionamento físico.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push('/auth')}
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6 shadow-2xl shadow-yellow-500/20"
              >
                Começar Agora
              </Button>
              <Button
                onClick={() => setShowPricing(true)}
                size="lg"
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-semibold text-lg px-8 py-6 backdrop-blur-sm"
              >
                Ver Planos
              </Button>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Cancele quando quiser • Sem compromisso
            </p>
          </div>
        </div>
      </section>

      {/* Section com Pessoas Treinando - Estilo Smart Fit */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&h=1080&fit=crop&q=80)',
            }}
          />
          <div className="absolute inset-0 bg-black/85" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Transforme seu corpo,<br />
              <span className="text-yellow-500">onde você estiver</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Milhares de pessoas já estão alcançando seus objetivos com treinos inteligentes
            </p>
          </div>

          {/* Grid de Imagens de Treino */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="relative h-80 rounded-2xl overflow-hidden group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=800&fit=crop&q=80)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">Força e Resistência</h3>
                <p className="text-gray-300">Desenvolva músculos e ganhe potência</p>
              </div>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&h=800&fit=crop&q=80)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">Cardio Intenso</h3>
                <p className="text-gray-300">Queime calorias e defina seu corpo</p>
              </div>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=800&fit=crop&q=80)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">Flexibilidade</h3>
                <p className="text-gray-300">Alongue e previna lesões</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Tudo que você precisa para{' '}
            <span className="text-yellow-500">evoluir</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Dumbbell className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reconhecimento por IA</h3>
              <p className="text-gray-400">
                Fotografe os equipamentos e nossa IA identifica automaticamente cada aparelho, 
                criando seu inventário personalizado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Dumbbell className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Treinos Personalizados</h3>
              <p className="text-gray-400">
                Planos de treino criados especialmente para você, com séries, repetições 
                e tempos de descanso adaptados ao seu nível.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Acompanhamento Total</h3>
              <p className="text-gray-400">
                Cronômetro integrado, feedback após treinos e evolução semanal 
                para você ver seus resultados.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Apple className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Plano Nutricional</h3>
              <p className="text-gray-400">
                Cardápio personalizado com cálculo de macros e calorias baseado 
                no seu objetivo e condição física.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Droplet className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hidratação Inteligente</h3>
              <p className="text-gray-400">
                Lembretes automáticos de ingestão de água, com intervalos 
                personalizados para seu perfil.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Crown className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Suporte Especial</h3>
              <p className="text-gray-400">
                Planos adaptados para bariátricos e usuários de medicamentos 
                GLP-1 (Ozempic, Mounjaro, Wegovy).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section de Motivação com Background */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&h=1080&fit=crop&q=80)',
            }}
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Não espere o momento perfeito.<br />
            <span className="text-yellow-500">Comece agora.</span>
          </h2>
          <p className="text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Cada treino é um passo em direção à melhor versão de você mesmo
          </p>
        </div>
      </section>

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Escolha seu plano</h2>
              <Button
                onClick={() => setShowPricing(false)}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Toggle Mensal/Anual */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-gray-800 rounded-full p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-yellow-500 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-yellow-500 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Anual
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                    Economize
                  </span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plano Básico */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Plano Básico</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-5xl font-bold text-yellow-500">
                      R$ {billingCycle === 'monthly' ? '19,99' : '9,99'}
                    </span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-500 mt-2 font-semibold">
                      R$ 119,88 cobrado anualmente
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">Com anúncios</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Treinos personalizados ilimitados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Reconhecimento de equipamentos por IA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Plano nutricional completo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Cronômetro e acompanhamento</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Anúncios a cada 2 treinos</span>
                  </li>
                </ul>

                <Button
                  onClick={handleBasicPlanCheckout}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  Assinar Agora
                </Button>
              </div>

              {/* Plano Premium */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 rounded-2xl p-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Plano Premium</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-5xl font-bold text-yellow-500">
                      R$ {billingCycle === 'monthly' ? '24,99' : '19,99'}
                    </span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-500 mt-2 font-semibold">
                      R$ 239,88 cobrado anualmente
                    </p>
                  )}
                  <p className="text-sm text-yellow-500 mt-2 font-semibold">Sem anúncios</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Tudo do plano básico</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300 font-semibold">Experiência sem anúncios</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Suporte prioritário</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span className="text-gray-300">Novos recursos em primeira mão</span>
                  </li>
                </ul>

                <Button
                  onClick={handlePremiumPlanCheckout}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  Assinar Agora
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              Cancele quando quiser • Sem compromisso
            </p>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-y border-yellow-500/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para transformar<br />seu treino?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Comece hoje mesmo e veja a diferença de ter 
            um personal trainer virtual no seu bolso.
          </p>
          <Button
            onClick={() => setShowPricing(true)}
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-10 py-6"
          >
            Ver Planos
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p className="mb-4">
            © 2024 Fit Smart 360º. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-6">
            <button className="hover:text-yellow-500 transition-colors">Termos de Uso</button>
            <button className="hover:text-yellow-500 transition-colors">Política de Privacidade</button>
            <button className="hover:text-yellow-500 transition-colors">Contato</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
