import { supabase } from '@/integrations/supabase/client';
import { IndexAnalysis } from '@/types/options';

export interface AnalysisHistoryUpdate {
  bias?: string;
  strategy?: string;
  notes?: string;
}

export async function saveAnalysis(analysis: IndexAnalysis, rawData?: any) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to save analysis');
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .insert([{
      user_id: user.id,
      index_name: analysis.index,
      spot_close: analysis.spot_close,
      expiry_date: analysis.expiry,
      atm_strike: analysis.atm,
      pcr: analysis.pcr,
      bias: analysis.bias,
      support_zones: analysis.support_zones as any,
      resistance_zones: analysis.resistance_zones as any,
      premium_table: analysis.premium_table as any,
      strategy: analysis.strategy,
      raw_data: rawData as any,
      analysis_date: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAnalysisHistory(
  limit: number = 50,
  indexName?: string,
  startDate?: Date,
  endDate?: Date
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  let query = supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', user.id)
    .order('analysis_date', { ascending: false })
    .limit(limit);

  if (indexName) {
    query = query.eq('index_name', indexName);
  }

  if (startDate) {
    query = query.gte('analysis_date', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('analysis_date', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getAnalysisById(id: string) {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAnalysis(id: string, updates: AnalysisHistoryUpdate) {
  const { data, error } = await supabase
    .from('analysis_history')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function saveReport(
  analysisId: string,
  reportName: string,
  reportType: 'PDF' | 'CSV' | 'JSON',
  notes?: string,
  tags?: string[]
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('saved_reports')
    .insert([{
      user_id: user.id,
      analysis_id: analysisId,
      report_name: reportName,
      report_type: reportType,
      notes,
      tags,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSavedReports(bookmarkedOnly: boolean = false) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  let query = supabase
    .from('saved_reports')
    .select('*, analysis_history(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (bookmarkedOnly) {
    query = query.eq('is_bookmarked', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function toggleBookmark(reportId: string, isBookmarked: boolean) {
  const { data, error } = await supabase
    .from('saved_reports')
    .update({ is_bookmarked: isBookmarked })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReport(reportId: string) {
  const { error } = await supabase
    .from('saved_reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
}

export async function getAnalysisStats() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .select('index_name, bias, analysis_date')
    .eq('user_id', user.id);

  if (error) throw error;

  return {
    total: data.length,
    byIndex: data.reduce((acc, curr) => {
      acc[curr.index_name] = (acc[curr.index_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byBias: data.reduce((acc, curr) => {
      acc[curr.bias] = (acc[curr.bias] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}