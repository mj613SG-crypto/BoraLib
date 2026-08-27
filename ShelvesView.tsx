import React, { useState } from 'react';
import { Book, Shelf } from '../types';
import {
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  BookOpen,
  Sparkles,
  Heart,
  Clock,
  Bookmark,
  Layers,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { BookCard } from './BookCard';

interface ShelvesViewProps {
  shelves: Shelf[];
  books: Book[];
  onSaveShelves: (shelves: Shelf[]) => void;
  onOpenCreateShelf: () => void;
  onOpenEditShelf: (shelf: Shelf) => void;
  onDeleteShelf: (shelfId: string) => void;
  onOpenBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onMoveToShelf: (bookId: string, shelfId: string) => void;
  onToggleComplete: (bookId: string) => void;
  onUpdateRating?: (bookId: string, rating: number) => void;
}

export const ShelvesView: React.FC<ShelvesViewProps> = ({
  shelves,
  books,
  onSaveShelves,
  onOpenCreateShelf,
  onOpenEditShelf,
  onDeleteShelf,
  onOpenBook,
  onDeleteBook,
  onMoveToShelf,
  onToggleComplete,
  onUpdateRating,
}) => {
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);

  // Move shelf up
  const moveShelfUp = (index: number) => {
    if (index === 0) return;
    const newShelves = [...shelves];
    const temp = newShelves[index];
    newShelves[index] = newShelves[index - 1];
    newShelves[index - 1] = temp;
    newShelves.forEach((s, idx) => (s.order = idx));
    onSaveShelves(newShelves);
  };

  // Move shelf down
  const moveShelfDown = (index: number) => {
    if (index === shelves.length - 1) return;
    const newShelves = [...shelves];
    const temp = newShelves[index];
    newShelves[index] = newShelves[index + 1];
    newShelves[index + 1] = temp;
    newShelves.forEach((s, idx) => (s.order = idx));
    onSaveShelves(newShelves);
  };

  const activeShelf = shelves.find((s) => s.id === selectedShelfId);
  const activeShelfBooks = activeShelf ? books.filter((b) => b.shelfId === activeShelf.id) : [];

  const getShelfIcon = (iconName: string, color: string) => {
    const props = { className: 'w-5 h-5', style: { color } };
    switch (iconName) {
      case 'Heart': return <Heart {...props} />;
      case 'Clock': return <Clock {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Bookmark': return <Bookmark {...props} />;
      case 'Layers': return <Layers {...props} />;
      default: return <BookOpen {...props} />;
    }
  };

  return (
    <div id="shelves-view-main" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#140d21] p-5 rounded-3xl border border-[#291842] backdrop-blur-md shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-jakarta">
            <Layers className="w-5 h-5 text-purple-400" /> Mis Estanterías Personalizadas
          </h2>
          <p className="text-xs text-purple-300/80 mt-1">
            Organiza tus libros por temáticas, estados o favoritos y ordénalas libremente.
          </p>
        </div>

        <button
          id="btn-create-shelf"
          onClick={onOpenCreateShelf}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-950/60 border border-purple-400/30 transition self-start sm:self-auto active:scale-95"
        >
          <FolderPlus className="w-4 h-4" /> Nueva Estantería
        </button>
      </div>

      {/* If looking at a specific shelf detail */}
      {activeShelf ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#140d21] p-4 rounded-2xl border border-[#291842]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedShelfId(null)}
                className="p-1.5 rounded-xl bg-[#1e1332] text-purple-300 hover:text-white border border-[#352055] text-xs font-semibold px-3"
              >
                ← Volver a todas
              </button>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeShelf.color }} />
                <h3 className="text-base font-bold text-white">{activeShelf.name}</h3>
                <span className="text-xs text-purple-300/70">({activeShelfBooks.length} libros)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenEditShelf(activeShelf)}
                className="p-2 rounded-xl bg-[#1e1332] hover:bg-[#271842] text-purple-200 border border-[#352055] text-xs flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
          </div>

          {activeShelfBooks.length === 0 ? (
            <div className="py-16 text-center bg-[#140d21] rounded-3xl border border-[#291842] p-6 shadow-sm">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-purple-400/40" />
              <p className="text-sm font-semibold text-purple-200">No hay libros en esta estantería todavía</p>
              <p className="text-xs text-purple-400 mt-1">
                Puedes añadir libros desde la biblioteca abriendo el menú de opciones de cualquier libro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {activeShelfBooks.map((book) => (
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
        </div>
      ) : (
        /* List of all Shelves with Reordering & Management */
        <div className="space-y-3.5">
          {shelves.map((shelf, index) => {
            const shelfBooksCount = books.filter((b) => b.shelfId === shelf.id).length;
            const completedCount = books.filter((b) => b.shelfId === shelf.id && b.progressPercent >= 100).length;

            return (
              <div
                key={shelf.id}
                id={`shelf-item-${shelf.id}`}
                className="bg-[#140d21] hover:bg-[#1b112c] rounded-3xl p-4 sm:p-5 border border-[#291842] hover:border-purple-500/40 transition shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md group"
              >
                {/* Left: Icon, Name, Description & stats */}
                <div
                  onClick={() => setSelectedShelfId(shelf.id)}
                  className="flex items-start sm:items-center gap-3.5 flex-1 cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border flex-shrink-0"
                    style={{
                      backgroundColor: `${shelf.color}20`,
                      borderColor: `${shelf.color}50`,
                    }}
                  >
                    {getShelfIcon(shelf.icon, shelf.color)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition font-jakarta">
                        {shelf.name}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#1f1335] text-purple-200 border border-[#352055]">
                        {shelfBooksCount} {shelfBooksCount === 1 ? 'libro' : 'libros'}
                      </span>
                    </div>

                    {shelf.description && (
                      <p className="text-xs text-purple-300/80 truncate mt-0.5 max-w-md">{shelf.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-purple-400">
                      <span>{completedCount} completados</span>
                      <span>•</span>
                      <span>{shelfBooksCount - completedCount} por leer / en curso</span>
                    </div>
                  </div>
                </div>

                {/* Right: Reorder & Actions */}
                <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 border-[#291842] pt-2 sm:pt-0">
                  {/* Reorder Buttons (Up / Down) */}
                  <div className="flex items-center bg-[#0c0814] rounded-xl border border-[#291842] p-0.5">
                    <button
                      onClick={() => moveShelfUp(index)}
                      disabled={index === 0}
                      title="Mover arriba"
                      className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-[#201338] disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveShelfDown(index)}
                      disabled={index === shelves.length - 1}
                      title="Mover abajo"
                      className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-[#201338] disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => onOpenEditShelf(shelf)}
                    title="Editar estantería"
                    className="p-2 rounded-xl bg-[#19102b] hover:bg-[#24143a] text-purple-300 hover:text-white border border-[#291842] transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button (if not default) */}
                  {!shelf.isDefault && (
                    <button
                      onClick={() => onDeleteShelf(shelf.id)}
                      title="Eliminar estantería"
                      className="p-2 rounded-xl bg-[#19102b] hover:bg-red-950/60 text-purple-400 hover:text-red-300 border border-[#291842] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* View books arrow */}
                  <button
                    onClick={() => setSelectedShelfId(shelf.id)}
                    className="p-2 rounded-xl bg-[#201338] hover:bg-purple-700 text-purple-200 transition ml-1 border border-[#2d1b4b]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
