import React, { useState } from 'react';
import { Activity, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onSignIn }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSignIn(email, password);
        } catch (err) {
            setError(
                err.message === 'Invalid login credentials'
                    ? 'Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.'
                    : err.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 animate-fade-in">
                    <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-3 border-slate-950 animate-pulse-slow" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                        Health Pulse
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Personal Health Tracker
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 animate-fade-in animate-fade-in-delay-1">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">Inloggen</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Log in om je gezondheidsdata te bekijken
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="login-email"
                                className="text-xs font-medium text-slate-400 uppercase tracking-wider"
                            >
                                E-mailadres
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="jouw@email.nl"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="login-password"
                                className="text-xs font-medium text-slate-400 uppercase tracking-wider"
                            >
                                Wachtwoord
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
                                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-rose-400">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="btn-login"
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Bezig met inloggen...
                                </>
                            ) : (
                                'Inloggen'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 mt-6 animate-fade-in animate-fade-in-delay-2">
                    Garmin Index Scale · Supabase · GitHub Pages
                </p>
            </div>
        </div>
    );
}
