import React, { useState } from 'react';
import { Book, Shelf } from '../types';
import { BookOpen, Sparkles, Star } from 'lucide-react';

interface PhysicalBookshelfProps {
  books: Book[];
  shelves: Shelf[];
  activeShelfId: string;
  onSelectShelf: (shelfId: string) => void;
  onOpenBook: (bookId: string) => void;
  onUpdateRating?: (bookId: string, rating: number) => void;
}

export const PhysicalBookshelf: React.FC<PhysicalBookshelfProps> = ({
  books,
  shelves,
  activeShelfId,
  onSelectShelf,
  onOpenBook,
  onUpdateRating,
}) => {
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);
  // Group books by shelves or display active shelf
  const currentShelf = shelves.find((s) => s.id === activeShelfId) || shelves[0];
  const shelfBooks = activeShelfId === 'all' ? books : books.filter((b) => b.shelfId === activeShelfId);

  // Distribute books across shelves in rows of 4-6
  const booksPerRow = 4;
  const rows: Book[][] = [];
  for (let i = 0; i < Math.max(shelfBooks.length, 1); i += booksPerRow) {
    rows.push(shelfBooks.slice(i, i + booksPerRow));
  }

  const spineColors = [
    'from-purple-900 via-indigo-900 to-purple-950 border-purple-600/40 text-purple-200',
    'from-fuchsia-950 via-purple-900 to-indigo-950 border-fuchsia-600/40 text-fuchsia-200',
    'from-violet-950 via-purple-950 to-slate-900 border-violet-500/40 text-violet-200',
    'from-emerald-950 via-purple-950 to-indigo-950 border-emerald-500/40 text-emerald-200',
    'from-amber-950 via-purple-900 to-purple-950 border-amber-500/40 text-amber-200',
  ];

  return (
    <div id="physical-library-container" className="space-y-6">
      {/* Physical Shelf Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectShelf('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeShelfId === 'all'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 border border-purple-400/40'
              : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1e1332]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Toda la Biblioteca ({books.length})
        </button>

        {shelves.map((shelf) => {
          const count = books.filter((b) => b.shelfId === shelf.id).length;
          const isSelected = activeShelfId === shelf.id;
          return (
            <button
              key={shelf.id}
              onClick={() => onSelectShelf(shelf.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'text-white shadow-lg border'
                  : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1e1332]'
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

      {/* 3D Physical Wooden Shelves Structure */}
      <div className="bg-[#140d21] rounded-3xl p-4 sm:p-6 border border-[#2d1a47] shadow-[0_12px_40px_rgba(0,0,0,0.7)] relative overflow-hidden backdrop-blur-md">
        {/* Subtle Ambient Wood Texture & Purple Library Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/15 via-transparent to-black/70 pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-jakarta">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentShelf?.color || '#a855f7' }} />
              {activeShelfId === 'all' ? 'Estantería Principal' : currentShelf?.name}
            </h2>
            <p className="text-xs text-purple-300/70">{shelfBooks.length} tomos en exhibición</p>
          </div>
        </div>

        {shelfBooks.length === 0 ? (
          <div className="py-16 text-center text-purple-300/70">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
            <p className="text-sm font-medium">Esta estantería física está vacía.</p>
            <p className="text-xs mt-1">Añade o mueve libros a esta estantería desde la biblioteca.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="relative pt-6">
                {/* Books standing on the shelf */}
                <div className="flex items-end justify-around sm:justify-start sm:gap-6 px-3 min-h-[170px] relative z-10">
                  {row.map((book, idx) => {
                    const spineStyle = spineColors[(rowIndex * booksPerRow + idx) % spineColors.length];
                    const randomHeight = 145 + ((book.title.length * 7) % 25); // Dynamic height for realistic variety
                    const bookRating = book.rating || 0;

                    return (
                      <div
                        key={book.id}
                        onMouseEnter={() => setHoveredBookId(book.id)}
                        onMouseLeave={() => setHoveredBookId(null)}
                        onClick={() => onOpenBook(book.id)}
                        title={`${book.title} - ${book.author} (${book.progressPercent}% leído, ★ ${bookRating}/5)`}
                        className="group relative cursor-pointer flex flex-col items-center select-none transition-all duration-300 hover:-translate-y-3 hover:scale-105"
                      >
                        {/* Bookmark Ribbon on top */}
                        {book.progressPercent > 0 && (
                          <div className="absolute -top-3 right-2 w-2.5 h-5 bg-purple-500 rounded-b shadow-md z-20 border-b border-purple-200" />
                        )}

                        {/* Floating Tooltip / Quick Rating on Hover with Cover Preview */}
                        {hoveredBookId === book.id && (
                          <div
                            className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-[#0c0814]/95 border border-[#352055] p-1.5 rounded-xl shadow-2xl whitespace-nowrap flex items-center gap-2 text-[10px] text-purple-200 backdrop-blur-md animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {book.coverUrl && (
                              <div className="w-7 h-10 rounded-md overflow-hidden bg-[#180e28] border border-purple-500/40 flex-shrink-0 shadow-md">
                                <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white max-w-[120px] truncate">{book.title}</span>
                                <span className="text-[9px] text-purple-300 font-semibold">{book.progressPercent}%</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-bold text-amber-300 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {bookRating > 0 ? `${bookRating}.0` : 'Sin calificar'}
                                </span>
                                {onUpdateRating && (
                                  <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-[#2d1b4b]">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onUpdateRating(book.id, bookRating === s ? 0 : s);
                                        }}
                                        className="p-0.5 hover:scale-125 transition"
                                      >
                                        <Star
                                          className={`w-2.5 h-2.5 ${
                                            s <= bookRating ? 'fill-amber-400 text-amber-400' : 'text-purple-400/40 hover:text-amber-300'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3D Standing Book Spine */}
                        <div
                          style={{ height: `${randomHeight}px` }}
                          className={`w-14 sm:w-16 rounded-t-md bg-gradient-to-b ${spineStyle} border-t-2 border-x border-b-0 shadow-[4px_6px_14px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col justify-between p-1.5`}
                        >
                          {/* Spine Emboss Texture lines */}
                          <div className="w-full h-1 bg-white/20 rounded-full mt-1" />
                          <div className="w-full h-0.5 bg-black/40 mt-0.5" />

                          {/* Vertical Title (Book Spine) */}
                          <div className="flex-1 flex items-center justify-center overflow-hidden my-1">
                            <span className="text-[11px] font-bold tracking-tight text-white/90 truncate [writing-mode:vertical-rl] rotate-180 max-h-[90px] font-merriweather">
                              {book.title}
                            </span>
                          </div>

                          {/* Bottom Author Tag & Rating/Progress */}
                          <div className="text-center">
                            <div className="w-full h-0.5 bg-white/20 mb-1" />
                            <span className="text-[8px] font-medium text-purple-300/80 block truncate">
                              {book.author.split(' ')[0]}
                            </span>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              {bookRating > 0 && (
                                <span className="text-[8px] font-bold text-amber-300 flex items-center gap-0.5">
                                  ★{bookRating}
                                </span>
                              )}
                              <span className="text-[8px] font-bold text-purple-200">
                                {book.progressPercent}%
                              </span>
                            </div>
                          </div>

                          {/* Realistic spine reflection */}
                          <div className="absolute inset-y-0 left-0 w-1 bg-white/15" />
                          <div className="absolute inset-y-0 right-0 w-1 bg-black/40" />
                        </div>

                        {/* Book shadow on shelf */}
                        <div className="w-12 h-2 bg-black/60 rounded-full blur-[2px] mt-0.5" />
                      </div>
                    );
                  })}
                </div>

                {/* 3D Physical Shelf Plank */}
                <div className="bookshelf-shelf h-7 rounded-md w-full relative z-0 mt-[-6px]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

