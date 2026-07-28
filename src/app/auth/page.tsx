'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, User, ArrowLeft, ArrowRight, Eye, EyeOff, MailCheck } from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';
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
  const [emailSent, setEmailSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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

        if (error) { setErrorMessage(translateAuthError(error.message)); return; }

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

        if (error) { setErrorMessage(translateAuthError(error.message)); return; }

        if (data.session) {
          router.push('/onboarding');
        } else {
          setSignupEmail(formData.email);
          setEmailSent(true);
        }
      }
    } catch {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── Tela de confirmação de e-mail ── */
  if (emailSent) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <Dumbbell className="text-yellow-400 mb-8" style={{ width: 80, height: 80, transform: 'rotate(-20deg)' }} strokeWidth={2} />
        <MailCheck className="text-yellow-400 mb-4" style={{ width: 56, height: 56 }} />
        <h1 className="text-2xl font-bold mb-2">Verifique seu e-mail</h1>
        <p className="text-gray-400 mb-1">Enviamos um link de confirmação para:</p>
        <p className="text-yellow-400 font-semibold mb-6">{signupEmail}</p>
        <p className="text-gray-500 text-sm mb-8">Clique no link para ativar sua conta. Verifique também o spam.</p>
        <button
          onClick={() => { setEmailSent(false); setIsLogin(true); }}
          className="w-full max-w-sm bg-yellow-400 text-black font-bold py-5 rounded-2xl flex items-center justify-between px-6 active:scale-[0.98] transition-transform"
        >
          <span className="text-lg tracking-wide">JÁ CONFIRMEI</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    );
  }

  /* ── Campos de input reutilizáveis ── */
  const inputRow = (
    icon: React.ReactNode,
    id: string,
    name: string,
    type: string,
    placeholder: string,
    value: string,
    rightIcon?: React.ReactNode
  ) => (
    <div className="flex items-center rounded-2xl px-4 gap-3"
         style={{ background: '#111', border: '1.5px solid #222', height: 64 }}>
      <span className="text-yellow-400 flex-shrink-0">{icon}</span>
      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        required
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
        className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-base"
      />
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </div>
  );

  /* ── Tela principal de login / cadastro ── */
  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-6" style={{ paddingTop: 48, paddingBottom: 32 }}>

      {/* Voltar */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-yellow-400 font-bold tracking-widest text-sm mb-2 w-fit active:opacity-70"
      >
        <ArrowLeft className="w-5 h-5" />
        VOLTAR
      </button>

      {/* Haltere */}
      <div className="flex justify-center" style={{ marginTop: 24, marginBottom: 36 }}>
        <Dumbbell
          className="text-yellow-400"
          style={{ width: 130, height: 130, transform: 'rotate(-20deg)' }}
          strokeWidth={2}
        />
      </div>

      {/* Erro */}
      {errorMessage && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-center text-sm text-red-400"
             style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {errorMessage}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {!isLogin && (
          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Nome</p>
            {inputRow(<User className="w-5 h-5" />, 'name', 'name', 'text', 'Seu nome completo', formData.name)}
          </div>
        )}

        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">E-mail</p>
          {inputRow(<Mail className="w-5 h-5" />, 'email', 'email', 'email', 'seu@email.com', formData.email)}
        </div>

        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Senha</p>
          {inputRow(
            <Lock className="w-5 h-5" />,
            'password', 'password',
            showPassword ? 'text' : 'password',
            '••••••••',
            formData.password,
            <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-500 active:text-yellow-400">
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          )}
        </div>

        {!isLogin && (
          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Confirmar Senha</p>
            {inputRow(
              <Lock className="w-5 h-5" />,
              'confirmPassword', 'confirmPassword',
              showConfirm ? 'text' : 'password',
              '••••••••',
              formData.confirmPassword,
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-500 active:text-yellow-400">
                {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}

        {isLogin && (
          <div className="text-right">
            <button type="button" className="text-yellow-400 text-sm font-semibold">
              Esqueceu a senha?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-bold flex items-center justify-between px-6 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ background: '#f59e0b', color: '#000', height: 68, fontSize: '1.15rem', letterSpacing: '0.08em', marginTop: 4 }}
        >
          <span>{isSubmitting ? 'AGUARDE...' : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </form>

      {/* Divisor OU */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px" style={{ background: '#222' }} />
        <span className="text-gray-600 text-sm font-bold tracking-widest">OU</span>
        <div className="flex-1 h-px" style={{ background: '#222' }} />
      </div>

      {/* Toggle login/cadastro */}
      <p className="text-center text-white text-base">
        {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
        <button
          onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); }}
          className="text-yellow-400 font-semibold"
        >
          {isLogin ? 'Cadastre-se' : 'Faça login'}
        </button>
      </p>

      {/* Termos */}
      <p className="text-center text-xs text-gray-600 mt-6">
        Ao continuar, você concorda com os{' '}
        <button className="text-yellow-600 hover:underline">Termos de Uso</button>
        {' '}e{' '}
        <button onClick={() => router.push('/privacidade')} className="text-yellow-600 hover:underline">
          Política de Privacidade
        </button>
      </p>

      <InstallPrompt />
    </div>
  );
}
