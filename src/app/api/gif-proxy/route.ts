import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  const key = process.env.WORKOUTX_API_KEY;
  if (!key) return new NextResponse('Not configured', { status: 503 });

  try {
    const res = await fetch(`https://api.workoutxapp.com/v1/gifs/${id}.gif`, {
      headers: { 'X-WorkoutX-Key': key },
    });
    if (!res.ok) return new NextResponse('GIF not found', { status: res.status });

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Error fetching GIF', { status: 500 });
  }
}
