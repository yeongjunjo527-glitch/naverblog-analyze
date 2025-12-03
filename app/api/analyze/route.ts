import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 빌드 에러 방지를 위해 이 설정을 추가합니다.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ✅ [핵심] 함수 안에서 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;

    if (!supabaseUrl || !supabaseKey || !googleApiKey) {
       return NextResponse.json({ error: "환경변수 설정 오류" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(googleApiKey);

    const { data: stats, error } = await supabase
      .from('blog_stats')
      .select('date, views, visitors')
      .order('date', { ascending: true })
      .limit(30);

    if (error || !stats || stats.length === 0) {
      return NextResponse.json({ 
        analysis: "아직 데이터가 없습니다. 확장프로그램으로 데이터를 수집해주세요!", 
        chartData: [] 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `데이터: ${JSON.stringify(stats)}. 블로그 컨설턴트로서 성장 추세, 특이점, 개선 전략 3가지를 마크다운으로 분석해줘.`;
    
    const result = await model.generateContent(prompt);
    return NextResponse.json({ analysis: result.response.text(), chartData: stats });

  } catch (e: any) {
    return NextResponse.json({ analysis: "분석 중 오류 발생: " + e.message, chartData: [] });
  }
}