'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, User, ArrowLeft, MailCheck } from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase';
import { getUserData } from '@/lib/supabase-helpers';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já está cadastrado.',
};

function translateAuthError(message: string): string {
  return AUTH_ERROR_MESSAGES[message] || message;
}

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage('Supabase não está configurado. Verifique as variáveis de ambiente.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setErrorMessage(translateAuthError(error.message));
          return;
        }

        const userData = await getUserData();
        router.push(userData ? '/dashboard' : '/onboarding');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('As senhas não coincidem.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name },
            emailRedirectTo: 'https://fit-smart-360.vercel.app/bem-vindo',
          },
        });

        if (error) {
          setErrorMessage(translateAuthError(error.message));
          return;
        }

        if (data.session) {
          router.push('/onboarding');
        } else {
          setSignupEmail(formData.email);
          setEmailSent(true);
        }
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,0.15),transparent_60%)]" />
        <div className="relative w-full max-w-md text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Dumbbell className="w-9 h-9 text-yellow-500" />
              <span className="font-heading text-4xl bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent tracking-wide">
                Fit Smart 360°
              </span>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <MailCheck className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            <h1 className="font-heading text-3xl mb-3">Verifique seu e-mail</h1>
            <p className="text-gray-400 mb-2">Enviamos um link de confirmação para:</p>
            <p className="text-yellow-400 font-semibold mb-6">{signupEmail}</p>
            <p className="text-gray-500 text-sm mb-8">
              Clique no link do e-mail para ativar sua conta e acessar o Fit Smart 360º.
              Verifique também a pasta de spam.
            </p>
            <Button
              onClick={() => { setEmailSent(false); setIsLogin(true); }}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold py-6 rounded-2xl text-lg"
            >
              Já confirmei, fazer login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Dumbbell className="w-10 h-10 text-yellow-500" />
            <span className="font-heading text-4xl bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent tracking-wide">
              Fit Smart 360°
            </span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h1>
            <p className="text-gray-400">
              {isLogin 
                ? 'Entre para continuar seu treino' 
                : 'Comece sua jornada fitness hoje'}
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-center text-red-400">{errorMessage}</p>
            </div>
          )}
          {infoMessage && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-sm text-center text-green-400">{infoMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6 text-lg disabled:opacity-60"
            >
              {isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>

          {/* Trial Info */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-center text-yellow-500">
                🎉 3 dias de teste grátis • Cancele quando quiser
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Ao continuar, você concorda com nossos{' '}
          <button className="text-yellow-500 hover:underline">Termos de Uso</button>
          {' '}e{' '}
          <button
            type="button"
            onClick={() => router.push('/privacidade')}
            className="text-yellow-500 hover:underline"
          >
            Política de Privacidade
          </button>
        </p>
      </div>
      <InstallPrompt />
    </div>
  );
}
