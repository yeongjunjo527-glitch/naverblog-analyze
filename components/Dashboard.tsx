import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Activity, Users, Eye, Sparkles, RefreshCw, BarChart3 } from 'lucide-react';
import { FetchStatus, BlogStat } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<BlogStat[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [analysisStatus, setAnalysisStatus] = useState<FetchStatus>(FetchStatus.IDLE);

  // Function to load raw data for the chart (Client-side fetch from DB or API)
  const loadData = useCallback(async () => {
    setStatus(FetchStatus.LOADING);
    try {
      // In a real app, you might use the Supabase client directly or an API route.
      // For consistency with the architecture, let's hit the analyze endpoint 
      // which returns both data and analysis, or just use Supabase client here for the chart.
      // Here we will use the API to analyze which also refreshes data context.
      
      // Let's create a simple fetcher for just the stats to populate the chart initially
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('blog_stats')
        .select('*')
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;
      setStats(data || []);
      setStatus(FetchStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(FetchStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Function to call the AI Analysis API
  const handleAnalyze = async () => {
    if (stats.length === 0) return;
    setAnalysisStatus(FetchStatus.LOADING);
    
    try {
      const response = await fetch('/api/analyze');
      if (!response.ok) throw new Error('Analysis failed');
      
      const result = await response.json();
      setAnalysis(result.markdown);
      // The API also returns 'chartData', we could update stats here too if we wanted strict sync
      if (result.chartData) {
        setStats(result.chartData);
      }
      setAnalysisStatus(FetchStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setAnalysisStatus(FetchStatus.ERROR);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const totalViews = stats.reduce((acc, curr) => acc + curr.views, 0);
  const totalVisitors = stats.reduce((acc, curr) => acc + curr.visitors, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-brand-600" />
            AI Blog Advisor
          </h1>
          <p className="text-slate-500 mt-1">
            Naver Blog Insights & AI-Powered Strategy
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={status === FetchStatus.LOADING ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Eye size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Total Views (30d)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">
            {totalViews.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Total Visitors (30d)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">
            {totalVisitors.toLocaleString()}
          </p>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-start">
            <button
              onClick={handleAnalyze}
              disabled={analysisStatus === FetchStatus.LOADING || stats.length === 0}
              className="w-full h-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Sparkles size={20} className={analysisStatus === FetchStatus.LOADING ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
              {analysisStatus === FetchStatus.LOADING ? "AI Analyzing..." : "Get AI Insights"}
            </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-slate-400" size={20}/>
              Traffic Trends
            </h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Last 30 Days</span>
          </div>
          
          {status === FetchStatus.LOADING && stats.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading charts...</div>
          ) : stats.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate} 
                    stroke="#cbd5e1"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#cbd5e1" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    name="Page Views"
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                    name="Visitors"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p>No data collected yet.</p>
              <p className="text-sm mt-2">Use the Chrome Extension on Naver Creator Advisor.</p>
            </div>
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <Sparkles className="text-brand-500" size={20} />
            AI Insight
          </h2>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {analysis ? (
              <div className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-brand-700">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            ) : analysisStatus === FetchStatus.LOADING ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
                 <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                 <p className="text-slate-500 text-sm font-medium">Gemini is analyzing your traffic patterns...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 p-8 text-center">
                <Sparkles className="mb-3 text-slate-300" size={48} />
                <p className="font-medium text-slate-600">Ready to Analyze</p>
                <p className="text-sm mt-1">Click the "Get AI Insights" button to generate a growth strategy report.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;