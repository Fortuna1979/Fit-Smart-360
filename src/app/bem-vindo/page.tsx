'use client';

import { useRouter } from 'next/navigation';
import { Dumbbell, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BemVindoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,0.15),transparent_60%)]" />

      <div className="relative w-full max-w-md text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Dumbbell className="w-9 h-9 text-yellow-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
              Fit Smart 360º
            </span>
          </div>

          {/* Ícone de confirmação */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-yellow-500" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold mb-3">
            Seja bem-vindo!
          </h1>
          <p className="text-xl font-semibold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent mb-4">
            Tudo está pronto para você começar
          </p>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Sua conta foi confirmada com sucesso. Agora é só entrar e iniciar sua jornada fitness com treinos personalizados para o seu objetivo.
          </p>

          {/* Destaques */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {[
              {
                img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=300&fit=crop&q=80',
                label: 'Treinos personalizados',
              },
              {
                img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=300&fit=crop&q=80',
                label: 'Scan de equipamentos',
              },
              {
                img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&h=300&fit=crop&q=80',
                label: 'Acompanhe seu progresso',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="relative overflow-hidden rounded-2xl border border-gray-700 flex flex-col items-center"
              >
                <div
                  className="w-full h-20 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.img})` }}
                />
                <div className="w-full bg-gray-800/80 px-1 py-2">
                  <span className="text-xs text-gray-300 leading-tight text-center block">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Botão */}
          <Button
            onClick={() => router.push('/auth')}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold py-6 rounded-2xl text-lg transition-all duration-200 hover:scale-[1.02]"
          >
            Entrar na minha conta
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

        </div>
      </div>
    </div>
  );
}
