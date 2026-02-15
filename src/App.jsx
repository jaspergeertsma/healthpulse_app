import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import WeightPage from './components/WeightPage';
import BodyCompositionPage from './components/BodyCompositionPage';
import SettingsPage from './components/SettingsPage';
import { useDashboard } from './hooks/useHealthData';

function AppContent() {
    const { user, session, loading: authLoading, signIn, signOut, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Show loading spinner while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-mesh flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Laden...</p>
                </div>
            </div>
        );
    }

    // Show login if not authenticated
    if (!isAuthenticated) {
        return <LoginPage onSignIn={signIn} />;
    }

    // Authenticated — show the app
    return <AuthenticatedApp activeTab={activeTab} setActiveTab={setActiveTab} user={user} onSignOut={signOut} />;
}

function AuthenticatedApp({ activeTab, setActiveTab, user, onSignOut }) {
    const {
        data,
        stats,
        chartData,
        loading,
        error,
        isDemo,
        syncing,
        lastSync,
        refresh,
        sync,
        updateProfile,
        logHabit,
    } = useDashboard(0);

    const renderPage = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <Dashboard
                        data={data}
                        stats={stats}
                        chartData={chartData}
                        loading={loading}
                        syncing={syncing}
                        onSync={sync}
                        onLogHabit={logHabit}
                        updateProfile={updateProfile}
                        user={user}
                    />
                );
            case 'weight':
                return (
                    <WeightPage
                        chartData={chartData}
                        stats={stats}
                        profile={data?.profile}
                        loading={loading}
                    />
                );
            case 'body':
                return (
                    <BodyCompositionPage
                        chartData={chartData}
                        stats={stats}
                        data={data}
                        loading={loading}
                    />
                );
            case 'settings':
                return (
                    <SettingsPage
                        isDemo={isDemo}
                        data={data}
                        lastSync={lastSync}
                        syncing={syncing}
                        onSync={sync}
                        updateProfile={updateProfile}
                        user={user}
                        onSignOut={onSignOut}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-mesh">
            <Navbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDemo={isDemo}
                onRefresh={refresh}
                loading={loading}
                syncing={syncing}
                user={user}
                onSignOut={onSignOut}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && !loading && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 animate-fade-in">
                        <strong>Fout:</strong> {error}
                    </div>
                )}
                {renderPage()}
            </main>

            <footer className="border-t border-slate-800/30 mt-16 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-slate-600">
                            Health Pulse v1.0 — Personal Health Tracker
                        </p>
                        <p className="text-xs text-slate-600">
                            Data via Supabase · Garmin Index Scale Gen 1
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
