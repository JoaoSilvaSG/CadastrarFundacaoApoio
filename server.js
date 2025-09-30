const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const FoundationDAO = require('./DAO/FoundationDAO');

const PORT = process.env.PORT || 3000;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject({ status: 400, message: 'JSON inválido.' });
      }
    });
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(__dirname, 'public', pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
}

(async () => {
  await FoundationDAO.init(); 

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    try {
      if (req.method === 'GET' && (pathname === '/' || pathname.startsWith('/index') || pathname.startsWith('/app.js'))) {
        return serveStatic(req, res);
      }

      if (pathname.startsWith('/api/fundacoes')) {
        if (req.method === 'POST' && pathname === '/api/fundacoes') {
          const body = await parseBody(req);
          const created = await FoundationDAO.create(body);
          return sendJson(res, 201, { message: 'Fundação cadastrada com sucesso.', data: created });
        }

        if (req.method === 'GET' && pathname === '/api/fundacoes') {
          const { cnpj } = parsedUrl.query;
          if (cnpj) {
            const found = await FoundationDAO.findByCNPJ(cnpj);
            if (!found) return sendJson(res, 404, { message: 'Fundação não encontrada' });
            return sendJson(res, 200, { data: found });
          } else {
            const all = await FoundationDAO.listAll();
            return sendJson(res, 200, { data: all });
          }
        }

        const putMatch = pathname.match(/^\/api\/fundacoes\/(\d+)$/);
        if (req.method === 'PUT' && putMatch) {
          const id = Number(putMatch[1]);
          const body = await parseBody(req);
          const updated = await FoundationDAO.update(id, body);
          return sendJson(res, 200, { message: 'Atualizado com sucesso.', data: updated });
        }

        const delMatch = pathname.match(/^\/api\/fundacoes\/(\d+)$/);
        if (req.method === 'DELETE' && delMatch) {
          const id = Number(delMatch[1]);
          await FoundationDAO.delete(id);
          return sendJson(res, 200, { message: 'Excluído com sucesso.' });
        }
      }

      res.writeHead(404);
      res.end('Not found');
    } catch (err) {
      console.error(err);
      const status = err && err.status ? err.status : 500;
      const message = err && err.message ? err.message : 'Erro interno';
      return sendJson(res, status, { error: message });
    }
  });

  server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
})();
