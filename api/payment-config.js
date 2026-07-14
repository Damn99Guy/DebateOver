export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    paypalAction: 'https://www.paypal.com/cgi-bin/webscr',
    hostedButtonId: 'MLL9TXMJVDLCQ'
  });
}
