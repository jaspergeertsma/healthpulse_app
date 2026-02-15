/**
 * Demo data generator for Health Pulse
 * Generates realistic health data for UI development and demo purposes.
 * This data is used when the Garmin Connect API is not yet configured.
 */

function generateDateRange(daysBack) {
    const dates = [];
    const today = new Date();
    for (let i = daysBack; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

function randomWalk(start, volatility, trend, count) {
    const values = [start];
    for (let i = 1; i < count; i++) {
        const change = (Math.random() - 0.5) * 2 * volatility + trend;
        values.push(parseFloat((values[i - 1] + change).toFixed(2)));
    }
    return values;
}

export function generateDemoWeightData(days = 90) {
    const dates = generateDateRange(days);
    const weights = randomWalk(86.5, 0.3, -0.015, dates.length);
    const bodyFats = randomWalk(24.2, 0.2, -0.01, dates.length);
    const muscleMasses = randomWalk(38.1, 0.1, 0.005, dates.length);
    const boneMasses = randomWalk(3.2, 0.02, 0, dates.length);
    const bodyWaters = randomWalk(55.3, 0.3, 0.01, dates.length);
    const bmis = weights.map((w) => parseFloat((w / (1.82 * 1.82)).toFixed(1)));

    const dateWeightList = dates.map((date, i) => ({
        calendarDate: date,
        weight: weights[i] * 1000, // Garmin stores in grams
        bmi: bmis[i],
        bodyFatPercentage: bodyFats[i],
        muscleMass: muscleMasses[i] * 1000,
        boneMass: boneMasses[i] * 1000,
        bodyWater: bodyWaters[i],
        sourceType: 'INDEX_SCALE',
        timestampGMT: new Date(date).getTime(),
    }));

    // Skip some random days to make it realistic (not weighing every day)
    const filtered = dateWeightList.filter(() => Math.random() > 0.25);

    return {
        dateWeightList: filtered,
        totalAverage: {
            from: dates[0],
            until: dates[dates.length - 1],
        },
    };
}

export function generateDemoProfile() {
    return {
        displayName: 'Health User',
        userName: 'healthuser',
        profileImageUrl: null,
        height: 182, // cm
        weight: 85.2,
        birthDate: '1988-06-15',
        gender: 'MALE',
    };
}

export function generateDemoDashboard() {
    const weightData = generateDemoWeightData(90);
    const profile = generateDemoProfile();

    return {
        weight: weightData,
        profile: profile,
        fetchedAt: new Date().toISOString(),
        isDemo: true,
    };
}

/**
 * Transform raw Garmin weight data into chart-ready format
 */
export function transformWeightData(rawData) {
    if (!rawData || !rawData.dateWeightList) return [];

    return rawData.dateWeightList
        .map((entry) => ({
            date: entry.calendarDate,
            weight: parseFloat((entry.weight / 1000).toFixed(1)),
            bmi: entry.bmi || null,
            bodyFat: entry.bodyFatPercentage
                ? parseFloat(entry.bodyFatPercentage.toFixed(1))
                : null,
            muscleMass: entry.muscleMass
                ? parseFloat((entry.muscleMass / 1000).toFixed(1))
                : null,
            boneMass: entry.boneMass
                ? parseFloat((entry.boneMass / 1000).toFixed(1))
                : null,
            bodyWater: entry.bodyWater
                ? parseFloat(entry.bodyWater.toFixed(1))
                : null,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate statistics from weight data
 */
export function calculateStats(data) {
    if (!data || data.length === 0) {
        return {
            current: null,
            previous: null,
            change: null,
            changePercent: null,
            min: null,
            max: null,
            average: null,
            trend: 'neutral',
        };
    }

    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    const weights = data.map((d) => d.weight).filter(Boolean);

    const change = previous ? parseFloat((latest.weight - previous.weight).toFixed(2)) : 0;
    const changePercent = previous
        ? parseFloat(((change / previous.weight) * 100).toFixed(2))
        : 0;

    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const average = parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1));

    // Simple trend: compare last 7 entries average vs first 7
    let trend = 'neutral';
    if (data.length > 14) {
        const recentAvg =
            data
                .slice(-7)
                .reduce((sum, d) => sum + (d.weight || 0), 0) / 7;
        const olderAvg =
            data
                .slice(0, 7)
                .reduce((sum, d) => sum + (d.weight || 0), 0) / 7;
        trend = recentAvg < olderAvg ? 'down' : recentAvg > olderAvg ? 'up' : 'neutral';
    }

    return {
        current: latest,
        previous,
        change,
        changePercent,
        min: parseFloat(min.toFixed(1)),
        max: parseFloat(max.toFixed(1)),
        average,
        trend,
    };
}
