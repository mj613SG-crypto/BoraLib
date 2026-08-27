import React, { useState } from 'react';
import { User, ReadingSettings } from '../types';
import {
  Settings,
  Cloud,
  RefreshCw,
  User as UserIcon,
  Download,
  Upload,
  Moon,
  Sun,
  Palette,
  Type,
  CheckCircle,
  CheckCircle2,
  HardDrive,
  Smartphone,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '../';
import { usePwaInstall } from '../usePwaInstall';

interface SettingsViewProps {
  user: User | null;
  settings: ReadingSettings;
  onSaveSettings: (settings: ReadingSettings) => void;
  syncStatus: { isSyncing: boolean; lastSync: string };
  onTriggerSync: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  onSaveSettings,
  syncStatus,
  onTriggerSync,
  onOpenAuth,
  onLogout,
  onRefreshData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePwaInstall();

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BoraLib_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = StorageService.importFullBackup(content);
      if (ok) {
        setImportStatus('¡Copia de seguridad restaurada con éxito!');
        onRefreshData();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Error: Archivo de copia no válido');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-view-main" className="space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#140d21] p-5 rounded-3xl border border-[#291842] backdrop-blur-md shadow-md">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-jakarta">
          <Settings className="w-5 h-5 text-purple-400" /> Ajustes y Configuración
        </h2>
        <p className="text-xs text-purple-300/80 mt-1">
          Gestiona tu cuenta en la nube, preferencias de lectura y copias de seguridad.
        </p>
      </div>

      {/* 1. Account & Cloud Profile Card */}
      <div className="bg-[#140d21] rounded-3xl p-5 border border-[#291842] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-purple-400" /> Perfil y Cuenta
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1e1332] text-purple-200 border border-[#352055] font-medium">
            {user?.isGuest ? 'Modo Local / Invitado' : 'Cuenta Sincronizada'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#19102b] p-4 rounded-2xl border border-[#2d1a47]">
          <div className="flex items-center gap-3.5">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-400/50 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-purple-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div>
              <h4 className="text-base font-bold text-white">{user?.name || 'Usuario'}</h4>
              <p className="text-xs text-purple-300/80">{user?.email || 'cuenta@boralib.app'}</p>
              <p className="text-[10px] text-purple-400/70 mt-1">
                Miembro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'hoy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-md"
            >
              {user?.isGuest ? 'Iniciar Sesión / Crear Cuenta' : 'Cambiar Cuenta'}
            </button>
            {!user?.isGuest && (
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-xl bg-[#0c0814] hover:bg-[#1f1335] text-purple-300 hover:text-white border border-[#291842] text-xs transition"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Cloud Synchronization Manager */}
      <div className="bg-[#140d21] rounded-3xl p-5 border border-[#291842] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-purple-400" /> Sincronización en la Nube
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#19102b] p-4 rounded-2xl border border-[#2d1a47]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white">Estado de la Nube Activo</h4>
            </div>
            <p className="text-xs text-purple-300/80 mt-1">
              Última sincronización guardada:{' '}
              <span className="text-purple-200 font-medium">
                {new Date(syncStatus.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </p>
            <p className="text-[11px] text-purple-400/70 mt-0.5">
              Todos tus libros, notas, subrayados y progreso se respaldan automáticamente al leer.
            </p>
          </div>

          <button
            onClick={onTriggerSync}
            disabled={syncStatus.isSyncing}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/60 transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>
      </div>

      {/* 3. Default Reader Preferences */}
      <div className="bg-[#140d21] rounded-3xl p-5 border border-[#291842] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" /> Preferencias Predeterminadas del Lector
        </h3>

        {/* Theme select */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-purple-200">Tema de Lectura Predeterminado:</label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => onSaveSettings({ ...settings, theme: 'light' })}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                settings.theme === 'light'
                  ? 'bg-white text-slate-900 border-purple-400 shadow-md font-bold'
                  : 'bg-white/10 text-purple-200 border-[#291842] hover:bg-white/20'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs">Modo Claro</span>
            </button>

            <button
              onClick={() => onSaveSettings({ ...settings, theme: 'sepia' })}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                settings.theme === 'sepia'
                  ? 'bg-[#f7f0df] text-[#3d3023] border-amber-600 shadow-md font-bold'
                  : 'bg-[#f7f0df]/20 text-purple-200 border-[#291842] hover:bg-[#f7f0df]/30'
              }`}
            >
              <Palette className="w-4 h-4 text-amber-700" />
              <span className="text-xs">Modo Sepia</span>
            </button>

            <button
              onClick={() => onSaveSettings({ ...settings, theme: 'dark' })}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                settings.theme === 'dark'
                  ? 'bg-[#0c0814] text-purple-200 border-purple-400 shadow-md font-bold'
                  : 'bg-[#0c0814]/50 text-purple-300 border-[#291842] hover:bg-[#19102b]'
              }`}
            >
              <Moon className="w-4 h-4 text-purple-400" />
              <span className="text-xs">Modo Oscuro</span>
            </button>
          </div>
        </div>

        {/* Font family default */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Tipografía Predeterminada:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'literata', name: 'Literata (Serif clásica)' },
              { id: 'merriweather', name: 'Merriweather (Libro)' },
              { id: 'playfair', name: 'Playfair Display' },
              { id: 'jakarta', name: 'Plus Jakarta (Sans)' },
              { id: 'mono', name: 'JetBrains Mono' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => onSaveSettings({ ...settings, fontFamily: f.id as any })}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition text-left ${
                  settings.fontFamily === f.id
                    ? 'bg-purple-700 text-white border-purple-400 shadow'
                    : 'bg-[#19102b] text-purple-300 border-[#291842] hover:bg-[#22153b]'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Base Font Size */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-purple-200">
            <span>Tamaño de Letra Base:</span>
            <span className="text-purple-300 font-bold">{settings.fontSize} px</span>
          </div>
          <input
            type="range"
            min="14"
            max="30"
            step="1"
            value={settings.fontSize}
            onChange={(e) => onSaveSettings({ ...settings, fontSize: Number(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      {/* 4. Progressive Web App (PWA) & Android Installation */}
      <div id="pwa-settings-card" className="bg-[#140d21] rounded-3xl p-5 border border-[#291842] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" /> Aplicación PWA para Android
          </h3>
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
              isStandalone || isInstalled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-purple-950/80 text-purple-200 border-purple-500/30'
            }`}
          >
            {isStandalone ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> App Instalada (Standalone)
              </>
            ) : isInstalled ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Instalada
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-purple-400" /> Lista para Instalar
              </>
            )}
          </span>
        </div>

        <div className="bg-[#19102b] p-4 rounded-2xl border border-[#2d1a47] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                BoraLib - Experiencia Nativa en Android
              </h4>
              <p className="text-xs text-purple-300/80 mt-1 leading-relaxed">
                Instala BoraLib en la pantalla de inicio de tu teléfono para leer libros EPUB a pantalla completa, sin barras del navegador y con lectura 100% offline.
              </p>
            </div>

            {/* Install Trigger Button */}
            {!isStandalone && (
              <button
                onClick={() => promptInstall()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/80 transition active:scale-95 flex-shrink-0 self-start sm:self-auto"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isInstallable ? 'Instalar BoraLib en Android' : 'Cómo Instalar en Android'}</span>
              </button>
            )}
          </div>

          {/* Key PWA Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#2d1a47]">
            <div className="bg-[#10091d] p-2.5 rounded-xl border border-[#291842] flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Lectura Offline</p>
                <p className="text-[10px] text-purple-300/70">Libros guardados en almacenamiento local</p>
              </div>
            </div>

            <div className="bg-[#10091d] p-2.5 rounded-xl border border-[#291842] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Pantalla Completa</p>
                <p className="text-[10px] text-purple-300/70">Modo Standalone sin distracciones</p>
              </div>
            </div>

            <div className="bg-[#10091d] p-2.5 rounded-xl border border-[#291842] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Lanzamiento Rápido</p>
                <p className="text-[10px] text-purple-300/70">Icono directo en tu escritorio</p>
              </div>
            </div>
          </div>

          {/* Android Installation Tip */}
          {!isStandalone && (
            <div className="bg-[#10091d]/80 p-3 rounded-xl border border-[#291842] text-[11px] text-purple-300/90 flex items-start gap-2">
              <span className="text-purple-400 font-bold">💡 Consejo Chrome:</span>
              <span>
                Para instalar manualmente en Android, pulsa el menú de 3 puntos (<strong>⋮</strong>) en la esquina superior de Chrome y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla principal"</strong>.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Backup & Restore Database */}
      <div className="bg-[#140d21] rounded-3xl p-5 border border-[#291842] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-purple-400" /> Copia de Seguridad & Datos
        </h3>
        <p className="text-xs text-purple-300/80">
          Exporta tu biblioteca completa, estanterías, notas y subrayados en un solo archivo JSON seguro o restáuralos en cualquier momento.
        </p>

        {importStatus && (
          <div className="p-3 bg-[#1e1332] border border-purple-500 rounded-xl text-xs text-purple-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> {importStatus}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 text-xs font-semibold flex items-center gap-2 border border-[#352055] transition"
          >
            <Download className="w-4 h-4" /> Exportar Copia de Seguridad (JSON)
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 text-xs font-semibold flex items-center gap-2 border border-[#352055] transition cursor-pointer">
            <Upload className="w-4 h-4" /> Restaurar Copia (JSON)
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
