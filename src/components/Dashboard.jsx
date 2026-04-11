import React, { useState, useEffect } from 'react';
import {
    Scale,
    Percent,
    Dumbbell,
    Bone,
    Droplets,
    Heart,
    Target,
    TrendingDown,
    Calendar,
    ArrowDownRight,
    ArrowUpRight,
    CloudDownload,
    Loader2,
    Moon,
    Coffee,
    Utensils,
    CheckCircle2,
    Move,
    Maximize,
    ChevronUp,
    ChevronDown,
    Layout,
    Save,
    X,
    Star,
    Clock,
    ChevronRight,
    AlertCircle,
    Upload,
    Syringe,
    Activity,
    ShieldAlert,
} from 'lucide-react';
import {
    StatCard,
    StatCardSkeleton,
    SectionHeader,
    PeriodSelector,
    MetricMini,
    StatusBadge,
    SecondaryButton,
    PrimaryButton,
} from './ui';
import { WeightChart, BMIGauge, Sparkline } from './charts';
import {
    getDosePhase,
    getDaysUntilNextInjection,
    getRecommendedSite,
    calculateWeightVelocityByPhase,
    analyzeBodyComposition,
    getOzempicWeightChange,
    SITE_LABELS,
    DAY_LABELS,
} from '../lib/ozempic';

export default function Dashboard({ data, stats, chartData, loading, syncing, onSync, onImportExport, onLogHabit, onLogInjection, updateProfile, user }) {
    const [isEditing, setIsEditing] = useState(false);
    const [period, setPeriod] = useState(90);
    const [showSyncMenu, setShowSyncMenu] = useState(false);
    const [importProgress, setImportProgress] = useState(null);
    const [selectedSite, setSelectedSite] = useState(null);
    const [injectionLogging, setInjectionLogging] = useState(false);
    const fileInputRef = React.useRef(null);

    // Close sync menu when clicking outside
    useEffect(() => {
        if (!showSyncMenu) return;
        const handleClick = () => setShowSyncMenu(false);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [showSyncMenu]);

    // Layout State
    const defaultLayout = [
        { id: 'ozempic_injection', width: 4 },
        { id: 'fasting_sleep', width: 4 },
        { id: 'sleep_coach', width: 4 },
        { id: 'goal_progress', width: 4 },
        { id: 'weight_velocity', width: 2 },
        { id: 'body_composition_insight', width: 2 },
        { id: 'stats_row', width: 4 },
        { id: 'weight_chart', width: 4 },
        { id: 'summary_row', width: 4 },
    ];

    const [layout, setLayout] = useState(data?.profile?.dashboardLayout || defaultLayout);

    // Update local layout when data arrives
    React.useEffect(() => {
        if (data?.profile?.dashboardLayout) {
            setLayout(data.profile.dashboardLayout);
        }
    }, [data?.profile?.dashboardLayout]);

    const handleSaveLayout = async () => {
        try {
            await updateProfile({ dashboard_layout: layout });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to save layout:', err);
        }
    };

    const moveWidget = (id, direction) => {
        const index = layout.findIndex(w => w.id === id);
        if ((direction === -1 && index === 0) || (direction === 1 && index === layout.length - 1)) return;

        const newLayout = [...layout];
        const [moved] = newLayout.splice(index, 1);
        newLayout.splice(index + direction, 0, moved);
        setLayout(newLayout);
    };

    const resizeWidget = (id, width) => {
        setLayout(layout.map(w => w.id === id ? { ...w, width } : w));
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                {/* Skeleton Loading */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>
                <div className="glass-card p-6">
                    <div className="shimmer w-full h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    const current = stats?.current;
    const profile = data?.profile;

    // Lifestyle Logic
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinutes;

    // Fasting window (12:00 - 20:00)
    const isFasting = currentHour < 12 || currentHour >= 20;
    const nextEventTime = isFasting
        ? (currentHour >= 20 ? 12 + 24 : 12) * 60 // Next 12:00
        : 20 * 60; // Next 20:00

    const minutesRemaining = nextEventTime - (currentHour >= 20 ? currentHour * 60 + currentMinutes : currentTimeMinutes);
    const hoursRemaining = Math.floor(minutesRemaining / 60);
    const minsRemaining = minutesRemaining % 60;

    // Sleep logic (target 22:15)
    const sleepTargetTotalMinutes = 22 * 60 + 15;
    const isWindDown = currentHour >= 21 || (currentHour === 20 && currentMinutes >= 15);
    const sleepRemaining = sleepTargetTotalMinutes - currentTimeMinutes;

    // Habit tracking for today
    const today = new Date().toISOString().split('T')[0];
    const todayHabits = data?.habits?.find(h => h.date === today) || { fasting_met: false, sleep_met: false };

    // Calculate days in range
    const filteredData = period === 0
        ? (chartData || [])
        : (chartData?.filter((d) => {
            const entryDate = new Date(d.date);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - period);
            return entryDate >= cutoff;
        }) || []);

    const widthClasses = {
        1: 'lg:col-span-1',
        2: 'lg:col-span-2',
        3: 'lg:col-span-3',
        4: 'lg:col-span-4'
    };

    // Widget Wrapper Component
    const Widget = ({ id, width, children }) => (
        <div className={`col-span-4 ${widthClasses[width]} relative group`}>
            {isEditing && (
                <div className="absolute -top-3 left-0 right-0 z-20 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex bg-slate-900/90 border border-slate-700/50 rounded-full px-2 py-1 shadow-xl backdrop-blur-md">
                        <button onClick={() => moveWidget(id, -1)} className="p-1.5 hover:text-blue-400"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveWidget(id, 1)} className="p-1.5 hover:text-blue-400 border-r border-slate-700/50"><ChevronDown className="w-3.5 h-3.5" /></button>

                        {[1, 2, 3, 4].map(w => (
                            <button
                                key={w}
                                onClick={() => resizeWidget(id, w)}
                                className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${width === w ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {w}/4
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className={isEditing ? 'ring-2 ring-blue-500/20 rounded-2xl' : ''}>
                {children}
            </div>
        </div>
    );

    // Period-specific stats
    const periodWeights = filteredData.map((d) => d.weight).filter(Boolean);
    const periodMin = periodWeights.length ? Math.min(...periodWeights) : null;
    const periodMax = periodWeights.length ? Math.max(...periodWeights) : null;
    const periodAvg = periodWeights.length
        ? (periodWeights.reduce((a, b) => a + b, 0) / periodWeights.length)
        : null;
    const periodFirst = filteredData.length ? filteredData[0].weight : null;
    const periodLast = filteredData.length ? filteredData[filteredData.length - 1].weight : null;
    const periodChange = periodFirst && periodLast ? periodLast - periodFirst : null;

    // --- WIDGET RENDERERS ---

    const renderFastingSleep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fasting Card */}
            <div className={`glass-card p-5 border-l-4 transition-all duration-500 ${isFasting ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-emerald-500 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isFasting ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isFasting ? <Moon className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200">
                                {isFasting ? 'Vast-venster actief' : 'Eet-venster actief'}
                            </h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Intermittent Fasting (16/8)</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onLogHabit({ fasting_met: !todayHabits.fasting_met })}
                        className={`p-2 rounded-lg transition-all ${todayHabits.fasting_met ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        title="Vasten vandaag gelukt?"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold text-slate-100 tabular-nums">
                                {hoursRemaining}u {minsRemaining}m
                            </p>
                            <p className="text-xs text-slate-500">tot {isFasting ? '12:00 (Eten)' : '20:00 (Vasten)'}</p>
                        </div>
                        <div className="text-right">
                            <StatusBadge type={isFasting ? 'info' : 'success'}>
                                {isFasting ? 'AFBLIJVEN 📵' : 'EET SMAKELIJK 🥗'}
                            </StatusBadge>
                        </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isFasting ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(minutesRemaining / (isFasting ? 16 * 60 : 8 * 60)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Sleep Card */}
            <div className={`glass-card p-5 border-l-4 transition-all duration-500 ${isWindDown ? 'border-l-purple-500 bg-purple-500/5' : 'border-l-blue-500 bg-blue-500/5'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isWindDown ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {isWindDown ? <Moon className="w-5 h-5 animate-pulse" /> : <Coffee className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200">
                                {isWindDown ? 'Wind-down Mode' : 'Productieve Dag'}
                            </h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Slaapdoel: 22:15</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onLogHabit({ sleep_met: !todayHabits.sleep_met })}
                        className={`p-2 rounded-lg transition-all ${todayHabits.sleep_met ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        title="Op tijd naar bed gelukt?"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold text-slate-100 tabular-nums">
                                {sleepRemaining > 0 ? `${Math.floor(sleepRemaining / 60)}u ${sleepRemaining % 60}m` : 'BEDTIJD! 😴'}
                            </p>
                            <p className="text-xs text-slate-500">{sleepRemaining > 0 ? 'resterend tot rust' : 'Je zou al moeten slapen'}</p>
                        </div>
                        <div className="text-right">
                            {isWindDown && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-bold animate-pulse">LEG JE PHONE WEG</span>}
                        </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isWindDown ? 'bg-purple-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.max(0, Math.min(100, (currentTimeMinutes / sleepTargetTotalMinutes) * 100))}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGoalProgress = () => {
        if (!profile?.targetWeight || !profile?.startWeight) return null;

        const currentWeight = stats?.current?.weight || 0;
        const totalToLose = Math.abs(profile.startWeight - profile.targetWeight);
        const lostSoFar = Math.abs(profile.startWeight - currentWeight);
        const remaining = Math.abs(currentWeight - profile.targetWeight);
        const progress = Math.min(Math.max(totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0, 0), 100);

        return (
            <div className="glass-card p-6 border-l-4 border-l-blue-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Target className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-200">Progressie naar streefgewicht</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Doel: {profile.targetWeight.toFixed(1)} kg • Start: {profile.startWeight.toFixed(1)} kg
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-2xl font-bold text-blue-400 tabular-nums">{progress.toFixed(0)}%</span>
                                    <span className="text-xs text-slate-500 ml-2">voltooid</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Nog <span className="text-slate-200 font-bold">{remaining.toFixed(1)} kg</span> te gaan</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Totaal verloren: {lostSoFar.toFixed(1)} kg</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-20 bg-slate-800/50" />

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-48">
                        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-bold">Resterend</p>
                            <p className="text-lg font-bold text-slate-200 tabular-nums">
                                {remaining.toFixed(1)} <span className="text-xs text-slate-500">kg</span>
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-bold">Totale winst</p>
                            <p className="text-lg font-bold text-emerald-400 tabular-nums">
                                {lostSoFar.toFixed(1)} <span className="text-xs text-slate-500">kg</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStatsRow = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Gewicht" value={current?.weight} unit="kg" change={stats?.change} trend={stats?.trend} icon={Scale} color="blue" />
            <StatCard label="BMI" value={current?.bmi} unit="" icon={Target} color="purple" />
            <StatCard label="Lichaamsvet" value={current?.bodyFat} unit="%" icon={Percent} color="amber" />
            <StatCard label="Spiermassa" value={current?.muscleMass} unit="kg" icon={Dumbbell} color="green" />
        </div>
    );

    const renderWeightChart = () => (
        <div className="glass-card p-6">
            <SectionHeader
                title="Gewichtstrend"
                subtitle={`${filteredData.length} metingen`}
                action={<PeriodSelector selected={period} onChange={setPeriod} />}
            />
            <WeightChart data={filteredData} targetWeight={profile?.targetWeight} height={340} />
            {periodChange != null && (
                <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-slate-800/50 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        {periodChange < 0 ? <ArrowDownRight className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                        <span>Verschil: <span className={`font-bold tabular-nums ${periodChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{periodChange.toFixed(1)} kg</span></span>
                    </div>
                    <div>Min: <span className="text-slate-300">{periodMin?.toFixed(1)} kg</span></div>
                    <div>Max: <span className="text-slate-300">{periodMax?.toFixed(1)} kg</span></div>
                    <div>Gem: <span className="text-slate-300">{periodAvg?.toFixed(1)} kg</span></div>
                </div>
            )}
        </div>
    );

    const renderSummaryRow = () => (
        <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* BMI Score */}
                <div className="space-y-6">
                    <SectionHeader title="BMI Score" subtitle="Laatste meting" />
                    <BMIGauge value={current?.bmi} />
                    <div className="pt-4 border-t border-slate-800/50 flex justify-around text-center">
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 mb-1">Lengte</p>
                            <p className="text-sm font-semibold text-slate-200">{profile?.height ? `${profile.height} cm` : '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 mb-1">Gewicht</p>
                            <p className="text-sm font-semibold text-slate-200">{current?.weight ? `${current.weight.toFixed(1)} kg` : '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Body Details & Sparklines */}
                <div className="md:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <SectionHeader title="Details" subtitle="Samenstelling" />
                            <MetricMini label="Lichaamsvet" value={current?.bodyFat?.toFixed(1)} unit="%" />
                            <MetricMini label="Spiermassa" value={current?.muscleMass?.toFixed(1)} unit="kg" />
                            <MetricMini label="Botmassa" value={current?.boneMass?.toFixed(1)} unit="kg" />
                        </div>
                        <div>
                            <SectionHeader title="Trends" subtitle="Afgelopen 90d" />
                            <div className="space-y-4 mt-4">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-500 mb-1">Gewicht</p>
                                    <Sparkline data={chartData} dataKey="weight" color="#3b82f6" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-500 mb-1">Vet</p>
                                    <Sparkline data={chartData} dataKey="bodyFat" color="#f59e0b" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Discipline Heatmap */}
                    <div className="pt-6 border-t border-slate-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-200">Discipline Score</h4>
                                <p className="text-[10px] text-slate-500">Afgelopen 30 dagen</p>
                            </div>
                            <div className="flex gap-2">
                                {[0, 1, 2].map(s => (
                                    <div key={s} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <div className={`w-2 h-2 rounded-sm ${s === 2 ? 'bg-emerald-500' : s === 1 ? 'bg-blue-500/40' : 'bg-slate-800'}`} /> {s}/2
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(() => {
                                const days = [];
                                for (let i = 29; i >= 0; i--) {
                                    const d = new Date(); d.setDate(d.getDate() - i);
                                    const dateStr = d.toISOString().split('T')[0];
                                    const habit = data?.habits?.find(h => h.date === dateStr);
                                    let score = 0; if (habit?.fasting_met) score++; if (habit?.sleep_met) score++;
                                    days.push({ date: dateStr, score });
                                }
                                return days.map((day, idx) => (
                                    <div key={idx} className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${day.score === 2 ? 'bg-emerald-500' : day.score === 1 ? 'bg-blue-500/40' : 'bg-slate-800'}`} title={day.date} />
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSleepCoach = () => {
        const sleepEntries = data?.sleep || [];
        const latestSleep = sleepEntries.length > 0 ? sleepEntries[sleepEntries.length - 1] : null;
        const previousSleep = sleepEntries.length > 1 ? sleepEntries[sleepEntries.length - 2] : null;

        const sleepNeed = latestSleep?.sleep_need_seconds;
        const sleepDebt = latestSleep?.sleep_debt_seconds;
        const lastScore = latestSleep?.sleep_score;
        const lastDuration = latestSleep?.duration_seconds;
        const previousScore = previousSleep?.sleep_score;

        const formatDur = (seconds) => {
            if (!seconds) return '—';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h}u ${m}m`;
        };

        const getScoreColor = (s) => {
            if (!s) return 'text-slate-500';
            if (s >= 80) return 'text-emerald-400';
            if (s >= 60) return 'text-blue-400';
            if (s >= 40) return 'text-amber-400';
            return 'text-rose-400';
        };

        const getScoreLabel = (s) => {
            if (!s) return 'Geen data';
            if (s >= 80) return 'Uitstekend';
            if (s >= 60) return 'Goed';
            if (s >= 40) return 'Matig';
            return 'Slecht';
        };

        return (
            <div className="glass-card p-5 border-l-4 border-l-indigo-500 bg-indigo-500/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Moon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200">
                                Garmin Slaapcoach
                            </h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                Aanbeveling voor komende nacht
                            </p>
                        </div>
                    </div>
                    {lastScore && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(lastScore)} bg-slate-800/50`}>
                            <Star className="w-3 h-3" />
                            {lastScore}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recommended sleep time */}
                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                                Aanbevolen slaaptijd
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-slate-100 tabular-nums">
                            {sleepNeed ? formatDur(sleepNeed) : '—'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Volgens je Garmin slaapcoach
                        </p>
                    </div>

                    {/* Last night score */}
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-3.5 h-3.5 text-blue-400" />
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                Afgelopen nacht
                            </p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className={`text-2xl font-bold tabular-nums ${getScoreColor(lastScore)}`}>
                                {lastScore ?? '—'}
                            </p>
                            <span className="text-xs text-slate-500">/100</span>
                            {previousScore && lastScore && (
                                <span className={`text-xs font-medium ${lastScore >= previousScore ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {lastScore >= previousScore ? '↑' : '↓'} {Math.abs(lastScore - previousScore)}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {lastDuration ? formatDur(lastDuration) : '—'} geslapen · {getScoreLabel(lastScore)}
                        </p>
                    </div>

                    {/* Sleep debt */}
                    <div className={`p-4 rounded-xl border ${sleepDebt && sleepDebt > 0
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className={`w-3.5 h-3.5 ${sleepDebt && sleepDebt > 0 ? 'text-amber-400' : 'text-emerald-400'
                                }`} />
                            <p className={`text-[10px] uppercase tracking-wider font-bold ${sleepDebt && sleepDebt > 0 ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                Slaapschuld
                            </p>
                        </div>
                        <p className={`text-2xl font-bold tabular-nums ${sleepDebt && sleepDebt > 0 ? 'text-amber-300' : 'text-emerald-300'
                            }`}>
                            {sleepDebt != null ? formatDur(Math.abs(sleepDebt)) : '—'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {sleepDebt && sleepDebt > 0
                                ? 'Slaaptekort opgebouwd'
                                : sleepDebt != null
                                    ? 'Slaapschuld ingelopen!'
                                    : 'Sync om data te laden'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderOzempicInjection = () => {
        const ozStart = profile?.ozempicStartDate;
        if (!ozStart) {
            return (
                <div className="glass-card p-5 border-l-4 border-l-teal-500 bg-teal-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                            <Syringe className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200">Ozempic Tracking</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Configureer je Ozempic-instellingen bij Instellingen om deze widget te activeren.</p>
                        </div>
                    </div>
                </div>
            );
        }

        const phase = getDosePhase(ozStart);
        const daysUntil = getDaysUntilNextInjection(profile?.injectionDay);
        const medications = data?.medications || [];
        const todayStr = new Date().toLocaleDateString('en-CA');
        const todayInjection = medications.find(m => m.date === todayStr);
        const recommendedSite = getRecommendedSite(medications.slice(-3));
        const currentDose = profile?.currentDoseMg || phase?.recommendedDoseMg || 0.25;

        // Calculate days since last injection to detect "late"
        const lastInjection = medications.length > 0 ? medications[medications.length - 1] : null;
        const daysSinceLast = lastInjection
            ? Math.floor((new Date(todayStr) - new Date(lastInjection.date)) / (1000 * 60 * 60 * 24))
            : null;
        const isLate = daysSinceLast !== null && daysSinceLast > 7;
        const daysLate = isLate ? daysSinceLast - 7 : 0;

        const handleLogInjection = async () => {
            if (!onLogInjection) return;
            setInjectionLogging(true);
            try {
                await onLogInjection({
                    date: todayStr,
                    dose_mg: currentDose,
                    injection_site: selectedSite || recommendedSite,
                });
                setSelectedSite(null);
            } catch (err) {
                console.error('Injection log failed:', err);
            } finally {
                setInjectionLogging(false);
            }
        };

        return (
            <div className={`glass-card p-5 border-l-4 transition-all duration-500 ${daysUntil === 0 ? 'border-l-teal-500 bg-teal-500/5' : 'border-l-cyan-500 bg-cyan-500/5'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${daysUntil === 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                            <Syringe className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200">
                                {daysUntil === 0 ? 'Vandaag is injectiedag!' : `Nog ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'} tot injectie`}
                            </h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                {phase?.phaseName} · {DAY_LABELS[profile?.injectionDay]}
                            </p>
                        </div>
                    </div>
                    {todayInjection && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10">
                            <CheckCircle2 className="w-3 h-3" />
                            Gelogd
                        </div>
                    )}
                </div>

                {todayInjection && (
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{todayInjection.dose_mg}mg</span>
                        {todayInjection.injection_site && <span>· {SITE_LABELS[todayInjection.injection_site] || todayInjection.injection_site}</span>}
                    </div>
                )}

                {!todayInjection && (
                    <div className="space-y-3">
                        {isLate && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {daysLate} {daysLate === 1 ? 'dag' : 'dagen'} te laat
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-bold">Injectielocatie</p>
                            <div className="flex gap-2">
                                {Object.entries(SITE_LABELS).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedSite(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            (selectedSite || recommendedSite) === key
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {label}
                                        {key === recommendedSite && !selectedSite && (
                                            <span className="ml-1 text-[9px]">●</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleLogInjection}
                            disabled={injectionLogging}
                            title={daysUntil === 0
                                ? 'Vandaag is injectiedag!'
                                : isLate
                                    ? `${daysLate} ${daysLate === 1 ? 'dag' : 'dagen'} te laat — log alsnog je injectie`
                                    : `Nog ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'} tot volgende injectiedag`
                            }
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg ${
                                daysUntil === 0 || isLate
                                    ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-teal-500/20'
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600 shadow-slate-700/20'
                            }`}
                        >
                            {injectionLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Syringe className="w-4 h-4" />}
                            Injectie loggen ({currentDose}mg)
                        </button>
                    </div>
                )}

                <div className="space-y-2 mt-3">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isLate ? 'bg-rose-500' : 'bg-cyan-500'}`}
                            style={{ width: `${Math.min(((7 - daysUntil) / 7) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        Laatste injectie: {lastInjection ? new Date(lastInjection.date).toLocaleDateString('nl-NL') : 'Nog geen'}
                    </p>
                </div>
            </div>
        );
    };

    const renderWeightVelocity = () => {
        const ozStart = profile?.ozempicStartDate;
        if (!ozStart) return null;

        const phases = calculateWeightVelocityByPhase(chartData, ozStart);
        const totalChange = getOzempicWeightChange(chartData, ozStart);

        if (!totalChange) return (
            <div className="glass-card p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">Gewichtssnelheid</h3>
                </div>
                <p className="text-xs text-slate-500">Nog niet genoeg data sinds Ozempic-start.</p>
            </div>
        );

        const ozData = chartData.filter(d => new Date(d.date) >= new Date(ozStart));

        return (
            <div className="glass-card p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200">Gewichtssnelheid</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sinds Ozempic-start</p>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                    <span className={`text-2xl font-bold tabular-nums ${totalChange.change < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalChange.change > 0 ? '+' : ''}{totalChange.change.toFixed(1)} kg
                    </span>
                    <span className="text-xs text-slate-500">in {totalChange.weeks} weken</span>
                </div>

                {ozData.length > 1 && <Sparkline data={ozData} dataKey="weight" color="#10b981" height={50} />}

                {phases.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-1.5">
                        {phases.map((p, i) => (
                            <div key={i} className={`flex items-center justify-between text-xs ${p.isCurrent ? 'text-slate-200' : 'text-slate-500'}`}>
                                <span className="flex items-center gap-1.5">
                                    {p.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                    {p.doseMg}mg
                                </span>
                                <span className={`font-bold tabular-nums ${p.kgPerWeek < 0 ? 'text-emerald-400' : p.kgPerWeek > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                    {p.kgPerWeek > 0 ? '+' : ''}{p.kgPerWeek.toFixed(2)} kg/week
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderBodyCompositionInsight = () => {
        const ozStart = profile?.ozempicStartDate;
        if (!ozStart) return null;

        const analysis = analyzeBodyComposition(chartData, ozStart);
        if (!analysis) return (
            <div className="glass-card p-5 border-l-4 border-l-amber-500 bg-amber-500/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">Lichaamssamenstelling</h3>
                </div>
                <p className="text-xs text-slate-500">Nog niet genoeg compositiedata sinds Ozempic-start.</p>
            </div>
        );

        const ozData = chartData.filter(d => new Date(d.date) >= new Date(ozStart) && d.muscleMass && d.bodyFat);

        return (
            <div className={`glass-card p-5 border-l-4 transition-all ${analysis.isMuscleLossWarning ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-emerald-500 bg-emerald-500/5'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${analysis.isMuscleLossWarning ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200">Lichaamssamenstelling</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Spier vs Vet ({analysis.weeks} weken)</p>
                    </div>
                </div>

                {analysis.isMuscleLossWarning && (
                    <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400 font-medium">
                            ⚠ Spiermassa daalt sneller dan vetmassa. Overweeg meer eiwitten en krachttraining.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-slate-800/30">
                        <p className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Spiermassa</p>
                        <p className={`text-lg font-bold tabular-nums ${analysis.muscleChange < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {analysis.muscleChange > 0 ? '+' : ''}{analysis.muscleChange.toFixed(1)} kg
                        </p>
                        <p className="text-[10px] text-slate-500">{analysis.lastMuscle.toFixed(1)} kg nu</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/30">
                        <p className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Vetpercentage</p>
                        <p className={`text-lg font-bold tabular-nums ${analysis.fatChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {analysis.fatChange > 0 ? '+' : ''}{analysis.fatChange.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-500">{analysis.lastFat.toFixed(1)}% nu</p>
                    </div>
                </div>

                {ozData.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 mb-1">Spiermassa</p>
                            <Sparkline data={ozData} dataKey="muscleMass" color="#22c55e" height={35} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 mb-1">Vetpercentage</p>
                            <Sparkline data={ozData} dataKey="bodyFat" color="#f59e0b" height={35} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderWidgetContent = (id) => {
        switch (id) {
            case 'ozempic_injection': return renderOzempicInjection();
            case 'weight_velocity': return renderWeightVelocity();
            case 'body_composition_insight': return renderBodyCompositionInsight();
            case 'fasting_sleep': return renderFastingSleep();
            case 'sleep_coach': return renderSleepCoach();
            case 'goal_progress': return renderGoalProgress();
            case 'stats_row': return renderStatsRow();
            case 'weight_chart': return renderWeightChart();
            case 'summary_row': return renderSummaryRow();
            default: return null;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header with Edit Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                        Welkom terug{profile?.displayName || user?.email?.split('@')[0] ? `, ${profile?.displayName || user.email.split('@')[0]}` : ''} 👋
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm">Dashboard aanpassen naar jouw wensen.</p>
                </div>

                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <div className="flex gap-2">
                            <SecondaryButton onClick={() => {
                                setLayout(data?.profile?.dashboardLayout || defaultLayout);
                                setIsEditing(false);
                            }} icon={X}>
                                Annuleren
                            </SecondaryButton>
                            <PrimaryButton onClick={handleSaveLayout} icon={Save}>
                                Opslaan
                            </PrimaryButton>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <SecondaryButton onClick={() => setIsEditing(true)} icon={Layout}>
                                Indeling wijzigen
                            </SecondaryButton>
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowSyncMenu(!showSyncMenu); }}
                                    disabled={syncing}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 ring-1 ring-blue-500/20 transition-all disabled:opacity-50"
                                >
                                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                                    {syncing ? (importProgress || '...') : 'Sync'}
                                    {!syncing && <ChevronDown className="w-3 h-3" />}
                                </button>

                                {showSyncMenu && !syncing && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999] overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setShowSyncMenu(false);
                                                onSync && onSync(90);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors text-left"
                                        >
                                            <CloudDownload className="w-4 h-4 text-blue-400 shrink-0" />
                                            <div>
                                                <div className="font-medium">Sync via Garmin</div>
                                                <div className="text-xs text-slate-400">Direct ophalen via API</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowSyncMenu(false);
                                                fileInputRef.current?.click();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors text-left border-t border-slate-700"
                                        >
                                            <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <div>
                                                <div className="font-medium">Upload Garmin Export</div>
                                                <div className="text-xs text-slate-400">ZIP bestand van Garmin</div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".zip"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        e.target.value = '';
                                        try {
                                            await onImportExport(file, setImportProgress);
                                            setImportProgress(null);
                                        } catch {
                                            setImportProgress(null);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Grid Dashboard */}
            <div className="grid grid-cols-4 gap-6 items-start">
                {layout.map((w) => (
                    <Widget key={w.id} id={w.id} width={w.width}>
                        {renderWidgetContent(w.id)}
                    </Widget>
                ))}
            </div>
        </div>
    );
}
