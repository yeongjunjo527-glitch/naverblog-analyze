export interface BlogStat {
  id?: string;
  date: string;
  views: number;
  visitors: number;
  keyword_rank?: Record<string, any> | null;
  raw_data?: Record<string, any>;
  created_at?: string;
}

export interface AnalysisResult {
  markdown: string;
  chartData?: any; // Optional additional data from AI
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// Enum for API status
export enum FetchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
