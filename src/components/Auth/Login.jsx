import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Moon,
  Sun,
  KeyRound,
  Store,
  Sparkles,
} from 'lucide-react';

export default function Login() {
  const { login, darkMode, toggleDarkMode } = useApp();

  const [username, setUsername] = useState('Kioscokeonda');
  const [password, setPassword] = useState('1656');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const res = login(username.trim(), password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setUsername('Kioscokeonda');
      setPassword('1656');
      login('Kioscokeonda', '1656');
    } else {
      setUsername('cajero');
      setPassword('1656');
      login('cajero', '1656');
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat selection:bg-red-500 selection:text-white"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
      }}
    >
      {/* Dark & Neon Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/60 backdrop-blur-[2px]" />

      {/* Night mode toggle at top-right of login screen */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all"
          title="Modo Noche / Día"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
        </button>
      </div>

      {/* Main Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Logo and Brand Header */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-3 rounded-2xl bg-white shadow-xl p-2 border-2 border-red-500 flex items-center justify-center transform hover:rotate-2 transition-transform">
            <img
              src="/logo.png"
              alt="KEE ONDA Logo"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            <span className="text-red-600">KEE</span> ONDA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Sistema Integral CRM / ERP para Kiosco & Almacén
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kioscokeonda"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Contraseña / PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1656"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>INGRESAR AL SISTEMA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Accounts Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Acceso Rápido (1-Click)
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/30 text-left transition-all"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                <span>Kioscokeonda</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Clave: 1656</div>
            </button>

            <button
              onClick={() => handleQuickLogin('cajero')}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/30 text-left transition-all"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Cajero</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Clave: 1656</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

