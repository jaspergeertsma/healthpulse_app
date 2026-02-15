import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    ComposedChart,
    Legend,
    ReferenceLine,
} from 'recharts';

/**
 * Custom Tooltip for charts
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs text-slate-400 mb-2 font-medium">
                {new Date(label).toLocaleDateString('nl-NL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })}
            </p>
            <div className="space-y-1">
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-slate-400">{entry.name}:</span>
                        <span className="text-sm font-bold text-slate-100 tabular-nums">
                            {entry.value?.toFixed(1)}
                            <span className="text-xs text-slate-500 ml-0.5">
                                {entry.name === 'Gewicht' ? 'kg' : entry.name === 'BMI' ? '' : '%'}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Weight Trend Chart — main area chart
 */
export function WeightChart({ data, targetWeight, height = 320 }) {
    if (!data || data.length === 0) return null;

    // Calculate domain with padding
    const weights = data.map((d) => d.weight).filter(Boolean);
    let minW = Math.min(...weights);
    let maxW = Math.max(...weights);

    // Include target weight in domain if present
    if (targetWeight) {
        minW = Math.min(minW, targetWeight);
        maxW = Math.max(maxW, targetWeight);
    }

    minW = Math.floor(minW - 1);
    maxW = Math.ceil(maxW + 1);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: -12, bottom: 0 }}>
                {/* ... defs ... */}
                <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="weightLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.06)"
                    vertical={false}
                />
                <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                />
                <YAxis
                    domain={[minW, maxW]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val} kg`}
                />
                <Tooltip content={<CustomTooltip />} />

                {targetWeight && (
                    <ReferenceLine
                        y={targetWeight}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                        label={{
                            position: 'right',
                            value: `DOEL: ${targetWeight}kg`,
                            fill: '#ef4444',
                            fontSize: 10,
                            fontWeight: 'bold',
                            offset: 10
                        }}
                    />
                )}

                <Area
                    type="monotone"
                    dataKey="weight"
                    name="Gewicht"
                    stroke="url(#weightLine)"
                    strokeWidth={2.5}
                    fill="url(#weightGradient)"
                    dot={false}
                    activeDot={{
                        r: 5,
                        fill: '#3b82f6',
                        stroke: '#1e293b',
                        strokeWidth: 2,
                    }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/**
 * Body Composition Chart — multi-line
 */
export function BodyCompositionChart({ data, height = 320 }) {
    const [activeLines, setActiveLines] = useState({
        bodyFat: true,
        muscleMass: false,
        bodyWater: false,
    });

    if (!data || data.length === 0) return null;

    const toggleLine = (key) => {
        setActiveLines((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const lineConfig = [
        { key: 'bodyFat', name: 'Lichaamsvet', color: '#f59e0b', unit: '%' },
        { key: 'muscleMass', name: 'Spiermassa', color: '#22c55e', unit: 'kg' },
        { key: 'bodyWater', name: 'Lichaamsvocht', color: '#06b6d4', unit: '%' },
    ];

    return (
        <div>
            {/* Toggle buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {lineConfig.map((line) => (
                    <button
                        key={line.key}
                        onClick={() => toggleLine(line.key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeLines[line.key]
                            ? 'bg-slate-700/50 text-slate-200 ring-1 ring-slate-600/50'
                            : 'bg-slate-800/30 text-slate-500 hover:text-slate-400'
                            }`}
                    >
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: activeLines[line.key] ? line.color : '#475569',
                            }}
                        />
                        {line.name}
                    </button>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148, 163, 184, 0.06)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                        interval="preserveStartEnd"
                        minTickGap={50}
                    />
                    <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {activeLines.bodyFat && (
                        <Line
                            type="monotone"
                            dataKey="bodyFat"
                            name="Lichaamsvet"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#f59e0b', stroke: '#1e293b', strokeWidth: 2 }}
                        />
                    )}
                    {activeLines.muscleMass && (
                        <Line
                            type="monotone"
                            dataKey="muscleMass"
                            name="Spiermassa"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#22c55e', stroke: '#1e293b', strokeWidth: 2 }}
                        />
                    )}
                    {activeLines.bodyWater && (
                        <Line
                            type="monotone"
                            dataKey="bodyWater"
                            name="Lichaamsvocht"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#06b6d4', stroke: '#1e293b', strokeWidth: 2 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * BMI Gauge — visual indicator
 */
export function BMIGauge({ value }) {
    if (value == null) return null;

    // BMI ranges
    const ranges = [
        { label: 'Ondergewicht', min: 0, max: 18.5, color: '#3b82f6' },
        { label: 'Normaal', min: 18.5, max: 25, color: '#22c55e' },
        { label: 'Overgewicht', min: 25, max: 30, color: '#f59e0b' },
        { label: 'Obesitas', min: 30, max: 40, color: '#ef4444' },
    ];

    const currentRange = ranges.find((r) => value >= r.min && value < r.max) || ranges[ranges.length - 1];
    const position = Math.min(Math.max(((value - 15) / (35 - 15)) * 100, 0), 100);

    return (
        <div className="space-y-3">
            {/* BMI Value */}
            <div className="text-center">
                <span className="text-3xl font-bold tabular-nums" style={{ color: currentRange.color }}>
                    {value.toFixed(1)}
                </span>
                <p className="text-sm text-slate-400 mt-1">{currentRange.label}</p>
            </div>

            {/* Gauge Bar */}
            <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-800">
                <div className="absolute inset-0 flex">
                    {ranges.map((r, i) => (
                        <div
                            key={i}
                            className="h-full"
                            style={{
                                backgroundColor: r.color,
                                width: `${((r.max - r.min) / (40 - 0)) * 100}%`,
                                opacity: 0.3,
                            }}
                        />
                    ))}
                </div>
                {/* Indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-lg transition-all duration-1000"
                    style={{
                        left: `${position}%`,
                        backgroundColor: currentRange.color,
                        transform: `translateX(-50%) translateY(-50%)`,
                        boxShadow: `0 0 12px ${currentRange.color}66`,
                    }}
                />
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[10px] text-slate-500">
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>30</span>
                <span>35</span>
            </div>
        </div>
    );
}

/**
 * Sparkline — tiny chart for inline use
 */
export function Sparkline({ data, dataKey, color = '#3b82f6', height = 40, width = 120 }) {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width={width} height={height}>
            <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                    <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#spark-${dataKey})`}
                    dot={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/**
 * Weight Distribution Chart
 */
export function WeightDistributionChart({ data, height = 200 }) {
    if (!data || data.length === 0) return null;

    // Create histogram buckets
    const weights = data.map((d) => d.weight).filter(Boolean);
    const min = Math.floor(Math.min(...weights));
    const max = Math.ceil(Math.max(...weights));
    const bucketSize = 0.5;
    const buckets = [];

    for (let i = min; i <= max; i += bucketSize) {
        const count = weights.filter((w) => w >= i && w < i + bucketSize).length;
        buckets.push({
            range: `${i.toFixed(1)}`,
            count,
        });
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={buckets} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.06)"
                    vertical={false}
                />
                <XAxis
                    dataKey="range"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={1}
                />
                <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                    dataKey="count"
                    name="Metingen"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.7}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
