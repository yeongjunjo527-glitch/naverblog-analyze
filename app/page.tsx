'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analyze')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div className="p-10 text-xl font-bold text-gray-600">데이터를 분석 중입니다... 🤖</div>;
  
  // 데이터가 없을 때 표시할 화면
  if (!data) return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold text-red-500 mb-4">데이터가 없습니다</h1>
      <p className="text-gray-600 mb-4">
        아직 수집된 블로그 통계가 없습니다.<br/>
        크롬 확장프로그램을 통해 네이버 크리에이터 어드바이저에 접속해주세요!
      </p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📈 블로그 AI 어드바이저</h1>
      
      {/* 차트 영역 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-6 text-gray-700">최근 30일 조회수 추이</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: '#888'}} 
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 12, fill: '#888'}}
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="조회수"/>
              <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name="방문자수"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI 분석 영역 */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <h2 className="text-2xl font-bold text-blue-900">Gemini의 분석 리포트</h2>
        </div>
        <div className="prose prose-lg text-gray-700 max-w-none">
          <ReactMarkdown>{data.analysis}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}