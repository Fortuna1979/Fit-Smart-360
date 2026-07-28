'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InstallPrompt from '@/components/InstallPrompt';

// Slides do carrossel — appScreen: link postimg do screenshot real de cada tela
const SLIDES = [
  {
    id: 'treinos',
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1600&fit=crop&q=85',
    appScreen: null as string | null,
    title: 'TREINOS', sub: 'PERSONALIZADOS',
    tag: 'IA cria seu plano baseado nos equipamentos da sua academia',
    accent: '#eab308',
  },
  {
    id: 'destrava',
    photo: 'https://i.postimg.cc/XNTzrpXC/file-00000000b1a8820eb3b72e5a9c9aa52d.png',
    appScreen: null as string | null,
    title: 'DESTRAVA', sub: 'CORRA · PEDALA · CARDIO',
    tag: 'Corrida, ciclismo e cardio intenso — tudo em uma só tela',
    accent: '#f59e0b',
  },
  {
    id: 'calistenia',
    photo: 'https://i.postimg.cc/NMZp2zGw/file-0000000066bc820eafa8cdcc31a997e9.png',
    appScreen: null as string | null,
    title: 'CALISTENIA', sub: 'PESO CORPORAL',
    tag: 'Treino sem equipamento — apenas seu corpo, qualquer lugar',
    accent: '#eab308',
  },
  {
    id: 'hidratacao',
    photo: 'https://i.postimg.cc/t49D6Pbg/file-000000005148820e96b7cb1ff888a259.png',
    appScreen: null as string | null,
    title: 'HIDRATAÇÃO', sub: 'INTELIGENTE',
    tag: 'Lembretes automáticos para manter seu rendimento no pico',
    accent: '#60a5fa',
  },
  {
    id: 'alimentacao',
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=1600&fit=crop&q=85',
    appScreen: null as string | null,
    title: 'NUTRIÇÃO', sub: 'SOB MEDIDA',
    tag: 'Macros e calorias calculados para seu objetivo e fase do treino',
    accent: '#4ade80',
  },
  {
    id: 'conquistas',
    photo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=1600&fit=crop&q=85',
    appScreen: null as string | null,
    title: 'CONQUISTAS', sub: '& EVOLUÇÃO',
    tag: 'Badges e recordes pessoais que te mantêm motivado',
    accent: '#fbbf24',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [showPricing, setShowPricing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleFreePlanSignup = () => router.push('/auth');
  const handleBasicPlanCheckout = () => window.open('https://pay.kiwify.com.br/y5kh8ps', '_blank');
  const handlePremiumPlanCheckout = () => window.open('https://pay.kiwify.com.br/3aKNiC9', '_blank');

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setActiveSlide(Math.round(el.scrollLeft / window.innerWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Carrossel horizontal — snap por slide */}
      <div
        id="carousel"
        ref={scrollRef}
        className="flex h-screen overflow-x-scroll overflow-y-hidden snap-x snap-mandatory"
      >
        <style>{`
          #carousel::-webkit-scrollbar { display: none; }
          #carousel { scrollbar-width: none; }
          .slide-title {
            font-style: italic;
            font-size: clamp(2.8rem, 12vw, 5rem);
            line-height: 0.92;
            color: #fff;
            letter-spacing: -0.02em;
            text-shadow: 2px 2px 0 rgba(0,0,0,0.75);
          }
        `}</style>

        {/* SLIDE 0: HERO */}
        <section
          className="flex-shrink-0 w-screen h-screen bg-black flex flex-col overflow-hidden"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="w-full max-w-[430px] mx-auto flex flex-col h-full px-4 pt-5 pb-5">

            {/* Barra superior: logo + badge */}
            <div className="flex-shrink-0 flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="text-yellow-400 fill-yellow-400" style={{ width: 30, height: 30 }} />
                <span className="font-heading italic leading-none"
                      style={{ fontSize: '2.6rem', color: '#eab308',
                               textShadow: '0 0 22px rgba(234,179,8,0.7), 0 2px 5px rgba(0,0,0,0.8)' }}>
                  FS360°
                </span>
              </div>
              <div style={{ border: '1.5px solid rgba(234,179,8,0.6)', borderRadius: '8px',
                            padding: '6px 14px', background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 700,
                               letterSpacing: '0.08em' }}>Personal IA</span>
                <Dumbbell className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              </div>
            </div>

            {/* FITNESS PERFORMANCE — fora do card */}
            <div className="flex-shrink-0 mb-2.5">
              <p className="text-white font-black leading-[1.05]"
                 style={{ fontSize: 'clamp(1.15rem, 5.2vw, 1.5rem)', letterSpacing: '0.04em' }}>
                FITNESS
              </p>
              <p className="text-white font-black leading-[1.05]"
                 style={{ fontSize: 'clamp(1.15rem, 5.2vw, 1.5rem)', letterSpacing: '0.04em' }}>
                PERFORMANCE
              </p>
            </div>

            {/* Card com imagem combinada */}
            <div className="flex-1 min-h-0 relative rounded-[20px] overflow-hidden">
              {/* Imagem já com título embutido */}
              <div className="absolute inset-0"
                   style={{ backgroundImage: 'url(https://i.postimg.cc/2y9PVwqx/file-00000000d144820ebc28f7f8d04acff0.png)',
                            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
            </div>

            {/* Seção inferior */}
            <div className="flex-shrink-0 mt-3 flex flex-col gap-2">
              <div>
                <p className="font-heading italic leading-[1.0]"
                   style={{ fontSize: 'clamp(1.1rem, 5.2vw, 1.45rem)', color: '#fff', letterSpacing: '0.02em' }}>
                  SEU TREINO, DO SEU JEITO,
                </p>
                <p className="font-heading italic leading-[1.0]"
                   style={{ fontSize: 'clamp(1.1rem, 5.2vw, 1.45rem)', color: '#eab308', letterSpacing: '0.02em' }}>
                  COM OS APARELHOS QUE VOCÊ TEM
                </p>
              </div>

              <button
                onClick={() => router.push('/auth')}
                className="w-full font-heading italic tracking-[0.15em] uppercase active:scale-[0.975] transition-transform"
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

        {/* SLIDES DE FUNCIONALIDADES */}
        {SLIDES.map((slide, i) => (
          <section
            key={slide.id}
            className="flex-shrink-0 w-screen h-screen relative overflow-hidden"
            style={{ scrollSnapAlign: 'start', background: '#000' }}
          >
            {/* Foto de fundo */}
            <div className="absolute inset-0 bg-cover bg-center"
                 style={{ backgroundImage: `url(${slide.photo})` }} />
            {/* Gradiente dramático */}
            <div className="absolute inset-0"
                 style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.04) 30%,rgba(0,0,0,0.55) 62%,rgba(0,0,0,0.95) 100%)' }} />

            {/* Screenshot do app (aparece quando o link for fornecido) */}
            {slide.appScreen && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                   style={{ width: '42%', maxWidth: '160px' }}>
                <div style={{ borderRadius: '18px', overflow: 'hidden',
                              border: '2px solid rgba(234,179,8,0.4)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  <img src={slide.appScreen} alt={`Tela ${slide.title}`}
                       style={{ width: '100%', display: 'block' }} />
                </div>
              </div>
            )}

            {/* Indicador */}
            <div className="absolute top-5 right-5"
                 style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                          border: `1px solid ${slide.accent}55`, borderRadius: '20px',
                          padding: '4px 12px' }}>
              <span style={{ color: slide.accent, fontSize: '11px', fontWeight: 700,
                             letterSpacing: '0.12em' }}>
                {i + 1}/{SLIDES.length}
              </span>
            </div>

            {/* Conteúdo no rodapé */}
            <div className="absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto"
                 style={{ padding: '0 24px 52px' }}>
              <h2 className="font-heading slide-title">
                {slide.title}<br />
                <span style={{ color: slide.accent }}>{slide.sub}</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '15px',
                          marginTop: '10px', lineHeight: 1.45 }}>
                {slide.tag}
              </p>
              {i === SLIDES.length - 1 ? (
                <button
                  onClick={() => router.push('/auth')}
                  className="font-heading italic tracking-widest uppercase mt-5"
                  style={{ padding: '15px 32px', borderRadius: '12px',
                           background: 'linear-gradient(90deg,#b45309,#f59e0b)',
                           color: '#000', fontSize: '1rem',
                           boxShadow: '0 4px 20px rgba(180,83,9,0.4)' }}
                >
                  COMEÇAR GRÁTIS →
                </button>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px',
                            marginTop: '18px', letterSpacing: '0.15em' }}>
                  DESLIZE →
                </p>
              )}
            </div>
          </section>
        ))}
      </div>{/* fim do carrossel */}

      {/* Pontos de navegação (overlay fixo) */}
      <div style={{ position: 'fixed', bottom: '14px', left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: '5px',
                    pointerEvents: 'none', zIndex: 50 }}>
        {Array.from({ length: 1 + SLIDES.length }).map((_, i) => (
          <div key={i} style={{
            width: activeSlide === i ? '18px' : '6px',
            height: '6px', borderRadius: '3px',
            background: activeSlide === i ? '#eab308' : 'rgba(255,255,255,0.28)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Modal de planos */}
      {showPricing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-4 sm:p-8 max-w-lg sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">Escolha seu plano</h2>
              <Button onClick={() => setShowPricing(false)} variant="ghost" className="text-gray-400 hover:text-white">✕</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">Gratuito</h3>
                  <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 0</span>
                  <p className="text-sm text-gray-400 mt-2">Com anúncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Treinos personalizados ilimitados','Reconhecimento por IA','Cronômetro e acompanhamento','Anúncio a cada 2 exercícios'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">✓</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleFreePlanSignup} variant="outline" className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold">Criar Conta Gratuita</Button>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">Básico</h3>
                  <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 9,99</span>
                  <span className="text-gray-400">/mês</span>
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
                <Button onClick={handleBasicPlanCheckout} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Assinar Agora</Button>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 rounded-2xl p-5 sm:p-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">MAIS POPULAR</div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>
                  <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 19,99</span>
                  <span className="text-gray-400">/mês</span>
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
                <Button onClick={handlePremiumPlanCheckout} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Assinar Agora</Button>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">Cancele quando quiser · Sem compromisso</p>
          </div>
        </div>
      )}

      <InstallPrompt />
    </>
  );
}
