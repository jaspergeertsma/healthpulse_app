import React, { useState } from 'react';
import {
    Percent,
    Dumbbell,
    Bone,
    Droplets,
    Target,
    Activity,
} from 'lucide-react';
import {
    StatCard,
    SectionHeader,
    PeriodSelector,
    MetricMini,
    StatCardSkeleton,
} from './ui';
import { BodyCompositionChart, BMIGauge } from './charts';

export default function BodyCompositionPage({ chartData, stats, data, loading }) {
    const [period, setPeriod] = useState(90);

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

    const filteredData = period === 0
        ? (chartData || [])
        : (chartData?.filter((d) => {
            const entryDate = new Date(d.date);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - period);
            return entryDate >= cutoff;
        }) || []);

    const current = stats?.current;

    // Calculate composition percentages for the visual breakdown
    const compositionData = current
        ? [
            {
                label: 'Lichaamsvet',
                value: current.bodyFat,
                unit: '%',
                color: '#f59e0b',
                icon: Percent,
            },
            {
                label: 'Spiermassa',
                value: current.muscleMass,
                unit: 'kg',
                color: '#22c55e',
                icon: Dumbbell,
            },
            {
                label: 'Botmassa',
                value: current.boneMass,
                unit: 'kg',
                color: '#8b5cf6',
                icon: Bone,
            },
            {
                label: 'Lichaamsvocht',
                value: current.bodyWater,
                unit: '%',
                color: '#06b6d4',
                icon: Droplets,
            },
        ]
        : [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-fade-in">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                    Lichaamssamenstelling 🏋️
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                    Data van je Garmin Index weegschaal (1e generatie)
                </p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Lichaamsvet"
                    value={current?.bodyFat}
                    unit="%"
                    icon={Percent}
                    color="amber"
                    delay={1}
                />
                <StatCard
                    label="Spiermassa"
                    value={current?.muscleMass}
                    unit="kg"
                    icon={Dumbbell}
                    color="green"
                    delay={2}
                />
                <StatCard
                    label="Botmassa"
                    value={current?.boneMass}
                    unit="kg"
                    icon={Bone}
                    color="purple"
                    delay={3}
                />
                <StatCard
                    label="Lichaamsvocht"
                    value={current?.bodyWater}
                    unit="%"
                    icon={Droplets}
                    color="cyan"
                    delay={4}
                />
            </div>

            {/* Composition Chart */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-2">
                <SectionHeader
                    title="Verloop lichaamssamenstelling"
                    subtitle="Selecteer de gewenste metingen"
                    action={<PeriodSelector selected={period} onChange={setPeriod} />}
                />
                <BodyCompositionChart data={filteredData} height={360} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* BMI Detail */}
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-3">
                    <SectionHeader title="BMI" subtitle="Body Mass Index" />
                    <BMIGauge value={current?.bmi} />
                </div>

                {/* Visual Breakdown */}
                <div className="lg:col-span-2 glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                    <SectionHeader
                        title="Huidige samenstelling"
                        subtitle="Visueel overzicht van je lichaamsmetingen"
                    />

                    <div className="space-y-4">
                        {compositionData.map((item) => {
                            const Icon = item.icon;
                            const barWidth =
                                item.unit === '%'
                                    ? `${Math.min(item.value || 0, 100)}%`
                                    : `${Math.min(((item.value || 0) / (current?.weight || 100)) * 100, 100)}%`;

                            return (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" style={{ color: item.color }} />
                                            <span className="text-sm text-slate-300 font-medium">
                                                {item.label}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-200 tabular-nums">
                                            {item.value?.toFixed(1)} {item.unit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: barWidth,
                                                backgroundColor: item.color,
                                                opacity: 0.7,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Composition Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/50">
                        <div className="text-center p-3 rounded-xl bg-slate-800/30">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Vetvrij gewicht</p>
                            <p className="text-lg font-bold text-slate-200 tabular-nums">
                                {current?.weight && current?.bodyFat
                                    ? ((current.weight * (100 - current.bodyFat)) / 100).toFixed(1)
                                    : '—'}{' '}
                                <span className="text-xs text-slate-500">kg</span>
                            </p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-slate-800/30">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Vetmassa</p>
                            <p className="text-lg font-bold text-slate-200 tabular-nums">
                                {current?.weight && current?.bodyFat
                                    ? ((current.weight * current.bodyFat) / 100).toFixed(1)
                                    : '—'}{' '}
                                <span className="text-xs text-slate-500">kg</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
