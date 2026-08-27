import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Lock, Sparkles, X, Check, Cloud, ShieldCheck } from 'lucide-react';
import { StorageService } from '../';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUserAuthenticated: (user: User) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.split('@')[0],
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const authedUser: User = {
          id: data.user.id,
          name: name.trim() || data.user.name,
          email: data.user.email,
          avatar: selectedAvatar || data.user.avatar,
          createdAt: data.user.createdAt || new Date().toISOString(),
          isGuest: false,
        };

        StorageService.setCurrentUser(authedUser);
        onUserAuthenticated(authedUser);
        onClose();
      } else {
        setErrorMsg('No se pudo conectar al servidor de autenticación.');
      }
    } catch {
      // Fallback local account
      const authedUser: User = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        avatar: selectedAvatar,
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      StorageService.setCurrentUser(authedUser);
      onUserAuthenticated(authedUser);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccount = (demoName: string, demoEmail: string) => {
    const demoUser: User = {
      id: 'demo_' + Buffer.from(demoEmail).toString('hex').substring(0, 10),
      name: demoName,
      email: demoEmail,
      avatar: selectedAvatar,
      createdAt: new Date().toISOString(),
      isGuest: false,
    };
    StorageService.setCurrentUser(demoUser);
    onUserAuthenticated(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="auth-modal-box"
        className="w-full max-w-md bg-[#140d21] border border-[#352055] rounded-3xl p-6 shadow-2xl space-y-5 text-purple-100 relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#291842]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-jakarta">Sincronización en la Nube</h3>
              <p className="text-[10px] text-purple-300/80">Guarda libros, notas y progreso entre dispositivos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-400 hover:text-white hover:bg-[#201338] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Iniciar Sesión / Crear Cuenta */}
        <div className="flex items-center bg-[#0c0814] p-1 rounded-2xl border border-[#291842]">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'login' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-400/80 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'register' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-400/80 hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-purple-200 block mb-1">Nombre Completo:</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Sofía Martínez"
                  className="w-full pl-9 pr-3 py-2 bg-[#0c0814] border border-[#291842] rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">Correo Electrónico:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full pl-9 pr-3 py-2 bg-[#0c0814] border border-[#291842] rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">Contraseña:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#0c0814] border border-[#291842] rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1.5">Elige tu Avatar:</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {AVATAR_OPTIONS.map((av, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedAvatar === av ? 'border-purple-400 scale-110 shadow-lg' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={av} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-purple-950/60 transition active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Conectando...' : mode === 'login' ? 'Acceder a mi Biblioteca' : 'Crear Cuenta y Sincronizar'}
          </button>
        </form>

        {/* 1-Click Demo Profiles */}
        <div className="border-t border-[#291842] pt-3">
          <span className="text-[10px] text-purple-400 block text-center font-bold uppercase mb-2">
            O entra con un clic de prueba:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleDemoAccount('Lector Gabriel', 'gabriel@biblioteca.com')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-[#0c0814] hover:bg-[#1e1332] border border-[#291842] text-[11px] text-purple-200 truncate transition"
            >
              👤 Gabriel (Lectura activa)
            </button>
            <button
              onClick={() => handleDemoAccount('Valeria Literaria', 'valeria@biblioteca.com')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-[#0c0814] hover:bg-[#1e1332] border border-[#291842] text-[11px] text-purple-200 truncate transition"
            >
              👤 Valeria (Investigadora)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
