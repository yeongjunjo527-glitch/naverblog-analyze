import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. CORS 설정 (확장프로그램 접속 허용)
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

  try {
    // ✅ [핵심] 빌드 에러 방지를 위해 함수 안에서 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // API 키 검증
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const body = await request.json();
    const { dataType, data } = body;
    console.log(`📥 데이터 수신: ${dataType}`);

    const statsList = data?.result?.stat || [];
    
    if (!statsList.length) {
        return NextResponse.json({ message: "데이터 없음" }, { headers });
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

  } catch (e: any) {
    console.error("서버 에러:", e);
    return NextResponse.json({ error: e.message }, { status: 500, headers });
  }
}