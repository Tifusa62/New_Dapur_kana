// /api/notifikasi.js
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = 844673353; // Telegram chat ID Owner
const OWNER_USERNAME = 'priliautami'; // username Telegram owner (tanpa @)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { id_pesanan } = req.body;
    if (!id_pesanan) return res.status(400).send('Missing id_pesanan');

    // Ambil data pesanan
    const { data: pesanan, error } = await supabase
      .from('pesanan')
      .select('*')
      .eq('id', id_pesanan)
      .single();
    if (error || !pesanan) return res.status(404).send('Pesanan not found');

    // Ambil item pesanan
    const { data: itemList } = await supabase
      .from('item_pesanan')
      .select('*')
      .eq('id_pesanan', id_pesanan);

    let totalHarga = 0;
    const itemText = itemList.map((item, i) => {
      totalHarga += item.subtotal;
      return `${i + 1}. ${item.nama_item} x ${item.jumlah} = Rp ${item.subtotal.toLocaleString()}`;
    }).join('\n');

    const textPesanan = `🛒 *Pesanan Baru Masuk!*\n
👤 *${pesanan.nama}*
📍 ${pesanan.alamat}
📞 ${pesanan.no_tlp}
📝 Catatan: ${pesanan.catatan || '-'}
💰 Metode: ${pesanan.metode}
📦 Via: ${pesanan.akses_via}

*🧾 Rincian Pesanan:*
${itemText}

💳 *Total: Rp ${totalHarga.toLocaleString()}*`;

    // === Kirim ke OWNER
    await sendTelegramMessage(OWNER_CHAT_ID, textPesanan);

    // === Kirim ke USER (jika via Telegram)
    if (pesanan.akses_via === 'telegram' && pesanan.telegram_user_id) {
      const { data: user } = await supabase
        .from('user_telegram')
        .select('chat_id')
        .eq('user_id', pesanan.telegram_user_id)
        .single();

      if (user && user.chat_id) {
        const userText = `✅ *Pesanan kamu sudah kami terima!*\n\n${textPesanan}`;
        const tombolHubungi = {
          inline_keyboard: [[{
            text: "🧑‍🍳 Hubungi Penjual",
            url: `https://t.me/${OWNER_USERNAME}`
          }]]
        };

        await sendTelegramMessage(user.chat_id, userText, tombolHubungi);
      }
    }

    return res.status(200).send('Notifikasi terkirim');
  } catch (err) {
    console.error('❌ Error Notifikasi:', err);
    return res.status(500).send('Server Error');
  }
}

async function sendTelegramMessage(chat_id, text, replyMarkup = null) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id,
      text,
      parse_mode: 'Markdown',
      ...(replyMarkup && { reply_markup: replyMarkup })
    });
  } catch (err) {
    console.error('❌ Gagal kirim ke Telegram:', err.response?.data || err.message);
  }
}
