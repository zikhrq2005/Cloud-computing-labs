const app = require('../server');
const server = app.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  console.log(`Cloud Issue API listening on http://127.0.0.1:${port} (test)`);
  process.send({ port });
});
