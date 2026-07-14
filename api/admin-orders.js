import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Metodo non permesso' });
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

  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Stringa di connessione al database mancante.");
    }

    const sql = neon(connectionString);

    // Allineamento colonne tabella (per sicurezza)
    await sql`
      ALTER TABLE ordini ADD COLUMN IF NOT EXISTS elaborato BOOLEAN DEFAULT FALSE;
    `;
    await sql`
      ALTER TABLE ordini ADD COLUMN IF NOT EXISTS stato_pagamento VARCHAR(50) DEFAULT 'PENDING';
    `;

    // Selezioniamo i dati rinominandoli (con AS) per farli combaciare al volo con il frontend dell'admin
    const dbOrders = await sql`
      SELECT 
        id, 
        ragione, 
        torto, 
        oggetto, 
        email, 
        pacchetto AS package,       -- Mappato come richiesto dal JS admin
        prezzo AS price,            -- Mappato come richiesto dal JS admin
        stato_pagamento,            -- Nuovo campo pagamento
        data_creazione as timestamp,
        elaborato as processed
      FROM ordini
      ORDER BY data_creazione DESC;
    `;
    
    res.status(200).json({ ok: true, orders: dbOrders });
  } catch (error) {
    console.error('Failed to fetch orders from DB:', error);
    res.status(500).json({ ok: false, error: 'Impossibile recuperare gli ordini dal database.' });
  }
}