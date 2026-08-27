import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory persistent cloud store per user
interface UserCloudStorage {
  user: any;
  syncData?: any;
  lastUpdated: string;
}

const cloudDatabase = new Map<string, UserCloudStorage>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Service Worker explicit header to ensure maximum scope and instant update detection
  app.get('/sw.js', (req, res, next) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
  });

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BoraLib Cloud Sync & EPUB API',
      usersCount: cloudDatabase.size,
      uptime: process.uptime(),
    });
  });

  // Auth: Register or Login
  app.post('/api/auth/login', (req, res) => {
    const { email, name, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const userId = 'user_' + Buffer.from(email.toLowerCase().trim()).toString('hex').substring(0, 16);
    let userData = cloudDatabase.get(userId);

    if (!userData) {
      const newUser = {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      userData = {
        user: newUser,
        lastUpdated: new Date().toISOString(),
      };
      cloudDatabase.set(userId, userData);
    }

    res.json({
      success: true,
      user: userData.user,
      token: 'token_' + userId,
      hasCloudData: !!userData.syncData,
    });
  });

  // Cloud Sync: Push & Pull
  app.post('/api/sync', (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || 'guest_default';
    const clientData = req.body;

    let userStore = cloudDatabase.get(userId);
    if (!userStore) {
      userStore = {
        user: { id: userId },
        lastUpdated: new Date().toISOString(),
      };
      cloudDatabase.set(userId, userStore);
    }

    userStore.syncData = clientData;
    userStore.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: 'Datos sincronizados en la nube exitosamente',
      serverTimestamp: userStore.lastUpdated,
      bookCount: clientData.books?.length || 0,
      highlightsCount: clientData.highlights?.length || 0,
    });
  });

  app.get('/api/sync', (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || 'guest_default';
    const userStore = cloudDatabase.get(userId);

    if (!userStore || !userStore.syncData) {
      return res.json({
        exists: false,
        message: 'No hay datos en la nube previos para este usuario',
      });
    }

    res.json({
      exists: true,
      syncData: userStore.syncData,
      lastUpdated: userStore.lastUpdated,
    });
  });

  // Static Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraLib Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
