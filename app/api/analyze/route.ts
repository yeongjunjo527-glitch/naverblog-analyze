import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // ✅ [수정됨] 함수 안에서 생성
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!supabaseUrl || !supabaseKey || !googleApiKey) {
     return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const genAI = new GoogleGenerativeAI(googleApiKey);

  // DB 조회
  const { data: stats, error } = await supabase
    .from('blog_stats')
    .select('date, views, visitors')
    .order('date', { ascending: true })
    .limit(30);

  if (error || !stats || stats.length === 0) {
    return NextResponse.json({ 
      analysis: "데이터가 아직 없습니다. 크롬 확장프로그램으로 네이버 통계 페이지를 방문해주세요!", 
      chartData: [] 
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      데이터: ${JSON.stringify(stats)}
      역할: 블로그 컨설턴트.
      요청: 위 데이터를 보고 1.성장추세, 2.특이점, 3.개선전략을 마크다운으로 분석해줘.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ analysis: text, chartData: stats });
  } catch (e) {
    return NextResponse.json({ analysis: "분석 실패", chartData: stats });
  }
}