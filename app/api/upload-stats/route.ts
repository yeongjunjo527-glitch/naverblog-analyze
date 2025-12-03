import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase Client with Service Role Key for writing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Validate API Secret
    const secret = req.headers.get('x-api-secret');
    if (secret !== process.env.API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Secret' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { date, views, visitors, raw_data } = body;

    // Basic validation
    if (!date || views === undefined || visitors === undefined) {
      return NextResponse.json({ error: 'Missing required fields: date, views, or visitors' }, { status: 400 });
    }

    console.log(`Received stats for ${date}: Views ${views}, Visitors ${visitors}`);

    // 3. Upsert to Supabase
    const { data, error } = await supabase
      .from('blog_stats')
      .upsert(
        { 
          date, 
          views, 
          visitors, 
          raw_data: raw_data || {} 
        },
        { onConflict: 'date' }
      )
      .select();

    if (error) {
      console.error('Supabase Upsert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Stats saved successfully', data });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}