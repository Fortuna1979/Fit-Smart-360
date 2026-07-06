import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
  }

  const uid = user.id;

  const [userData, equipments, workouts, progress, nutrition, hydration, achievements, feed, territories] = await Promise.all([
    supabase.from('user_data').select('*').eq('user_id', uid).single(),
    supabase.from('scanned_equipments').select('*').eq('user_id', uid),
    supabase.from('workout_plans').select('*').eq('user_id', uid),
    supabase.from('workout_progress').select('*').eq('user_id', uid).single(),
    supabase.from('nutrition_plans').select('*').eq('user_id', uid),
    supabase.from('hydration_logs').select('*').eq('user_id', uid),
    supabase.from('user_achievements').select('*').eq('user_id', uid),
    supabase.from('activity_feed').select('*').eq('user_id', uid),
    supabase.from('territories').select('*').eq('user_id', uid),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: userData.data ?? null,
    equipments: equipments.data ?? [],
    workouts: workouts.data ?? [],
    progress: progress.data ?? null,
    nutrition_plans: nutrition.data ?? [],
    hydration_logs: hydration.data ?? [],
    achievements: achievements.data ?? [],
    activity_feed: feed.data ?? [],
    territories: territories.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="fitsmart360-meus-dados-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}
