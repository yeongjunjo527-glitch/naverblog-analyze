import { createClient } from '@supabase/supabase-js';
import { BlogStat } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchStats = async (days = 30): Promise<BlogStat[]> => {
  const { data, error } = await supabase
    .from('blog_stats')
    .select('*')
    .order('date', { ascending: true })
    .limit(days);

  if (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }

  return data || [];
};

// NOTE: In a real Next.js app, the upsert logic below would typically reside 
// in the /api/upload-stats route (server-side) to protect write access.
// We include it here for completeness of the "API" logic requested.
export const upsertStat = async (stat: BlogStat, secret: string): Promise<void> => {
  // Simple client-side check, real check happens on RLS or Server Function
  if (!stat.date) throw new Error("Date is required");

  const { error } = await supabase
    .from('blog_stats')
    .upsert(stat, { onConflict: 'date' });

  if (error) {
    throw error;
  }
};
