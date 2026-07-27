'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Zap, TrendingUp, Apple, Droplet, Crown, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InstallPrompt from '@/components/InstallPrompt';

const SLIDES = [
  {
    id: 'treinos',
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1600&fit=crop&q=85',
    title: 'TREINOS', sub: 'PERSONALIZADOS',
    tag: 'IA cria seu plano baseado nos equipamentos da sua academia',
    accent: '#eab308',
  },
  {
    id: 'corrida',
    photo: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=1600&fit=crop&q=85',
    title: 'CORRIDA', sub: '& CARDIO',
    tag: 'Pace, distÃ¢ncia e zonas de frequÃªncia cardÃ­aca em tempo real',
    accent: '#f59e0b',
  },
  {
    id: 'bike',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1600&fit=crop&q=85',
    title: 'CICLISMO', sub: 'INDOOR & OUTDOOR',
    tag: 'Controle total da performance no pedal',
    accent: '#d97706',
  },
  {
    id: 'calistenia',
    photo: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=1600&fit=crop&q=85',
    title: 'CALISTENIA', sub: 'SEM LIMITES',
    tag: 'Do iniciante ao avanÃ§ado â€” sem equipamento, qualquer lugar',
    accent: '#eab308',
  },
  {
    id: 'hidratacao',
    photo: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=1600&fit=crop&q=85',
    title: 'HIDRATAÃ‡ÃƒO', sub: 'INTELIGENTE',
    tag: 'Lembretes automÃ¡ticos para manter seu rendimento no pico',
    accent: '#60a5fa',
  },
  {
    id: 'alimentacao',
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=1600&fit=crop&q=85',
    title: 'NUTRIÃ‡ÃƒO', sub: 'SOB MEDIDA',
    tag: 'Macros e calorias calculados para seu objetivo e fase do treino',
    accent: '#4ade80',
  },
  {
    id: 'conquistas',
    photo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=1600&fit=crop&q=85',
    title: 'CONQUISTAS', sub: '& EVOLUÃ‡ÃƒO',
    tag: 'Badges, recordes pessoais e marcos que te mantÃªm motivado',
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
      {/* Carrossel horizontal â€” snap por slide */}
      <div
        id="carousel"
        ref={scrollRef}
        className="flex h-screen overflow-x-scroll overflow-y-hidden snap-x snap-mandatory"
      >
      <style>{`
        #carousel::-webkit-scrollbar { display: none; }
        #carousel { scrollbar-width: none; }
        /* â”€â”€ TITLE SLIDE-IN â”€â”€ */
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

      {/* â”€â”€ SLIDE 0: HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="flex-shrink-0 w-screen h-screen bg-black flex flex-col overflow-hidden"
               style={{ scrollSnapAlign: 'start' }}>
        <div className="w-full max-w-[430px] mx-auto flex flex-col h-full px-4 pt-5 pb-5">

          {/* â”€â”€ BARRA SUPERIOR: logo + badge â”€â”€ */}
          <div className="flex-shrink-0 flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <svg width="22" height="32" viewBox="0 0 14 22" aria-hidden="true">
                <polygon points="9,0 2,12 7,12 6,22 13,10 8,10" fill="#eab308"/>
              </svg>
              <span className="font-heading italic leading-none"
                    style={{ fontSize: '2.1rem', color: '#eab308',
                             textShadow: '0 0 20px rgba(234,179,8,0.5)' }}>
                FS360Â°
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

          {/* â”€â”€ FITNESS PERFORMANCE â€” fora do card, acima dele â”€â”€ */}
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

          {/* â”€â”€ CARD COM FOTOS â”€â”€ */}
          <div className="flex-1 min-h-0 relative rounded-[20px] overflow-hidden"
               style={{ border: '1.5px solid rgba(200,130,10,0.3)' }}>

            {/* Imagem exata enviada: homem (topo) + mulher na esteira (baixo) */}
            <div className="absolute inset-0"
                 style={{ backgroundImage: 'url(https://i.postimg.cc/NFzFCCBQ/Whats-App-Image-2026-07-27-at-16-35-09.jpg)',
                          backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }} />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)' }} />

            {/* â”€â”€ FAIXA DO TÃTULO â€” cruza o centro exato â”€â”€ */}
            <div className="absolute left-0 right-0 z-20"
                 style={{ top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.48)', overflow: 'hidden', clipPath: 'inset(0)' }}>
              <h1 className="hero-title font-heading">FIT SMART 360Â°</h1>
            </div>
          </div>

          {/* â”€â”€ SEÃ‡ÃƒO INFERIOR â”€â”€ */}
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

            {/* BotÃ£o */}
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
              COMEÃ‡AR TREINO
            </button>
          </div>

        </div>
      </section>

      {/* â”€â”€ SLIDES DE FUNCIONALIDADES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {SLIDES.map((slide, i) => (
        <section
          key={slide.id}
          className="flex-shrink-0 w-screen h-screen relative overflow-hidden"
          style={{ scrollSnapAlign: 'start', background: '#000' }}
        >
          <div className="absolute inset-0 bg-cover bg-center"
               style={{ backgroundImage: `url(${slide.photo})` }} />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.12) 0%,rgba(0,0,0,0.04) 35%,rgba(0,0,0,0.6) 65%,rgba(0,0,0,0.94) 100%)' }} />

          {/* Indicador de slide */}
          <div className="absolute top-5 right-5"
               style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
                        border:`1px solid ${slide.accent}55`, borderRadius:'20px', padding:'4px 12px' }}>
            <span style={{ color: slide.accent, fontSize:'11px', fontWeight:700, letterSpacing:'0.12em' }}>
              {i + 1}/{SLIDES.length}
            </span>
          </div>

          {/* ConteÃºdo no rodapÃ© */}
          <div className="absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto"
               style={{ padding:'0 24px 52px' }}>
            <h2 className="font-heading"
                style={{ fontStyle:'italic', fontWeight:900,
                         fontSize:'clamp(3rem,13vw,5.5rem)', lineHeight:0.9,
                         color:'#fff', letterSpacing:'-0.02em',
                         textShadow:'2px 2px 0 rgba(0,0,0,0.75)' }}>
              {slide.title}<br />
              <span style={{ color: slide.accent }}>{slide.sub}</span>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.82)', fontSize:'15px',
                        marginTop:'10px', lineHeight:1.45 }}>
              {slide.tag}
            </p>
            {i === SLIDES.length - 1 ? (
              <button
                onClick={() => router.push('/auth')}
                className="font-heading italic font-black tracking-widest uppercase mt-5"
                style={{ padding:'15px 32px', borderRadius:'12px',
                         background:'linear-gradient(90deg,#b45309,#f59e0b)',
                         color:'#000', fontSize:'1rem',
                         boxShadow:'0 4px 20px rgba(180,83,9,0.4)' }}
              >
                COMEÃ‡AR GRÃTIS â†’
              </button>
            ) : (
              <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'11px',
                          marginTop:'18px', letterSpacing:'0.15em' }}>
                DESLIZE â†’
              </p>
            )}
          </div>
        </section>
      ))}

      </div>{/* fim do carrossel horizontal */}

      {/* â”€â”€ PONTOS DE NAVEGAÃ‡ÃƒO (overlay fixo) â”€â”€ */}
      <div style={{ position:'fixed', bottom:'14px', left:0, right:0,
                    display:'flex', justifyContent:'center', gap:'5px',
                    pointerEvents:'none', zIndex:50 }}>
        {Array.from({ length: 1 + SLIDES.length }).map((_, i) => (
          <div key={i} style={{
            width: activeSlide === i ? '18px' : '6px',
            height: '6px', borderRadius: '3px',
            background: activeSlide === i ? '#eab308' : 'rgba(255,255,255,0.28)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* â”€â”€ MODAL DE PLANOS â”€â”€ */}
      {showPricing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-4 sm:p-8 max-w-lg sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">Escolha seu plano</h2>
              <Button onClick={() => setShowPricing(false)} variant="ghost" className="text-gray-400 hover:text-white">âœ•</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">Gratuito</h3>
                  <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 0</span>
                  <p className="text-sm text-gray-400 mt-2">Com anÃºncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Treinos personalizados ilimitados','Reconhecimento por IA','CronÃ´metro e acompanhamento','AnÃºncio a cada 2 exercÃ­cios'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">âœ“</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleFreePlanSignup} variant="outline" className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold">Criar Conta Gratuita</Button>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">BÃ¡sico</h3>
                  <span className="text-3xl sm:text-5xl font-bold text-yellow-500">R$ 9,99</span>
                  <span className="text-gray-400">/mÃªs</span>
                  <p className="text-sm text-gray-400 mt-2">Sem anÃºncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Tudo do plano gratuito','Sem anÃºncios','Plano nutricional completo'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">âœ“</span>
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
                  <span className="text-gray-400">/mÃªs</span>
                  <p className="text-sm text-yellow-500 mt-2 font-semibold">Sem anÃºncios</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Tudo do plano bÃ¡sico','Suporte prioritÃ¡rio','Novos recursos em primeira mÃ£o'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">âœ“</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handlePremiumPlanCheckout} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Assinar Agora</Button>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">Cancele quando quiser Â· Sem compromisso</p>
          </div>
        </div>
      )}

      <InstallPrompt />
    </>
  );
}
