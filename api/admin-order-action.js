import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    res.status(500).json({ ok: false, error: 'Le credenziali admin non sono ancora configurate nel deploy.' });
    return;
  }

  if (!authHeader.startsWith('Basic ')) {
    res.status(401).json({ ok: false, error: 'Non autorizzato' });
    return;
  }

  const encoded = authHeader.slice(6);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  if (username !== expectedUser || password !== expectedPass) {
    res.status(401).json({ ok: false, error: 'Credenziali non valide' });
    return;
  }

  // Decodifica del corpo
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  } else if (Buffer.isBuffer(body)) {
    try { body = JSON.parse(body.toString('utf8')); } catch (e) { body = {}; }
  }

  // Estraiamo l'azione
  const action = body.action;
  
  // IL TRUCCHETTO: Se il frontend invia 'timestamp' invece di 'id', noi lo prendiamo lo stesso!
  const rawId = body.id || body.timestamp; 

  if (!action || rawId === undefined || rawId === null) {
    res.status(400).json({ ok: false, error: 'Richiesta mancante di action e id' });
    return;
  }

  // Postgres richiede un numero per la colonna ID, quindi lo convertiamo
  const id = Number(rawId);

  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Stringa di connessione al database mancante.");
    }

    const sql = neon(connectionString);

    // Eseguiamo l'azione SQL
    if (action === 'delete') {
      await sql`DELETE FROM ordini WHERE id = ${id};`;
    } else if (action === 'mark_processed') {
      await sql`UPDATE ordini SET elaborato = TRUE WHERE id = ${id};`;
    } else if (action === 'unmark_processed') {
      await sql`UPDATE ordini SET elaborato = FALSE WHERE id = ${id};`;
    } else {
      res.status(400).json({ ok: false, error: 'Azione non riconosciuta' });
      return;
    }

    // Recuperiamo la lista aggiornata
    const updatedOrders = await sql`
      SELECT 
        id, 
        ragione, 
        torto, 
        oggetto, 
        email, 
        pacchetto AS package,
        prezzo AS price,
        stato_pagamento,
        data_creazione as timestamp,
        elaborato as processed
      FROM ordini
      ORDER BY data_creazione DESC;
    `;

    res.status(200).json({ ok: true, orders: updatedOrders });
  } catch (error) {
    console.error('admin-order-action failed', error);
    res.status(500).json({ ok: false, error: 'Operazione fallita' });
  }
}