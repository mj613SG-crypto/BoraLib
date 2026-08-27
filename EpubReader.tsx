import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Book, Chapter, ReadingSettings, Highlight, Bookmark, HighlightColor } from '../types';
import { HIGHLIGHT_PRESETS, getHighlightStyle } from '../highlightColors';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark as BookmarkIcon,
  List,
  Type,
  Sun,
  Moon,
  Palette,
  Volume2,
  VolumeX,
  Search,
  Highlighter,
  MessageSquarePlus,
  MessageSquare,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  Sliders,
  AlignLeft,
  AlignJustify,
  Maximize,
  Minimize,
  ChevronDown,
  Trash2,
  Edit3,
  Save,
  ExternalLink,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EpubReaderProps {
  book: Book;
  settings: ReadingSettings;
  highlights: Highlight[];
  bookmarks: Bookmark[];
  onSaveSettings: (settings: ReadingSettings) => void;
  onUpdateProgress: (chapterIndex: number, progressPercent: number, cfi?: string) => void;
  onAddHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void;
  onUpdateHighlightNote?: (id: string, note?: string) => void;
  onUpdateHighlight?: (id: string, updates: Partial<Highlight>) => void;
  onDeleteHighlight?: (id: string) => void;
  onAddBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  onCloseReader: () => void;
}

export const EpubReader: React.FC<EpubReaderProps> = ({
  book,
  settings,
  highlights,
  bookmarks,
  onSaveSettings,
  onUpdateProgress,
  onAddHighlight,
  onUpdateHighlightNote,
  onUpdateHighlight,
  onDeleteHighlight,
  onAddBookmark,
  onCloseReader,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(book.currentChapterIndex || 0);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showTocDrawer, setShowTocDrawer] = useState(false);
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchInBookQuery, setSearchInBookQuery] = useState('');
  
  // Highlights drawer filters
  const [highlightsDrawerFilter, setHighlightsDrawerFilter] = useState<'all' | 'chapter' | 'with_notes'>('all');
  const [highlightsDrawerSearch, setHighlightsDrawerSearch] = useState('');
  const [highlightsDrawerColor, setHighlightsDrawerColor] = useState<string>('all');

  // Interactive Highlight Detail Modal (on clicking/tapping highlighted text)
  const [activeDetailHighlight, setActiveDetailHighlight] = useState<Highlight | null>(null);
  const [isEditingNoteInModal, setIsEditingNoteInModal] = useState(false);
  const [modalNoteValue, setModalNoteValue] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Selection & Floating Toolbar State
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteInputValue, setNoteInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('purple');
  const [customHexColor, setCustomHexColor] = useState('#c084fc');
  const [showFullPalette, setShowFullPalette] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Text to Speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  const chapters = book.chapters || [];
  const currentChapter = chapters[currentChapterIndex] || {
    id: 'chap-0',
    title: 'Capítulo 1',
    href: '',
    content: '<p>Cargando capítulo...</p>',
    order: 0,
  };

  // Highlights for current book and chapter
  const bookHighlights = useMemo(() => {
    return highlights.filter((h) => h.bookId === book.id);
  }, [highlights, book.id]);

  const chapterHighlights = useMemo(() => {
    return highlights.filter((h) => h.bookId === book.id && h.chapterIndex === currentChapterIndex);
  }, [highlights, book.id, currentChapterIndex]);

  const bookHighlightsWithNotes = useMemo(() => {
    return bookHighlights.filter((h) => h.note && h.note.trim().length > 0);
  }, [bookHighlights]);

  // Keep modal active highlight synced with state changes
  useEffect(() => {
    if (activeDetailHighlight) {
      const refreshed = highlights.find((h) => h.id === activeDetailHighlight.id);
      if (refreshed) {
        setActiveDetailHighlight(refreshed);
      } else {
        setActiveDetailHighlight(null);
      }
    }
  }, [highlights]);

  // Trigger brief feedback toast
  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2400);
  };

  // Filtered highlights inside reader Highlights Drawer
  const filteredDrawerHighlights = useMemo(() => {
    return bookHighlights.filter((h) => {
      // Chapter or notes filter
      if (highlightsDrawerFilter === 'chapter' && h.chapterIndex !== currentChapterIndex) return false;
      if (highlightsDrawerFilter === 'with_notes' && (!h.note || !h.note.trim())) return false;

      // Color filter
      if (highlightsDrawerColor !== 'all' && h.color !== highlightsDrawerColor) return false;

      // Search query
      if (highlightsDrawerSearch.trim()) {
        const q = highlightsDrawerSearch.toLowerCase();
        const matchesText = h.text.toLowerCase().includes(q);
        const matchesNote = h.note ? h.note.toLowerCase().includes(q) : false;
        const matchesChapter = h.chapterTitle ? h.chapterTitle.toLowerCase().includes(q) : false;
        return matchesText || matchesNote || matchesChapter;
      }

      return true;
    });
  }, [bookHighlights, highlightsDrawerFilter, currentChapterIndex, highlightsDrawerColor, highlightsDrawerSearch]);

  // Annotated chapter HTML content with visually striking, interactive highlights
  const annotatedChapterContent = useMemo(() => {
    if (!currentChapter?.content) return '';
    if (chapterHighlights.length === 0) return currentChapter.content;

    let content = currentChapter.content;
    // Sort from longest text to shortest to prevent nested substring collision
    const sorted = [...chapterHighlights].sort((a, b) => b.text.length - a.text.length);

    sorted.forEach((hl) => {
      if (!hl.text || hl.text.trim().length < 2) return;
      const style = getHighlightStyle(hl.color);
      // Normalize whitespace for resilient regex matching in HTML bodies
      const escaped = hl.text
        .trim()
        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        .replace(/\s+/g, '\\s+');
      try {
        const regex = new RegExp(`(?![^<]*>)(${escaped})`, 'gi');
        content = content.replace(
          regex,
          `<mark class="reader-highlight-mark ${hl.note ? 'has-note' : ''}" data-highlight-id="${hl.id}" style="background-color: ${style.bgRgba}; border-bottom: 3px solid ${style.borderHex}; color: inherit;" title="${hl.note ? `Nota: ${hl.note.replace(/"/g, '&quot;')}` : `Subrayado (${style.name})`} [Toca para ver nota o gestionar]">$1</mark>`
        );
      } catch {
        // Fallback gracefully without regex error
      }
    });

    return content;
  }, [currentChapter, chapterHighlights]);

  // Check if current chapter is bookmarked
  const isCurrentChapterBookmarked = useMemo(() => {
    return bookmarks.some((b) => b.bookId === book.id && b.chapterIndex === currentChapterIndex);
  }, [bookmarks, book.id, currentChapterIndex]);

  // Auto-save progress whenever chapter changes
  useEffect(() => {
    if (chapters.length > 0) {
      const calculatedPercent = Math.round(((currentChapterIndex + 1) / chapters.length) * 100);
      onUpdateProgress(currentChapterIndex, calculatedPercent);

      // Trigger celebratory confetti if reaching 100%
      if (calculatedPercent === 100) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9333ea', '#c084fc', '#fbbf24', '#38bdf8'],
        });
      }
    }
  }, [currentChapterIndex, chapters.length]);

  // Handle scroll position reset on chapter change
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentChapterIndex]);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    // Extract text from current chapter
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentChapter.content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    if (!plainText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(plainText.substring(0, 3000));
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
  };

  // Text selection handler
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (!showNoteInput) {
        setToolbarPos(null);
        setSelectedText('');
      }
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 2) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position floating toolbar right above selection
      setToolbarPos({
        x: Math.max(10, Math.min(window.innerWidth - 280, rect.left + rect.width / 2 - 140)),
        y: Math.max(10, rect.top - 54),
      });
    }
  };

  const handleApplyHighlight = (color: HighlightColor) => {
    if (!selectedText) return;

    onAddHighlight({
      bookId: book.id,
      bookTitle: book.title,
      chapterIndex: currentChapterIndex,
      chapterTitle: currentChapter.title,
      text: selectedText,
      note: noteInputValue.trim() || undefined,
      color,
    });

    triggerToast('Texto subrayado correctamente');

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setToolbarPos(null);
    setSelectedText('');
    setShowNoteInput(false);
    setNoteInputValue('');
  };

  // Content Canvas Click Handler (Detects clicks on Highlighted <mark> tags vs background)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const markEl = target.closest('mark[data-highlight-id]');

    if (markEl) {
      e.preventDefault();
      e.stopPropagation();
      const id = markEl.getAttribute('data-highlight-id');
      const found = highlights.find((h) => h.id === id);
      if (found) {
        setActiveDetailHighlight(found);
        setModalNoteValue(found.note || '');
        setIsEditingNoteInModal(false);
      }
      return;
    }

    // Toggle top/bottom bars when tapping neutral body
    if (target.tagName !== 'BUTTON' && !window.getSelection()?.toString()) {
      const clickY = e.clientY;
      if (clickY > 90 && clickY < window.innerHeight - 90) {
        setShowControls((prev) => !prev);
      }
    }
  };

  // Save or update note from active modal
  const handleSaveModalNote = () => {
    if (!activeDetailHighlight) return;
    const updatedNote = modalNoteValue.trim();
    if (onUpdateHighlightNote) {
      onUpdateHighlightNote(activeDetailHighlight.id, updatedNote || undefined);
    }
    setIsEditingNoteInModal(false);
    triggerToast(updatedNote ? 'Nota guardada' : 'Nota eliminada');
  };

  // Delete only the attached note
  const handleDeleteModalNoteOnly = (highlightId: string) => {
    if (onUpdateHighlightNote) {
      onUpdateHighlightNote(highlightId, undefined);
    }
    setModalNoteValue('');
    setIsEditingNoteInModal(false);
    triggerToast('Nota eliminada (el subrayado se mantiene)');
  };

  // Delete the highlight completely
  const handleDeleteHighlightFull = (highlightId: string) => {
    if (onDeleteHighlight) {
      onDeleteHighlight(highlightId);
    }
    if (activeDetailHighlight?.id === highlightId) {
      setActiveDetailHighlight(null);
    }
    triggerToast('Subrayado eliminado');
  };

  // Change color of highlight
  const handleChangeHighlightColor = (highlightId: string, newColor: HighlightColor) => {
    if (onUpdateHighlight) {
      onUpdateHighlight(highlightId, { color: newColor });
    }
    triggerToast('Color de subrayado actualizado');
  };

  const handleAddBookmarkClick = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentChapter.content;
    const preview = (tempDiv.textContent || '').substring(0, 80).trim();

    onAddBookmark({
      bookId: book.id,
      bookTitle: book.title,
      chapterIndex: currentChapterIndex,
      chapterTitle: currentChapter.title,
      percentage: Math.round(((currentChapterIndex + 1) / Math.max(chapters.length, 1)) * 100),
      previewText: preview ? `...${preview}...` : 'Capítulo marcado',
    });
    triggerToast('Marcador guardado');
  };

  const handleCopySelection = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopiedSuccess(true);
      setTimeout(() => {
        setCopiedSuccess(false);
        setToolbarPos(null);
      }, 1200);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Compute theme CSS class
  const themeClass =
    settings.theme === 'light'
      ? 'reader-theme-light'
      : settings.theme === 'sepia'
      ? 'reader-theme-sepia'
      : 'reader-theme-dark';

  // Compute font family class
  const fontClass =
    settings.fontFamily === 'literata'
      ? 'font-literata'
      : settings.fontFamily === 'merriweather'
      ? 'font-merriweather'
      : settings.fontFamily === 'playfair'
      ? 'font-playfair'
      : settings.fontFamily === 'jakarta'
      ? 'font-jakarta'
      : 'font-mono-reader';

  // Margin container width
  const marginWidthClass =
    settings.marginWidth === 'compact'
      ? 'max-w-xl'
      : settings.marginWidth === 'wide'
      ? 'max-w-4xl'
      : 'max-w-2xl';

  return (
    <div
      id="epub-reader-container"
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col transition-colors duration-300 ${themeClass}`}
    >
      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1c1130] text-purple-200 border border-purple-500/50 px-4 py-2 rounded-2xl text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-150 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 1. Top Floating Control Bar */}
      {showControls && (
        <header
          id="reader-top-bar"
          className="sticky top-0 z-40 px-3 sm:px-6 py-2.5 pt-[calc(0.65rem+env(safe-area-inset-top,0px))] flex items-center justify-between border-b backdrop-blur-md transition-all shadow-md reader-border bg-[#140d21]/90 text-purple-100 border-[#291842]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="reader-back-btn"
              onClick={onCloseReader}
              title="Volver a la Biblioteca"
              className="p-2 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 hover:text-white transition flex items-center gap-1 text-xs font-semibold border border-[#352055]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Biblioteca</span>
            </button>

            <div className="min-w-0 ml-1">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-xs">
                {book.title}
              </h2>
              <p className="text-[10px] text-purple-300/80 truncate">
                {currentChapter.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Table of Contents button */}
            <button
              id="reader-toc-btn"
              onClick={() => setShowTocDrawer(true)}
              title="Índice de Capítulos"
              className="p-2 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 border border-[#352055] transition flex items-center gap-1.5"
            >
              <List className="w-4 h-4 text-purple-300" />
              <span className="text-[11px] font-semibold hidden md:inline">Índice</span>
            </button>

            {/* Dedicated Highlights & Notes Drawer Button (Next to TOC) */}
            <button
              id="reader-notes-drawer-btn"
              onClick={() => setShowHighlightsDrawer(true)}
              title="Subrayados y Notas del Libro"
              className="p-2 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 border border-[#352055] transition relative flex items-center gap-1.5"
            >
              <Highlighter className="w-4 h-4 text-purple-300" />
              <span className="text-[11px] font-semibold hidden md:inline">Notas</span>
              {bookHighlights.length > 0 && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#140d21] shadow leading-none">
                  {bookHighlights.length}
                </span>
              )}
            </button>

            {/* Bookmark button */}
            <button
              id="reader-bookmark-btn"
              onClick={handleAddBookmarkClick}
              title={isCurrentChapterBookmarked ? 'Capítulo marcado' : 'Añadir marcador'}
              className={`p-2 rounded-xl transition ${
                isCurrentChapterBookmarked
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#1e1332] hover:bg-[#281943] text-purple-200 border border-[#352055]'
              }`}
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>

            {/* Text to Speech Button */}
            <button
              id="reader-tts-btn"
              onClick={toggleSpeech}
              title={isSpeaking ? 'Detener lectura' : 'Leer en voz alta (TTS)'}
              className={`p-2 rounded-xl transition ${
                isSpeaking
                  ? 'bg-fuchsia-600 text-white animate-pulse shadow-md'
                  : 'bg-[#1e1332] hover:bg-[#281943] text-purple-200 border border-[#352055]'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Reader Settings Button */}
            <button
              id="reader-settings-btn"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              title="Ajustes de Lectura (Letra, Tema)"
              className="p-2 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 border border-[#352055] transition"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title="Pantalla completa"
              className="p-2 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 border border-[#352055] transition hidden sm:inline-block"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* 2. Main Reader Scrollable Canvas */}
      <main
        ref={contentContainerRef}
        id="reader-content-canvas"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        onClick={handleCanvasClick}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 selection:bg-purple-400/40 relative select-text cursor-default"
      >
        <div className={`mx-auto ${marginWidthClass} ${fontClass} leading-relaxed transition-all pb-24`}>
          {/* Chapter Title Badge */}
          <div className="mb-8 text-center pb-4 border-b border-purple-500/20">
            <span className="text-[11px] uppercase tracking-widest font-bold text-purple-400">
              {book.title}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 font-jakarta">
              {currentChapter.title}
            </h1>
            <span className="text-xs text-purple-300/60 mt-1 block">
              Capítulo {currentChapterIndex + 1} de {chapters.length || 1}
            </span>
          </div>

          {/* Chapter Rendered HTML Body */}
          <div
            id="chapter-rendered-html"
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              textAlign: settings.textAlign,
            }}
            className="prose prose-purple max-w-none space-y-4 font-normal"
            dangerouslySetInnerHTML={{ __html: annotatedChapterContent }}
          />

          {/* Active Chapter Highlights Quick Summary at bottom */}
          {chapterHighlights.length > 0 && (
            <div className="mt-12 pt-6 border-t border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Highlighter className="w-3.5 h-3.5" /> Subrayados en este capítulo ({chapterHighlights.length})
                </h4>
                <button
                  onClick={() => {
                    setHighlightsDrawerFilter('chapter');
                    setShowHighlightsDrawer(true);
                  }}
                  className="text-xs text-purple-300 hover:text-white font-medium underline flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid gap-2">
                {chapterHighlights.map((h) => {
                  const style = getHighlightStyle(h.color);
                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        setActiveDetailHighlight(h);
                        setModalNoteValue(h.note || '');
                        setIsEditingNoteInModal(false);
                      }}
                      className="p-3 rounded-2xl bg-[#140d21] border border-[#2d1b4b] text-xs flex items-start gap-2.5 shadow-sm hover:border-purple-500/60 cursor-pointer transition"
                      style={{ borderLeftColor: style.borderHex, borderLeftWidth: '4px' }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 border"
                        style={{ backgroundColor: style.hex, borderColor: style.borderHex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="italic font-serif text-purple-100/90 line-clamp-2">"{h.text}"</p>
                        {h.note && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-[#1c122e] border border-[#352055] text-purple-200">
                            <span className="text-[10px] font-bold text-purple-400 block uppercase">Nota:</span>
                            <span className="font-sans text-xs">{h.note}</span>
                          </div>
                        )}
                        <span className="text-[9px] text-purple-400/70 mt-1 block">
                          Color: {style.name} · Toca para ver nota o eliminar
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chapter Navigation Buttons inside text */}
          <div className="mt-14 pt-8 border-t border-purple-500/20 flex items-center justify-between gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentChapterIndex > 0) setCurrentChapterIndex((c) => c - 1);
              }}
              disabled={currentChapterIndex === 0}
              className="px-4 py-2.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 disabled:opacity-30 border border-purple-700/40 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Capítulo Anterior
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentChapterIndex < chapters.length - 1) setCurrentChapterIndex((c) => c + 1);
              }}
              disabled={currentChapterIndex >= chapters.length - 1}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/50 transition"
            >
              Siguiente Capítulo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* 3. Floating Text Selection Toolbar (When selecting new text) */}
      {toolbarPos && selectedText && (
        <div
          id="reader-selection-toolbar"
          style={{ top: `${toolbarPos.y}px`, left: `${toolbarPos.x}px` }}
          className="fixed z-50 bg-[#140d21]/95 border border-[#352055] text-white rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 max-w-[360px]"
        >
          {showNoteInput ? (
            <div className="space-y-2.5 p-1">
              <span className="text-[11px] font-bold text-purple-300">Añadir nota al subrayado:</span>
              <input
                type="text"
                value={noteInputValue}
                onChange={(e) => setNoteInputValue(e.target.value)}
                placeholder="Escribe tu reflexión o comentario..."
                autoFocus
                className="w-full bg-[#0c0814] border border-[#291842] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-purple-400 focus:outline-none"
              />
              
              {/* Color selection for note */}
              <div>
                <span className="text-[10px] text-purple-400 block mb-1">Color del subrayado:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HIGHLIGHT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedColor(p.id)}
                      title={p.name}
                      style={{ backgroundColor: p.hex, borderColor: p.borderHex }}
                      className={`w-5 h-5 rounded-full border shadow-sm transition ${
                        selectedColor === p.id ? 'ring-2 ring-white scale-125' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                  {/* Custom color input in note dialog */}
                  <label
                    title="Color personalizado"
                    className="relative w-5 h-5 rounded-full border border-purple-400/80 cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 hover:scale-110 transition"
                  >
                    <input
                      type="color"
                      value={customHexColor}
                      onChange={(e) => {
                        setCustomHexColor(e.target.value);
                        setSelectedColor(e.target.value);
                      }}
                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="px-2.5 py-1 rounded-lg bg-[#1e1332] text-[10px] text-purple-200 hover:text-white"
                >
                  Atrás
                </button>
                <button
                  onClick={() => handleApplyHighlight(selectedColor)}
                  className="px-3.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white shadow"
                >
                  Guardar Subrayado
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                {/* Main 6 Quick Highlight Presets */}
                <div className="flex items-center gap-1 px-1 border-r border-[#291842] pr-2">
                  {HIGHLIGHT_PRESETS.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyHighlight(p.id)}
                      title={`Subrayar en ${p.name}`}
                      style={{ backgroundColor: p.hex, borderColor: p.borderHex }}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border shadow-sm transform hover:scale-125 transition active:scale-95"
                    />
                  ))}
                  
                  {/* Toggle more colors / custom picker button */}
                  <button
                    onClick={() => setShowFullPalette((prev) => !prev)}
                    title="Más colores de subrayado y selector personalizado"
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center transition ${
                      showFullPalette
                        ? 'bg-purple-600 border-purple-300 text-white'
                        : 'bg-[#221338] border-purple-500/50 text-purple-300 hover:text-white'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                  </button>

                  {/* HTML5 Native Color Picker for 100% Free Choice */}
                  <label
                    title="Elegir cualquier color personalizado"
                    className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-purple-300/80 cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 hover:scale-125 transition shadow-sm"
                  >
                    <input
                      type="color"
                      value={customHexColor}
                      onChange={(e) => {
                        const hex = e.target.value;
                        setCustomHexColor(hex);
                        handleApplyHighlight(hex);
                      }}
                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                    <Sparkles className="w-2.5 h-2.5 text-white drop-shadow pointer-events-none" />
                  </label>
                </div>

                {/* Add Note Button */}
                <button
                  onClick={() => setShowNoteInput(true)}
                  title="Añadir Nota"
                  className="p-1.5 rounded-xl hover:bg-[#1e1332] text-purple-200 hover:text-white transition flex items-center gap-1 text-[11px]"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                </button>

                {/* Copy Button */}
                <button
                  onClick={handleCopySelection}
                  title="Copiar texto"
                  className="p-1.5 rounded-xl hover:bg-[#1e1332] text-purple-200 hover:text-white transition"
                >
                  {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Palette Row (remaining presets) */}
              {showFullPalette && (
                <div className="pt-1.5 border-t border-[#291842] flex items-center justify-between gap-1 animate-in fade-in">
                  <div className="flex items-center gap-1">
                    {HIGHLIGHT_PRESETS.slice(6).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleApplyHighlight(p.id)}
                        title={`Subrayar en ${p.name}`}
                        style={{ backgroundColor: p.hex, borderColor: p.borderHex }}
                        className="w-5 h-5 rounded-full border shadow-sm transform hover:scale-125 transition active:scale-95"
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-purple-400/80 font-medium">12 tonos + selector</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Bottom Floating Navigation & Progress Bar */}
      {showControls && (
        <footer
          id="reader-bottom-bar"
          className="sticky bottom-0 z-40 px-4 sm:px-8 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t backdrop-blur-md transition-all shadow-[0_-8px_20px_rgba(0,0,0,0.4)] reader-border bg-[#140d21]/90 text-purple-100 border-[#291842]"
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {/* Progress Slider */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (currentChapterIndex > 0) setCurrentChapterIndex((c) => c - 1);
                }}
                disabled={currentChapterIndex === 0}
                className="p-1 text-purple-300 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <input
                id="reader-progress-slider"
                type="range"
                min="0"
                max={Math.max(chapters.length - 1, 1)}
                value={currentChapterIndex}
                onChange={(e) => setCurrentChapterIndex(Number(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer"
              />

              <button
                onClick={() => {
                  if (currentChapterIndex < chapters.length - 1) setCurrentChapterIndex((c) => c + 1);
                }}
                disabled={currentChapterIndex >= chapters.length - 1}
                className="p-1 text-purple-300 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Chapter info & percentage */}
            <div className="flex justify-between items-center text-[11px] text-purple-300 font-medium">
              <span className="truncate max-w-[200px]">{currentChapter.title}</span>
              <span className="font-bold text-white">
                {Math.round(((currentChapterIndex + 1) / Math.max(chapters.length, 1)) * 100)}%
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* 5. Reader Settings Bottom Sheet */}
      {showSettingsDrawer && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSettingsDrawer(false)}
          />
          <div
            id="reader-settings-sheet"
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-[#140d21] border-t sm:border border-[#352055] sm:rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 text-purple-100 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#291842]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" /> Preferencias de Lectura
              </h3>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 rounded-lg text-purple-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes: Claro, Sepia, Oscuro */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-300">Modo de Fondo:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSaveSettings({ ...settings, theme: 'light' })}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                    settings.theme === 'light'
                      ? 'bg-white text-slate-900 border-purple-400 shadow'
                      : 'bg-white/10 text-purple-200 border-[#291842]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Claro
                </button>
                <button
                  onClick={() => onSaveSettings({ ...settings, theme: 'sepia' })}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                    settings.theme === 'sepia'
                      ? 'bg-[#f7f0df] text-[#3d3023] border-amber-600 shadow'
                      : 'bg-[#f7f0df]/20 text-purple-200 border-[#291842]'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-amber-700" /> Sepia
                </button>
                <button
                  onClick={() => onSaveSettings({ ...settings, theme: 'dark' })}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                    settings.theme === 'dark'
                      ? 'bg-[#0c0814] text-purple-100 border-purple-400 shadow font-bold'
                      : 'bg-[#0c0814]/50 text-purple-300 border-[#291842]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-purple-400" /> Oscuro
                </button>
              </div>
            </div>

            {/* Font Size Stepper */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-purple-300">
                <span>Tamaño de Fuente:</span>
                <span className="font-bold text-white">{settings.fontSize} px</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSaveSettings({ ...settings, fontSize: Math.max(14, settings.fontSize - 2) })}
                  className="w-10 h-10 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-white font-bold text-sm border border-[#352055] flex items-center justify-center"
                >
                  A-
                </button>
                <input
                  type="range"
                  min="14"
                  max="32"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => onSaveSettings({ ...settings, fontSize: Number(e.target.value) })}
                  className="flex-1 accent-purple-500"
                />
                <button
                  onClick={() => onSaveSettings({ ...settings, fontSize: Math.min(32, settings.fontSize + 2) })}
                  className="w-10 h-10 rounded-xl bg-[#1e1332] hover:bg-[#281943] text-white font-bold text-base border border-[#352055] flex items-center justify-center"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-300">Tipografía:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'literata', name: 'Literata (Serif libro)' },
                  { id: 'merriweather', name: 'Merriweather' },
                  { id: 'playfair', name: 'Playfair Display' },
                  { id: 'jakarta', name: 'Plus Jakarta' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onSaveSettings({ ...settings, fontFamily: f.id as any })}
                    className={`px-3 py-2 rounded-xl text-xs text-left border ${
                      settings.fontFamily === f.id
                        ? 'bg-purple-600 text-white border-purple-400 font-bold shadow'
                        : 'bg-[#0c0814] text-purple-300 border-[#291842] hover:bg-[#19102b]'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height & Alignment */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-purple-300 mr-1">Interlineado:</span>
                {[1.4, 1.6, 1.8, 2.0].map((lh) => (
                  <button
                    key={lh}
                    onClick={() => onSaveSettings({ ...settings, lineHeight: lh })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                      settings.lineHeight === lh
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#1e1332] text-purple-300 hover:bg-[#281943]'
                    }`}
                  >
                    {lh}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSaveSettings({ ...settings, textAlign: 'left' })}
                  className={`p-1.5 rounded-lg ${
                    settings.textAlign === 'left' ? 'bg-purple-600 text-white' : 'text-purple-400'
                  }`}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSaveSettings({ ...settings, textAlign: 'justify' })}
                  className={`p-1.5 rounded-lg ${
                    settings.textAlign === 'justify' ? 'bg-purple-600 text-white' : 'text-purple-400'
                  }`}
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 6. Table of Contents Drawer */}
      {showTocDrawer && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowTocDrawer(false)} />
          <div
            id="reader-toc-drawer"
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#140d21] border-r border-[#352055] shadow-2xl p-5 flex flex-col animate-in slide-in-from-left duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[#291842]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <List className="w-4 h-4 text-purple-400" /> Índice de Capítulos
              </h3>
              <button onClick={() => setShowTocDrawer(false)} className="p-1 rounded-lg text-purple-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1.5">
              {chapters.map((chap, idx) => {
                const isActive = currentChapterIndex === idx;
                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      setCurrentChapterIndex(idx);
                      setShowTocDrawer(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl text-xs transition flex items-center justify-between ${
                      isActive
                        ? 'bg-purple-600 text-white font-bold shadow-md'
                        : 'hover:bg-[#1e1332] text-purple-200'
                    }`}
                  >
                    <span className="truncate pr-2">{chap.title}</span>
                    <span className="text-[10px] opacity-70">
                      {Math.round(((idx + 1) / chapters.length) * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 7. Dedicated Highlights & Notes Drawer (Accessible from top bar next to TOC) */}
      {showHighlightsDrawer && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowHighlightsDrawer(false)} />
          <div
            id="reader-highlights-drawer"
            className="fixed inset-y-0 right-0 z-50 w-96 max-w-[90vw] bg-[#140d21] border-l border-[#352055] shadow-2xl p-4 sm:p-5 flex flex-col animate-in slide-in-from-right duration-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#291842]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-900/60 border border-purple-500/30 text-purple-300">
                  <Highlighter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Subrayados y Notas</h3>
                  <p className="text-[10px] text-purple-300/80">{book.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHighlightsDrawer(false)}
                className="p-1.5 rounded-xl text-purple-400 hover:text-white hover:bg-[#1e1332]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="py-3 space-y-2 border-b border-[#291842]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={highlightsDrawerSearch}
                  onChange={(e) => setHighlightsDrawerSearch(e.target.value)}
                  placeholder="Buscar en subrayados y notas..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0c0814] border border-[#291842] text-xs text-purple-100 placeholder-purple-400/60 focus:outline-none focus:border-purple-500"
                />
                {highlightsDrawerSearch && (
                  <button
                    onClick={() => setHighlightsDrawerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[#0c0814] p-1 rounded-xl border border-[#291842]">
                <button
                  onClick={() => setHighlightsDrawerFilter('all')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition text-center ${
                    highlightsDrawerFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Todo ({bookHighlights.length})
                </button>
                <button
                  onClick={() => setHighlightsDrawerFilter('chapter')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition text-center ${
                    highlightsDrawerFilter === 'chapter'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Capítulo ({chapterHighlights.length})
                </button>
                <button
                  onClick={() => setHighlightsDrawerFilter('with_notes')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition text-center ${
                    highlightsDrawerFilter === 'with_notes'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Notas ({bookHighlightsWithNotes.length})
                </button>
              </div>

              {/* Color Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setHighlightsDrawerColor('all')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap border transition ${
                    highlightsDrawerColor === 'all'
                      ? 'bg-purple-700 text-white border-purple-400'
                      : 'bg-[#19102b] text-purple-300 border-[#291842]'
                  }`}
                >
                  Todos
                </button>
                {HIGHLIGHT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setHighlightsDrawerColor(p.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap border flex items-center gap-1 transition ${
                      highlightsDrawerColor === p.id
                        ? 'bg-purple-700 text-white border-purple-400'
                        : 'bg-[#19102b] text-purple-300 border-[#291842]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full border" style={{ backgroundColor: p.hex, borderColor: p.borderHex }} />
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Highlights Cards */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {filteredDrawerHighlights.length === 0 ? (
                <div className="py-12 text-center text-purple-400/70 space-y-2">
                  <Highlighter className="w-8 h-8 mx-auto text-purple-500/40" />
                  <p className="text-xs font-semibold text-purple-200">No hay subrayados aquí</p>
                  <p className="text-[11px] max-w-[220px] mx-auto text-purple-400/80">
                    Selecciona cualquier texto en la lectura para subrayarlo y adjuntar notas.
                  </p>
                </div>
              ) : (
                filteredDrawerHighlights.map((hl) => {
                  const style = getHighlightStyle(hl.color);
                  const isCurrentChapter = hl.chapterIndex === currentChapterIndex;

                  return (
                    <div
                      key={hl.id}
                      className="p-3 rounded-2xl bg-[#180f29] border border-[#301b4c] text-xs space-y-2 relative group hover:border-purple-500/60 transition"
                      style={{ borderLeftColor: style.borderHex, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] text-purple-300">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                            style={{ backgroundColor: style.hex, borderColor: style.borderHex }}
                          />
                          <span className="font-bold truncate text-purple-200">
                            {hl.chapterTitle || `Capítulo ${hl.chapterIndex + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Jump to Chapter Button */}
                          <button
                            onClick={() => {
                              setCurrentChapterIndex(hl.chapterIndex);
                              setShowHighlightsDrawer(false);
                            }}
                            title="Ir a este capítulo"
                            className="px-2 py-0.5 rounded-lg bg-[#25153e] hover:bg-purple-600 text-purple-200 hover:text-white transition text-[9px] font-bold flex items-center gap-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {isCurrentChapter ? 'Actual' : 'Ir'}
                          </button>

                          {/* Open Detail / Edit Modal */}
                          <button
                            onClick={() => {
                              setActiveDetailHighlight(hl);
                              setModalNoteValue(hl.note || '');
                              setIsEditingNoteInModal(false);
                            }}
                            title="Gestionar subrayado y notas"
                            className="p-1 rounded-lg hover:bg-purple-600/40 text-purple-300 hover:text-white transition"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          {/* Delete Highlight Button */}
                          <button
                            onClick={() => handleDeleteHighlightFull(hl.id)}
                            title="Eliminar subrayado"
                            className="p-1 rounded-lg hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Highlighted Quote text */}
                      <blockquote
                        onClick={() => {
                          setActiveDetailHighlight(hl);
                          setModalNoteValue(hl.note || '');
                          setIsEditingNoteInModal(false);
                        }}
                        className="italic font-serif text-purple-100/90 leading-relaxed cursor-pointer p-2 rounded-xl bg-[#11091e]/80 border border-purple-500/10 hover:border-purple-500/40 transition"
                      >
                        "{hl.text}"
                      </blockquote>

                      {/* Attached Note Block */}
                      {hl.note ? (
                        <div className="p-2 rounded-xl bg-[#201235] border border-purple-500/30 text-purple-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-purple-400">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-purple-300" /> Nota:
                            </span>
                            <button
                              onClick={() => handleDeleteModalNoteOnly(hl.id)}
                              title="Eliminar solo la nota"
                              className="text-rose-400 hover:text-rose-300 text-[9px] font-normal"
                            >
                              Borrar nota
                            </button>
                          </div>
                          <p className="font-sans text-xs text-purple-100 whitespace-pre-wrap">{hl.note}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveDetailHighlight(hl);
                            setModalNoteValue('');
                            setIsEditingNoteInModal(true);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-200 flex items-center gap-1 font-semibold"
                        >
                          <MessageSquarePlus className="w-3 h-3" /> + Añadir nota a este subrayado
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* 8. Interactive Highlight Detail & Note Modal (Opened when tapping a highlighted quote in text) */}
      {activeDetailHighlight && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm animate-in fade-in"
            onClick={() => {
              setActiveDetailHighlight(null);
              setIsEditingNoteInModal(false);
            }}
          />
          <div
            id="reader-highlight-detail-modal"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg bg-[#140d21] border border-[#3d2260] rounded-3xl p-5 sm:p-6 shadow-2xl text-purple-100 space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#291842] pb-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const style = getHighlightStyle(activeDetailHighlight.color);
                  return (
                    <span
                      className="w-3.5 h-3.5 rounded-full border shadow-sm"
                      style={{ backgroundColor: style.hex, borderColor: style.borderHex }}
                    />
                  );
                })()}
                <div>
                  <h3 className="text-sm font-bold text-white">Detalle del Subrayado</h3>
                  <span className="text-[10px] text-purple-300/80">
                    {activeDetailHighlight.chapterTitle || `Capítulo ${activeDetailHighlight.chapterIndex + 1}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveDetailHighlight(null);
                  setIsEditingNoteInModal(false);
                }}
                className="p-1.5 rounded-xl text-purple-400 hover:text-white hover:bg-[#1e1332] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Highlighted Quote Text */}
            {(() => {
              const style = getHighlightStyle(activeDetailHighlight.color);
              return (
                <blockquote
                  className="pl-3.5 py-2.5 border-l-4 rounded-r-2xl text-sm font-serif italic text-purple-100 leading-relaxed max-h-36 overflow-y-auto"
                  style={{
                    borderLeftColor: style.borderHex,
                    backgroundColor: style.bgRgba,
                  }}
                >
                  "{activeDetailHighlight.text}"
                </blockquote>
              );
            })()}

            {/* Change Color Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                <span>Color de este subrayado:</span>
                <span className="text-purple-400 font-normal">
                  {getHighlightStyle(activeDetailHighlight.color).name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {HIGHLIGHT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleChangeHighlightColor(activeDetailHighlight.id, p.id)}
                    title={p.name}
                    style={{ backgroundColor: p.hex, borderColor: p.borderHex }}
                    className={`w-6 h-6 rounded-full border shadow-sm transition flex-shrink-0 ${
                      activeDetailHighlight.color === p.id ? 'ring-2 ring-white scale-125' : 'hover:scale-110'
                    }`}
                  />
                ))}
                {/* Custom Color Selector */}
                <label
                  title="Color personalizado"
                  className="relative w-6 h-6 rounded-full border border-purple-400/80 cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 hover:scale-125 transition flex-shrink-0"
                >
                  <input
                    type="color"
                    value={
                      activeDetailHighlight.color.startsWith('#') ? activeDetailHighlight.color : '#c084fc'
                    }
                    onChange={(e) => handleChangeHighlightColor(activeDetailHighlight.id, e.target.value)}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                  <Sparkles className="w-3 h-3 text-white pointer-events-none drop-shadow" />
                </label>
              </div>
            </div>

            {/* Note Section (View, Edit, Add, or Delete Note) */}
            <div className="space-y-2 pt-2 border-t border-[#291842]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Nota adjunta:
                </span>

                {activeDetailHighlight.note && !isEditingNoteInModal && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingNoteInModal(true)}
                      className="text-[11px] text-purple-300 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteModalNoteOnly(activeDetailHighlight.id)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Borrar nota
                    </button>
                  </div>
                )}
              </div>

              {isEditingNoteInModal ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={modalNoteValue}
                    onChange={(e) => setModalNoteValue(e.target.value)}
                    placeholder="Escribe tu reflexión, apunte o resumen..."
                    autoFocus
                    className="w-full bg-[#0c0814] border border-[#352055] rounded-2xl p-3 text-xs text-white placeholder-purple-400/60 focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setModalNoteValue(activeDetailHighlight.note || '');
                        setIsEditingNoteInModal(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#1e1332] text-xs text-purple-200 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveModalNote}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar Nota
                    </button>
                  </div>
                </div>
              ) : activeDetailHighlight.note ? (
                <div className="p-3 rounded-2xl bg-[#1a0f2b] border border-purple-500/20 text-xs text-purple-100 whitespace-pre-wrap leading-relaxed">
                  {activeDetailHighlight.note}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#11091e] border border-dashed border-[#352055] text-center space-y-1.5">
                  <p className="text-xs text-purple-400">Este subrayado no tiene notas adjuntas todavía.</p>
                  <button
                    onClick={() => {
                      setModalNoteValue('');
                      setIsEditingNoteInModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold border border-purple-500/30 inline-flex items-center gap-1.5 transition"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5 text-purple-300" /> + Añadir una Nota
                  </button>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#291842]">
              {/* Delete Highlight Action */}
              <button
                onClick={() => handleDeleteHighlightFull(activeDetailHighlight.id)}
                className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar Subrayado
              </button>

              <button
                onClick={() => {
                  setActiveDetailHighlight(null);
                  setIsEditingNoteInModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition"
              >
                Listo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
