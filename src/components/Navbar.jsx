import React, { useState, useRef, useEffect } from 'react';
import {
    Activity,
    BarChart3,
    Settings,
    Heart,
    RefreshCcw,
    Wifi,
    WifiOff,
    Menu,
    X,
    LogOut,
    User,
    ChevronDown,
    Moon,
} from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, isDemo, onRefresh, loading, syncing, user, onSignOut }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: Activity },
        { id: 'weight', label: 'Gewicht', icon: BarChart3 },
        { id: 'sleep', label: 'Slaap', icon: Moon },
        { id: 'body', label: 'Lichaamssamenstelling', icon: Heart },
    ];

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse-slow" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-100 tracking-tight">
                                Health Pulse
                            </h1>
                            <p className="text-[10px] text-slate-500 -mt-0.5 font-medium uppercase tracking-wider">
                                Garmin Connect
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    id={`nav-${tab.id}`}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-blue-500/10 text-blue-400 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        } ${isActive ? 'nav-active' : ''}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <div
                            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDemo
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                        >
                            {isDemo ? (
                                <>
                                    <WifiOff className="w-3 h-3" />
                                    Geen data
                                </>
                            ) : (
                                <>
                                    <Wifi className="w-3 h-3" />
                                    Live
                                </>
                            )}
                        </div>

                        {/* Refresh */}
                        <button
                            id="btn-refresh"
                            onClick={onRefresh}
                            disabled={loading || syncing}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200 disabled:opacity-50"
                        >
                            <RefreshCcw
                                className={`w-4 h-4 ${loading || syncing ? 'animate-spin' : ''}`}
                            />
                        </button>

                        {/* User Menu - Desktop Only */}
                        {user && (
                            <div className="relative hidden md:block" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-all duration-200 ${dropdownOpen
                                        ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-lg'
                                        : 'bg-slate-900/50 border-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
                                        <User className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <span className="max-w-[120px] truncate text-xs font-medium">
                                        {user.email.split('@')[0]}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl animate-fade-in z-[60]">
                                        <div className="px-4 py-2 border-b border-slate-800/50 mb-1">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ingelogd als</p>
                                            <p className="text-xs text-slate-300 truncate font-medium">{user.email}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                onTabChange('settings');
                                                setDropdownOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-blue-400" />
                                            Instellingen
                                        </button>

                                        <button
                                            onClick={() => {
                                                onSignOut();
                                                setDropdownOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu */}
                        <button
                            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 space-y-1 animate-fade-in">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        onTabChange(tab.id);
                                        setMobileOpen(false);
                                    }}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}

                        {/* Mobile user / sign out */}
                        {user && (
                            <div className="mt-3 pt-3 border-t border-slate-800/50">
                                <div className="px-4 py-2 border-b border-slate-800/50 mb-1">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ingelogd als</p>
                                    <p className="text-xs text-slate-300 truncate font-medium">{user.email}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        onTabChange('settings');
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-blue-400" />
                                    Instellingen
                                </button>

                                <button
                                    onClick={() => {
                                        onSignOut();
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
