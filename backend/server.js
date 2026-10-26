require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });
const express = require('express');
const issueRoutes = require('./routes/issues');
const app = express();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use('/api/issues', issueRoutes);
app.use((req, res) => {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found.' } });
});
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON.' } });
  }
  if (error.status === 415) {
    return res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported request encoding or charset.' } });
  }
  if (error.status >= 400 && error.status < 500) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body could not be accepted.' } });
  }
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
});

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`Cloud Issue API listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

module.exports = app;
