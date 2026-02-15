import React from 'react';
import { useAnimatedValue } from '../hooks/useHealthData';
import {
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react';

/**
 * Stat Card — displays a single metric with trend indicator
 */
export function StatCard({ label, value, unit, change, trend, icon: Icon, color = 'blue', delay = 0 }) {
    const animatedValue = useAnimatedValue(value, 1200);

    const colorMap = {
        blue: {
            iconBg: 'bg-blue-500/10',
            iconText: 'text-blue-400',
            glow: 'glow-blue',
        },
        purple: {
            iconBg: 'bg-purple-500/10',
            iconText: 'text-purple-400',
            glow: 'glow-purple',
        },
        green: {
            iconBg: 'bg-emerald-500/10',
            iconText: 'text-emerald-400',
            glow: 'glow-green',
        },
        amber: {
            iconBg: 'bg-amber-500/10',
            iconText: 'text-amber-400',
            glow: '',
        },
        cyan: {
            iconBg: 'bg-cyan-500/10',
            iconText: 'text-cyan-400',
            glow: '',
        },
        rose: {
            iconBg: 'bg-rose-500/10',
            iconText: 'text-rose-400',
            glow: '',
        },
    };

    const c = colorMap[color] || colorMap.blue;

    const trendIcon =
        trend === 'down' ? (
            <TrendingDown className="w-3.5 h-3.5" />
        ) : trend === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5" />
        ) : (
            <Minus className="w-3.5 h-3.5" />
        );

    const trendColor =
        trend === 'down' ? 'text-emerald-400' : trend === 'up' ? 'text-rose-400' : 'text-slate-500';

    return (
        <div
            className={`stat-card p-5 animate-fade-in animate-fade-in-delay-${delay}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                    {Icon && <Icon className={`w-5 h-5 ${c.iconText}`} />}
                </div>
                {change != null && (
                    <div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendColor} bg-slate-800/50`}
                    >
                        {trendIcon}
                        <span>{change > 0 ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-sm font-medium text-slate-400">{label}</h3>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-100 tabular-nums tracking-tight">
                        {value != null ? animatedValue.toFixed(1) : '—'}
                    </span>
                    {unit && (
                        <span className="text-sm font-medium text-slate-500">{unit}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Metric Mini — compact inline metric
 */
export function MetricMini({ label, value, unit, trend }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
            <span className="text-sm text-slate-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200 tabular-nums">
                    {value != null ? value : '—'}
                </span>
                {unit && <span className="text-xs text-slate-500">{unit}</span>}
                {trend && (
                    <span className={`text-xs ${trend === 'down' ? 'text-emerald-400' : trend === 'up' ? 'text-rose-400' : 'text-slate-500'}`}>
                        {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Section Header
 */
export function SectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-end justify-between mb-6">
            <div>
                <h2 className="text-xl font-bold text-slate-100">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

/**
 * Loading Skeleton
 */
export function Skeleton({ className = '' }) {
    return <div className={`shimmer h-4 ${className}`} />;
}

export function StatCardSkeleton() {
    return (
        <div className="stat-card p-5 space-y-4">
            <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-24 h-7" />
            </div>
        </div>
    );
}

/**
 * Period Selector
 */
export function PeriodSelector({ selected, onChange }) {
    const periods = [
        { value: 30, label: '30D' },
        { value: 90, label: '90D' },
        { value: 180, label: '6M' },
        { value: 365, label: '1J' },
        { value: 0, label: 'Alles' },
    ];

    return (
        <div className="flex bg-slate-800/50 rounded-xl p-1 gap-0.5">
            {periods.map((p) => (
                <button
                    key={p.value}
                    onClick={() => onChange(p.value)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${selected === p.value
                        ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                        }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}

/**
 * Status Badge
 */
export function StatusBadge({ type = 'info', children }) {
    const styles = {
        info: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${styles[type]}`}
        >
            {children}
        </span>
    );
}

/**
 * Empty State
 */
export function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {Icon && (
                <div className="p-4 rounded-2xl bg-slate-800/50 mb-4">
                    <Icon className="w-8 h-8 text-slate-500" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm">{description}</p>
        </div>
    );
}
/**
 * Primary Button — solid blue brand button
 */
export function PrimaryButton({ onClick, children, icon: Icon, disabled, className = '' }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${className}`}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
}

/**
 * Secondary Button — glass effect button
 */
export function SecondaryButton({ onClick, children, icon: Icon, disabled, className = '' }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 border border-slate-700/50 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${className}`}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
}
