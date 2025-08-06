export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const token = '7981245691:AAHUZvl-qlWjyCpTAOOR0h3K1_pflUHNhO8'; // Ganti dengan token bot kamu
  const { message } = req.body;

  if (message && message.text === '/start') {
    const chatId = message.chat.id;
    const name = message.from.first_name || 'User';
    const text = `Halo ${name} 🍅! Selamat datang 👋`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }

  res.status(200).send('OK');
}
