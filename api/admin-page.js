import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const authHeader = req.headers.authorization || '';
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    res.status(500).send('Admin credentials not configured.');
    return;
  }

  if (!authHeader.startsWith('Basic ')) {
    res.status(401).setHeader('WWW-Authenticate', 'Basic realm="Admin"').send('Non autorizzato');
    return;
  }

  const encoded = authHeader.slice(6);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  if (username !== expectedUser || password !== expectedPass) {
    res.status(401).setHeader('WWW-Authenticate', 'Basic realm="Admin"').send('Credenziali non valide');
    return;
  }

  const adminPath = path.join(process.cwd(), 'private', 'admin.html');
  try {
    const html = await fs.promises.readFile(adminPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Failed to load admin page:', error);
    res.status(500).send('Impossibile caricare la pagina admin.');
  }
}
