const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL || 'https://play.geforcenow.com';

// Middleware
app.use(cors());
app.use(express.json());

// ==================== ОБЯЗАТЕЛЬНЫЕ МАРШРУТЫ ====================

// 1. ГЛАВНАЯ СТРАНИЦА (чтобы не было "Not Found")
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GeForce NOW Proxy</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; }
        .card { background: rgba(255,255,255,0.15); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { background: #00d4aa; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        code { background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 GeForce NOW Proxy Active</h1>
        
        <div class="card">
          <h3>✅ Сервер работает</h3>
          <p><strong>Статус:</strong> <span style="color:#00ff88">ONLINE</span></p>
          <p><strong>Время:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>URL:</strong> ${req.protocol}://${req.get('host')}</p>
        </div>
        
        <div class="card">
          <h3>📡 Доступные эндпоинты:</h3>
          <ul>
            <li><a href="/health" style="color:#00d4ff;">GET <code>/health</code></a> - Проверка работы</li>
            <li><code>GET /api/*</code> - Прокси GET запросы</li>
            <li><code>POST /api/*</code> - Прокси POST запросы</li>
            <li><a href="/stream" style="color:#00d4ff;">GET <code>/stream</code></a> - WebSocket тест</li>
          </ul>
        </div>
        
        <div class="card">
          <h3>🎯 Назначение:</h3>
          <p>Этот сервер перенаправляет запросы на: <code>${TARGET_URL}</code></p>
          <p>Используется для доступа к GeForce NOW через прокси.</p>
        </div>
        
        <button class="btn" onclick="window.location.href='/health'">Проверить здоровье сервера</button>
        
        <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">Автоматически развернуто на Render • ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `);
});

// 2. HEALTH CHECK (обязательно!)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GeForce NOW Proxy Server is running',
    timestamp: new Date().toISOString(),
    version: '2.0',
    target: TARGET_URL
  });
});

// 3. ПРОКСИ ЭНДПОИНТЫ
app.get('/api/*', async (req, res) => {
  try {
    const path = req.params[0];
    const url = `${TARGET_URL}/${path}`;
    const query = Object.keys(req.query).length ? `?${new URLSearchParams(req.query)}` : '';
    
    console.log(`[PROXY] GET ${url}${query}`);
    
    const response = await axios.get(`${url}${query}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
});

app.post('/api/*', async (req, res) => {
  try {
    const path = req.params[0];
    const url = `${TARGET_URL}/${path}`;
    
    console.log(`[PROXY] POST ${url}`);
    
    const response = await axios.post(url, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
});

// 4. WebSocket маскировка (ВАЖНО для обхода блокировок)
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/live', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/live': '' },
  logLevel: 'silent'
}));

app.get('/stream', (req, res) => {
  res.send('<h2>WebSocket Tunnel Active</h2><p>For persistent connections.</p>');
});

// 5. 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <div style="padding: 40px; text-align: center;">
      <h1>404 - Страница не найдена</h1>
      <p>Запрошенный путь <code>${req.path}</code> не существует.</p>
      <p><a href="/">Вернуться на главную</a></p>
    </div>
  `);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n✅ Server started on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🎯 Target: ${TARGET_URL}\n`);
});

module.exports = app;
