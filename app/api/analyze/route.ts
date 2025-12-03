import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch recent 30 days of data from Supabase
    const { data: stats, error } = await supabase
      .from('blog_stats')
      .select('date, views, visitors')
      .order('date', { ascending: true })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!stats || stats.length === 0) {
      return NextResponse.json({ 
        markdown: "데이터가 충분하지 않습니다. 확장 프로그램을 통해 데이터를 수집해주세요.",
        chartData: []
      });
    }

    // 2. Prepare Data for Gemini Prompt
    const dataSummary = JSON.stringify(stats);
    
    // 3. Construct Prompt
    const prompt = `
      다음은 내 블로그의 최근 30일간 통계 데이터(JSON)입니다.
      데이터: ${dataSummary}

      이 데이터를 분석해서 다음 내용을 마크다운(Markdown) 형식으로 작성해주세요:
      
      1. **📈 성장 추세 분석**: 조회수와 방문자 수의 추세를 분석해주세요. (성장 중, 정체, 하락 등)
      2. **🔍 특이사항 발견**: 유독 수치가 높거나 낮은 날짜를 찾고, 일반적인 블로그 패턴(주말/평일 등)을 고려하여 원인을 추론해주세요.
      3. **🚀 향후 운영 전략 3가지**: 이 데이터 패턴을 바탕으로 트래픽을 늘리기 위한 구체적인 실행 전략 3가지를 제안해주세요.

      어조는 전문적이고 분석적인 어조를 유지해주세요.
    `;

    // 4. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;

    // 5. Return result
    return NextResponse.json({
      markdown: text,
      chartData: stats
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
}