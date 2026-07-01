export interface Achievement {
  key: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'primeiro_treino',
    name: 'Primeira Pedalada',
    desc: 'Complete seu primeiro treino',
    icon: '🏋️',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/50',
  },
  {
    key: 'calistenia_master',
    name: 'Calistênicos',
    desc: 'Complete um treino de calistenia',
    icon: '🤸',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/50',
  },
  {
    key: 'tres_consecutivos',
    name: 'Em Chamas',
    desc: 'Treine 3 dias seguidos',
    icon: '🔥',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/50',
  },
  {
    key: 'sete_consecutivos',
    name: 'Semana Perfeita',
    desc: '7 dias consecutivos de treino',
    icon: '⚡',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/50',
  },
  {
    key: 'dez_treinos',
    name: 'Dedicado',
    desc: 'Complete 10 treinos no total',
    icon: '💪',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/50',
  },
  {
    key: 'trinta_treinos',
    name: 'Consistente',
    desc: 'Complete 30 treinos no total',
    icon: '🏆',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/50',
  },
  {
    key: 'cinquenta_treinos',
    name: 'Elite',
    desc: 'Complete 50 treinos no total',
    icon: '🌟',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/50',
  },
  {
    key: 'cem_treinos',
    name: 'Lendário',
    desc: 'Complete 100 treinos no total',
    icon: '💎',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/50',
  },
  {
    key: 'primeiro_territorio',
    name: 'Explorador',
    desc: 'Domine seu primeiro território',
    icon: '🗺️',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/50',
  },
  {
    key: 'cinco_territorios',
    name: 'Conquistador',
    desc: 'Domine 5 territórios',
    icon: '👑',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/50',
  },
  {
    key: 'vinte_territorios',
    name: 'Dominador',
    desc: 'Domine 20 territórios',
    icon: '🏰',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/50',
  },
  {
    key: 'popular',
    name: 'Popular',
    desc: 'Receba seu primeiro Kudos de alguém',
    icon: '👊',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/50',
  },
];
