import { Book, Shelf, Highlight, Bookmark, ReadingSettings } from '../types';
import { generateFallbackCover } from './epubParser';

export const DEFAULT_SHELVES: Shelf[] = [
  {
    id: 'shelf-reading',
    name: 'Leyendo Actualmente',
    description: 'Libros en curso con progreso activo',
    color: '#9333ea', // purple-600
    icon: 'BookOpen',
    order: 0,
    isDefault: true,
  },
  {
    id: 'shelf-favorites',
    name: 'Favoritos',
    description: 'Mis lecturas predilectas y tesoros literarios',
    color: '#ec4899', // pink-500
    icon: 'Heart',
    order: 1,
    isDefault: true,
  },
  {
    id: 'shelf-classics',
    name: 'Clásicos Universales',
    description: 'Obras maestras de la literatura mundial',
    color: '#8b5cf6', // violet-500
    icon: 'Sparkles',
    order: 2,
    isDefault: false,
  },
  {
    id: 'shelf-toread',
    name: 'Por Leer',
    description: 'Próximas aventuras pendientes',
    color: '#06b6d4', // cyan-500
    icon: 'Clock',
    order: 3,
    isDefault: false,
  },
];

export const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 18,
  fontFamily: 'literata',
  theme: 'dark',
  lineHeight: 1.6,
  marginWidth: 'normal',
  textAlign: 'left',
  brightness: 100,
  soundEffects: true,
  autoScroll: false,
};

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-principito',
    title: 'El Principito',
    author: 'Antoine de Saint-Exupéry',
    coverUrl: generateFallbackCover('El Principito', 'Antoine de Saint-Exupéry'),
    description: 'Una obra poética y filosófica sobre el amor, la amistad y el sentido de la vida vista a través de los ojos de un pequeño príncipe de un asteroide lejano.',
    language: 'es',
    totalChapters: 4,
    currentChapterIndex: 0,
    progressPercent: 25,
    rating: 5,
    totalReadingTimeMinutes: 45,
    lastReadAt: new Date(Date.now() - 3600000).toISOString(),
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    shelfId: 'shelf-reading',
    tags: ['Clásico', 'Filosofía', 'Ilustrado'],
    fileSizeFormatted: '850 KB',
    isSample: true,
    chapters: [
      {
        id: 'p-chap-1',
        title: 'Dedicatoria y Capítulo I: El dibujo de la boa',
        href: 'cap1.xhtml',
        order: 0,
        content: `
          <div class="chapter-wrapper">
            <h1 class="text-2xl font-bold text-purple-300 mb-4">A León Werth</h1>
            <p class="italic text-slate-400 mb-6">Pido perdón a los niños por haber dedicado este libro a una persona grande. Tengo una seria razón para ello: esta persona grande es el mejor amigo que tengo en el mundo.</p>
            
            <h2 class="text-xl font-semibold text-purple-200 mt-6 mb-4">Capítulo I</h2>
            <p class="mb-4">Cuando yo tenía seis años vi en un libro sobre la selva virgen que se titulaba <em>Historias vividas</em>, una magnífica lámina. Representaba una serpiente boa que se tragaba a una fiera.</p>
            <p class="mb-4">El libro decía: «Las serpientes boas tragan sus presas enteras, sin masticarlas. Luego no pueden moverse y duermen durante los seis meses que dura su digestión».</p>
            <p class="mb-4">Reflexioné mucho entonces sobre las aventuras de la selva y, a mi vez, logré trazar con un lápiz de color mi primer dibujo. Mi dibujo número 1 era así: representaba un sombrero para las personas mayores, pero en realidad era una serpiente boa que digería un elefante.</p>
            <p class="mb-4">Las personas mayores me aconsejaron que dejara a un lado los dibujos de serpientes boas y que me interesara un poco más por la geografía, la historia, el cálculo y la gramática. Así fue como, a la edad de seis años, abandoné una magnífica carrera de pintor.</p>
          </div>
        `,
      },
      {
        id: 'p-chap-2',
        title: 'Capítulo II: El encuentro en el desierto del Sahara',
        href: 'cap2.xhtml',
        order: 1,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-xl font-semibold text-purple-200 mb-4">Capítulo II</h2>
            <p class="mb-4">Viví así, solo, sin nadie con quien hablar verdaderamente, hasta un día en que tuve una avería en el desierto de Sahara, hace seis años. Algo se había roto en mi motor. Y como no llevaba conmigo ni mecánico ni pasajeros, me dispuse a realizar, solo, una difícil reparación. Era para mí una cuestión de vida o muerte: apenas tenía agua de beber para ocho días.</p>
            <p class="mb-4">La primera noche me dormí sobre la arena, a mil millas de toda tierra habitada. Estaba más aislado que un náufrago en una balsa en medio del océano. Imaginaos, pues, mi sorpresa cuando, al romper el día, me despertó una extraña vocecita que decía:</p>
            <p class="p-3 bg-purple-900/30 border-l-4 border-purple-400 rounded my-4 italic font-serif">«—Por favor... ¡dibújame un cordero!»</p>
            <p class="mb-4">—¿Eh?</p>
            <p class="mb-4">—Dibújame un cordero...</p>
            <p class="mb-4">Me puse en pie de un salto, como herido por el rayo. Me froté bien los ojos. Miré bien. Y vi un hombrecito extraordinario que me examinaba gravemente.</p>
          </div>
        `,
      },
      {
        id: 'p-chap-3',
        title: 'Capítulo III: El asteroide B 612 y los baobabs',
        href: 'cap3.xhtml',
        order: 2,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-xl font-semibold text-purple-200 mb-4">Capítulo III & IV</h2>
            <p class="mb-4">Necesité mucho tiempo para comprender de dónde venía. El principito, que me hacía muchas preguntas, jamás parecía oír las mías. Fueron palabras pronunciadas al azar las que, poco a poco, me revelaron todo.</p>
            <p class="mb-4">Así supe que el planeta de donde venía era apenas más grande que una casa. Tengo serias razones para creer que el planeta del principito era el asteroide B 612.</p>
            <p class="mb-4">En el planeta del principito había, como en todos los planetas, hierbas buenas y hierbas malas. Por consiguiente, de buenas semillas salían buenas hierbas, y de malas semillas, malas hierbas. Ahora bien, las semillas son invisibles: duermen en el secreto de la tierra hasta que a una de ellas se le ocurre despertar. Si se trata de una ramita de rábano o de rosal, se la puede dejar brotar como quiera. Pero si se trata de una planta mala, hay que arrancar la planta inmediatamente, en cuanto se la ha reconocido. Y había semillas terribles en el planeta del principito: las semillas de <strong>baobab</strong>.</p>
          </div>
        `,
      },
      {
        id: 'p-chap-4',
        title: 'Capítulo XXI: El secreto del zorro',
        href: 'cap4.xhtml',
        order: 3,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-xl font-semibold text-purple-200 mb-4">Capítulo XXI</h2>
            <p class="mb-4">Fue entonces cuando apareció el zorro.</p>
            <p class="mb-4">—Buenos días —dijo el zorro.</p>
            <p class="mb-4">—Buenos días —respondió cortésmente el principito, que se volvió pero no vio nada.</p>
            <p class="mb-4">—Estoy aquí —dijo la voz—, bajo el manzano.</p>
            <p class="mb-4">—¿Quién eres? —dijo el principito—. Eres muy bonito...</p>
            <p class="mb-4">—Soy un zorro —dijo el zorro.</p>
            <p class="mb-4">—Ven a jugar conmigo —le propuso el principito—. ¡Estoy tan triste!...</p>
            <p class="mb-4">—No puedo jugar contigo —dijo el zorro—. No estoy domesticado.</p>
            <p class="mb-4">—¿Qué significa «domesticar»? —preguntó el principito.</p>
            <p class="mb-4">—Es una cosa demasiado olvidada —dijo el zorro—. Significa «crear lazos...»</p>
            <p class="p-4 bg-purple-950/80 border border-purple-500/50 rounded-xl my-6 text-purple-100 text-lg shadow-inner">
              «He aquí mi secreto. Es muy simple: <strong>no se ve bien sino con el corazón. Lo esencial es invisible a los ojos.</strong>»
            </p>
          </div>
        `,
      },
    ],
  },
  {
    id: 'book-quijote',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    coverUrl: generateFallbackCover('Don Quijote de la Mancha', 'Miguel de Cervantes'),
    description: 'La cumbre de la literatura hispánica que narra las peripecias del ingenioso hidalgo Alonso Quijano y su fiel escudero Sancho Panza.',
    language: 'es',
    totalChapters: 3,
    currentChapterIndex: 0,
    progressPercent: 10,
    rating: 5,
    totalReadingTimeMinutes: 120,
    lastReadAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    shelfId: 'shelf-classics',
    tags: ['Clásico', 'Novela', 'Siglo de Oro'],
    fileSizeFormatted: '1.4 MB',
    isSample: true,
    chapters: [
      {
        id: 'q-chap-1',
        title: 'Capítulo I: De la condición y ejercicio del famoso hidalgo',
        href: 'quijote1.xhtml',
        order: 0,
        content: `
          <div class="chapter-wrapper">
            <h1 class="text-2xl font-bold text-purple-300 mb-4">El ingenioso hidalgo Don Quijote de la Mancha</h1>
            <h2 class="text-lg font-semibold text-purple-200 mb-4">Capítulo Primero</h2>
            <p class="mb-4 font-serif text-lg leading-relaxed">
              En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.
            </p>
            <p class="mb-4">
              Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza. Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben.
            </p>
            <p class="mb-4">
              Es, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso —que eran los más del año—, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda; y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer.
            </p>
          </div>
        `,
      },
      {
        id: 'q-chap-2',
        title: 'Capítulo VII: De la segunda salida y la elección de Sancho Panza',
        href: 'quijote2.xhtml',
        order: 1,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-lg font-semibold text-purple-200 mb-4">Capítulo VII</h2>
            <p class="mb-4">En este tiempo solicitó don Quijote a un labrador vecino suyo, hombre de bien —si es que este título se puede dar al que es pobre—, pero de muy poca sal en la mollera. En resolución, tanto le dijo, tanto le persuadió y prometió, que el pobre villano se determinó de salirse con él y servirle de escudero.</p>
            <p class="mb-4">Decíale, entre otras cosas, don Quijote que se dispusiese a ir con él de buena gana, porque tal vez le podía suceder aventura que ganase, en quítame allá esas pajas, alguna ínsula, y le dejase a él por gobernador della. Con estas promesas y otras tales, Sancho Panza, que así se llamaba el labrador, dejó su mujer y hijos y asentó por escudero de su vecino.</p>
          </div>
        `,
      },
      {
        id: 'q-chap-3',
        title: 'Capítulo VIII: Del buen suceso con los molinos de viento',
        href: 'quijote3.xhtml',
        order: 2,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-lg font-semibold text-purple-200 mb-4">Capítulo VIII: Los Molinos de Viento</h2>
            <p class="mb-4">En esto, descubrieron treinta o cuarenta molinos de viento que hay en aquel campo; y, así como don Quijote los vio, dijo a su escudero:</p>
            <p class="mb-4">—La ventura va guiando nuestras cosas mejor de lo que acertáramos a desear; porque ves allí, amigo Sancho Panza, donde se descubren treinta, o pocos más, desaforados gigantes, con quien pienso hacer batalla y quitarles a todos las vidas, con cuyos despojos comenzaremos a enriquecer; que ésta es buena guerra, y es gran servicio de Dios quitar tan mala simiente de sobre la faz de la tierra.</p>
            <p class="mb-4">—¿Qué gigantes? —dijo Sancho Panza.</p>
            <p class="mb-4">—Aquellos que allí ves —respondió su amo— de los brazos largos, que los suelen tener algunos de casi dos leguas.</p>
            <p class="mb-4">—Mire vuestra merced —respondió Sancho— que aquellos que allí se parecen no son gigantes, sino molinos de viento, y lo que en ellos parecen brazos son las aspas, que, volteadas del viento, hacen andar la piedra del molino.</p>
          </div>
        `,
      },
    ],
  },
  {
    id: 'book-metamorfosis',
    title: 'La Metamorfosis',
    author: 'Franz Kafka',
    coverUrl: generateFallbackCover('La Metamorfosis', 'Franz Kafka'),
    description: 'La sobrecogedora historia de Gregorio Samsa, quien una mañana se despierta transformado en un monstruoso insecto.',
    language: 'es',
    totalChapters: 3,
    currentChapterIndex: 0,
    progressPercent: 0,
    rating: 4,
    totalReadingTimeMinutes: 60,
    lastReadAt: undefined,
    addedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    shelfId: 'shelf-toread',
    tags: ['Existencialismo', 'Clásico', 'Drama'],
    fileSizeFormatted: '620 KB',
    isSample: true,
    chapters: [
      {
        id: 'k-chap-1',
        title: 'Capítulo I: El despertar de Gregorio Samsa',
        href: 'kafka1.xhtml',
        order: 0,
        content: `
          <div class="chapter-wrapper">
            <h1 class="text-2xl font-bold text-purple-300 mb-4">La Metamorfosis</h1>
            <p class="mb-4 font-serif text-lg leading-relaxed">
              Cuando Gregorio Samsa se despertó una mañana después de un sueño intranquilo, se encontró sobre su cama convertido en un monstruoso insecto. Estaba tumbado sobre su espalda dura, y en forma de caparazón y, al levantar un poco la cabeza veía un vientre abombado, parduzco, dividido por partes duras en forma de arco.
            </p>
            <p class="mb-4">
              «¿Qué me ha ocurrido?», pensó. No era un sueño. Su habitación, una auténtica habitación humana, aunque un poco pequeña, permanecía tranquila entre las cuatro paredes harto conocidas. Sobre la mesa, sobre la cual se encontraba extendido un muestrario de paños desempaquetados —Samsa era viajante de comercio—, colgaba la estampa que hacía poco había recortado de una revista ilustrada.
            </p>
          </div>
        `,
      },
      {
        id: 'k-chap-2',
        title: 'Capítulo II: La nueva vida en la habitación',
        href: 'kafka2.xhtml',
        order: 1,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-xl font-semibold text-purple-200 mb-4">Capítulo II</h2>
            <p class="mb-4">Gregorio no se despertó de su pesado sueño hasta el atardecer. Seguramente no se habría despertado mucho más tarde, pues se sentía suficientemente descansado y repuesto, pero le pareció que le despertaba un paso sigiloso y un cerrar prudente de la puerta que daba al vestíbulo.</p>
            <p class="mb-4">Al lado de la puerta había un tazón lleno de leche dulce en la que flotaban pequeños pedacitos de pan blanco. Casi lloró de alegría, porque ahora tenía mucha más hambre que por la mañana.</p>
          </div>
        `,
      },
      {
        id: 'k-chap-3',
        title: 'Capítulo III: El desenlace y la partida',
        href: 'kafka3.xhtml',
        order: 2,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-xl font-semibold text-purple-200 mb-4">Capítulo III</h2>
            <p class="mb-4">La grave herida que sufrió Gregorio y que le hizo padecer durante más de un mes —la manzana permaneció incrustada en la carne como visible recuerdo, ya que nadie se atrevía a retirarla— pareció haber recordado incluso al padre que Gregorio, a pesar de su triste y repugnante forma actual, era un miembro de la familia a quien no se podía tratar como a un enemigo.</p>
          </div>
        `,
      },
    ],
  },
  {
    id: 'book-orgullo',
    title: 'Orgullo y Prejuicio',
    author: 'Jane Austen',
    coverUrl: generateFallbackCover('Orgullo y Prejuicio', 'Jane Austen'),
    description: 'La agudeza y el romance entre Elizabeth Bennet y el orgulloso señor Darcy en la Inglaterra del siglo XIX.',
    language: 'es',
    totalChapters: 2,
    currentChapterIndex: 0,
    progressPercent: 0,
    rating: 5,
    totalReadingTimeMinutes: 90,
    lastReadAt: undefined,
    addedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    shelfId: 'shelf-favorites',
    tags: ['Romance', 'Clásico', 'Inglaterra'],
    fileSizeFormatted: '1.1 MB',
    isSample: true,
    chapters: [
      {
        id: 'oa-chap-1',
        title: 'Capítulo I: Una verdad universalmente reconocida',
        href: 'orgullo1.xhtml',
        order: 0,
        content: `
          <div class="chapter-wrapper">
            <h1 class="text-2xl font-bold text-purple-300 mb-4">Orgullo y Prejuicio</h1>
            <p class="mb-4 font-serif text-lg leading-relaxed">
              Es una verdad universalmente reconocida que un hombre soltero, poseedor de una gran fortuna, necesita una esposa.
            </p>
            <p class="mb-4">
              Por poco conocidos que sean los sentimientos u opiniones de tal hombre a su primera llegada a un vecindario, esta verdad está tan arraigada en las mentes de las familias vecinas que se le considera de propiedad legítima de una u otra de sus hijas.
            </p>
            <p class="mb-4">
              —Querido señor Bennet —le dijo un día su señora—, ¿has oído que Netherfield Park ha sido alquilado al fin?
            </p>
            <p class="mb-4">
              El señor Bennet contestó que no.
            </p>
            <p class="mb-4">
              —Pues lo ha sido —insistió ella—; porque la señora Long acaba de estar aquí y me lo ha contado todo.
            </p>
          </div>
        `,
      },
      {
        id: 'oa-chap-2',
        title: 'Capítulo II: El baile y la llegada del señor Darcy',
        href: 'orgullo2.xhtml',
        order: 1,
        content: `
          <div class="chapter-wrapper">
            <h2 class="text-xl font-semibold text-purple-200 mb-4">Capítulo II</h2>
            <p class="mb-4">El señor Bennet fue uno de los primeros en visitar al señor Bingley. Siempre había tenido la intención de visitarle, aunque hasta el último momento aseguró a su esposa que no iría.</p>
            <p class="mb-4">El señor Darcy pronto atrajo la atención de la sala por su porte fino y distinguido, sus hermosos rasgos, noble porte y el rumor que circuló generalizadamente a los cinco minutos de su entrada de que gozaba de diez mil libras al año.</p>
          </div>
        `,
      },
    ],
  },
];

export const INITIAL_HIGHLIGHTS: Highlight[] = [
  {
    id: 'hl-1',
    bookId: 'book-principito',
    bookTitle: 'El Principito',
    chapterIndex: 3,
    chapterTitle: 'Capítulo XXI: El secreto del zorro',
    text: 'No se ve bien sino con el corazón. Lo esencial es invisible a los ojos.',
    note: 'La frase más representativa sobre la empatía y la auténtica conexión humana.',
    color: 'purple',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'hl-2',
    bookId: 'book-principito',
    bookTitle: 'El Principito',
    chapterIndex: 3,
    chapterTitle: 'Capítulo XXI: El secreto del zorro',
    text: 'Significa «crear lazos...»',
    note: 'El significado de domesticar según el zorro.',
    color: 'yellow',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'hl-3',
    bookId: 'book-quijote',
    bookTitle: 'Don Quijote de la Mancha',
    chapterIndex: 0,
    chapterTitle: 'Capítulo I: De la condición y ejercicio del famoso hidalgo',
    text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo...',
    note: 'Comienzo legendario de la literatura española.',
    color: 'green',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const INITIAL_BOOKMARKS: Bookmark[] = [
  {
    id: 'bm-1',
    bookId: 'book-principito',
    bookTitle: 'El Principito',
    chapterIndex: 3,
    chapterTitle: 'Capítulo XXI: El secreto del zorro',
    percentage: 85,
    previewText: '«He aquí mi secreto. Es muy simple: no se ve bien sino con el corazón...»',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'bm-2',
    bookId: 'book-quijote',
    bookTitle: 'Don Quijote de la Mancha',
    chapterIndex: 2,
    chapterTitle: 'Capítulo VIII: Del buen suceso con los molinos de viento',
    percentage: 15,
    previewText: 'En esto, descubrieron treinta o cuarenta molinos de viento que hay en aquel campo...',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];
