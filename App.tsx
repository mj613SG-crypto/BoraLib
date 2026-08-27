import React, { useState, useEffect, useCallback } from 'react';
import { User, Book, Shelf, Highlight, Bookmark, ReadingSettings } from './types';
import { StorageService } from './storage';
import { Navbar } from './Navbar';
import { LibraryView } from './LibraryView';
import { ShelvesView } from './ShelvesView';
import { NotesView } from './NotesView';
import { SettingsView } from './SettingsView';
import { EpubReader } from './EpubReader';
import { UploadModal } from './UploadModal';
import { AuthModal } from './AuthModal';
import { ShelfModal } from './ShelfModal';

type NavTab = 'library' | 'shelves' | 'notes' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('library');
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [settings, setSettings] = useState<ReadingSettings>(StorageService.getSettings());

  // Active Reader
  const [activeReaderBook, setActiveReaderBook] = useState<Book | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);

  // Cloud Sync Status
  const [syncStatus, setSyncStatus] = useState<{ isSyncing: boolean; lastSync: string }>({
    isSyncing: false,
    lastSync: StorageService.getLastSyncTime(),
  });

  // Load all initial data from Storage & Cloud
  const refreshAllData = useCallback(() => {
    setUser(StorageService.getCurrentUser());
    setBooks(StorageService.getBooksMetadata());
    setShelves(StorageService.getShelves());
    setHighlights(StorageService.getHighlights());
    setBookmarks(StorageService.getBookmarks());
    setSettings(StorageService.getSettings());
    setSyncStatus({ isSyncing: false, lastSync: StorageService.getLastSyncTime() });
  }, []);

  useEffect(() => {
    refreshAllData();

    // Auto-sync on startup
    StorageService.syncWithCloud().then((res) => {
      setSyncStatus({ isSyncing: false, lastSync: res.timestamp });
    });
  }, [refreshAllData]);

  // Open Book Reader
  const handleOpenBook = async (bookId: string) => {
    setIsLoadingBook(true);
    try {
      const fullBook = await StorageService.getFullBook(bookId);
      if (fullBook) {
        setActiveReaderBook(fullBook);
      }
    } catch (e) {
      console.error('Error opening book:', e);
    } finally {
      setIsLoadingBook(false);
    }
  };

  const handleCloseReader = () => {
    setActiveReaderBook(null);
    refreshAllData();
  };

  // Reading Progress Handler
  const handleUpdateProgress = (chapterIndex: number, progressPercent: number, cfi?: string) => {
    if (activeReaderBook) {
      StorageService.updateReadingProgress(activeReaderBook.id, chapterIndex, progressPercent, cfi);
      setBooks(StorageService.getBooksMetadata());
    }
  };

  // Highlights Handler
  const handleAddHighlight = (highlightData: Omit<Highlight, 'id' | 'createdAt'>) => {
    const newHl = StorageService.addHighlight(highlightData);
    setHighlights(StorageService.getHighlights());
  };

  const handleUpdateHighlightNote = (id: string, note?: string) => {
    StorageService.updateHighlightNote(id, note);
    setHighlights(StorageService.getHighlights());
  };

  const handleUpdateHighlight = (id: string, updates: Partial<Highlight>) => {
    StorageService.updateHighlight(id, updates);
    setHighlights(StorageService.getHighlights());
  };

  const handleDeleteHighlight = (id: string) => {
    StorageService.deleteHighlight(id);
    setHighlights(StorageService.getHighlights());
  };

  // Bookmarks Handler
  const handleAddBookmark = (bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>) => {
    StorageService.addBookmark(bookmarkData);
    setBookmarks(StorageService.getBookmarks());
  };

  const handleDeleteBookmark = (id: string) => {
    StorageService.deleteBookmark(id);
    setBookmarks(StorageService.getBookmarks());
  };

  // Book Actions
  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este libro de tu biblioteca?')) {
      await StorageService.deleteBook(bookId);
      refreshAllData();
    }
  };

  const handleMoveToShelf = (bookId: string, shelfId: string) => {
    const updatedBooks = books.map((b) => (b.id === bookId ? { ...b, shelfId } : b));
    StorageService.saveBooksMetadata(updatedBooks);
    setBooks(updatedBooks);
  };

  const handleToggleComplete = (bookId: string) => {
    const target = books.find((b) => b.id === bookId);
    if (target) {
      const newPercent = target.progressPercent >= 100 ? 0 : 100;
      StorageService.updateReadingProgress(bookId, target.currentChapterIndex || 0, newPercent);
      setBooks(StorageService.getBooksMetadata());
    }
  };

  // Shelves Actions
  const handleSaveShelves = (newShelves: Shelf[]) => {
    StorageService.saveShelves(newShelves);
    setShelves(newShelves);
  };

  const handleSaveCustomShelf = (shelfData: Omit<Shelf, 'id' | 'order'>, id?: string) => {
    if (id) {
      StorageService.updateShelf(id, shelfData);
    } else {
      StorageService.addShelf(shelfData);
    }
    setShelves(StorageService.getShelves());
  };

  const handleDeleteShelf = (shelfId: string) => {
    if (window.confirm('¿Eliminar esta estantería? Los libros volverán a la lista general.')) {
      StorageService.deleteShelf(shelfId);
      refreshAllData();
    }
  };

  // Cloud Sync
  const handleTriggerSync = async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    const res = await StorageService.syncWithCloud();
    setSyncStatus({ isSyncing: false, lastSync: res.timestamp });
  };

  // Settings
  const handleSaveSettings = (newSettings: ReadingSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-[#0c0814] text-[#ede8f5] flex flex-col selection:bg-purple-600/50 selection:text-white font-jakarta">
      {/* Active Fullscreen Reader Overlay */}
      {activeReaderBook ? (
        <EpubReader
          book={activeReaderBook}
          settings={settings}
          highlights={highlights}
          bookmarks={bookmarks}
          onSaveSettings={handleSaveSettings}
          onUpdateProgress={handleUpdateProgress}
          onAddHighlight={handleAddHighlight}
          onUpdateHighlightNote={handleUpdateHighlightNote}
          onUpdateHighlight={handleUpdateHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          onAddBookmark={handleAddBookmark}
          onCloseReader={handleCloseReader}
        />
      ) : (
        <>
          {/* Top Bar Header & Mobile Navigation */}
          <Navbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            user={user}
            syncStatus={syncStatus}
            onTriggerSync={handleTriggerSync}
            onOpenAuth={() => setShowAuthModal(true)}
          />

          {/* Main Views Container */}
          <main className="flex-1 px-4 sm:px-6 pt-5 max-w-6xl w-full mx-auto">
            {activeTab === 'library' && (
              <LibraryView
                books={books}
                shelves={shelves}
                onOpenBook={handleOpenBook}
                onDeleteBook={handleDeleteBook}
                onMoveToShelf={handleMoveToShelf}
                onToggleComplete={handleToggleComplete}
                onOpenUpload={() => setShowUploadModal(true)}
              />
            )}

            {activeTab === 'shelves' && (
              <ShelvesView
                shelves={shelves}
                books={books}
                onSaveShelves={handleSaveShelves}
                onOpenCreateShelf={() => {
                  setEditingShelf(null);
                  setShowShelfModal(true);
                }}
                onOpenEditShelf={(shelf) => {
                  setEditingShelf(shelf);
                  setShowShelfModal(true);
                }}
                onDeleteShelf={handleDeleteShelf}
                onOpenBook={handleOpenBook}
                onDeleteBook={handleDeleteBook}
                onMoveToShelf={handleMoveToShelf}
                onToggleComplete={handleToggleComplete}
              />
            )}

            {activeTab === 'notes' && (
              <NotesView
                highlights={highlights}
                bookmarks={bookmarks}
                books={books}
                onUpdateHighlightNote={handleUpdateHighlightNote}
                onDeleteHighlight={handleDeleteHighlight}
                onDeleteBookmark={handleDeleteBookmark}
                onOpenBookAtLocation={(bookId, chapterIndex) => {
                  handleOpenBook(bookId);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                user={user}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                syncStatus={syncStatus}
                onTriggerSync={handleTriggerSync}
                onOpenAuth={() => setShowAuthModal(true)}
                onLogout={() => {
                  StorageService.setCurrentUser(null);
                  refreshAllData();
                }}
                onRefreshData={refreshAllData}
              />
            )}
          </main>
        </>
      )}

      {/* Loading Overlay */}
      {isLoadingBook && (
        <div className="fixed inset-0 z-50 bg-[#0c0814]/80 backdrop-blur-md flex items-center justify-center text-white">
          <div className="bg-[#19102b] border border-purple-500/40 p-6 rounded-3xl flex flex-col items-center gap-3 shadow-2xl">
            <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-purple-100">Abriendo libro...</p>
          </div>
        </div>
      )}

      {/* Upload EPUB Modal */}
      <UploadModal
        shelves={shelves}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSaveNewBook={async (newBook) => {
          await StorageService.saveBook(newBook);
          refreshAllData();
        }}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        currentUser={user}
        onClose={() => setShowAuthModal(false)}
        onUserAuthenticated={(authedUser) => {
          setUser(authedUser);
          handleTriggerSync();
        }}
      />

      {/* Create / Edit Shelf Modal */}
      <ShelfModal
        isOpen={showShelfModal}
        editingShelf={editingShelf}
        onClose={() => setShowShelfModal(false)}
        onSaveShelf={handleSaveCustomShelf}
      />
    </div>
  );
}
