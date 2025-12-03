import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase Client (Server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for writes to bypass RLS if needed
);

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Secret
    const secret = req.headers.get('x-api-secret');
    if (secret !== process.env.API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { date, views, visitors, raw_data } = body;

    if (!date || views === undefined || visitors === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Upsert to Supabase
    const { data, error } = await supabase
      .from('blog_stats')
      .upsert(
        { 
          date, 
          views, 
          visitors, 
          raw_data 
        },
        { onConflict: 'date' }
      )
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
