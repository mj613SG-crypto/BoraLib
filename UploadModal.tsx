import React, { useState, useRef } from 'react';
import { Shelf, Book } from '../types';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Image, RefreshCw } from 'lucide-react';
import { parseEpubFile } from '../epubParser';

interface UploadModalProps {
  shelves: Shelf[];
  isOpen: boolean;
  onClose: () => void;
  onSaveNewBook: (book: Book) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  shelves,
  isOpen,
  onClose,
  onSaveNewBook,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Parsed Preview
  const [parsedData, setParsedData] = useState<Omit<Book, 'id' | 'addedAt' | 'shelfId'> | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState(shelves[0]?.id || 'shelf-reading');
  const customCoverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setErrorMsg('Por favor selecciona un archivo con formato .epub');
      return;
    }

    setErrorMsg(null);
    setIsParsing(true);

    try {
      const parsed = await parseEpubFile(file);
      setParsedData(parsed);
      setTitle(parsed.title);
      setAuthor(parsed.author);
      setCoverUrl(parsed.coverUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al procesar el archivo EPUB');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selecciona una imagen válida (JPG, PNG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = () => {
    if (!parsedData) return;

    const newBook: Book = {
      ...parsedData,
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: title.trim() || parsedData.title,
      author: author.trim() || parsedData.author,
      coverUrl: coverUrl || parsedData.coverUrl,
      addedAt: new Date().toISOString(),
      shelfId: selectedShelfId,
      progressPercent: 0,
      currentChapterIndex: 0,
    };

    onSaveNewBook(newBook);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setParsedData(null);
    setTitle('');
    setAuthor('');
    setCoverUrl('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="upload-modal-box"
        className="w-full max-w-lg bg-[#140d21] border border-[#352055] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-purple-100 relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#291842]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-jakarta">Subir Libro EPUB</h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl text-purple-400 hover:text-white hover:bg-[#201338] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!parsedData ? (
          /* Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[220px] ${
              isDragging
                ? 'border-purple-400 bg-purple-900/30 scale-[1.01]'
                : 'border-[#291842] bg-[#0c0814]/70 hover:border-purple-600/60'
            }`}
          >
            {isParsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                <p className="text-sm font-bold text-white">Analizando archivo EPUB...</p>
                <p className="text-xs text-purple-300/70">Extrayendo capítulos, portada original en alta calidad e índice</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#1e1332] border border-[#352055] flex items-center justify-center mb-3 shadow-inner text-purple-300">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white">Arrastra tu archivo .epub aquí</h4>
                <p className="text-xs text-purple-300/70 mt-1 max-w-xs">
                  O haz clic en el botón de abajo para seleccionarlo desde tu dispositivo
                </p>

                <label className="mt-4 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-purple-950/60 transition inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Seleccionar archivo EPUB
                  <input
                    type="file"
                    accept=".epub,application/epub+zip"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        ) : (
          /* Parsed Metadata & High-Fidelity Cover Preview */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 bg-[#19102b] p-4 rounded-2xl border border-[#2d1a47]">
              {/* Cover Preview with aspect ratio preservation and blur backdrop */}
              <div className="flex flex-col items-center sm:items-start flex-shrink-0">
                <div className="relative w-28 h-40 sm:w-24 sm:h-36 rounded-xl overflow-hidden bg-[#0c0814] shadow-xl border border-purple-500/40 flex items-center justify-center">
                  {coverUrl && (
                    <img
                      src={coverUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110 pointer-events-none"
                    />
                  )}
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Portada original"
                      className="relative z-10 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-400/40">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Cover actions */}
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => customCoverInputRef.current?.click()}
                    className="text-[10px] text-purple-300 hover:text-white px-2 py-1 rounded-lg bg-[#0c0814] border border-[#2d1a47] flex items-center gap-1 transition"
                    title="Cambiar la imagen de la portada"
                  >
                    <Image className="w-3 h-3 text-purple-400" />
                    <span>Personalizar</span>
                  </button>
                  {coverUrl !== parsedData.coverUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverUrl(parsedData.coverUrl)}
                      className="text-[10px] text-purple-300 hover:text-white p-1 rounded-lg bg-[#0c0814] border border-[#2d1a47] transition"
                      title="Restaurar portada original del EPUB"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                  <input
                    ref={customCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomCoverUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title & Author Inputs */}
              <div className="flex-1 space-y-2.5 text-xs">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/30 text-purple-300 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Portada original extraída en alta calidad</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-purple-300">Título del Libro:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0c0814] border border-[#291842] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-purple-300">Autor:</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#0c0814] border border-[#291842] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 mt-0.5"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#19102b] p-3 rounded-2xl border border-[#291842]">
                <span className="text-[10px] text-purple-400 block font-semibold uppercase">Capítulos</span>
                <span className="text-sm font-bold text-white">{parsedData.totalChapters} detectados</span>
              </div>
              <div className="bg-[#19102b] p-3 rounded-2xl border border-[#291842]">
                <span className="text-[10px] text-purple-400 block font-semibold uppercase">Tamaño</span>
                <span className="text-sm font-bold text-white">{parsedData.fileSizeFormatted}</span>
              </div>
            </div>

            {/* Destination Shelf */}
            <div>
              <label className="text-xs font-semibold text-purple-200 block mb-1.5">
                Guardar en la Estantería:
              </label>
              <select
                value={selectedShelfId}
                onChange={(e) => setSelectedShelfId(e.target.value)}
                className="w-full bg-[#0c0814] border border-[#291842] rounded-2xl px-3.5 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
              >
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#291842]">
              <button
                onClick={() => setParsedData(null)}
                className="px-4 py-2 rounded-xl bg-[#0c0814] text-purple-300 hover:text-white text-xs border border-[#291842] transition"
              >
                Elegir otro
              </button>
              <button
                id="confirm-upload-btn"
                onClick={handleConfirmUpload}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/60 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Añadir a mi Biblioteca
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

