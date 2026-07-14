import { neon } from '@neondatabase/serverless';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const payload = req.body || {};

  const orderData = {
    ragione: payload.ragione || 'n/d',
    torto: payload.torto || 'n/d',
    oggetto: payload.oggetto || payload.subject || 'n/d',
    email: payload.email || null,
    package: payload.package || 'n/d', 
    packageName: payload.packageName || payload.package || 'n/d', 
    price: payload.price || 'n/d',
  };

  const order = {
    ...orderData,
    timestamp: new Date().toISOString(),
  };

  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Stringa di connessione al database mancante.");
    }

    // Inizializza il client di Neon
    const sql = neon(connectionString);

    // 1. Crea la tabella se non esiste (con stato_pagamento)
    await sql`
      CREATE TABLE IF NOT EXISTS ordini (
        id SERIAL PRIMARY KEY,
        ragione VARCHAR(255),
        torto VARCHAR(255),
        oggetto TEXT,
        email VARCHAR(255),
        pacchetto VARCHAR(100),
        prezzo VARCHAR(50),
        stato_pagamento VARCHAR(50) DEFAULT 'PENDING',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 1b. Per sicurezza, se la tabella esisteva già, aggiungiamo la colonna se manca
    await sql`
      ALTER TABLE ordini ADD COLUMN IF NOT EXISTS stato_pagamento VARCHAR(50) DEFAULT 'PENDING';
    `;

    // 2. Inserisce l'ordine
    const result = await sql`
      INSERT INTO ordini (ragione, torto, oggetto, email, pacchetto, prezzo, stato_pagamento)
      VALUES (${order.ragione}, ${order.torto}, ${order.oggetto}, ${order.email}, ${order.package}, ${order.price}, 'PENDING')
      RETURNING id;
    `;
    
    order.id = result[0].id;
    order.stato_pagamento = 'PENDING';

  } catch (error) {
    console.error('Failed to save order to Database:', error);
    return res.status(500).json({ ok: false, error: 'Impossibile salvare l\'ordine nel database.' });
  }  

  // ==========================================
  // LOGICA EMAIL CON NODEMAILER (BREVO SMTP)
  // ==========================================
  const gmailUser = process.env.GMAIL_USER;       // Lo username SMTP (es. b20671001@smtp-brevo.com)
  const gmailPass = process.env.GMAIL_APP_PASS;   // La password SMTP di Brevo
  
  // Questa è la tua email reale verificata su Brevo che useremo come mittente e destinatario admin
  const realEmail = 'erunesto99@gmail.com'; 
  const adminRecipient = process.env.ORDER_TO_EMAIL || realEmail;

  if (!gmailUser || !gmailPass) {
    console.log('[Debate Over] Nuovo ordine ricevuto (SMTP non configurato):', order);
    res.status(200).json({
      ok: true,
      message: 'Ordine ricevuto e salvato nel DB. Configura le variabili per inviare email.',
      order
    });
    return;
  }

  // Configura il trasportatore di Nodemailer per Brevo
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: gmailUser, 
      pass: gmailPass, 
    },
  });

  let adminEmailSent = false;
  let customerEmailSent = false;

  // 1. Invio email all'Admin
  try {
    const adminEmailHtml = `
      <h2>Nuovo ordine ricevuto (ID: ${order.id})</h2>
      <p><strong>Chi ha ragione:</strong> ${order.ragione}</p>
      <p><strong>Chi ha torto:</strong> ${order.torto}</p>
      <p><strong>Oggetto:</strong> ${order.oggetto}</p>
      <p><strong>Pacchetto:</strong> ${order.package}</p>
      <p><strong>Prezzo:</strong> ${order.price}</p>
      <p><strong>Email Cliente:</strong> ${order.email || 'n/d'}</p>
      <p><strong>Timestamp:</strong> ${order.timestamp}</p>
    `;

    await transporter.sendMail({
      from: `"Debate Over" <${realEmail}>`, // Mittente autorizzato
      to: adminRecipient.split(',').map((item) => item.trim()).filter(Boolean),
      subject: `Nuovo ordine Debate Over [#${order.id}] - ${order.package}`,
      html: adminEmailHtml,
    });

    adminEmailSent = true;
  } catch (error) {
    console.error('Invio notifica ordine all\'admin fallito:', error);
  }

  // 2. Invio email di conferma al Cliente (se ha inserito l'email)
  if (order.email) {
    try {
      const customerEmailHtml = `
        <h1>Il tuo ordine è stato registrato!</h1>
        <p>Ciao ${order.ragione},</p>
        <p>Abbiamo ricevuto la tua richiesta per ufficializzare la tua ragione riguardo a: "<strong>${order.oggetto}</strong>".</p>
        <p>Hai scelto il pacchetto: <strong>${order.packageName}</strong>.</p>
        <p>Stai per essere reindirizzato alla pagina di pagamento per completare l'ordine e ricevere il tuo certificato.</p>
        <p>Grazie per aver scelto Debate Over per ristabilire la verità.</p>
        <hr>
        <p><small>Riepilogo: Ordine #${order.id}, Controparte: ${order.torto}, Prezzo: ${order.price}</small></p>
      `;

      await transporter.sendMail({
        from: `"Debate Over" <${realEmail}>`, // Mittente autorizzato
        to: order.email,
        subject: `Conferma ordine Debate Over: ${order.packageName}`,
        html: customerEmailHtml,
      });

      customerEmailSent = true;
    } catch (error) {
      console.error('Invio conferma ordine al cliente fallito:', error);
    }
  }

  const message = `Ordine ricevuto e salvato nel Database. Notifica admin: ${adminEmailSent ? 'OK' : 'Fallita'}. Conferma cliente: ${customerEmailSent ? 'OK' : 'Fallita/Non richiesta'}.`;
  res.status(200).json({
    ok: true,
    message,
    order
  });
}