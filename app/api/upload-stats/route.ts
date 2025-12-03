import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  // 1. 보안 검사 (비밀번호 확인)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. 확장프로그램에서 보낸 데이터 받기
    const body = await request.json();
    const { dataType, data } = body; // 'views' 또는 'visitors'

    console.log(`📥 데이터 수신됨 [${dataType}]`);

    // 3. 네이버 데이터 구조에서 '날짜'와 '수치' 추출하기
    // (네이버 데이터 구조: result.stat 쪽에 통계가 들어있음)
    const statsList = data?.result?.stat || [];
    
    if (statsList.length === 0) {
        return NextResponse.json({ message: "데이터가 비어있습니다." });
    }

    // 4. DB에 저장하기 (날짜별로 루프 돌면서 저장)
    for (const item of statsList) {
        // 날짜 포맷 확인 (YYYY-MM-DD)
        const date = item.date; 
        const count = parseInt(item.value || "0", 10); // 값 (문자열일 수 있어서 숫자로 변환)

        // 저장할 데이터 객체 만들기
        const updateData: any = { date: date };
        
        if (dataType === 'views') {
            updateData.views = count;
        } else if (dataType === 'visitors') {
            updateData.visitors = count;
        }
        updateData.raw_json = data; // 나중을 위해 원본도 백업

        // Supabase에 저장 (upsert: 날짜가 같으면 업데이트, 없으면 추가)
        const { error } = await supabase
            .from('blog_stats')
            .upsert(updateData, { onConflict: 'date' });

        if (error) console.error("DB 저장 에러:", error);
    }

    return NextResponse.json({ success: true, count: statsList.length });

  } catch (e) {
    console.error("서버 에러:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}