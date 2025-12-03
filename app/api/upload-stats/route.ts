import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. CORS 허가증 설정 (이게 없어서 튕겼던 겁니다!)
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // 모든 주소에서 접속 허용 (보안을 위해 나중에 특정 주소로 바꿀 수 있음)
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  };
}

// 2. "똑똑(OPTIONS)" 노크에 대해 "들어와!"라고 대답하는 함수
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  // 응답에 허가증(Header)을 붙여서 보냅니다.
  const headers = corsHeaders();

  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { dataType, data } = body;

    console.log(`📥 데이터 수신됨 [${dataType}]`);

    // 네이버 데이터 구조 안전하게 파싱
    const statsList = data?.result?.stat || [];
    
    if (!statsList || statsList.length === 0) {
        return NextResponse.json({ message: "Empty Data" }, { headers });
    }

    // 데이터 저장 루프
    for (const item of statsList) {
        const date = item.date; 
        // 콤마(,)가 포함된 문자열일 경우 제거 후 숫자로 변환
        const valueStr = String(item.value || "0").replace(/,/g, '');
        const count = parseInt(valueStr, 10);

        const updateData: any = { date: date };
        if (dataType === 'views') updateData.views = count;
        else if (dataType === 'visitors') updateData.visitors = count;
        
        // 원본 데이터도 백업 (나중을 위해)
        updateData.raw_json = data;

        await supabase.from('blog_stats').upsert(updateData, { onConflict: 'date' });
    }

    return NextResponse.json({ success: true }, { headers });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server Error" }, { status: 500, headers });
  }
}