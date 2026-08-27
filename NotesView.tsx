import React, { useState, useMemo } from 'react';
import { Highlight, Bookmark, Book } from '../types';
import { HIGHLIGHT_PRESETS, getHighlightStyle } from '../';
import {
  BookmarkCheck,
  Search,
  Download,
  Trash2,
  Edit3,
  Check,
  X,
  BookOpen,
  Copy,
  FileText,
  Filter,
} from 'lucide-react';

interface NotesViewProps {
  highlights: Highlight[];
  bookmarks: Bookmark[];
  books: Book[];
  onUpdateHighlightNote: (id: string, note: string) => void;
  onDeleteHighlight: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onOpenBookAtLocation: (bookId: string, chapterIndex: number) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  highlights,
  bookmarks,
  books,
  onUpdateHighlightNote,
  onDeleteHighlight,
  onDeleteBookmark,
  onOpenBookAtLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'bookmarks'>('highlights');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHighlights = useMemo(() => {
    return highlights.filter((h) => {
      const matchesSearch =
        h.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.note && h.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.chapterTitle && h.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedBookFilter !== 'all' && h.bookId !== selectedBookFilter) return false;
      if (selectedColorFilter !== 'all' && h.color !== selectedColorFilter) return false;

      return true;
    });
  }, [highlights, searchQuery, selectedBookFilter, selectedColorFilter]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bm) => {
      const matchesSearch =
        bm.previewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedBookFilter !== 'all' && bm.bookId !== selectedBookFilter) return false;

      return true;
    });
  }, [bookmarks, searchQuery, selectedBookFilter]);

  const handleStartEdit = (h: Highlight) => {
    setEditingHighlightId(h.id);
    setEditNoteText(h.note || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateHighlightNote(id, editNoteText.trim());
    setEditingHighlightId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportNotesAsMarkdown = () => {
    let md = `# Notas y Subrayados - BoraLib\n\nExportado el ${new Date().toLocaleDateString()}\n\n`;

    const groupedByBook = new Map<string, Highlight[]>();
    filteredHighlights.forEach((h) => {
      const list = groupedByBook.get(h.bookId) || [];
      list.push(h);
      groupedByBook.set(h.bookId, list);
    });

    groupedByBook.forEach((hList, bookId) => {
      const book = books.find((b) => b.id === bookId);
      md += `## 📖 ${book?.title || 'Libro'} (${book?.author || 'Autor'})\n\n`;
      hList.forEach((h) => {
        md += `> "${h.text}"\n\n`;
        if (h.note) md += `*Nota:* ${h.note}\n\n`;
        md += `— *${h.chapterTitle}* | Color: ${h.color}\n\n---\n\n`;
      });
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BoraLib_Notas_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="notes-view-main" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#140d21] p-5 rounded-3xl border border-[#291842] backdrop-blur-md shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-jakarta">
            <BookmarkCheck className="w-5 h-5 text-purple-400" /> Notas, Subrayados y Marcadores
          </h2>
          <p className="text-xs text-purple-300/80 mt-1">
            Revisa todas tus reflexiones, pasajes destacados y anotaciones guardadas en la nube.
          </p>
        </div>

        {highlights.length > 0 && (
          <button
            id="export-notes-btn"
            onClick={exportNotesAsMarkdown}
            className="px-4 py-2.5 rounded-2xl bg-[#1e1332] hover:bg-[#281943] text-purple-200 hover:text-white border border-[#352055] text-xs font-semibold inline-flex items-center gap-2 transition self-start sm:self-auto shadow-md"
          >
            <Download className="w-4 h-4" /> Exportar a Markdown (.md)
          </button>
        )}
      </div>

      {/* Tabs: Subrayados vs Marcadores */}
      <div className="flex items-center gap-2 bg-[#140d21] p-1 rounded-2xl border border-[#291842] max-w-xs shadow-inner">
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'highlights'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-purple-400/70 hover:text-purple-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Subrayados ({highlights.length})
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'bookmarks'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-purple-400/70 hover:text-purple-200'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" /> Marcadores ({bookmarks.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="notes-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en textos, notas o capítulos..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#140d21] border border-[#291842] rounded-2xl text-xs sm:text-sm text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500 transition shadow-inner"
          />
        </div>

        {/* Book filter dropdown */}
        <div className="flex items-center gap-2">
          <select
            id="notes-book-filter-select"
            value={selectedBookFilter}
            onChange={(e) => setSelectedBookFilter(e.target.value)}
            className="bg-[#140d21] border border-[#291842] px-3 py-2.5 rounded-2xl text-xs text-purple-200 focus:outline-none shadow-inner"
          >
            <option value="all" className="bg-[#140d21] text-purple-100">Todos los libros</option>
            {books.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#140d21] text-purple-100">
                {b.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Color Filter Chips (For highlights) */}
      {activeTab === 'highlights' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-purple-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Color:
          </span>
          <button
            onClick={() => setSelectedColorFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
              selectedColorFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1e1332]'
            }`}
          >
            Todos
          </button>
          {HIGHLIGHT_PRESETS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedColorFilter(c.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                selectedColorFilter === c.id
                  ? 'bg-purple-800 text-white border border-purple-400 shadow-md'
                  : 'bg-[#140d21] text-purple-300 border border-[#291842] hover:bg-[#1e1332]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border shadow-sm"
                style={{ backgroundColor: c.hex, borderColor: c.borderHex }}
              />
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {activeTab === 'highlights' ? (
        filteredHighlights.length === 0 ? (
          <div className="py-16 text-center bg-[#140d21] rounded-3xl border border-[#291842] p-6 shadow-sm">
            <FileText className="w-12 h-12 mx-auto mb-2 text-purple-400/30" />
            <p className="text-sm font-semibold text-purple-200">No hay subrayados que coincidan</p>
            <p className="text-xs text-purple-400 mt-1 max-w-sm mx-auto">
              Mientras lees en el lector EPUB, selecciona cualquier texto para subrayarlo en tu color preferido y añadir notas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHighlights.map((hl) => {
              const book = books.find((b) => b.id === hl.bookId);
              const colorInfo = getHighlightStyle(hl.color);
              const isEditing = editingHighlightId === hl.id;

              return (
                <div
                  key={hl.id}
                  id={`highlight-card-${hl.id}`}
                  className="bg-[#140d21] rounded-3xl p-4 sm:p-5 border border-[#291842] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-3"
                >
                  {/* Book & Chapter Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#291842] pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                        style={{ backgroundColor: colorInfo.hex, borderColor: colorInfo.borderHex }}
                      />
                      <span className="text-xs font-bold text-purple-200 truncate">
                        {book?.title || hl.bookTitle || 'Libro'}
                      </span>
                      <span className="text-purple-400 text-xs hidden sm:inline">•</span>
                      <span className="text-[11px] text-purple-300/70 truncate hidden sm:inline">
                        {hl.chapterTitle}
                      </span>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-semibold border hidden xs:inline"
                        style={{
                          backgroundColor: `${colorInfo.hex}25`,
                          borderColor: `${colorInfo.borderHex}60`,
                          color: colorInfo.hex,
                        }}
                      >
                        {colorInfo.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(hl.text, hl.id)}
                        title="Copiar texto"
                        className="p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-[#201338] transition"
                      >
                        {copiedId === hl.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onOpenBookAtLocation(hl.bookId, hl.chapterIndex)}
                        title="Ir al capítulo en el lector"
                        className="p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-[#201338] transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteHighlight(hl.id)}
                        title="Eliminar subrayado"
                        className="p-1.5 rounded-lg text-purple-400 hover:text-red-300 hover:bg-red-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Highlighted Quote Text */}
                  <blockquote
                    className="pl-3.5 py-1.5 border-l-4 rounded-r-xl text-sm sm:text-base font-serif italic text-purple-100/95 leading-relaxed"
                    style={{
                      borderLeftColor: colorInfo.borderHex,
                      backgroundColor: colorInfo.bgRgba,
                    }}
                  >
                    "{hl.text}"
                  </blockquote>

                  {/* Note Section */}
                  {isEditing ? (
                    <div className="space-y-2 bg-[#19102b] p-3 rounded-2xl border border-[#352055]">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        placeholder="Escribe tu reflexión o nota sobre esta cita..."
                        className="w-full bg-[#0c0814] border border-[#291842] rounded-xl p-2.5 text-xs text-purple-100 placeholder-purple-400 focus:outline-none focus:border-purple-400 resize-none h-20"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingHighlightId(null)}
                          className="px-3 py-1 rounded-xl bg-[#0c0814] text-purple-300 hover:text-white text-xs border border-[#291842]"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(hl.id)}
                          className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow"
                        >
                          Guardar Nota
                        </button>
                      </div>
                    </div>
                  ) : hl.note ? (
                    <div className="bg-[#19102b] border border-[#352055] rounded-2xl p-3 flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                          Mi Nota:
                        </span>
                        <p className="text-xs text-purple-200 leading-relaxed">{hl.note}</p>
                      </div>
                      <button
                        onClick={() => handleStartEdit(hl)}
                        title="Editar nota"
                        className="p-1 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-[#24143a]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(hl)}
                      className="text-[11px] text-purple-400 hover:text-purple-200 inline-flex items-center gap-1 font-medium transition"
                    >
                      <Edit3 className="w-3 h-3" /> + Añadir una nota a esta cita
                    </button>
                  )}

                  <div className="text-[10px] text-purple-400/60 pt-1">
                    Guardado el {new Date(hl.createdAt).toLocaleDateString()} a las{' '}
                    {new Date(hl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Bookmarks list */
        filteredBookmarks.length === 0 ? (
          <div className="py-16 text-center bg-[#140d21] rounded-3xl border border-[#291842] p-6 shadow-sm">
            <BookmarkCheck className="w-12 h-12 mx-auto mb-2 text-purple-400/30" />
            <p className="text-sm font-semibold text-purple-200">No hay marcadores registrados</p>
            <p className="text-xs text-purple-400 mt-1">
              Usa el icono de marcador dentro del lector para guardar tus páginas o capítulos clave.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map((bm) => {
              const book = books.find((b) => b.id === bm.bookId);

              return (
                <div
                  key={bm.id}
                  className="bg-[#140d21] rounded-2xl p-4 border border-[#291842] shadow-sm flex items-center justify-between gap-3 backdrop-blur-md"
                >
                  <div
                    onClick={() => onOpenBookAtLocation(bm.bookId, bm.chapterIndex)}
                    className="flex-1 min-w-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {book?.title || bm.bookTitle}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1332] text-purple-300 font-bold border border-[#352055]">
                        {bm.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-purple-300/80 mt-0.5 truncate">{bm.chapterTitle}</p>
                    {bm.previewText && (
                      <p className="text-[11px] text-purple-400/70 italic line-clamp-1 mt-1 font-serif">
                        "{bm.previewText}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenBookAtLocation(bm.bookId, bm.chapterIndex)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1 shadow"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Continuar
                    </button>

                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      title="Eliminar marcador"
                      className="p-1.5 rounded-lg text-purple-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
