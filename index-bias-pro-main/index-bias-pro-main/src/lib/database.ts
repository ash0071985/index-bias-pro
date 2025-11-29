import { supabase } from '@/integrations/supabase/client';
import { IndexAnalysis } from '@/types/options';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type AnalysisHistoryInsert = TablesInsert<'analysis_history'>;
export type AnalysisHistoryUpdate = TablesUpdate<'analysis_history'>;
export type SavedReportInsert = TablesInsert<'saved_reports'>;

/**
 * Save an analysis to the database
 */
export async function saveAnalysis(analysis: IndexAnalysis, rawData?: any) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be authenticated to save analysis');
    }

    const analysisData: AnalysisHistoryInsert = {
        user_id: user.id,
        index_name: analysis.index,
        spot_close: analysis.spot_close,
        expiry_date: analysis.expiry,
        atm_strike: analysis.atm,
        pcr: analysis.pcr,
        bias: analysis.bias,
        strategy: analysis.strategy || null,
        support_zones: analysis.support_zones as any,
        resistance_zones: analysis.resistance_zones as any,
        premium_table: analysis.premium_table as any,
        raw_data: rawData || null,
    };

    const { data, error } = await supabase
        .from('analysis_history')
        .insert(analysisData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get analysis history for the current user
 */
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

/**
 * Get a specific analysis by ID
 */
export async function getAnalysisById(id: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update an existing analysis
 */
export async function updateAnalysis(id: string, updates: AnalysisHistoryUpdate) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
        .from('analysis_history')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(id: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be authenticated');
    }

    const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw error;
}

/**
 * Save a report reference
 */
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

    const reportData: SavedReportInsert = {
        user_id: user.id,
        analysis_id: analysisId,
        report_name: reportName,
        report_type: reportType,
        notes: notes || null,
        tags: tags || [],
    };

    const { data, error } = await supabase
        .from('saved_reports')
        .insert(reportData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get saved reports
 */
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

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(reportId: string, isBookmarked: boolean) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
        .from('saved_reports')
        .update({ is_bookmarked: isBookmarked })
        .eq('id', reportId)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a saved report
 */
export async function deleteReport(reportId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be authenticated');
    }

    const { error } = await supabase
        .from('saved_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

    if (error) throw error;
}

/**
 * Get analysis statistics
 */
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

    // Calculate statistics
    const totalAnalyses = data.length;
    const indexBreakdown = data.reduce((acc, item) => {
        acc[item.index_name] = (acc[item.index_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const biasBreakdown = data.reduce((acc, item) => {
        acc[item.bias] = (acc[item.bias] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalAnalyses,
        indexBreakdown,
        biasBreakdown,
    };
}
