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
 * Process a Garmin export ZIP file client-side.
 * Extracts weight (userBioMetrics) and sleep data, then upserts to Supabase.
 */
export async function processGarminExport(file, onProgress) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Je moet ingelogd zijn om te importeren.');

    if (onProgress) onProgress('ZIP bestand laden...');

    // Dynamic import JSZip
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);

    const userId = user.id;
    let weightSynced = 0;
    let sleepSynced = 0;

    // ---- Process Weight Data from userBioMetrics.json ----
    if (onProgress) onProgress('Gewichtsdata verwerken...');

    const bioMetricsFile = Object.keys(zip.files).find(f =>
        f.includes('userBioMetrics') && f.endsWith('.json')
    );

    if (bioMetricsFile) {
        const bioMetricsJson = await zip.files[bioMetricsFile].async('string');
        const bioMetrics = JSON.parse(bioMetricsJson);

        // Build weight entries, keep latest per date
        const entriesMap = {};
        for (const entry of bioMetrics) {
            if (!entry.weight?.weight || !entry.metaData?.calendarDate) continue;

            const w = entry.weight;
            const dateStr = entry.metaData.calendarDate.split('T')[0];

            entriesMap[dateStr] = {
                user_id: userId,
                measured_at: dateStr,
                weight: (w.weight / 1000).toFixed(2),
                bmi: w.bmi || null,
                body_fat: w.bodyFat || null,
                muscle_mass: w.muscleMass ? (w.muscleMass / 1000).toFixed(2) : null,
                bone_mass: w.boneMass ? (w.boneMass / 1000).toFixed(2) : null,
                body_water: w.bodyWater || null,
                source: w.sourceType || 'GARMIN_EXPORT',
                raw_data: entry,
            };
        }

        const weightEntries = Object.values(entriesMap);
        if (weightEntries.length > 0) {
            if (onProgress) onProgress(`${weightEntries.length} gewichtsmetingen opslaan...`);

            // Upsert in batches of 500 to avoid payload limits
            for (let i = 0; i < weightEntries.length; i += 500) {
                const batch = weightEntries.slice(i, i + 500);
                const { error } = await supabase
                    .from('weight_entries')
                    .upsert(batch, { onConflict: 'user_id,measured_at' });
                if (error) throw new Error('Fout bij opslaan gewicht: ' + error.message);
            }
            weightSynced = weightEntries.length;
        }
    }

    // ---- Process Sleep Data from *_sleepData.json files ----
    if (onProgress) onProgress('Slaapdata verwerken...');

    const sleepFiles = Object.keys(zip.files).filter(f =>
        f.includes('sleepData') && f.endsWith('.json')
    );

    const allSleepRows = [];
    for (const sleepFile of sleepFiles) {
        const sleepJson = await zip.files[sleepFile].async('string');
        const sleepEntries = JSON.parse(sleepJson);

        for (const s of sleepEntries) {
            if (!s.calendarDate) continue;

            // Parse sleepNeed
            let rawSleepNeed = s.sleepNeed || s.sleepNeedInSeconds || null;
            let sleepNeedSec = rawSleepNeed;
            if (rawSleepNeed && typeof rawSleepNeed === 'object') {
                sleepNeedSec = rawSleepNeed.actual ? (rawSleepNeed.actual * 60) : null;
            }

            // Parse sleepDebt
            let rawSleepDebt = s.sleepDebt || s.sleepDebtInSeconds || null;
            let sleepDebtSec = rawSleepDebt;
            if (rawSleepDebt && typeof rawSleepDebt === 'object') {
                sleepDebtSec = rawSleepDebt.actual ? (rawSleepDebt.actual * 60) : null;
            }

            allSleepRows.push({
                user_id: userId,
                calendar_date: s.calendarDate,
                sleep_start: s.sleepStartTimestampGMT ? new Date(s.sleepStartTimestampGMT).toISOString() : null,
                sleep_end: s.sleepEndTimestampGMT ? new Date(s.sleepEndTimestampGMT).toISOString() : null,
                duration_seconds: s.sleepTimeSeconds || s.durationInSeconds || null,
                deep_sleep_seconds: s.deepSleepSeconds || s.deepSleepDuration || 0,
                light_sleep_seconds: s.lightSleepSeconds || s.lightSleepDuration || 0,
                rem_sleep_seconds: s.remSleepSeconds || s.remSleepDuration || 0,
                awake_seconds: s.awakeSleepSeconds || s.awakeDuration || 0,
                sleep_score: s.sleepScores?.overall?.value || s.sleepScores?.totalScore || s.overallScore || null,
                quality_score: s.sleepScores?.qualityOfSleep?.qualifierKey ? null : (s.sleepScores?.qualityOfSleep?.value || null),
                duration_score: s.sleepScores?.sleepDuration?.value || null,
                recovery_score: s.sleepScores?.recoveryScore?.value || s.sleepScores?.revitalizationScore?.value || null,
                restfulness_score: s.sleepScores?.sleepRestfulness?.value || s.sleepScores?.restlessSleepScore?.value || null,
                sleep_need_seconds: sleepNeedSec,
                sleep_debt_seconds: sleepDebtSec,
                body_battery_change: s.bodyBatteryChange || null,
                avg_spo2: s.averageSpO2Value || s.averageSPO2 || null,
                avg_respiration: s.averageRespirationValue || s.avgRespirationRate || null,
                avg_heart_rate: s.restingHeartRate || s.averageHeartRate || null,
                lowest_heart_rate: s.lowestHeartRate || null,
                avg_stress: s.averageStress || null,
                source: 'GARMIN_EXPORT',
                raw_data: s,
            });
        }
    }

    if (allSleepRows.length > 0) {
        if (onProgress) onProgress(`${allSleepRows.length} slaapmetingen opslaan...`);

        for (let i = 0; i < allSleepRows.length; i += 500) {
            const batch = allSleepRows.slice(i, i + 500);
            const { error } = await supabase
                .from('sleep_entries')
                .upsert(batch, { onConflict: 'user_id,calendar_date' });
            if (error) throw new Error('Fout bij opslaan slaap: ' + error.message);
        }
        sleepSynced = allSleepRows.length;
    }

    // Log the import
    await supabase.from('sync_log').insert({
        user_id: userId,
        status: 'success',
        entries_synced: weightSynced + sleepSynced,
        duration_ms: 0,
    });

    if (onProgress) onProgress('Import voltooid!');

    return {
        success: true,
        weightSynced,
        sleepSynced,
        source: 'export',
    };
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

    const importExport = useCallback(async (file, onProgress) => {
        setSyncing(true);
        setError(null);
        try {
            const result = await processGarminExport(file, onProgress);
            console.log('✅ Import completed:', result);
            await fetchDashboard();
            return result;
        } catch (err) {
            console.error('Import failed:', err);
            setError(`Import mislukt: ${err.message}`);
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
        importExport,
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
