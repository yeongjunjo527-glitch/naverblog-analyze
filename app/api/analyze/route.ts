import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // ✅ 1. 클라이언트 생성을 함수 안으로 이동
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. DB 조회
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

  // 3. AI 분석
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      다음은 내 블로그의 최근 30일간 통계야:
      ${JSON.stringify(stats)}

      역할: 전문 블로그 컨설턴트.
      분석 요청:
      1. [요약] 전체적인 조회수/방문자수 추세 (상승세, 하락세, 유지 등)
      2. [특이점] 수치가 급격히 변한 날짜가 있다면 언급하고 원인 추측
      3. [액션 플랜] 앞으로 성장하기 위해 필요한 구체적인 조언 3가지
      
      말투: 전문적이고 냉철하게 분석해주고, 마크다운(Markdown) 형식을 써줘.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ analysis: text, chartData: stats });
  } catch (e) {
    return NextResponse.json({ analysis: "AI 분석 중 오류가 발생했습니다.", chartData: stats });
  }
}