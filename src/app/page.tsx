'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Zap, TrendingUp, Apple, Droplet, Crown, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InstallPrompt from '@/components/InstallPrompt';

export default function LandingPage() {
  const router = useRouter();
  const [showPricing, setShowPricing] = useState(false);

  const handleFreePlanSignup = () => router.push('/auth');
  const handleBasicPlanCheckout = () => window.open('https://pay.kiwify.com.br/y5kh8ps', '_blank');
  const handlePremiumPlanCheckout = () => window.open('https://pay.kiwify.com.br/3aKNiC9', '_blank');

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @keyframes runIn {
          0%   { transform: translateX(-110vw); }
          78%  { transform: translateX(2.5%); }
          90%  { transform: translateX(-1%); }
          100% { transform: translateX(0); }
        }
        @keyframes gleam {
          0%   { background-position: 140% center; }
          100% { background-position: -40% center; }
        }
        .hero-title {
          animation:
            runIn 1.15s cubic-bezier(0.22, 1, 0.36, 1) forwards,
            gleam 1.3s ease-in-out 1.25s 3;
          background: linear-gradient(
            90deg,
            #92400e  0%,
            #b45309 12%,
            #d97706 25%,
            #eab308 38%,
            #fefce8 46%,
            #ffffff 50%,
            #fefce8 54%,
            #eab308 62%,
            #d97706 75%,
            #b45309 88%,
            #92400e 100%
          );
          background-size: 400% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        .fade-up-1 { animation-delay: 1.4s; opacity: 0; }
        .fade-up-2 { animation-delay: 1.6s; opacity: 0; }
        .fade-up-3 { animation-delay: 1.8s; opacity: 0; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative h-screen flex flex-col overflow-hidden bg-black">

        {/* Foto superior — homem musculoso */}
        <div className="absolute top-0 left-0 right-0 h-[52%]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&h=800&fit=crop&q=80)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>

        {/* Foto inferior — mulher correndo na esteira */}
        <div className="absolute bottom-0 left-0 right-0 h-[52%]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1594882645126-14ac19a0ee2e?w=1200&h=800&fit=crop&q=80)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/80" />
        </div>

        {/* Faixa central escura para o título */}
        <div className="absolute inset-x-0 top-[44%] h-[14%] bg-gradient-to-b from-black/60 via-black/70 to-black/60 blur-sm" />

        {/* Conteúdo sobre as fotos */}
        <div className="relative z-10 h-full flex flex-col justify-between px-4 pt-10 pb-8 max-w-lg mx-auto w-full">

          {/* Topo: logo + badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-yellow-500" />
              <span className="font-heading text-2xl text-white tracking-wide">FS360°</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 border border-yellow-500/50 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-[11px] text-yellow-400 font-bold tracking-widest">IA ATIVA</span>
            </div>
          </div>

          {/* Título animado — centro da tela */}
          <div style={{ overflow: 'hidden', clipPath: 'inset(0)', margin: '0 -8px' }}>
            <h1
              className="hero-title font-heading leading-none tracking-tighter text-center whitespace-nowrap"
              style={{ fontSize: 'clamp(2.6rem, 12vw, 5rem)' }}
            >
              FIT SMART 360°
            </h1>
          </div>

          {/* Rodapé do hero */}
          <div className="space-y-5">

            {/* Avatares + contagem */}
            <div className="fade-up fade-up-1 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {['bg-gray-600','bg-gray-500','bg-gray-700','bg-gray-600'].map((bg, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-black flex items-center justify-center`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-300 fill-current"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center">
                  <span className="text-[9px] font-black text-black leading-none text-center">FS<br/>360</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">+5.200 usuários ativos</p>
                <p className="text-[10px] text-gray-400">treinando agora</p>
              </div>
            </div>

            {/* Subtítulo */}
            <div className="fade-up fade-up-2">
              <p className="text-sm text-gray-300 leading-relaxed">
                Fotografe os equipamentos da sua academia e receba treinos personalizados,
                adaptados ao seu objetivo e condicionamento físico.
              </p>
            </div>

            {/* CTA */}
            <div className="fade-up fade-up-3 space-y-3">
              <Button
                onClick={() => router.push('/auth')}
                className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-black text-base py-6 rounded-2xl tracking-wide shadow-2xl shadow-yellow-500/25"
              >
                COMEÇAR GRÁTIS
              </Button>
              <p className="text-center text-xs text-gray-500">
                Grátis para sempre · Sem cartão de crédito
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-4">
            Tudo que você precisa para{' '}
            <span className="text-yellow-500">evoluir</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 text-sm sm:text-base max-w-xl mx-auto">
            Tecnologia de ponta no seu bolso — de graça.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: Camera, title: 'Reconhecimento por IA',
                desc: 'Fotografe os equipamentos e nossa IA identifica automaticamente cada aparelho, criando seu inventário personalizado.',
              },
              {
                Icon: Dumbbell, title: 'Treinos Personalizados',
                desc: 'Planos de treino criados especialmente para você, com séries, repetições e tempos de descanso no seu nível.',
              },
              {
                Icon: TrendingUp, title: 'Acompanhamento Total',
                desc: 'Cronômetro integrado, feedback após treinos e evolução semanal para você ver seus resultados.',
              },
              {
                Icon: Apple, title: 'Plano Nutricional',
                desc: 'Cardápio personalizado com cálculo de macros e calorias baseado no seu objetivo e condição física.',
              },
              {
                Icon: Droplet, title: 'Hidratação Inteligente',
                desc: 'Lembretes automáticos de ingestão de água com intervalos personalizados para seu perfil.',
              },
              {
                Icon: Crown, title: 'Suporte Especial',
                desc: 'Planos adaptados para bariátricos e usuários de medicamentos GLP-1 (Ozempic, Mounjaro, Wegovy).',
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
              >
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALERIA ──────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&h=1080&fit=crop&q=80)' }}
          />
          <div className="absolute inset-0 bg-black/85" />
        </div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
              Transforme seu corpo,<br />
              <span className="text-yellow-500">onde você estiver</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Academia, casa, hotel, parque — seu treino vai com você.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=800&fit=crop&q=80',
                label: 'Força e Resistência', sub: 'Desenvolva músculos e ganhe potência',
              },
              {
                img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&h=800&fit=crop&q=80',
                label: 'Cardio Intenso', sub: 'Queime calorias e defina seu corpo',
              },
              {
                img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=800&fit=crop&q=80',
                label: 'Calistenia', sub: 'Sem equipamentos, qualquer lugar',
              },
            ].map(({ img, label, sub }) => (
              <div key={label} className="relative h-52 sm:h-80 rounded-2xl overflow-hidden group">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${img})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="text-xl font-bold mb-1">{label}</h3>
                  <p className="text-gray-300 text-sm">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOTIVAÇÃO ────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&h=1080&fit=crop&q=80)' }}
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-5xl md:text-6xl font-bold mb-6">
            Não espere o momento perfeito.<br />
            <span className="text-yellow-500">Comece agora.</span>
          </h2>
          <p className="text-base sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Cada treino é um passo em direção à melhor versão de você mesmo.
          </p>
          <Button
            onClick={() => router.push('/auth')}
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-10 py-6 rounded-2xl shadow-2xl shadow-yellow-500/20"
          >
            Criar minha conta grátis
          </Button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-12 px-4 bg-black border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-yellow-500/60" />
            <span className="font-heading text-lg text-gray-400">Fit Smart 360°</span>
          </div>
          <p className="mb-4">© 2026 Fit Smart 360º. Todos os direitos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="hover:text-yellow-500 transition-colors">Termos de Uso</button>
            <button
              onClick={() => router.push('/privacidade')}
              className="hover:text-yellow-500 transition-colors"
            >
              Política de Privacidade
            </button>
            <button
              onClick={() => setShowPricing(true)}
              className="hover:text-yellow-500 transition-colors"
            >
              Planos
            </button>
          </div>
        </div>
      </footer>

      {/* ── MODAL DE PLANOS ──────────────────────────────────────── */}
      {showPricing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-4 sm:p-8 max-w-lg sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Escolha seu plano</h2>
              <Button onClick={() => setShowPricing(false)} variant="ghost" className="text-gray-400 hover:text-white">✕</Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Gratuito */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 0</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Com anúncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Treinos personalizados ilimitados','Reconhecimento de equipamentos por IA','Cronômetro e acompanhamento','Anúncio a cada 2 exercícios'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">✓</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleFreePlanSignup} variant="outline" className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold">
                  Criar Conta Gratuita
                </Button>
              </div>

              {/* Básico */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Básico</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 9,99</span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Sem anúncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Tudo do plano gratuito','Sem anúncios','Plano nutricional completo'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">✓</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleBasicPlanCheckout} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                  Assinar Agora
                </Button>
              </div>

              {/* Premium */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 rounded-2xl p-5 sm:p-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Premium</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 19,99</span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  <p className="text-sm text-yellow-500 mt-2 font-semibold">Sem anúncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Tudo do plano básico','Suporte prioritário','Novos recursos em primeira mão'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">✓</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handlePremiumPlanCheckout} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                  Assinar Agora
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">Cancele quando quiser · Sem compromisso</p>
          </div>
        </div>
      )}

      <InstallPrompt />
    </div>
  );
}
