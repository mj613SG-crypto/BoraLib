import React, { useState, useMemo } from 'react';
import { Book, Shelf } from '../types';
import { BookCard } from './';
import { PhysicalBookshelf } from './';
import {
  Search,
  Plus,
  LayoutGrid,
  Library,
  ListFilter,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  BookMarked,
  X,
  Star,
} from 'lucide-react';

interface LibraryViewProps {
  books: Book[];
  shelves: Shelf[];
  onOpenBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onMoveToShelf: (bookId: string, shelfId: string) => void;
  onToggleComplete: (bookId: string) => void;
  onOpenUpload: () => void;
  onUpdateRating?: (bookId: string, rating: number) => void;
}

type ViewMode = 'grid' | 'physical' | 'list';
type SortOption = 'recent' | 'rating' | 'title' | 'progress' | 'author';

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  shelves,
  onOpenBook,
  onDeleteBook,
  onMoveToShelf,
  onToggleComplete,
  onOpenUpload,
  onUpdateRating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShelfFilter, setSelectedShelfFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Find most recently read book
  const continueReadingBook = useMemo(() => {
    const readingBooks = books.filter((b) => b.progressPercent > 0 && b.progressPercent < 100);
    if (readingBooks.length > 0) {
      return readingBooks.sort((a, b) => {
        const timeA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
        const timeB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
        return timeB - timeA;
      })[0];
    }
    return books[0] || null;
  }, [books]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const matchesSearch =
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (selectedShelfFilter === 'all') return true;
        if (selectedShelfFilter === 'reading') return book.progressPercent > 0 && book.progressPercent < 100;
        if (selectedShelfFilter === 'completed') return book.progressPercent >= 100;
        if (selectedShelfFilter === 'unread') return book.progressPercent === 0;

        return book.shelfId === selectedShelfFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        }
        if (sortBy === 'recent') {
          const timeA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
          const timeB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
          return timeB - timeA;
        }
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'progress') return b.progressPercent - a.progressPercent;
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        return 0;
      });
  }, [books, searchQuery, selectedShelfFilter, sortBy]);

  return (
    <div id="library-view-main" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Continue Reading Hero Banner (if any active book) */}
      {continueReadingBook && !searchQuery && (
        <div
          id="continue-reading-banner"
          onClick={() => onOpenBook(continueReadingBook.id)}
          className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-[#210e38]/90 via-[#180a2b]/90 to-[#10061e]/90 border border-purple-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer group hover:border-purple-400/50 transition-all duration-300 backdrop-blur-xl"
        >
          {/* Subtle Ambient Light Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="flex items-center gap-4 relative z-10">
            {/* Book Mini Cover with 3D depth */}
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden shadow-2xl border border-purple-400/30 flex-shrink-0 bg-[#1e1035] book-shadow-3d">
              <img
                src={continueReadingBook.coverUrl}
                alt={continueReadingBook.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Book Info & Continue Button */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-bold tracking-wider uppercase border border-purple-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-300" /> Continuar Lectura
                </span>
                <span className="text-[11px] text-purple-300/80">
                  {continueReadingBook.progressPercent}% completado
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white truncate font-jakarta">
                {continueReadingBook.title}
              </h2>
              <p className="text-xs text-purple-300 truncate mt-0.5">{continueReadingBook.author}</p>

              {/* Progress bar */}
              <div className="w-full bg-[#0c0814]/80 rounded-full h-2 mt-3 overflow-hidden border border-[#2d1a47] max-w-md">
                <div
                  className="bg-gradient-to-r from-purple-500 to-fuchsia-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(continueReadingBook.progressPercent, 5)}%` }}
                />
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="hidden sm:flex items-center">
              <button
                id="continue-read-action-btn"
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/60 border border-purple-400/40 transform group-hover:scale-105 transition"
              >
                <BookOpen className="w-4 h-4" /> Reanudar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & View Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="library-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, autor o etiqueta..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#140d21] border border-[#291842] rounded-2xl text-xs sm:text-sm text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition backdrop-blur-md shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode & Sort Switches */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* View Mode Buttons */}
            <div className="flex items-center bg-[#140d21] p-1 rounded-2xl border border-[#291842] shadow-inner">
              <button
                id="view-grid-btn"
                onClick={() => setViewMode('grid')}
                title="Cuadrícula 3D"
                className={`p-2 rounded-xl transition ${
                  viewMode === 'grid' ? 'bg-[#24143a] text-purple-200 shadow border border-purple-500/30' : 'text-purple-400/70 hover:text-purple-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="view-physical-btn"
                onClick={() => setViewMode('physical')}
                title="Estantería Física 3D"
                className={`p-2 rounded-xl transition ${
                  viewMode === 'physical' ? 'bg-[#24143a] text-purple-200 shadow border border-purple-500/30' : 'text-purple-400/70 hover:text-purple-200'
                }`}
              >
                <Library className="w-4 h-4" />
              </button>
              <button
                id="view-list-btn"
                onClick={() => setViewMode('list')}
                title="Lista Detallada"
                className={`p-2 rounded-xl transition ${
                  viewMode === 'list' ? 'bg-[#24143a] text-purple-200 shadow border border-purple-500/30' : 'text-purple-400/70 hover:text-purple-200'
                }`}
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-[#140d21] px-3 py-2 rounded-2xl border border-[#291842] text-xs text-purple-300 shadow-inner">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <select
                id="library-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-purple-200 focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="recent" className="bg-[#140d21] text-purple-100">Más Recientes</option>
                <option value="rating" className="bg-[#140d21] text-purple-100">Calificación (★ Estrellas)</option>
                <option value="title" className="bg-[#140d21] text-purple-100">Título (A-Z)</option>
                <option value="progress" className="bg-[#140d21] text-purple-100">Progreso (%)</option>
                <option value="author" className="bg-[#140d21] text-purple-100">Autor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shelf & Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedShelfFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedShelfFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 border border-purple-400/40'
                : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1f1334]'
            }`}
          >
            Todos ({books.length})
          </button>

          <button
            onClick={() => setSelectedShelfFilter('reading')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedShelfFilter === 'reading'
                ? 'bg-purple-600 text-white shadow-md border border-purple-400/40'
                : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1f1334]'
            }`}
          >
            <Clock className="w-3 h-3 text-purple-300" /> Leyendo ({books.filter((b) => b.progressPercent > 0 && b.progressPercent < 100).length})
          </button>

          <button
            onClick={() => setSelectedShelfFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedShelfFilter === 'completed'
                ? 'bg-purple-600 text-white shadow-md border border-purple-400/40'
                : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1f1334]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Leídos ({books.filter((b) => b.progressPercent >= 100).length})
          </button>

          {/* Shelves filters */}
          {shelves.map((shelf) => {
            const count = books.filter((b) => b.shelfId === shelf.id).length;
            const isSelected = selectedShelfFilter === shelf.id;
            return (
              <button
                key={shelf.id}
                onClick={() => setSelectedShelfFilter(shelf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white shadow-md border'
                    : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1f1334]'
                }`}
                style={{
                  backgroundColor: isSelected ? shelf.color : undefined,
                  borderColor: isSelected ? `${shelf.color}cc` : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : shelf.color }} />
                {shelf.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content by View Mode */}
      {filteredBooks.length === 0 ? (
        <div className="py-16 text-center bg-[#140d21] rounded-3xl border border-[#291842] p-8 shadow-md">
          <BookMarked className="w-12 h-12 mx-auto mb-3 text-purple-400/30" />
          <h3 className="text-base font-bold text-purple-100">No se encontraron libros</h3>
          <p className="text-xs text-purple-300/70 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No hay coincidencias para "${searchQuery}". Intenta otra búsqueda.`
              : 'Esta sección no tiene libros aún. ¡Sube tu primer archivo EPUB para comenzar!'}
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-5 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-950/50"
          >
            <Plus className="w-4 h-4" /> Subir Libro EPUB
          </button>
        </div>
      ) : viewMode === 'physical' ? (
        <PhysicalBookshelf
          books={filteredBooks}
          shelves={shelves}
          activeShelfId={selectedShelfFilter}
          onSelectShelf={setSelectedShelfFilter}
          onOpenBook={onOpenBook}
          onUpdateRating={onUpdateRating}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredBooks.map((book) => {
            const currentShelf = shelves.find((s) => s.id === book.shelfId);
            const bookRating = book.rating || 0;
            return (
              <div
                key={book.id}
                onClick={() => onOpenBook(book.id)}
                className="flex items-center gap-4 bg-[#140d21] hover:bg-[#1d1230] p-3 rounded-2xl border border-[#291842] hover:border-purple-500/40 transition cursor-pointer group shadow-sm"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#1e1035] flex-shrink-0 shadow-md border border-[#352055]">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
                    {book.title}
                  </h4>
                  <p className="text-xs text-purple-300/80 truncate mt-0.5">{book.author}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex-1 bg-[#0c0814] rounded-full h-1.5 min-w-[80px] max-w-[140px] overflow-hidden border border-[#291842]">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${Math.max(book.progressPercent, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-purple-300 font-medium">{book.progressPercent}%</span>
                    
                    {/* 5-star rating in list item */}
                    <div
                      className="flex items-center gap-0.5 bg-[#0c0814] px-2 py-0.5 rounded-lg border border-[#291842]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onUpdateRating && onUpdateRating(book.id, bookRating === star ? 0 : star)}
                          className="p-0.5 hover:scale-125 transition"
                          title={`Calificar ${star} estrellas`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              star <= bookRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-purple-400/30 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-[10px] ml-1 font-semibold text-amber-300">
                        {bookRating > 0 ? `${bookRating}.0` : '--'}
                      </span>
                    </div>

                    {currentShelf && (
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-semibold border hidden xs:inline"
                        style={{
                          backgroundColor: `${currentShelf.color}20`,
                          borderColor: `${currentShelf.color}40`,
                          color: currentShelf.color,
                        }}
                      >
                        {currentShelf.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBook(book.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-700/80 hover:bg-purple-600 text-white text-xs font-medium transition"
                >
                  Leer
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* 3D Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              shelves={shelves}
              onOpenBook={onOpenBook}
              onDeleteBook={onDeleteBook}
              onMoveToShelf={onMoveToShelf}
              onToggleComplete={onToggleComplete}
              onUpdateRating={onUpdateRating}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) for Uploading EPUB */}
      <button
        id="fab-upload-epub-btn"
        onClick={onOpenUpload}
        className="fixed bottom-20 right-4 sm:right-8 z-40 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_8px_25px_rgba(147,51,234,0.4)] border border-purple-400/40 active:scale-95 transition-all duration-200"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Subir EPUB</span>
      </button>
    </div>
  );
};
