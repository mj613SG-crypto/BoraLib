import React, { useState, useEffect } from 'react';
import { Shelf } from '../types';
import { FolderPlus, X, Check, BookOpen, Heart, Sparkles, Clock, Bookmark, Layers } from 'lucide-react';

interface ShelfModalProps {
  isOpen: boolean;
  editingShelf: Shelf | null;
  onClose: () => void;
  onSaveShelf: (shelfData: Omit<Shelf, 'id' | 'order'>, id?: string) => void;
}

const SHELF_COLORS = [
  '#9333ea', // purple-600
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#3b82f6', // blue-500
];

const SHELF_ICONS = [
  { id: 'BookOpen', label: 'Libro' },
  { id: 'Heart', label: 'Favorito' },
  { id: 'Sparkles', label: 'Especial' },
  { id: 'Clock', label: 'Pendiente' },
  { id: 'Bookmark', label: 'Marcador' },
  { id: 'Layers', label: 'Colección' },
];

export const ShelfModal: React.FC<ShelfModalProps> = ({
  isOpen,
  editingShelf,
  onClose,
  onSaveShelf,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SHELF_COLORS[0]);
  const [icon, setIcon] = useState('BookOpen');

  useEffect(() => {
    if (editingShelf) {
      setName(editingShelf.name);
      setDescription(editingShelf.description || '');
      setColor(editingShelf.color);
      setIcon(editingShelf.icon);
    } else {
      setName('');
      setDescription('');
      setColor(SHELF_COLORS[0]);
      setIcon('BookOpen');
    }
  }, [editingShelf, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveShelf(
      {
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
      },
      editingShelf?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="shelf-modal-box"
        className="w-full max-w-md bg-[#140d21] border border-[#352055] rounded-3xl p-6 shadow-2xl space-y-5 text-purple-100 relative"
      >
        <div className="flex justify-between items-center pb-2 border-b border-[#291842]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-jakarta">
              {editingShelf ? 'Editar Estantería' : 'Nueva Estantería'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-400 hover:text-white hover:bg-[#201338] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">
              Nombre de la Estantería:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Filosofía Antigua, Novelas de Ciencia Ficción..."
              className="w-full px-3.5 py-2.5 bg-[#0c0814] border border-[#291842] rounded-2xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">
              Descripción o Temática (Opcional):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve nota sobre los libros en esta sección"
              className="w-full px-3.5 py-2 bg-[#0c0814] border border-[#291842] rounded-2xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1.5">Color Temático:</label>
            <div className="flex items-center gap-2">
              {SHELF_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                    color === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1.5">Icono Representativo:</label>
            <div className="grid grid-cols-3 gap-2">
              {SHELF_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic.id}
                  onClick={() => setIcon(ic.id)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition ${
                    icon === ic.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow font-bold'
                      : 'bg-[#0c0814] text-purple-300 border-[#291842] hover:bg-[#1e1332]'
                  }`}
                >
                  {ic.id === 'Heart' && <Heart className="w-3.5 h-3.5" />}
                  {ic.id === 'Sparkles' && <Sparkles className="w-3.5 h-3.5" />}
                  {ic.id === 'Clock' && <Clock className="w-3.5 h-3.5" />}
                  {ic.id === 'Bookmark' && <Bookmark className="w-3.5 h-3.5" />}
                  {ic.id === 'Layers' && <Layers className="w-3.5 h-3.5" />}
                  {ic.id === 'BookOpen' && <BookOpen className="w-3.5 h-3.5" />}
                  <span>{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#291842]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0c0814] text-purple-300 text-xs border border-[#291842] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/60 transition"
            >
              {editingShelf ? 'Guardar Cambios' : 'Crear Estantería'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
