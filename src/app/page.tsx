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
        /* ── TITLE SLIDE-IN ── */
        @keyframes runIn {
          0%   { transform: translateX(-110vw); }
          78%  { transform: translateX(2.5%); }
          90%  { transform: translateX(-1%); }
          100% { transform: translateX(0); }
        }
        .hero-title {
          display: block;
          text-align: center;
          white-space: nowrap;
          font-style: italic;
          font-size: clamp(3.5rem, 15.5vw, 7rem);
          letter-spacing: -0.01em;
          line-height: 1;
          color: #fff;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.85), 5px 5px 18px rgba(0,0,0,0.6);
          animation: runIn 1.15s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-title { animation:none; transform:translateX(0); }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="w-full max-w-[430px] mx-auto flex flex-col h-full px-4 pt-5 pb-5">

          {/* ── BARRA SUPERIOR: logo + badge ── */}
          <div className="flex-shrink-0 flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <svg width="22" height="32" viewBox="0 0 14 22" aria-hidden="true">
                <polygon points="9,0 2,12 7,12 6,22 13,10 8,10" fill="#eab308"/>
              </svg>
              <span className="font-heading italic leading-none"
                    style={{ fontSize: '2.1rem', color: '#eab308',
                             textShadow: '0 0 20px rgba(234,179,8,0.5)' }}>
                FS360°
              </span>
            </div>
            <div style={{ border: '1.5px solid rgba(234,179,8,0.6)', borderRadius: '8px',
                          padding: '6px 14px', background: 'rgba(0,0,0,0.4)',
                          display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 700,
                             letterSpacing: '0.12em' }}>AI ACTIVE</span>
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </div>
          </div>

          {/* ── FITNESS PERFORMANCE — fora do card, acima dele ── */}
          <div className="flex-shrink-0 mb-2.5">
            <p className="text-white font-black leading-[1.05]"
               style={{ fontSize: 'clamp(1.15rem, 5.2vw, 1.5rem)', letterSpacing: '0.04em',
                        textShadow: '1px 1px 4px rgba(0,0,0,0.9)' }}>
              FITNESS
            </p>
            <p className="text-white font-black leading-[1.05]"
               style={{ fontSize: 'clamp(1.15rem, 5.2vw, 1.5rem)', letterSpacing: '0.04em',
                        textShadow: '1px 1px 4px rgba(0,0,0,0.9)' }}>
              PERFORMANCE
            </p>
          </div>

          {/* ── CARD COM FOTOS ── */}
          <div className="flex-1 min-h-0 relative rounded-[20px] overflow-hidden"
               style={{ border: '1.5px solid rgba(200,130,10,0.3)' }}>

            {/* Foto superior — homem musculoso */}
            <div className="absolute top-0 left-0 right-0" style={{ height: '52%' }}>
              <div className="absolute inset-0 bg-cover"
                   style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&h=900&fit=crop&q=85)',
                            backgroundPosition: 'center top' }} />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.22)' }} />
              <div className="absolute bottom-0 left-0 right-0" style={{ height: '45%',
                   background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.75))' }} />
            </div>

            {/* Foto inferior — mulher correndo na esteira */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: '52%' }}>
              <div className="absolute inset-0 bg-cover bg-center"
                   style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=1200&h=900&fit=crop&q=85)' }} />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
              <div className="absolute top-0 left-0 right-0" style={{ height: '40%',
                   background: 'linear-gradient(to top, transparent, rgba(0,0,0,0.7))' }} />
              <div className="absolute bottom-0 left-0 right-0" style={{ height: '30%',
                   background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))' }} />
            </div>

            {/* ── FAIXA DO TÍTULO — cruza o centro exato ── */}
            <div className="absolute left-0 right-0 z-20"
                 style={{ top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.48)', overflow: 'hidden', clipPath: 'inset(0)' }}>
              <h1 className="hero-title font-heading">FIT SMART 360°</h1>
            </div>
          </div>

          {/* ── SEÇÃO INFERIOR ── */}
          <div className="flex-shrink-0 mt-3 flex flex-col gap-2">

            {/* Avatares */}
            <div className="flex items-center">
              {[0.4, 0.32, 0.25, 0.18].map((op, i) => (
                <div key={i}
                     className="w-[44px] h-[44px] rounded-full bg-[#1a1a1a] flex items-center justify-center"
                     style={{ marginRight: '-14px', border: '2px solid #000',
                              boxShadow: '0 0 0 1.5px rgba(200,130,10,0.35)' }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" style={{ fill: `rgba(255,255,255,${op})` }}>
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </div>
              ))}
              <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center font-black text-center"
                   style={{ marginRight: 0, border: '2px solid #000', fontSize: '7.5px', lineHeight: 1.2,
                            background: 'linear-gradient(140deg,#b45309,#f59e0b)',
                            color: '#000', boxShadow: '0 0 0 1.5px rgba(200,130,10,0.35)' }}>
                FS<br/>CLUB
              </div>
            </div>

            <p style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.13em', fontSize: '11px' }}>
              FS PERFORMANCE PLATFORM
            </p>

            {/* Botão */}
            <button
              onClick={() => router.push('/auth')}
              className="w-full font-heading italic font-black tracking-[0.15em] uppercase active:scale-[0.975] transition-transform"
              style={{
                padding: '18px',
                fontSize: '1.1rem',
                color: '#f59e0b',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, #0a0a0a 0%, #1c1008 40%, #3b1c08 70%, #78350f 100%)',
                border: '1.5px solid rgba(234,179,8,0.35)',
                boxShadow: '0 4px 24px rgba(180,83,9,0.3), 0 1px 6px rgba(0,0,0,0.8)',
              }}
            >
              COMEÇAR TREINO
            </button>
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
