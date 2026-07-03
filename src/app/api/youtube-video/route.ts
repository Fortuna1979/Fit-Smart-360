import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ videoId: null });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ videoId: null });

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=1&relevanceLanguage=en&safeSearch=strict&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ videoId: null });
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId ?? null;
    return NextResponse.json({ videoId });
  } catch {
    return NextResponse.json({ videoId: null });
  }
}
