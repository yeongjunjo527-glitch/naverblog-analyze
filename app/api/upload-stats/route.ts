import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ 1. CORS 설정 (보안 문 열기)
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  const headers = corsHeaders();

  // ✅ 2. Supabase 클라이언트를 "함수 안에서" 생성 (빌드 에러 방지)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { dataType, data } = body;

    console.log(`📥 데이터 수신됨 [${dataType}]`);

    const statsList = data?.result?.stat || [];
    
    if (!statsList || statsList.length === 0) {
        return NextResponse.json({ message: "Empty Data" }, { headers });
    }

    for (const item of statsList) {
        const date = item.date; 
        const valueStr = String(item.value || "0").replace(/,/g, '');
        const count = parseInt(valueStr, 10);

        const updateData: any = { date: date };
        if (dataType === 'views') updateData.views = count;
        else if (dataType === 'visitors') updateData.visitors = count;
        
        updateData.raw_json = data;

        await supabase.from('blog_stats').upsert(updateData, { onConflict: 'date' });
    }

    return NextResponse.json({ success: true }, { headers });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server Error" }, { status: 500, headers });
  }
}