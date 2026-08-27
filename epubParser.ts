import JSZip from 'jszip';
import { Book, Chapter } from '../types';

/**
 * Advanced multi-strategy EPUB parser with pristine cover extraction and chapter rendering
 */
export async function parseEpubFile(file: File | ArrayBuffer): Promise<Omit<Book, 'id' | 'addedAt' | 'shelfId'>> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 1. Locate container.xml to find the root OPF file path
  const containerXmlStr = await loadedZip.file('META-INF/container.xml')?.async('text');
  if (!containerXmlStr) {
    throw new Error('El archivo no parece ser un EPUB válido (falta META-INF/container.xml)');
  }

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXmlStr, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path') || 'OEBPS/content.opf';
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Load and parse the OPF document
  const opfFile = loadedZip.file(opfPath) || findFileCaseInsensitive(loadedZip, opfPath);
  if (!opfFile) {
    throw new Error(`No se pudo encontrar el manifiesto OPF en: ${opfPath}`);
  }
  const opfStr = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfStr, 'application/xml');

  // Metadata
  const titleEl = opfDoc.querySelector('metadata > title, metadata > dc\\:title');
  const title = titleEl?.textContent?.trim() || (file instanceof File ? file.name.replace(/\.epub$/i, '') : 'Libro sin título');

  const creatorEl = opfDoc.querySelector('metadata > creator, metadata > dc\\:creator');
  const author = creatorEl?.textContent?.trim() || 'Autor Desconocido';

  const descEl = opfDoc.querySelector('metadata > description, metadata > dc\\:description');
  const description = descEl?.textContent?.trim() || 'Libro electrónico en formato EPUB.';

  const langEl = opfDoc.querySelector('metadata > language, metadata > dc\\:language');
  const language = langEl?.textContent?.trim() || 'es';

  // 3. Parse Manifest (Items and IDs)
  const manifestItems = new Map<string, { href: string; mediaType: string; properties?: string }>();
  const itemElements = opfDoc.querySelectorAll('manifest > item');

  itemElements.forEach((item) => {
    const id = item.getAttribute('id') || '';
    const href = item.getAttribute('href') || '';
    const mediaType = item.getAttribute('media-type') || '';
    const properties = item.getAttribute('properties') || '';

    manifestItems.set(id, { href, mediaType, properties });
  });

  // 4. Parse Spine (Ordered Chapter References)
  const spineElements = opfDoc.querySelectorAll('spine > itemref');
  const spineIdrefs: string[] = [];
  const spineHrefs: string[] = [];
  spineElements.forEach((itemref) => {
    const idref = itemref.getAttribute('idref');
    if (idref) {
      spineIdrefs.push(idref);
      const manifestItem = manifestItems.get(idref);
      if (manifestItem?.href) {
        spineHrefs.push(manifestItem.href);
      }
    }
  });

  // 5. High-Fidelity Cover Extraction using Multi-Tier Strategy
  let coverUrl = await extractPristineCover(loadedZip, opfDoc, opfDir, manifestItems, spineHrefs);

  // If no cover could be extracted from anywhere, generate a stylized geometric purple cover
  if (!coverUrl) {
    coverUrl = generateFallbackCover(title, author);
  }

  // 6. Extract Table of Contents (NCX or Nav)
  const tocTitles = new Map<string, string>();
  let ncxHref = '';
  manifestItems.forEach((item) => {
    if (item.mediaType === 'application/x-dtbncx+xml' || item.href.endsWith('.ncx')) {
      ncxHref = item.href;
    }
  });

  if (ncxHref) {
    const fullNcxPath = resolveZipPath(opfDir, ncxHref);
    const ncxFile = loadedZip.file(fullNcxPath) || findFileCaseInsensitive(loadedZip, fullNcxPath);
    if (ncxFile) {
      const ncxStr = await ncxFile.async('text');
      const ncxDoc = parser.parseFromString(ncxStr, 'application/xml');
      const navPoints = ncxDoc.querySelectorAll('navPoint');
      navPoints.forEach((np) => {
        const text = np.querySelector('navLabel > text')?.textContent?.trim();
        const src = np.querySelector('content')?.getAttribute('src');
        if (text && src) {
          const cleanSrc = src.split('#')[0];
          tocTitles.set(cleanSrc, text);
          const filename = cleanSrc.split('/').pop() || '';
          if (filename) tocTitles.set(filename, text);
        }
      });
    }
  }

  // 7. Load Chapters in spine order
  const chapters: Chapter[] = [];
  let chapterIndex = 0;

  for (const idref of spineIdrefs) {
    const manifestEntry = manifestItems.get(idref);
    if (!manifestEntry) continue;

    const fullChapterPath = resolveZipPath(opfDir, manifestEntry.href);
    const chapterFile = loadedZip.file(fullChapterPath) || findFileCaseInsensitive(loadedZip, fullChapterPath);
    if (!chapterFile) continue;

    const rawHtml = await chapterFile.async('text');
    
    // Process chapter HTML (embed internal images as base64, clean scripts)
    const processedHtml = await processChapterHtml(rawHtml, fullChapterPath, loadedZip);

    // Extract chapter title
    const cleanFilename = manifestEntry.href.split('#')[0].split('/').pop() || '';
    let chapterTitle = tocTitles.get(manifestEntry.href) || tocTitles.get(cleanFilename);
    
    if (!chapterTitle) {
      const doc = parser.parseFromString(processedHtml, 'text/html');
      const heading = doc.querySelector('h1, h2, h3, title');
      chapterTitle = heading?.textContent?.trim() || `Capítulo ${chapterIndex + 1}`;
    }

    // Truncate overly long titles
    if (chapterTitle.length > 60) {
      chapterTitle = chapterTitle.substring(0, 57) + '...';
    }

    chapters.push({
      id: `chap-${chapterIndex}`,
      title: chapterTitle,
      href: manifestEntry.href,
      content: processedHtml,
      order: chapterIndex,
    });

    chapterIndex++;
  }

  // If no spine chapters found, fallback to all html/xhtml items in manifest
  if (chapters.length === 0) {
    let fallbackIndex = 0;
    for (const [, item] of manifestItems) {
      if (item.mediaType.includes('html') || item.href.endsWith('.html') || item.href.endsWith('.xhtml')) {
        const fullPath = resolveZipPath(opfDir, item.href);
        const file = loadedZip.file(fullPath) || findFileCaseInsensitive(loadedZip, fullPath);
        if (!file) continue;
        const raw = await file.async('text');
        const processed = await processChapterHtml(raw, fullPath, loadedZip);
        chapters.push({
          id: `chap-${fallbackIndex}`,
          title: `Sección ${fallbackIndex + 1}`,
          href: item.href,
          content: processed,
          order: fallbackIndex,
        });
        fallbackIndex++;
      }
    }
  }

  const fileSize = file instanceof File ? formatFileSize(file.size) : '1.2 MB';

  return {
    title,
    author,
    coverUrl,
    description,
    language,
    totalChapters: chapters.length || 1,
    currentChapterIndex: 0,
    progressPercent: 0,
    totalReadingTimeMinutes: Math.max(15, chapters.length * 8),
    tags: ['EPUB', language.toUpperCase()],
    fileSizeFormatted: fileSize,
    chapters,
  };
}

/**
 * Advanced Multi-Tier Cover Extractor
 * Extracts 100% original, lossless book covers from any EPUB specification.
 */
async function extractPristineCover(
  loadedZip: JSZip,
  opfDoc: Document,
  opfDir: string,
  manifestItems: Map<string, { href: string; mediaType: string; properties?: string }>,
  spineHrefs: string[]
): Promise<string> {
  // Strategy 1: EPUB3 properties="cover-image" on manifest item
  for (const [, item] of manifestItems) {
    if (item.properties && item.properties.split(/\s+/).includes('cover-image')) {
      const fullPath = resolveZipPath(opfDir, item.href);
      const url = await extractZipImageAsLosslessDataUrl(loadedZip, fullPath, item.mediaType);
      if (url) return url;
    }
  }

  // Strategy 2: EPUB2 <meta name="cover" content="item_id_or_href" /> in OPF metadata
  const metaCoverEls = opfDoc.querySelectorAll(
    'metadata > meta[name="cover" i], metadata > meta[name="Cover" i], metadata > meta[name="cover-image" i]'
  );
  for (const metaEl of Array.from(metaCoverEls)) {
    const coverTarget = metaEl.getAttribute('content')?.trim() || '';
    if (coverTarget) {
      // 2a. Target is manifest item ID
      const manifestItem = manifestItems.get(coverTarget);
      if (manifestItem) {
        if (manifestItem.mediaType.startsWith('image/')) {
          const fullPath = resolveZipPath(opfDir, manifestItem.href);
          const url = await extractZipImageAsLosslessDataUrl(loadedZip, fullPath, manifestItem.mediaType);
          if (url) return url;
        } else if (isHtmlMediaType(manifestItem.mediaType, manifestItem.href)) {
          // It's a cover XHTML page
          const url = await extractImageFromHtmlFile(loadedZip, opfDir, manifestItem.href);
          if (url) return url;
        }
      }

      // 2b. Target is a direct file path or filename
      for (const [, mItem] of manifestItems) {
        if (mItem.href === coverTarget || mItem.href.endsWith('/' + coverTarget)) {
          if (mItem.mediaType.startsWith('image/')) {
            const fullPath = resolveZipPath(opfDir, mItem.href);
            const url = await extractZipImageAsLosslessDataUrl(loadedZip, fullPath, mItem.mediaType);
            if (url) return url;
          }
        }
      }

      // 2c. Direct zip lookup of target
      const directPath = resolveZipPath(opfDir, coverTarget);
      const url = await extractZipImageAsLosslessDataUrl(loadedZip, directPath);
      if (url) return url;
    }
  }

  // Strategy 3: OPF <guide> references (type="cover" or "other.ms-coverimage-standard" or "jacket")
  const guideRefs = opfDoc.querySelectorAll('guide > reference');
  for (const ref of Array.from(guideRefs)) {
    const type = (ref.getAttribute('type') || '').toLowerCase();
    const href = ref.getAttribute('href') || '';
    if (type.includes('cover') || type.includes('jacket') || type.includes('titlepage') || type.includes('title-page')) {
      if (href) {
        const cleanHref = href.split('#')[0];
        if (isImageExtension(cleanHref)) {
          const fullPath = resolveZipPath(opfDir, cleanHref);
          const url = await extractZipImageAsLosslessDataUrl(loadedZip, fullPath);
          if (url) return url;
        } else {
          const url = await extractImageFromHtmlFile(loadedZip, opfDir, cleanHref);
          if (url) return url;
        }
      }
    }
  }

  // Strategy 4: Inspect First Spine Item (Cover / Titlepage XHTML)
  if (spineHrefs.length > 0) {
    const firstSpineHref = spineHrefs[0];
    const isCoverCandidate =
      /cover|titlepage|title_page|portada|capa|jacket|front|000|001|p-cover/i.test(firstSpineHref) ||
      spineHrefs.length > 1;

    if (isCoverCandidate) {
      const url = await extractImageFromHtmlFile(loadedZip, opfDir, firstSpineHref, true);
      if (url) return url;
    }
  }

  // Strategy 5: Manifest heuristic matching (ID or href named cover, portada, jacket, etc.)
  const scoredCandidates: { href: string; mediaType: string; score: number }[] = [];
  for (const [id, item] of manifestItems) {
    if (item.mediaType.startsWith('image/')) {
      let score = 0;
      const idLower = id.toLowerCase();
      const hrefLower = item.href.toLowerCase();

      if (idLower === 'cover' || idLower === 'cover-image' || idLower === 'coverimage' || idLower === 'cover_image') score += 120;
      else if (idLower.includes('cover') || idLower.includes('portada')) score += 80;
      else if (idLower.includes('jacket') || idLower.includes('titlepage')) score += 60;
      else if (idLower.includes('front')) score += 40;

      if (hrefLower.endsWith('/cover.jpg') || hrefLower.endsWith('/cover.jpeg') || hrefLower.endsWith('/cover.png') || hrefLower === 'cover.jpg' || hrefLower === 'cover.jpeg' || hrefLower === 'cover.png') score += 110;
      else if (hrefLower.includes('cover') || hrefLower.includes('portada')) score += 75;
      else if (hrefLower.includes('jacket') || hrefLower.includes('titlepage') || hrefLower.includes('front')) score += 50;

      if (score > 0) {
        scoredCandidates.push({ href: item.href, mediaType: item.mediaType, score });
      }
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  for (const candidate of scoredCandidates) {
    const fullPath = resolveZipPath(opfDir, candidate.href);
    const url = await extractZipImageAsLosslessDataUrl(loadedZip, fullPath, candidate.mediaType);
    if (url) return url;
  }

  // Strategy 6: Direct search inside all ZIP files for cover image names
  const zipFileNames = Object.keys(loadedZip.files);
  const coverRegex = /(^|\/)(cover|portada|jacket|front_cover|frontcover|titlepage|title_page|capa).*\.(jpe?g|png|webp|svg|gif)$/i;
  const matchingZipFiles = zipFileNames.filter((p) => coverRegex.test(p) && !loadedZip.files[p].dir);

  for (const path of matchingZipFiles) {
    const url = await extractZipImageAsLosslessDataUrl(loadedZip, path);
    if (url) return url;
  }

  // Strategy 7: Fallback to largest/first image in the EPUB ZIP archive
  const allImageFiles = zipFileNames.filter((p) => isImageExtension(p) && !loadedZip.files[p].dir);
  if (allImageFiles.length > 0) {
    // Find the image file with the largest uncompressed size or first image
    let largestPath = allImageFiles[0];
    let maxSize = 0;
    for (const imgPath of allImageFiles) {
      const fileObj = loadedZip.files[imgPath];
      // @ts-ignore - _data may contain uncompressedSize in JSZip
      const size = (fileObj as any)._data?.uncompressedSize || 0;
      if (size > maxSize) {
        maxSize = size;
        largestPath = imgPath;
      }
    }
    const url = await extractZipImageAsLosslessDataUrl(loadedZip, largestPath);
    if (url) return url;
  }

  return '';
}

/**
 * Extracts an embedded image from an HTML/XHTML file (like cover.xhtml or titlepage.xhtml)
 */
async function extractImageFromHtmlFile(
  zip: JSZip,
  opfDir: string,
  htmlHref: string,
  isSpinePage = false
): Promise<string | null> {
  const fullHtmlPath = resolveZipPath(opfDir, htmlHref);
  const htmlFile = zip.file(fullHtmlPath) || findFileCaseInsensitive(zip, fullHtmlPath);
  if (!htmlFile) return null;

  const htmlText = await htmlFile.async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const htmlDir = fullHtmlPath.includes('/') ? fullHtmlPath.substring(0, fullHtmlPath.lastIndexOf('/') + 1) : '';

  // If inspecting a general spine page, check that it's actually a cover/titlepage (short text, large image)
  if (isSpinePage) {
    const textLen = (doc.body.textContent || '').trim().length;
    if (textLen > 400) {
      // Too much text, likely a standard chapter, not a cover page
      return null;
    }
  }

  // 1. Check SVG <image xlink:href="..." /> or <image href="..." /> (Calibre & Standard EPUB pattern)
  const svgImages = doc.querySelectorAll('svg image, image');
  for (const svgImg of Array.from(svgImages)) {
    const src = svgImg.getAttribute('xlink:href') || svgImg.getAttribute('href') || svgImg.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      const fullImgPath = resolveZipPath(htmlDir, src);
      const url = await extractZipImageAsLosslessDataUrl(zip, fullImgPath);
      if (url) return url;
    }
  }

  // 2. Check <img> tags
  const imgTags = doc.querySelectorAll('img');
  for (const img of Array.from(imgTags)) {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      const fullImgPath = resolveZipPath(htmlDir, src);
      const url = await extractZipImageAsLosslessDataUrl(zip, fullImgPath);
      if (url) return url;
    }
  }

  return null;
}

/**
 * Extracts a file from ZIP as a lossless Data URL preserving 100% original quality
 */
async function extractZipImageAsLosslessDataUrl(
  zip: JSZip,
  filePath: string,
  mediaTypeHint?: string
): Promise<string | null> {
  const file = zip.file(filePath) || findFileCaseInsensitive(zip, filePath);
  if (!file) return null;

  try {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    let mimeType = mediaTypeHint || 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';

    const uint8 = await file.async('uint8array');
    if (!uint8 || uint8.length === 0) return null;

    // Convert Uint8Array to base64 data URL without quality loss
    let binary = '';
    const len = uint8.byteLength;
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, Math.min(i + chunkSize, len))));
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.warn('Error reading cover image from ZIP:', e);
    return null;
  }
}

/**
 * Case-insensitive file search in JSZip
 */
function findFileCaseInsensitive(zip: JSZip, targetPath: string) {
  const cleanTarget = targetPath.toLowerCase().replace(/^\//, '');
  const keys = Object.keys(zip.files);
  for (const k of keys) {
    if (k.toLowerCase().replace(/^\//, '') === cleanTarget) {
      return zip.files[k];
    }
  }
  return null;
}

function isImageExtension(path: string): boolean {
  return /\.(jpe?g|png|webp|svg|gif)$/i.test(path);
}

function isHtmlMediaType(mediaType: string, href: string): boolean {
  return mediaType.includes('html') || href.endsWith('.xhtml') || href.endsWith('.html') || href.endsWith('.htm');
}

/**
 * Resolves relative file paths inside EPUB ZIP
 */
function resolveZipPath(baseDir: string, relativePath: string): string {
  try {
    relativePath = decodeURIComponent(relativePath);
  } catch {
    // Keep as is if decode fails
  }

  if (relativePath.startsWith('/')) {
    return relativePath.substring(1);
  }
  const combined = baseDir + relativePath;
  const parts = combined.split('/');
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  return stack.join('/');
}

/**
 * Replaces relative image references inside chapter HTML with data URLs
 */
async function processChapterHtml(html: string, chapterPath: string, zip: JSZip): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const chapterDir = chapterPath.includes('/') ? chapterPath.substring(0, chapterPath.lastIndexOf('/') + 1) : '';

  // Process <img> tags
  const images = doc.querySelectorAll('img, image');
  for (const img of Array.from(images)) {
    const src = img.getAttribute('src') || img.getAttribute('xlink:href');
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      const fullImgPath = resolveZipPath(chapterDir, src);
      const dataUrl = await extractZipImageAsLosslessDataUrl(zip, fullImgPath);
      if (dataUrl) {
        img.setAttribute('src', dataUrl);
        img.removeAttribute('xlink:href');
      }
    }
    // Ensure responsive image style
    img.setAttribute('style', 'max-width: 100%; height: auto; border-radius: 8px; margin: 16px auto; display: block;');
  }

  // Remove scripts or audio/video for security and cleanliness
  doc.querySelectorAll('script, iframe, object, embed').forEach((el) => el.remove());

  return doc.body.innerHTML;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Generates an elegant SVG cover with purple gradients and physical typography
 */
export function generateFallbackCover(title: string, author: string, hueVariant = 'purple'): string {
  const safeTitle = escapeXml(title.length > 45 ? title.substring(0, 42) + '...' : title);
  const safeAuthor = escapeXml(author.length > 30 ? author.substring(0, 27) + '...' : author);
  
  const gradients = {
    purple: {
      bg1: '#3b0764',
      bg2: '#581c87',
      bg3: '#1e0538',
      accent: '#c084fc',
      gold: '#fbbf24',
    },
    indigo: {
      bg1: '#1e1b4b',
      bg2: '#312e81',
      bg3: '#0f0e26',
      accent: '#818cf8',
      gold: '#38bdf8',
    },
  };

  const g = gradients.purple;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="coverBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${g.bg1}" />
        <stop offset="50%" stop-color="${g.bg2}" />
        <stop offset="100%" stop-color="${g.bg3}" />
      </linearGradient>
      <linearGradient id="spineEffect" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.6)" />
        <stop offset="3%" stop-color="rgba(255,255,255,0.15)" />
        <stop offset="6%" stop-color="rgba(0,0,0,0.2)" />
        <stop offset="10%" stop-color="transparent" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    
    <!-- Background -->
    <rect width="400" height="600" fill="url(#coverBg)" rx="8" />
    
    <!-- Subtle Ornaments -->
    <rect x="25" y="25" width="350" height="550" fill="none" stroke="${g.accent}" stroke-width="1.5" stroke-opacity="0.3" rx="4" />
    <rect x="32" y="32" width="336" height="536" fill="none" stroke="${g.accent}" stroke-width="0.75" stroke-opacity="0.2" rx="2" />
    
    <!-- Corner Decorators -->
    <circle cx="40" cy="40" r="3" fill="${g.gold}" opacity="0.7"/>
    <circle cx="360" cy="40" r="3" fill="${g.gold}" opacity="0.7"/>
    <circle cx="40" cy="560" r="3" fill="${g.gold}" opacity="0.7"/>
    <circle cx="360" cy="560" r="3" fill="${g.gold}" opacity="0.7"/>

    <!-- Geometric Center Emblem -->
    <g transform="translate(200, 160)">
      <circle r="44" fill="none" stroke="${g.accent}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.4" />
      <polygon points="0,-32 28,0 0,32 -28,0" fill="none" stroke="${g.gold}" stroke-width="2" opacity="0.85"/>
      <circle r="8" fill="${g.accent}" opacity="0.9" />
    </g>

    <!-- Title & Author Container -->
    <text x="200" y="270" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-weight="bold" font-size="24" fill="#ffffff" filter="url(#shadow)">
      ${breakSvgText(safeTitle, 22).map((line, i) => `<tspan x="200" dy="${i === 0 ? 0 : 28}">${line}</tspan>`).join('')}
    </text>

    <!-- Gold Divider -->
    <line x1="140" y1="410" x2="260" y2="410" stroke="${g.gold}" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>

    <text x="200" y="445" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="14" fill="${g.accent}" letter-spacing="2">
      ${safeAuthor.toUpperCase()}
    </text>

    <text x="200" y="525" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#a855f7" opacity="0.7" letter-spacing="3">
      EDICIÓN DIGITAL
    </text>

    <!-- 3D Book Spine Shadow -->
    <rect width="40" height="600" fill="url(#spineEffect)" rx="4" />
  </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function breakSvgText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4); // Max 4 lines
}

