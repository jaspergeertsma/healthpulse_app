import React, { useState } from 'react';
import {
    Moon,
    Clock,
    Battery,
    TrendingUp,
    TrendingDown,
    Star,
    Brain,
    Zap,
    Heart,
    Wind,
    Activity,
    BarChart3,
    ArrowRight,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import {
    StatCard,
    SectionHeader,
    PeriodSelector,
    MetricMini,
    StatCardSkeleton,
    StatusBadge,
} from './ui';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Line,
    Legend,
    ReferenceLine,
} from 'recharts';

function formatDuration(seconds) {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}u ${m}m`;
}

function formatHoursDecimal(seconds) {
    if (!seconds) return null;
    return parseFloat((seconds / 3600).toFixed(1));
}

function SleepScoreRing({ score, size = 120, label = 'Sleep Score' }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = score ? (score / 100) * circumference : 0;

    const getScoreColor = (s) => {
        if (!s) return '#475569';
        if (s >= 80) return '#22c55e';
        if (s >= 60) return '#3b82f6';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (s) => {
        if (!s) return 'Geen data';
        if (s >= 80) return 'Uitstekend';
        if (s >= 60) return 'Goed';
        if (s >= 40) return 'Matig';
        return 'Slecht';
    };

    const color = getScoreColor(score);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(71,85,105,0.3)"
                        strokeWidth="8"
                    />
                    {/* Progress ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-1000 ease-out"
                        style={{
                            filter: `drop-shadow(0 0 8px ${color}40)`,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-100 tabular-nums">
                        {score ?? '—'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {label}
                    </span>
                </div>
            </div>
            <StatusBadge
                type={
                    score >= 80 ? 'success' :
                        score >= 60 ? 'info' :
                            score >= 40 ? 'warning' : 'danger'
                }
            >
                {getScoreLabel(score)}
            </StatusBadge>
        </div>
    );
}

function SleepStagePill({ label, seconds, total, color, barColor, icon: Icon }) {
    const percentage = total > 0 ? ((seconds / total) * 100).toFixed(0) : 0;

    return (
        <div className="flex items-center gap-3 py-3 border-b border-slate-800/30 last:border-0">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 tabular-nums">
                            {formatDuration(seconds)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold tabular-nums w-10 text-right">
                            {percentage}%
                        </span>
                    </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${percentage}%`,
                            background: barColor,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}


function SleepChartTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-slate-900/95 border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
            <p className="text-xs text-slate-400 mb-2 font-medium">
                {new Date(label).toLocaleDateString('nl-NL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                })}
            </p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: entry.color }}
                        />
                        <span className="text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-slate-100 font-semibold tabular-nums">
                        {typeof entry.value === 'number'
                            ? entry.name.includes('Score')
                                ? entry.value
                                : `${entry.value.toFixed(1)}u`
                            : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function SleepPage({ data, loading }) {
    const [period, setPeriod] = useState(30);

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
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

    const sleepEntries = data?.sleep || [];

    // Filter by period
    const filteredData = period === 0
        ? sleepEntries
        : sleepEntries.filter((d) => {
            const entryDate = new Date(d.calendar_date);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - period);
            return entryDate >= cutoff;
        });

    // Transform for charts
    const chartData = filteredData.map((entry) => ({
        date: entry.calendar_date,
        duration: formatHoursDecimal(entry.duration_seconds),
        deep: formatHoursDecimal(entry.deep_sleep_seconds),
        light: formatHoursDecimal(entry.light_sleep_seconds),
        rem: formatHoursDecimal(entry.rem_sleep_seconds),
        awake: formatHoursDecimal(entry.awake_seconds),
        score: entry.sleep_score,
        sleepNeed: formatHoursDecimal(entry.sleep_need_seconds),
    }));

    // Latest entry
    const latest = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
    const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;

    // Averages
    const validScores = filteredData.filter(d => d.sleep_score).map(d => d.sleep_score);
    const avgScore = validScores.length
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : null;

    const validDurations = filteredData.filter(d => d.duration_seconds).map(d => d.duration_seconds);
    const avgDuration = validDurations.length
        ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
        : null;

    const validDeep = filteredData.filter(d => d.deep_sleep_seconds).map(d => d.deep_sleep_seconds);
    const avgDeep = validDeep.length
        ? Math.round(validDeep.reduce((a, b) => a + b, 0) / validDeep.length)
        : null;

    const validRem = filteredData.filter(d => d.rem_sleep_seconds).map(d => d.rem_sleep_seconds);
    const avgRem = validRem.length
        ? Math.round(validRem.reduce((a, b) => a + b, 0) / validRem.length)
        : null;

    // Sleep Coach data
    const sleepNeed = latest?.sleep_need_seconds;
    const sleepDebt = latest?.sleep_debt_seconds;

    // Total sleep stage seconds for latest
    const totalStageSeconds = latest
        ? (latest.deep_sleep_seconds || 0) + (latest.light_sleep_seconds || 0) +
        (latest.rem_sleep_seconds || 0) + (latest.awake_seconds || 0)
        : 0;

    // Duration change
    const durationChange = latest?.duration_seconds && previous?.duration_seconds
        ? ((latest.duration_seconds - previous.duration_seconds) / 3600).toFixed(1)
        : null;

    // Score change
    const scoreChange = latest?.sleep_score && previous?.sleep_score
        ? latest.sleep_score - previous.sleep_score
        : null;

    // Empty state
    if (sleepEntries.length === 0) {
        return (
            <div className="space-y-8">
                <div className="animate-fade-in">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                        Slaapanalyse 😴
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm">
                        Inzicht in je slaappatroon en herstel
                    </p>
                </div>
                <div className="glass-card p-12 text-center">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 inline-block mb-4">
                        <Moon className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">
                        Nog geen slaapdata beschikbaar
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                        Synchroniseer je Garmin horloge om je slaapgegevens te bekijken. Slaapdata wordt automatisch
                        opgehaald bij elke sync.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="animate-fade-in">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                    Slaapanalyse 😴
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                    Inzicht in je slaappatroon, herstel en Garmin Slaapcoach
                </p>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Slaapduur"
                    value={latest?.duration_seconds ? parseFloat((latest.duration_seconds / 3600).toFixed(1)) : null}
                    unit="uur"
                    change={durationChange ? parseFloat(durationChange) : null}
                    icon={Clock}
                    color="purple"
                    delay={1}
                />
                <StatCard
                    label="Slaapscore"
                    value={latest?.sleep_score}
                    unit="/100"
                    change={scoreChange}
                    icon={Star}
                    color="blue"
                    delay={2}
                />
                <StatCard
                    label="Gem. diepe slaap"
                    value={avgDeep ? parseFloat((avgDeep / 3600).toFixed(1)) : null}
                    unit="uur"
                    icon={Brain}
                    color="cyan"
                    delay={3}
                />
                <StatCard
                    label="Gem. slaapscore"
                    value={avgScore}
                    unit="/100"
                    icon={BarChart3}
                    color="green"
                    delay={4}
                />
            </div>

            {/* Main Content: Score Ring + Sleep Stages + Coach */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Latest Night Overview */}
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-2">
                    <SectionHeader
                        title="Afgelopen nacht"
                        subtitle={latest?.calendar_date
                            ? new Date(latest.calendar_date).toLocaleDateString('nl-NL', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })
                            : 'Geen data'}
                    />

                    <div className="flex justify-center mb-6">
                        <SleepScoreRing score={latest?.sleep_score} />
                    </div>

                    {/* Sub-scores */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {[
                            { label: 'Kwaliteit', value: latest?.quality_score, icon: Star },
                            { label: 'Duur', value: latest?.duration_score, icon: Clock },
                            { label: 'Herstel', value: latest?.recovery_score, icon: Zap },
                            { label: 'Rustigheid', value: latest?.restfulness_score, icon: Activity },
                        ].map((item) => (
                            <div key={item.label} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <item.icon className="w-3.5 h-3.5 text-slate-500" />
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        {item.label}
                                    </p>
                                </div>
                                <p className="text-lg font-bold text-slate-200 tabular-nums">
                                    {item.value ?? '—'}
                                    <span className="text-xs text-slate-500 ml-0.5">/100</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sleep Stages */}
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-3">
                    <SectionHeader
                        title="Slaapfases"
                        subtitle={`Totaal: ${formatDuration(latest?.duration_seconds)}`}
                    />

                    <div className="space-y-0">
                        <SleepStagePill
                            label="Diepe slaap"
                            seconds={latest?.deep_sleep_seconds || 0}
                            total={totalStageSeconds}
                            color="bg-indigo-500/10 text-indigo-400"
                            barColor="#6366f1"
                            icon={Brain}
                        />
                        <SleepStagePill
                            label="Lichte slaap"
                            seconds={latest?.light_sleep_seconds || 0}
                            total={totalStageSeconds}
                            color="bg-blue-500/10 text-blue-400"
                            barColor="#3b82f6"
                            icon={Moon}
                        />
                        <SleepStagePill
                            label="REM-slaap"
                            seconds={latest?.rem_sleep_seconds || 0}
                            total={totalStageSeconds}
                            color="bg-purple-500/10 text-purple-400"
                            barColor="#a855f7"
                            icon={Zap}
                        />
                        <SleepStagePill
                            label="Wakker"
                            seconds={latest?.awake_seconds || 0}
                            total={totalStageSeconds}
                            color="bg-amber-500/10 text-amber-400"
                            barColor="#f59e0b"
                            icon={Activity}
                        />
                    </div>

                    {/* Stage bar visualization */}
                    <div className="mt-6 h-6 rounded-full overflow-hidden flex" title="Slaapfase verdeling">
                        {totalStageSeconds > 0 && (
                            <>
                                <div
                                    className="bg-indigo-500 transition-all duration-1000"
                                    style={{ width: `${((latest?.deep_sleep_seconds || 0) / totalStageSeconds) * 100}%` }}
                                />
                                <div
                                    className="bg-blue-500 transition-all duration-1000"
                                    style={{ width: `${((latest?.light_sleep_seconds || 0) / totalStageSeconds) * 100}%` }}
                                />
                                <div
                                    className="bg-purple-500 transition-all duration-1000"
                                    style={{ width: `${((latest?.rem_sleep_seconds || 0) / totalStageSeconds) * 100}%` }}
                                />
                                <div
                                    className="bg-amber-500/60 transition-all duration-1000"
                                    style={{ width: `${((latest?.awake_seconds || 0) / totalStageSeconds) * 100}%` }}
                                />
                            </>
                        )}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                        <span>Diepe slaap</span>
                        <span>Licht</span>
                        <span>REM</span>
                        <span>Wakker</span>
                    </div>
                </div>

                {/* Sleep Coach & Biometrics */}
                <div className="space-y-6">
                    {/* Sleep Coach */}
                    <div className="glass-card p-6 border-l-4 border-l-indigo-500 animate-fade-in animate-fade-in-delay-3">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Moon className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-200">Garmin Slaapcoach</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                    Aanbeveling voor komende nacht
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                                <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-1">
                                    Aanbevolen slaaptijd
                                </p>
                                <p className="text-3xl font-bold text-slate-100 tabular-nums">
                                    {sleepNeed ? formatDuration(sleepNeed) : '—'}
                                </p>
                            </div>

                            {sleepDebt != null && (
                                <div className={`p-4 rounded-xl border ${sleepDebt > 0
                                    ? 'bg-amber-500/5 border-amber-500/20'
                                    : 'bg-emerald-500/5 border-emerald-500/20'
                                    }`}>
                                    <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${sleepDebt > 0 ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>
                                        Slaapschuld
                                    </p>
                                    <p className={`text-2xl font-bold tabular-nums ${sleepDebt > 0 ? 'text-amber-300' : 'text-emerald-300'
                                        }`}>
                                        {sleepDebt > 0 ? '+' : ''}{formatDuration(Math.abs(sleepDebt))}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {sleepDebt > 0
                                            ? 'Je hebt slaaptekort opgebouwd'
                                            : 'Je slaapschuld is ingelopen!'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Biometrics */}
                    <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                        <SectionHeader title="Biometrics" subtitle="Tijdens slaap" />
                        <MetricMini label="Gem. hartslag" value={latest?.avg_heart_rate?.toFixed(0)} unit="bpm" />
                        <MetricMini label="Laagste hartslag" value={latest?.lowest_heart_rate?.toFixed(0)} unit="bpm" />
                        <MetricMini label="Gem. SpO2" value={latest?.avg_spo2?.toFixed(0)} unit="%" />
                        <MetricMini label="Gem. ademhaling" value={latest?.avg_respiration?.toFixed(1)} unit="/min" />
                        <MetricMini label="Gem. stress" value={latest?.avg_stress?.toFixed(0)} unit="" />
                        {latest?.body_battery_change != null && (
                            <MetricMini
                                label="Body Battery"
                                value={`+${latest.body_battery_change}`}
                                unit=""
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Sleep Duration Chart */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                <SectionHeader
                    title="Slaapverloop"
                    subtitle={`${chartData.length} nachten`}
                    action={<PeriodSelector selected={period} onChange={setPeriod} />}
                />

                <ResponsiveContainer width="100%" height={340}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="gradDuration" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickFormatter={(d) => {
                                const date = new Date(d);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                            axisLine={{ stroke: 'rgba(51,65,85,0.3)' }}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                            tickFormatter={(v) => `${v}u`}
                        />
                        <Tooltip content={<SleepChartTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '16px' }}
                            formatter={(value) => (
                                <span className="text-xs text-slate-400">{value}</span>
                            )}
                        />
                        {/* Sleep need reference */}
                        {sleepNeed && (
                            <ReferenceLine
                                y={formatHoursDecimal(sleepNeed)}
                                stroke="#818cf8"
                                strokeDasharray="6 3"
                                label={{
                                    value: `Advies: ${formatDuration(sleepNeed)}`,
                                    position: 'right',
                                    fill: '#818cf8',
                                    fontSize: 10,
                                }}
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey="duration"
                            name="Slaapduur"
                            fill="url(#gradDuration)"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#1e1b4b', strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="deep"
                            name="Diepe slaap"
                            stroke="#6366f1"
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray="4 2"
                        />
                        <Line
                            type="monotone"
                            dataKey="rem"
                            name="REM"
                            stroke="#a855f7"
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray="4 2"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Sleep Score Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                    <SectionHeader
                        title="Slaapscore trend"
                        subtitle="Score per nacht"
                    />
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                tickFormatter={(d) => {
                                    const date = new Date(d);
                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                }}
                                axisLine={{ stroke: 'rgba(51,65,85,0.3)' }}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<SleepChartTooltip />} />
                            <Bar
                                dataKey="score"
                                name="Slaapscore"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={20}
                            >
                                {chartData.map((entry, index) => {
                                    const color = entry.score >= 80 ? '#22c55e' :
                                        entry.score >= 60 ? '#3b82f6' :
                                            entry.score >= 40 ? '#f59e0b' : '#ef4444';
                                    return (
                                        <Cell
                                            key={index}
                                            fill={color}
                                        />
                                    );
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Nights */}
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                    <SectionHeader
                        title="Recente nachten"
                        subtitle="Laatste 7 nachten"
                    />
                    <div className="space-y-0">
                        {filteredData
                            .slice(-7)
                            .reverse()
                            .map((entry) => (
                                <div
                                    key={entry.calendar_date}
                                    className="flex items-center justify-between py-3 border-b border-slate-800/30 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold ${entry.sleep_score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                                            entry.sleep_score >= 60 ? 'bg-blue-500/10 text-blue-400' :
                                                entry.sleep_score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-rose-500/10 text-rose-400'
                                            }`}>
                                            {entry.sleep_score ?? '—'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">
                                                {formatDuration(entry.duration_seconds)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(entry.calendar_date).toLocaleDateString('nl-NL', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="tabular-nums">
                                            {formatDuration(entry.deep_sleep_seconds)} diep
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
