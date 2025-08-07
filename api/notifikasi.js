// /pages/api/notifikasi.js

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = 844673353;
const OWNER_USERNAME = 'priliautami';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const config = {
  api: {
    bodyParser: true, // Pastikan ini true agar req.body bisa dibaca
  },
};

// notifikasi.js
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

    // Ambil data pesanan
    const { data: pesanan, error: pesananError } = await supabase
      .from('pesanan')
      .select('*')
      .eq('id', id_pesanan)
      .single();

    if (pesananError || !pesanan) {
      console.error('❌ Pesanan error:', pesananError);
      return res.status(404).json({ error: 'Pesanan not found' });
    }

    // Ambil item pesanan
    const { data: items, error: itemError } = await supabase
      .from('item_pesanan')
      .select('*')
      .eq('id_pesanan', id_pesanan);

    if (itemError) {
      console.error('❌ Item error:', itemError);
      return res.status(500).json({ error: 'Gagal ambil item pesanan' });
    }

    // Format rincian item
    let totalHarga = 0;
    const itemText = items.map((item, index) => {
      totalHarga += item.subtotal;
      return `${index + 1}. ${item.nama_item} x ${item.jumlah} = Rp ${item.subtotal.toLocaleString()}`;
    }).join('\n');

    const textPesanan = `🛒 *Pesanan Baru Masuk!*

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

    // === Kirim ke USER jika via Telegram
    if (pesanan.akses_via === 'telegram' && pesanan.telegram_user_id) {
      const { data: user } = await supabase
        .from('user_telegram')
        .select('chat_id')
        .eq('user_id', pesanan.telegram_user_id)
        .single();

      if (user?.chat_id) {
        const userText = `✅ *Pesanan kamu sudah kami terima!*\n\n${textPesanan}`;
        const tombolHubungi = {
          inline_keyboard: [[
            {
              text: "🧑‍🍳 Hubungi Penjual",
              url: `https://t.me/${OWNER_USERNAME}`
            }
          ]]
        };

        await sendTelegramMessage(user.chat_id, userText, tombolHubungi);
      }
    }

    return res.status(200).json({ success: true, message: 'Notifikasi terkirim' });

  } catch (err) {
    console.error('❌ Error Notifikasi:', err);
    return res.status(500).json({ error: 'Server error' });
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
