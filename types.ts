export type ThemeMode = 'light' | 'sepia' | 'dark';
export type FontFamily = 'literata' | 'merriweather' | 'playfair' | 'jakarta' | 'mono';
export type HighlightColor = string; // Supports standard preset IDs (yellow, purple, green, pink, blue, orange, red, teal, lime, lavender, amber, fuchsia) or custom hex (#aabbcc)

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  href: string;
  content: string; // HTML content
  order: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
  language?: string;
  totalChapters: number;
  currentChapterIndex: number;
  progressPercent: number; // 0 to 100
  rating?: number; // 0 to 5 stars (e.g. 1, 2, 3, 4, 5)
  currentCfi?: string;
  scrollPosition?: number;
  totalReadingTimeMinutes: number;
  lastReadAt?: string;
  addedAt: string;
  shelfId: string; // 'default' or custom shelf id
  tags: string[];
  fileSizeFormatted?: string;
  isSample?: boolean;
  chapters?: Chapter[];
  epubDataUrl?: string; // base64 or object URL for reader
}

export interface Shelf {
  id: string;
  name: string;
  description?: string;
  color: string; // hex or tailwind class
  icon: string; // lucide icon name
  order: number;
  isDefault?: boolean;
}

export interface Highlight {
  id: string;
  bookId: string;
  bookTitle?: string;
  chapterIndex: number;
  chapterTitle: string;
  text: string;
  note?: string;
  color: HighlightColor;
  createdAt: string;
  cfiRange?: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  bookTitle?: string;
  chapterIndex: number;
  chapterTitle: string;
  percentage: number;
  previewText: string;
  createdAt: string;
}

export interface ReadingSettings {
  fontSize: number; // 14 to 32
  fontFamily: FontFamily;
  theme: ThemeMode;
  lineHeight: number; // 1.4, 1.6, 1.8, 2.0
  marginWidth: 'compact' | 'normal' | 'wide';
  textAlign: 'left' | 'justify';
  brightness: number; // 50 to 100
  soundEffects: boolean;
  autoScroll: boolean;
}

export interface AppSyncData {
  version: number;
  timestamp: string;
  books: Book[];
  shelves: Shelf[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  settings: ReadingSettings;
}
