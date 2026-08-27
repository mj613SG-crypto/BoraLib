import { Book, Shelf, Highlight, Bookmark, ReadingSettings, User, AppSyncData } from '../types';
import { DEFAULT_SHELVES, DEFAULT_SETTINGS, INITIAL_BOOKS, INITIAL_HIGHLIGHTS, INITIAL_BOOKMARKS } from './defaultBooks';

const DB_NAME = 'AuraLib_DB';
const DB_VERSION = 1;
const STORAGE_PREFIX = 'auralib_';

// Local storage keys
const KEY_USER = `${STORAGE_PREFIX}user`;
const KEY_SETTINGS = `${STORAGE_PREFIX}settings`;
const KEY_SHELVES = `${STORAGE_PREFIX}shelves`;
const KEY_HIGHLIGHTS = `${STORAGE_PREFIX}highlights`;
const KEY_BOOKMARKS = `${STORAGE_PREFIX}bookmarks`;
const KEY_BOOKS_META = `${STORAGE_PREFIX}books_meta`;
const KEY_LAST_SYNC = `${STORAGE_PREFIX}last_sync`;

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('IndexedDB failed to open, falling back to in-memory/localStorage');
      reject(request.error);
    };
  });

  return dbPromise;
}

let cachedBooksMeta: Book[] | null = null;

export class StorageService {
  // --- USER AUTH & SESSION ---
  static getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(KEY_USER);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    // Default guest profile if none
    const guestUser: User = {
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      name: 'Lector Viajero',
      email: 'lector@boralib.app',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      isGuest: true,
    };
    StorageService.setCurrentUser(guestUser);
    return guestUser;
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEY_USER);
    }
  }

  // --- SETTINGS ---
  static getSettings(): ReadingSettings {
    try {
      const raw = localStorage.getItem(KEY_SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: ReadingSettings): void {
    try {
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
    this.scheduleCloudSync();
  }

  // --- SHELVES ---
  static getShelves(): Shelf[] {
    try {
      const raw = localStorage.getItem(KEY_SHELVES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.order - b.order);
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Initialize default shelves
    try {
      localStorage.setItem(KEY_SHELVES, JSON.stringify(DEFAULT_SHELVES));
    } catch {}
    return DEFAULT_SHELVES;
  }

  static saveShelves(shelves: Shelf[]): void {
    try {
      localStorage.setItem(KEY_SHELVES, JSON.stringify(shelves));
    } catch (e) {
      console.warn('Could not save shelves to localStorage:', e);
    }
    this.scheduleCloudSync();
  }

  static addShelf(shelf: Omit<Shelf, 'id' | 'order'>): Shelf {
    const shelves = this.getShelves();
    const newShelf: Shelf = {
      ...shelf,
      id: 'shelf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      order: shelves.length,
    };
    shelves.push(newShelf);
    this.saveShelves(shelves);
    return newShelf;
  }

  static updateShelf(id: string, updates: Partial<Shelf>): void {
    const shelves = this.getShelves().map((s) => (s.id === id ? { ...s, ...updates } : s));
    this.saveShelves(shelves);
  }

  static deleteShelf(id: string): void {
    const shelves = this.getShelves().filter((s) => s.id !== id);
    this.saveShelves(shelves);
    // Move books on this shelf to reading or unassigned
    const books = this.getBooksMetadata();
    const updatedBooks = books.map((b) => (b.shelfId === id ? { ...b, shelfId: 'shelf-reading' } : b));
    this.saveBooksMetadata(updatedBooks);
  }

  // --- BOOKS (METADATA & FULL OBJECT WITH CHAPTERS) ---
  static getBooksMetadata(): Book[] {
    if (cachedBooksMeta && cachedBooksMeta.length > 0) {
      return cachedBooksMeta;
    }

    try {
      const raw = localStorage.getItem(KEY_BOOKS_META);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedBooksMeta = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Initialize default books
    const initialMeta = INITIAL_BOOKS.map((b) => {
      const { chapters: _, ...meta } = b;
      return meta as Book;
    });
    cachedBooksMeta = initialMeta;
    try {
      localStorage.setItem(KEY_BOOKS_META, JSON.stringify(initialMeta));
    } catch {}

    // Also prime IndexedDB with sample full books
    INITIAL_BOOKS.forEach((book) => {
      this.saveBookToIDB(book).catch(console.error);
    });

    return initialMeta;
  }

  static saveBooksMetadata(books: Book[]): void {
    cachedBooksMeta = books;
    try {
      localStorage.setItem(KEY_BOOKS_META, JSON.stringify(books));
    } catch (e) {
      console.warn('LocalStorage quota reached, caching in memory and relying on IndexedDB:', e);
    }
    this.scheduleCloudSync();
  }

  static async getFullBook(bookId: string): Promise<Book | null> {
    try {
      const db = await getIDB();
      return new Promise((resolve) => {
        const tx = db.transaction('books', 'readonly');
        const store = tx.objectStore('books');
        const req = store.get(bookId);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            // Check sample books fallback
            const sample = INITIAL_BOOKS.find((b) => b.id === bookId);
            resolve(sample || null);
          }
        };
        req.onerror = () => {
          const sample = INITIAL_BOOKS.find((b) => b.id === bookId);
          resolve(sample || null);
        };
      });
    } catch {
      const sample = INITIAL_BOOKS.find((b) => b.id === bookId);
      return sample || null;
    }
  }

  static async saveBook(book: Book): Promise<void> {
    // 1. Save full book in IndexedDB
    await this.saveBookToIDB(book);

    // 2. Save metadata in localStorage for instant rendering without async lag
    const books = this.getBooksMetadata();
    const { chapters: _, ...meta } = book;
    const existingIndex = books.findIndex((b) => b.id === book.id);
    if (existingIndex >= 0) {
      books[existingIndex] = { ...books[existingIndex], ...meta };
    } else {
      books.unshift(meta as Book);
    }
    this.saveBooksMetadata(books);
    this.scheduleCloudSync();
  }

  private static async saveBookToIDB(book: Book): Promise<void> {
    try {
      const db = await getIDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        const req = store.put(book);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not save full book to IndexedDB:', e);
    }
  }

  static async deleteBook(bookId: string): Promise<void> {
    // Remove metadata
    const books = this.getBooksMetadata().filter((b) => b.id !== bookId);
    this.saveBooksMetadata(books);

    // Remove from IDB
    try {
      const db = await getIDB();
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').delete(bookId);
    } catch (e) {
      console.error(e);
    }

    // Clean up associated highlights and bookmarks
    const highlights = this.getHighlights().filter((h) => h.bookId !== bookId);
    this.saveHighlights(highlights);

    const bookmarks = this.getBookmarks().filter((b) => b.bookId !== bookId);
    this.saveBookmarks(bookmarks);

    this.scheduleCloudSync();
  }

  static updateReadingProgress(
    bookId: string,
    chapterIndex: number,
    progressPercent: number,
    cfi?: string,
    scrollPosition?: number
  ): void {
    const books = this.getBooksMetadata();
    const target = books.find((b) => b.id === bookId);
    if (target) {
      target.currentChapterIndex = chapterIndex;
      target.progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));
      target.lastReadAt = new Date().toISOString();
      if (cfi) target.currentCfi = cfi;
      if (scrollPosition !== undefined) target.scrollPosition = scrollPosition;

      // Auto update shelf to 'Leyendo Actualmente' if progress started and not finished
      if (target.progressPercent > 0 && target.progressPercent < 100 && target.shelfId === 'shelf-toread') {
        target.shelfId = 'shelf-reading';
      }

      this.saveBooksMetadata(books);

      // Also update in IndexedDB
      this.getFullBook(bookId).then((fullBook) => {
        if (fullBook) {
          fullBook.currentChapterIndex = chapterIndex;
          fullBook.progressPercent = target.progressPercent;
          fullBook.lastReadAt = target.lastReadAt;
          if (cfi) fullBook.currentCfi = cfi;
          if (scrollPosition !== undefined) fullBook.scrollPosition = scrollPosition;
          this.saveBookToIDB(fullBook);
        }
      });
    }
  }

  static updateBookRating(bookId: string, rating: number): void {
    const safeRating = Math.max(0, Math.min(5, rating));
    const books = this.getBooksMetadata();
    const target = books.find((b) => b.id === bookId);
    if (target) {
      target.rating = safeRating;
      this.saveBooksMetadata(books);

      this.getFullBook(bookId).then((fullBook) => {
        if (fullBook) {
          fullBook.rating = safeRating;
          this.saveBookToIDB(fullBook);
        }
      });
    }
  }

  // --- HIGHLIGHTS & ANNOTATIONS ---
  static getHighlights(): Highlight[] {
    try {
      const raw = localStorage.getItem(KEY_HIGHLIGHTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(KEY_HIGHLIGHTS, JSON.stringify(INITIAL_HIGHLIGHTS));
    return INITIAL_HIGHLIGHTS;
  }

  static saveHighlights(highlights: Highlight[]): void {
    localStorage.setItem(KEY_HIGHLIGHTS, JSON.stringify(highlights));
    this.scheduleCloudSync();
  }

  static addHighlight(highlight: Omit<Highlight, 'id' | 'createdAt'>): Highlight {
    const highlights = this.getHighlights();
    const newHighlight: Highlight = {
      ...highlight,
      id: 'hl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    highlights.unshift(newHighlight);
    this.saveHighlights(highlights);
    return newHighlight;
  }

  static updateHighlightNote(id: string, note?: string): void {
    const highlights = this.getHighlights().map((h) => (h.id === id ? { ...h, note: note || undefined } : h));
    this.saveHighlights(highlights);
  }

  static updateHighlight(id: string, updates: Partial<Highlight>): void {
    const highlights = this.getHighlights().map((h) => (h.id === id ? { ...h, ...updates } : h));
    this.saveHighlights(highlights);
  }

  static deleteHighlight(id: string): void {
    const highlights = this.getHighlights().filter((h) => h.id !== id);
    this.saveHighlights(highlights);
  }

  // --- BOOKMARKS ---
  static getBookmarks(): Bookmark[] {
    try {
      const raw = localStorage.getItem(KEY_BOOKMARKS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(INITIAL_BOOKMARKS));
    return INITIAL_BOOKMARKS;
  }

  static saveBookmarks(bookmarks: Bookmark[]): void {
    localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(bookmarks));
    this.scheduleCloudSync();
  }

  static addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const bookmarks = this.getBookmarks();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: 'bm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    bookmarks.unshift(newBookmark);
    this.saveBookmarks(bookmarks);
    return newBookmark;
  }

  static deleteBookmark(id: string): void {
    const bookmarks = this.getBookmarks().filter((b) => b.id !== id);
    this.saveBookmarks(bookmarks);
  }

  // --- CLOUD SYNC ENGINE ---
  static getLastSyncTime(): string {
    return localStorage.getItem(KEY_LAST_SYNC) || new Date().toISOString();
  }

  private static syncTimeout: NodeJS.Timeout | null = null;
  static scheduleCloudSync(): void {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncWithCloud().catch(() => {
        // Silent sync fallback
      });
    }, 2000);
  }

  static async syncWithCloud(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Usuario no conectado', timestamp: new Date().toISOString() };

    const payload: AppSyncData = {
      version: 1,
      timestamp: new Date().toISOString(),
      books: this.getBooksMetadata(),
      shelves: this.getShelves(),
      highlights: this.getHighlights(),
      bookmarks: this.getBookmarks(),
      settings: this.getSettings(),
    };

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const now = new Date().toISOString();
        localStorage.setItem(KEY_LAST_SYNC, now);
        return { success: true, message: 'Sincronizado correctamente con la nube', timestamp: now };
      }
    } catch {
      // Offline fallback: saved locally
    }

    const localTimestamp = new Date().toISOString();
    localStorage.setItem(KEY_LAST_SYNC, localTimestamp);
    return { success: true, message: 'Guardado localmente (Offline)', timestamp: localTimestamp };
  }

  // --- EXPORT & BACKUP ---
  static exportFullBackup(): string {
    const data: AppSyncData = {
      version: 1,
      timestamp: new Date().toISOString(),
      books: this.getBooksMetadata(),
      shelves: this.getShelves(),
      highlights: this.getHighlights(),
      bookmarks: this.getBookmarks(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importFullBackup(jsonStr: string): boolean {
    try {
      const data: AppSyncData = JSON.parse(jsonStr);
      if (data.books) this.saveBooksMetadata(data.books);
      if (data.shelves) this.saveShelves(data.shelves);
      if (data.highlights) this.saveHighlights(data.highlights);
      if (data.bookmarks) this.saveBookmarks(data.bookmarks);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Backup import error:', e);
      return false;
    }
  }
}
