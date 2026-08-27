import React, { useState } from 'react';
import { MoreVertical, BookOpen, Trash2, FolderPlus, CheckCircle2, Star } from 'lucide-react';
import { Book, Shelf } from '../types';

interface BookCardProps {
  book: Book;
  shelves: Shelf[];
  onOpenBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onMoveToShelf: (bookId: string, shelfId: string) => void;
  onToggleComplete: (bookId: string) => void;
  onUpdateRating?: (bookId: string, rating: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  shelves,
  onOpenBook,
  onDeleteBook,
  onMoveToShelf,
  onToggleComplete,
  onUpdateRating,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const currentShelf = shelves.find((s) => s.id === book.shelfId);

  const currentRating = book.rating || 0;
  const displayRating = hoverRating !== null ? hoverRating : currentRating;

  const handleStarClick = (e: React.MouseEvent, starValue: number) => {
    e.stopPropagation();
    if (onUpdateRating) {
      // If clicking the current rating again, allow clearing to 0 or setting
      const newRating = currentRating === starValue ? 0 : starValue;
      onUpdateRating(book.id, newRating);
    }
  };

  return (
    <div
      id={`book-card-${book.id}`}
      className="group relative flex flex-col justify-between bg-[#140d21] hover:bg-[#1b112c] rounded-2xl p-2.5 border border-[#291842] hover:border-purple-500/40 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-2xl hover:shadow-purple-950/60"
    >
      <div>
        {/* 3D Book Cover Container */}
        <div
          onClick={() => onOpenBook(book.id)}
          className="relative aspect-[2/3] w-full rounded-xl overflow-hidden cursor-pointer book-shadow-3d bg-[#180e28] border border-[#352055] flex items-center justify-center select-none"
        >
          {book.coverUrl && (
            <img
              src={book.coverUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
            />
          )}

          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="relative z-10 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center p-3 text-center text-purple-200">
              <BookOpen className="w-8 h-8 mb-2 text-purple-400 opacity-60" />
              <span className="text-xs font-semibold line-clamp-2">{book.title}</span>
            </div>
          )}

          {/* 3D Book Spine Left Highlight */}
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 via-white/10 to-transparent pointer-events-none z-20" />

          {/* Reading Progress Ribbon or Shelf Tag */}
          {book.progressPercent > 0 && (
            <div className="absolute top-2 right-2 z-20 bg-[#0c0814]/90 backdrop-blur-md text-purple-200 border border-purple-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              {book.progressPercent}%
            </div>
          )}

          {/* Completed Badge */}
          {book.progressPercent >= 100 && (
            <div className="absolute top-2 left-3 z-20 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
              <CheckCircle2 className="w-3 h-3" /> Leído
            </div>
          )}

          {/* Quick Read Overlay Button on Hover */}
          <div className="absolute inset-0 z-30 bg-[#0c0814]/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenBook(book.id);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/60 transform scale-90 group-hover:scale-100 transition border border-purple-400/30"
            >
              <BookOpen className="w-3.5 h-3.5" /> Continuar
            </button>
          </div>
        </div>

        {/* Progress Bar under cover */}
        <div className="w-full bg-[#0c0814] rounded-full h-1.5 mt-2.5 overflow-hidden border border-[#291842]">
          <div
            className="bg-gradient-to-r from-purple-500 to-fuchsia-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(book.progressPercent, 4)}%` }}
          />
        </div>

        {/* Book Info */}
        <div className="mt-2 flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onOpenBook(book.id)}
              title={book.title}
              className="text-sm font-bold text-purple-100 truncate hover:text-purple-300 cursor-pointer font-jakarta"
            >
              {book.title}
            </h3>
            <p className="text-xs text-purple-300/80 truncate mt-0.5">{book.author}</p>
            
            {/* Shelf Tag */}
            {currentShelf && (
              <span
                className="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded-md font-medium border"
                style={{
                  backgroundColor: `${currentShelf.color}20`,
                  borderColor: `${currentShelf.color}50`,
                  color: currentShelf.color,
                }}
              >
                {currentShelf.name}
              </span>
            )}
          </div>

          {/* Book Context Menu Button */}
          <div className="relative">
            <button
              id={`book-menu-trigger-${book.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-[#201338] transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Menu Dropdown */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-6 z-50 w-44 bg-[#19102b] border border-[#352055] rounded-xl shadow-2xl py-1 text-xs text-purple-100 backdrop-blur-xl animate-in fade-in zoom-in-95">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onOpenBook(book.id);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#24143a] flex items-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-300" /> Leer ahora
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onToggleComplete(book.id);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#24143a] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {book.progressPercent >= 100 ? 'Marcar no leído' : 'Marcar leído'}
                  </button>

                  {/* Submenu for shelves */}
                  <div className="border-t border-[#2d1b4b] my-1 pt-1 px-3">
                    <span className="text-[10px] text-purple-400 font-semibold uppercase flex items-center gap-1">
                      <FolderPlus className="w-3 h-3" /> Mover a:
                    </span>
                    <div className="mt-1 max-h-28 overflow-y-auto space-y-0.5">
                      {shelves.map((s) => (
                        <button
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onMoveToShelf(book.id, s.id);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] truncate flex items-center gap-1.5 ${
                            book.shelfId === s.id
                              ? 'bg-purple-800 text-purple-100 font-medium'
                              : 'hover:bg-[#24143a] text-purple-300'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#2d1b4b] my-1 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDeleteBook(book.id);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-950/60 text-red-300 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" /> Eliminar libro
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5-STAR RATING BAR (User requested: "añade una barra de calificación de hasta 5 estrellas en la estantería principal bajo cada libro") */}
      <div
        id={`book-rating-bar-${book.id}`}
        className="mt-3 pt-2 border-t border-[#25153c] flex items-center justify-between gap-1"
        onMouseLeave={() => setHoverRating(null)}
      >
        <div className="flex items-center gap-0.5" title={`Calificación: ${currentRating > 0 ? `${currentRating} de 5 estrellas` : 'Sin calificar'}`}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= displayRating;
            return (
              <button
                key={star}
                type="button"
                onClick={(e) => handleStarClick(e, star)}
                onMouseEnter={() => setHoverRating(star)}
                className="p-0.5 focus:outline-none transition-transform hover:scale-125"
                title={`${star} estrella${star > 1 ? 's' : ''}`}
                aria-label={`Calificar ${star} de 5 estrellas`}
              >
                <Star
                  className={`w-3.5 h-3.5 transition-colors duration-150 ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                      : 'text-purple-400/30 hover:text-amber-300/70'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Rating text / numerical indicator */}
        <span className="text-[10px] font-medium text-purple-300/80">
          {currentRating > 0 ? (
            <span className="text-amber-300 font-semibold">{currentRating}.0</span>
          ) : (
            <span className="text-purple-400/50">--</span>
          )}
        </span>
      </div>
    </div>
  );
};

