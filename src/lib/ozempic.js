/**
 * Ozempic (GLP-1) utility functions
 * Dose titration, injection scheduling, body composition analysis
 */

const TITRATION_SCHEDULE = [
    { weeksFrom: 0, weeksTo: 4, doseMg: 0.25, label: 'Opstart' },
    { weeksFrom: 4, weeksTo: 8, doseMg: 0.5, label: 'Opbouw' },
    { weeksFrom: 8, weeksTo: 12, doseMg: 1.0, label: 'Therapeutisch' },
    { weeksFrom: 12, weeksTo: Infinity, doseMg: 2.0, label: 'Onderhoud' },
];

const SITES = ['abdomen', 'thigh', 'upper_arm'];
const SITE_LABELS = { abdomen: 'Buik', thigh: 'Dij', upper_arm: 'Bovenarm' };
const DAY_LABELS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

/**
 * Get current dose phase based on start date
 */
export function getDosePhase(startDate, currentDate = new Date()) {
    if (!startDate) return null;
    const start = new Date(startDate);
    const diffMs = currentDate - start;
    const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

    if (weekNumber < 0) return { weekNumber: 0, recommendedDoseMg: 0.25, phaseLabel: 'Nog niet gestart' };

    const phase = TITRATION_SCHEDULE.find(p => weekNumber >= p.weeksFrom && weekNumber < p.weeksTo)
        || TITRATION_SCHEDULE[TITRATION_SCHEDULE.length - 1];

    return {
        weekNumber: weekNumber + 1,
        recommendedDoseMg: phase.doseMg,
        phaseLabel: phase.label,
        phaseName: `Week ${weekNumber + 1} — ${phase.doseMg}mg`,
    };
}

/**
 * Days until next injection day (0 = today)
 */
export function getDaysUntilNextInjection(injectionDay) {
    if (injectionDay == null) return null;
    const today = new Date();
    const currentDay = today.getDay();
    const diff = (injectionDay - currentDay + 7) % 7;
    return diff;
}

/**
 * Recommend next injection site based on rotation
 */
export function getRecommendedSite(recentInjections) {
    if (!recentInjections || recentInjections.length === 0) return SITES[0];
    const lastSite = recentInjections[recentInjections.length - 1]?.injection_site;
    const lastIndex = SITES.indexOf(lastSite);
    return SITES[(lastIndex + 1) % SITES.length];
}

/**
 * Calculate weight loss velocity per dose phase
 */
export function calculateWeightVelocityByPhase(chartData, startDate) {
    if (!chartData || !startDate || chartData.length === 0) return [];
    const start = new Date(startDate);
    const ozempicData = chartData.filter(d => new Date(d.date) >= start);
    if (ozempicData.length < 2) return [];

    const phases = [];
    for (const phase of TITRATION_SCHEDULE) {
        const phaseStart = new Date(start);
        phaseStart.setDate(phaseStart.getDate() + phase.weeksFrom * 7);
        const phaseEnd = phase.weeksTo === Infinity
            ? new Date()
            : new Date(start.getTime() + phase.weeksTo * 7 * 24 * 60 * 60 * 1000);

        const phaseData = ozempicData.filter(d => {
            const date = new Date(d.date);
            return date >= phaseStart && date < phaseEnd;
        });

        if (phaseData.length >= 2) {
            const first = phaseData[0].weight;
            const last = phaseData[phaseData.length - 1].weight;
            const weeks = (new Date(phaseData[phaseData.length - 1].date) - new Date(phaseData[0].date)) / (7 * 24 * 60 * 60 * 1000);
            phases.push({
                doseMg: phase.doseMg,
                label: phase.label,
                kgPerWeek: weeks > 0 ? (last - first) / weeks : 0,
                totalChange: last - first,
                dataPoints: phaseData.length,
                isCurrent: new Date() >= phaseStart && new Date() < phaseEnd,
            });
        }
    }

    return phases;
}

/**
 * Analyze body composition trends since Ozempic start
 */
export function analyzeBodyComposition(chartData, startDate) {
    if (!chartData || !startDate) return null;
    const start = new Date(startDate);
    const ozData = chartData.filter(d => new Date(d.date) >= start && d.muscleMass && d.bodyFat);
    if (ozData.length < 2) return null;

    const first = ozData[0];
    const last = ozData[ozData.length - 1];
    const weeks = (new Date(last.date) - new Date(first.date)) / (7 * 24 * 60 * 60 * 1000);
    if (weeks < 1) return null;

    const muscleChange = last.muscleMass - first.muscleMass;
    const fatChange = last.bodyFat - first.bodyFat;
    const muscleChangeRate = muscleChange / weeks;
    const fatChangeRate = fatChange / weeks;

    // Warning: muscle dropping faster than fat (both negative, but muscle rate more negative)
    const isMuscleLossWarning = muscleChange < 0 && (fatChange >= 0 || Math.abs(muscleChangeRate) > Math.abs(fatChangeRate));

    return {
        muscleChange,
        fatChange,
        muscleChangeRate,
        fatChangeRate,
        isMuscleLossWarning,
        weeks: Math.round(weeks),
        firstMuscle: first.muscleMass,
        lastMuscle: last.muscleMass,
        firstFat: first.bodyFat,
        lastFat: last.bodyFat,
    };
}

/**
 * Total weight change since Ozempic start
 */
export function getOzempicWeightChange(chartData, startDate) {
    if (!chartData || !startDate) return null;
    const start = new Date(startDate);
    const ozData = chartData.filter(d => new Date(d.date) >= start && d.weight);
    if (ozData.length < 2) return null;
    return {
        startWeight: ozData[0].weight,
        currentWeight: ozData[ozData.length - 1].weight,
        change: ozData[ozData.length - 1].weight - ozData[0].weight,
        weeks: Math.round((new Date(ozData[ozData.length - 1].date) - new Date(ozData[0].date)) / (7 * 24 * 60 * 60 * 1000)),
    };
}

export { SITES, SITE_LABELS, DAY_LABELS, TITRATION_SCHEDULE };
