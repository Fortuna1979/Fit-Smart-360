import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mapeamento de produto do Kiwify -> plano do app.
// Preencher com os product_id reais assim que recebermos o primeiro evento de teste
// (botão "Testar Webhook" no painel do Kiwify, depois que o site estiver publicado).
const KIWIFY_PRODUCT_TO_PLAN: Record<string, 'basic' | 'premium'> = {
  // 'PRODUCT_ID_DO_PLANO_BASICO': 'basic',
  // 'PRODUCT_ID_DO_PLANO_PREMIUM': 'premium',
};

const PAID_STATUSES = ['paid', 'approved'];
const CANCELED_STATUSES = ['refunded', 'chargedback', 'canceled', 'cancelled', 'expired'];

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Supabase não configurado para o webhook (SUPABASE_SECRET_KEY ausente)');
  }

  return createClient(supabaseUrl, supabaseSecretKey);
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase();

  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) return match.id;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!process.env.KIWIFY_WEBHOOK_SECRET || token !== process.env.KIWIFY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await request.json();
    console.log('Webhook Kiwify recebido:', JSON.stringify(payload));

    const email: string | undefined = payload?.Customer?.email ?? payload?.customer?.email;
    const productId: string | undefined =
      payload?.Product?.product_id ?? payload?.product?.id ?? payload?.product_id;
    const orderStatus: string = String(
      payload?.order_status ?? payload?.status ?? ''
    ).toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'E-mail do comprador não encontrado no payload' }, { status: 400 });
    }

    const userId = await findUserIdByEmail(email);
    if (!userId) {
      console.warn('Webhook Kiwify: nenhum usuário encontrado para o e-mail', email);
      return NextResponse.json({ received: true, matched: false });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (CANCELED_STATUSES.includes(orderStatus)) {
      await supabaseAdmin.from('user_data').update({ subscription_plan: 'free' }).eq('user_id', userId);
      return NextResponse.json({ received: true, plan: 'free' });
    }

    if (PAID_STATUSES.includes(orderStatus)) {
      const plan = productId ? KIWIFY_PRODUCT_TO_PLAN[productId] : undefined;
      if (!plan) {
        console.warn('Webhook Kiwify: produto sem mapeamento de plano:', productId);
        return NextResponse.json({ received: true, matched: false });
      }

      await supabaseAdmin.from('user_data').update({ subscription_plan: plan }).eq('user_id', userId);
      return NextResponse.json({ received: true, plan });
    }

    return NextResponse.json({ received: true, ignored: orderStatus });
  } catch (error) {
    console.error('Erro no webhook do Kiwify:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}
