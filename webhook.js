export default async function handler(req, res) {
  const token = '7981245691:AAHUZvl-qlWjyCpTAOOR0h3K1_pflUHNhO8';

  const body = req.body;

  if (body.message && body.message.text === '/start') {
    const chatId = body.message.chat.id;
    const name = body.message.from.first_name || 'User';
    const message = `Halo ${name} 🍅! Selamat datang 👋`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  }

  res.status(200).send('OK');
}