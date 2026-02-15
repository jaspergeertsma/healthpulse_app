import React, { useState, useEffect } from 'react';
import {
    Settings,
    Wifi,
    WifiOff,
    Shield,
    Database,
    Clock,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Info,
    CloudDownload,
    Loader2,
    LogOut,
    User,
    Trophy,
} from 'lucide-react';
import { SectionHeader, StatusBadge } from './ui';

export default function SettingsPage({ isDemo, data, lastSync, syncing, onSync, updateProfile, user, onSignOut }) {
    const [syncDays, setSyncDays] = useState(90);
    const [syncResult, setSyncResult] = useState(null);
    const [goalSaving, setGoalSaving] = useState(false);
    const [goalStatus, setGoalStatus] = useState(null);

    // Form states
    const [targetWeight, setTargetWeight] = useState('');
    const [startWeight, setStartWeight] = useState('');
    const [fastingStart, setFastingStart] = useState('20:00');
    const [fastingEnd, setFastingEnd] = useState('12:00');
    const [sleepTarget, setSleepTarget] = useState('22:15');

    // Sync state when data arrives
    useEffect(() => {
        if (data?.profile) {
            setTargetWeight(data.profile.targetWeight || '');
            setStartWeight(data.profile.startWeight || '');
            setFastingStart(data.profile.fastingStart?.substring(0, 5) || '20:00');
            setFastingEnd(data.profile.fastingEnd?.substring(0, 5) || '12:00');
            setSleepTarget(data.profile.sleepTarget?.substring(0, 5) || '22:15');
        }
    }, [data?.profile]);

    const handleSync = async () => {
        setSyncResult(null);
        try {
            const result = await onSync(syncDays);
            setSyncResult({ success: true, ...result });
        } catch (err) {
            setSyncResult({ success: false, error: err.message });
        }
    };

    const handleUpdateGoals = async (e) => {
        e.preventDefault();
        setGoalSaving(true);
        setGoalStatus(null);
        try {
            await updateProfile({
                target_weight: parseFloat(targetWeight) || null,
                start_weight: parseFloat(startWeight) || null,
                fasting_start_time: fastingStart,
                fasting_end_time: fastingEnd,
                sleep_target_time: sleepTarget,
            });
            setGoalStatus({ success: true, message: 'Doelen opgeslagen!' });
            setTimeout(() => setGoalStatus(null), 3000);
        } catch (err) {
            setGoalStatus({ success: false, message: err.message });
        } finally {
            setGoalSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div className="animate-fade-in">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                    Instellingen ⚙️
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                    Garmin Connect synchronisatie en configuratie
                </p>
            </div>

            {/* Connection Status */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-1">
                <SectionHeader
                    title="Verbindingsstatus"
                    subtitle="Supabase + Garmin Connect"
                />

                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30">
                    <div
                        className={`p-3 rounded-xl ${isDemo ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                            }`}
                    >
                        {isDemo ? (
                            <WifiOff className="w-6 h-6 text-amber-400" />
                        ) : (
                            <Wifi className="w-6 h-6 text-emerald-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-200">
                                {isDemo ? 'Geen data gevonden' : 'Verbonden'}
                            </h3>
                            <StatusBadge type={isDemo ? 'warning' : 'success'}>
                                {isDemo ? 'Demo modus' : 'Live data'}
                            </StatusBadge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isDemo
                                ? 'Synchroniseer eerst je Garmin data via de knop hieronder.'
                                : `${data?.entriesCount || 0} metingen geladen • Laatst gesynchroniseerd: ${lastSync?.synced_at
                                    ? new Date(lastSync.synced_at).toLocaleString('nl-NL')
                                    : 'Onbekend'
                                }`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Lichaamsdoelen */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-1">
                <SectionHeader
                    title="Lichaamsdoelen"
                    subtitle="Stel je streefgewicht en startpunt in voor betere tracking"
                />

                <form onSubmit={handleUpdateGoals} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 block font-medium">
                                Startgewicht (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={startWeight}
                                onChange={(e) => setStartWeight(e.target.value)}
                                placeholder="85.0"
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500">Je startpunt van je afvalreis.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 block font-medium">
                                Streefgewicht (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={targetWeight}
                                onChange={(e) => setTargetWeight(e.target.value)}
                                placeholder="75.0"
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500">Het gewicht waar je naartoe werkt.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 block font-medium">
                                Vasten Vanaf
                            </label>
                            <input
                                type="time"
                                value={fastingStart}
                                onChange={(e) => setFastingStart(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500">Wanneer begin je met vasten? (Standaard 20:00)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 block font-medium">
                                Eten Vanaf
                            </label>
                            <input
                                type="time"
                                value={fastingEnd}
                                onChange={(e) => setFastingEnd(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500">Wanneer mag je weer eten? (Standaard 12:00)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 block font-medium">
                                Slaapdoel
                            </label>
                            <input
                                type="time"
                                value={sleepTarget}
                                onChange={(e) => setSleepTarget(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500">Je streeftijd om in bed te liggen.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={goalSaving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            {goalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                            Doelen opslaan
                        </button>

                        {goalStatus && (
                            <span className={`text-sm font-medium flex items-center gap-1.5 ${goalStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {goalStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {goalStatus.message}
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* Sync Controls */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-2">
                <SectionHeader
                    title="Garmin data synchroniseren"
                    subtitle="Haal je weegschaaldata op uit Garmin Connect"
                />

                <div className="space-y-4">
                    {/* Period selection */}
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">
                            Synchroniseer data van de afgelopen:
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { days: 30, label: '30 dagen' },
                                { days: 90, label: '3 maanden' },
                                { days: 180, label: '6 maanden' },
                                { days: 365, label: '1 jaar' },
                                { days: 730, label: '2 jaar' },
                            ].map((opt) => (
                                <button
                                    key={opt.days}
                                    onClick={() => setSyncDays(opt.days)}
                                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${syncDays === opt.days
                                        ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                                        : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sync button */}
                    <button
                        id="btn-sync-settings"
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {syncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CloudDownload className="w-4 h-4" />
                        )}
                        {syncing ? 'Bezig met synchroniseren...' : 'Start synchronisatie'}
                    </button>

                    {/* Sync result */}
                    {syncResult && (
                        <div
                            className={`flex items-start gap-3 p-4 rounded-xl ${syncResult.success
                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                : 'bg-rose-500/10 border border-rose-500/20'
                                } animate-fade-in`}
                        >
                            {syncResult.success ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                                <p
                                    className={`text-sm font-medium ${syncResult.success ? 'text-emerald-400' : 'text-rose-400'
                                        }`}
                                >
                                    {syncResult.success
                                        ? `Synchronisatie geslaagd!`
                                        : 'Synchronisatie mislukt'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {syncResult.success
                                        ? `${syncResult.entriesSynced} metingen gesynchroniseerd in ${(syncResult.durationMs / 1000).toFixed(1)}s`
                                        : syncResult.error}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Account */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-3">
                <SectionHeader title="Account" subtitle="Ingelogd via Supabase Auth" />
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10">
                            <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">{user?.email}</p>
                            <p className="text-xs text-slate-500">Supabase Auth</p>
                        </div>
                    </div>
                    <button
                        onClick={onSignOut}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-200 ring-1 ring-rose-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Uitloggen
                    </button>
                </div>
            </div>

            {/* Setup Instructions */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                <SectionHeader
                    title="Setup Instructies"
                    subtitle="Voor beheerders van de app"
                />

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-400">
                            1
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-200">
                                Garmin Secrets
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                                Vergeet niet <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">GARMIN_EMAIL</code> en
                                <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">GARMIN_PASSWORD</code> in te stellen in de Supabase Secrets.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
