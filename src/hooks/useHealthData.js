import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    generateDemoDashboard,
    generateDemoWeightData,
    transformWeightData,
    calculateStats,
} from '../data/demo-data';

/**
 * Fetch weight entries from Supabase (RLS ensures user only sees own data)
 */
async function fetchWeightEntries(days = 0) {
    let query = supabase
        .from('weight_entries')
        .select('*')
        .order('measured_at', { ascending: true });

    if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];
        query = query.gte('measured_at', cutoff);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

/**
 * Fetch user profile from Supabase (RLS: own profile only)
 */
async function fetchProfile() {
    const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Fetch last sync info (RLS: own syncs only)
 */
async function fetchLastSync() {
    const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Fetch sleep entries from Supabase (RLS ensures user only sees own data)
 */
async function fetchSleepEntries(days = 0) {
    let query = supabase
        .from('sleep_entries')
        .select('*')
        .order('calendar_date', { ascending: true });

    if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];
        query = query.gte('calendar_date', cutoff);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Sleep fetch error:', error);
        return [];
    }
    return data || [];
}

/**
 * Transform Supabase weight entries to chart-ready format
 */
function transformEntries(entries) {
    return (entries || []).map((entry) => ({
        date: entry.measured_at,
        weight: parseFloat(entry.weight),
        bmi: entry.bmi ? parseFloat(entry.bmi) : null,
        bodyFat: entry.body_fat ? parseFloat(entry.body_fat) : null,
        muscleMass: entry.muscle_mass ? parseFloat(entry.muscle_mass) : null,
        boneMass: entry.bone_mass ? parseFloat(entry.bone_mass) : null,
        bodyWater: entry.body_water ? parseFloat(entry.body_water) : null,
    }));
}

/**
 * Trigger Garmin sync via Supabase Edge Function
 * Uses the current user's JWT for authentication
 */
export async function triggerSync(days = 90) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Je moet ingelogd zijn om te synchroniseren.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nlkbrwcbtfmsffugvibt.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const res = await fetch(`${supabaseUrl}/functions/v1/sync-garmin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ days, user_token: session.access_token }),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Sync mislukt');
    return result;
}

/**
 * Hook: Dashboard data including weight history, stats, and profile
 */
export function useDashboard(days = 0) {
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDemo, setIsDemo] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [user, setUser] = useState(null);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);

            const [entries, profile, syncInfo, habitData, sleepData] = await Promise.all([
                fetchWeightEntries(days),
                fetchProfile(),
                fetchLastSync(),
                supabase.from('daily_habits').select('*').order('date', { ascending: false }).limit(30),
                fetchSleepEntries(days),
            ]);


            const transformed = transformEntries(entries);
            setChartData(transformed);
            setStats(calculateStats(transformed));
            setLastSync(syncInfo);

            setData({
                profile: profile
                    ? {
                        displayName: profile.display_name,
                        height: profile.height_cm ? parseFloat(profile.height_cm) : null,
                        birthDate: profile.birth_date,
                        gender: profile.gender,
                        targetWeight: profile.target_weight ? parseFloat(profile.target_weight) : null,
                        startWeight: profile.start_weight ? parseFloat(profile.start_weight) : null,
                        fastingStart: profile.fasting_start_time,
                        fastingEnd: profile.fasting_end_time,
                        sleepTarget: profile.sleep_target_time,
                        dashboardLayout: profile.dashboard_layout || null,
                    }
                    : null,
                habits: habitData.data || [],
                sleep: sleepData || [],
                fetchedAt: syncInfo?.synced_at || new Date().toISOString(),
                entriesCount: entries.length,
            });

            setIsDemo(entries.length === 0);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message);
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    }, [days]);

    const updateProfile = useCallback(async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('user_profile')
            .upsert({
                id: user.id,
                ...updates,
                updated_at: new Date().toISOString(),
            });

        if (error) throw error;
        await fetchDashboard();
    }, [fetchDashboard]);

    const logHabit = useCallback(async (habitUpdates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('daily_habits')
            .upsert({
                user_id: user.id,
                date: today,
                ...habitUpdates,
            }, { onConflict: 'user_id,date' });

        if (error) throw error;
        await fetchDashboard();
    }, [fetchDashboard]);

    const sync = useCallback(async (syncDays = 90) => {
        setSyncing(true);
        try {
            const result = await triggerSync(syncDays);
            console.log('✅ Sync completed:', result);
            // Refresh data after sync
            await fetchDashboard();
            return result;
        } catch (err) {
            console.error('Sync failed:', err);
            setError(`Sync mislukt: ${err.message}`);
            throw err;
        } finally {
            setSyncing(false);
        }
    }, [fetchDashboard]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        stats,
        chartData,
        loading,
        error,
        isDemo,
        syncing,
        lastSync,
        refresh: fetchDashboard,
        sync,
        updateProfile,
        logHabit,
        user,
    };
}

/**
 * Hook: Animated counter for numbers
 */
export function useAnimatedValue(targetValue, duration = 1000) {
    const [value, setValue] = useState(0);
    const frameRef = useRef();

    useEffect(() => {
        if (targetValue == null) return;

        const startTime = performance.now();
        const startValue = value;
        const diff = targetValue - startValue;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(startValue + diff * eased);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        }

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [targetValue, duration]);

    return value;
}
