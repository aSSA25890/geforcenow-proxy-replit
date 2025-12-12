
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL || 'https://play.geforcenow.com';

app.use(cors());
app.use(express.json());

// ==================== ОБЯЗАТЕЛЬНЫЕ МАРШРУТЫ ====================

// 1. ГЛАВНАЯ СТРАНИЦА (убьет "Not Found")
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>GeForce NOW Proxy</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial; margin: 40px; background: #0f0f23; color: #00ff00; }
      .container { max-width: 800px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 15px; }
      .status { background: #162447; padding: 20px; border-radius: 10px; margin: 20px 0; }
      .btn { background: #00d4aa; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
    </style></head>
    <body>
      <div class="container">
        <h1>🚀 Прокси-сервер GeForce NOW</h1>
        <div class="status">
          <p><strong>Статус:</strong> <span style="color:#00ff88">ОНЛАЙН</span></p>
          <p><strong>Время:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Адрес:</strong> ${req.protocol}://${req.get('host')}</p>
        </div>
        <p>Этот сервер перенаправляет запросы на: <code>${TARGET_URL}</code></p>
        <p><a href="/health"><button class="btn">Проверить работоспособность</button></a></p>
      </div>
    </body>
    </html>
  `);
});

// 2. HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GeForce NOW Proxy Server is running',
    timestamp: new Date().toISOString(),
    target: TARGET_URL
  });
});

// 3. WebSocket маскировка
app.use('/live', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/live': '' },
  logLevel: 'silent'
}));

// 4. Простые прокси-эндпоинты
app.get('/api/*', async (req, res) => {
  try {
    const url = `${TARGET_URL}/${req.params[0]}`;
    const response = await axios.get(url);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
