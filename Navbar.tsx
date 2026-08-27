import React from 'react';
import { BookOpen, Library, BookmarkCheck, Settings, Cloud, RefreshCw, User as UserIcon, Smartphone } from 'lucide-react';
import { User } from '../types';
import { usePwaInstall } from '../';

interface NavbarProps {
  activeTab: 'library' | 'shelves' | 'notes' | 'settings';
  onTabChange: (tab: 'library' | 'shelves' | 'notes' | 'settings') => void;
  user: User | null;
  syncStatus: { isSyncing: boolean; lastSync: string };
  onTriggerSync: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  syncStatus,
  onTriggerSync,
  onOpenAuth,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  return (
    <>
      {/* Mobile Top Header */}
      <header
        id="app-top-header"
        className="sticky top-0 z-40 bg-[#10091d]/90 backdrop-blur-xl border-b border-[#291842] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1 font-jakarta">
              Bora<span className="text-purple-400">Lib</span>
            </h1>
            <p className="text-[10px] text-purple-300/70 font-medium">Biblioteca & Lector Digital</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Install Button when prompt is available and not already standalone */}
          {isInstallable && !isInstalled && (
            <button
              id="pwa-install-header-btn"
              onClick={() => promptInstall()}
              title="Instalar BoraLib como App en Android"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs font-semibold shadow-md shadow-purple-950/60 border border-purple-400/40 transition active:scale-95 animate-pulse"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Instalar</span>
            </button>
          )}

          {/* Cloud Sync Indicator */}
          <button
            id="cloud-sync-btn"
            onClick={onTriggerSync}
            title={syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizado con la nube'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#19102b] hover:bg-[#22153b] text-purple-200 text-xs border border-[#352055] transition active:scale-95 shadow-sm"
          >
            {syncStatus.isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-purple-300 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-purple-300" />
            )}
            <span className="hidden sm:inline font-medium text-[11px]">
              {syncStatus.isSyncing ? 'Sincronizando' : 'Nube'}
            </span>
          </button>

          {/* User Profile Avatar */}
          <button
            id="user-profile-header-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#19102b] hover:bg-[#22153b] border border-[#352055] transition active:scale-95 shadow-sm"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-purple-400/50"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs text-purple-100 font-medium max-w-[85px] truncate hidden xs:inline">
              {user?.name || 'Mi Cuenta'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Mobile-first UX) */}
      <nav
        id="app-bottom-navbar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#10091d]/95 backdrop-blur-2xl border-t border-[#291842] py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-3 flex justify-around items-center shadow-[0_-8px_25px_rgba(0,0,0,0.6)]"
      >
        {/* Tab: Biblioteca */}
        <button
          id="nav-tab-library"
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'library'
              ? 'text-purple-200 bg-[#24143a] border border-purple-500/30 font-semibold scale-105 shadow-md'
              : 'text-purple-400/60 hover:text-purple-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'library' ? 'stroke-[2.5] text-purple-300' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Biblioteca</span>
        </button>

        {/* Tab: Estanterías */}
        <button
          id="nav-tab-shelves"
          onClick={() => onTabChange('shelves')}
          className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'shelves'
              ? 'text-purple-200 bg-[#24143a] border border-purple-500/30 font-semibold scale-105 shadow-md'
              : 'text-purple-400/60 hover:text-purple-200'
          }`}
        >
          <Library className={`w-5 h-5 ${activeTab === 'shelves' ? 'stroke-[2.5] text-purple-300' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Estanterías</span>
        </button>

        {/* Tab: Notas & Subrayados */}
        <button
          id="nav-tab-notes"
          onClick={() => onTabChange('notes')}
          className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'notes'
              ? 'text-purple-200 bg-[#24143a] border border-purple-500/30 font-semibold scale-105 shadow-md'
              : 'text-purple-400/60 hover:text-purple-200'
          }`}
        >
          <BookmarkCheck className={`w-5 h-5 ${activeTab === 'notes' ? 'stroke-[2.5] text-purple-300' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Notas</span>
        </button>

        {/* Tab: Ajustes */}
        <button
          id="nav-tab-settings"
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'settings'
              ? 'text-purple-200 bg-[#24143a] border border-purple-500/30 font-semibold scale-105 shadow-md'
              : 'text-purple-400/60 hover:text-purple-200'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5] text-purple-300' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Ajustes</span>
        </button>
      </nav>
    </>
  );
};
