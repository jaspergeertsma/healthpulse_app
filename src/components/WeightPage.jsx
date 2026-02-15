import React, { useState } from 'react';
import {
    Scale,
    TrendingDown,
    TrendingUp,
    Minus,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Calendar,
} from 'lucide-react';
import {
    StatCard,
    SectionHeader,
    PeriodSelector,
    MetricMini,
    StatCardSkeleton,
} from './ui';
import { WeightChart, WeightDistributionChart } from './charts';

export default function WeightPage({ chartData, stats, profile, loading }) {
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

    const weights = filteredData.map((d) => d.weight).filter(Boolean);
    const min = weights.length ? Math.min(...weights) : null;
    const max = weights.length ? Math.max(...weights) : null;
    const avg = weights.length
        ? weights.reduce((a, b) => a + b, 0) / weights.length
        : null;
    const first = filteredData.length ? filteredData[0].weight : null;
    const last = filteredData.length ? filteredData[filteredData.length - 1].weight : null;
    const totalChange = first && last ? last - first : null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-fade-in">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                    Gewichtsanalyse ⚖️
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                    Gedetailleerd overzicht van je gewichtsverloop
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Huidig gewicht"
                    value={last}
                    unit="kg"
                    change={stats?.change}
                    trend={stats?.trend}
                    icon={Scale}
                    color="blue"
                    delay={1}
                />
                <StatCard
                    label="Laagste gewicht"
                    value={min}
                    unit="kg"
                    icon={TrendingDown}
                    color="green"
                    delay={2}
                />
                <StatCard
                    label="Hoogste gewicht"
                    value={max}
                    unit="kg"
                    icon={TrendingUp}
                    color="rose"
                    delay={3}
                />
                <StatCard
                    label="Gemiddeld"
                    value={avg}
                    unit="kg"
                    icon={BarChart3}
                    color="purple"
                    delay={4}
                />
            </div>

            {/* Main Chart */}
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-2">
                <SectionHeader
                    title="Gewichtsverloop"
                    subtitle={`${filteredData.length} metingen`}
                    action={<PeriodSelector selected={period} onChange={setPeriod} />}
                />
                <WeightChart data={filteredData} targetWeight={profile?.targetWeight} height={380} />

                {/* Summary Bar */}
                {totalChange != null && (
                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-slate-800/50">
                        <div className="flex items-center gap-2">
                            {totalChange < 0 ? (
                                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                            )}
                            <span className="text-sm text-slate-400">Totale verandering:</span>
                            <span
                                className={`text-sm font-bold tabular-nums ${totalChange < 0 ? 'text-emerald-400' : totalChange > 0 ? 'text-rose-400' : 'text-slate-400'
                                    }`}
                            >
                                {totalChange > 0 ? '+' : ''}
                                {totalChange.toFixed(1)} kg
                            </span>
                        </div>
                        <div className="text-sm text-slate-500">
                            {filteredData.length} metingen {period === 0 ? 'in totaal' : `in ${period} dagen`}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution */}
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-3">
                    <SectionHeader
                        title="Gewichtsverdeling"
                        subtitle="Histogram van je metingen"
                    />
                    <WeightDistributionChart data={filteredData} height={220} />
                </div>

                {/* Recent Measurements */}
                <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
                    <SectionHeader
                        title="Recente metingen"
                        subtitle="Laatste 10 weegmomenten"
                    />
                    <div className="space-y-0">
                        {filteredData
                            .slice(-10)
                            .reverse()
                            .map((entry, i) => (
                                <div
                                    key={entry.date}
                                    className="flex items-center justify-between py-3 border-b border-slate-800/30 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/50 text-xs font-medium text-slate-400">
                                            {new Date(entry.date).getDate()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">
                                                {entry.weight?.toFixed(1)} kg
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(entry.date).toLocaleDateString('nl-NL', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {i < filteredData.slice(-10).reverse().length - 1 && (
                                        <div className="text-xs tabular-nums">
                                            {(() => {
                                                const reversed = filteredData.slice(-10).reverse();
                                                const nextWeight = reversed[i + 1]?.weight;
                                                if (!nextWeight) return null;
                                                const diff = entry.weight - nextWeight;
                                                return (
                                                    <span
                                                        className={
                                                            diff < 0
                                                                ? 'text-emerald-400'
                                                                : diff > 0
                                                                    ? 'text-rose-400'
                                                                    : 'text-slate-500'
                                                        }
                                                    >
                                                        {diff > 0 ? '+' : ''}
                                                        {diff.toFixed(1)} kg
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
