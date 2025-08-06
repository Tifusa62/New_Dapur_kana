// === Telegram & Supabase Bot (Vercel) - Versi Lengkap Owner/Admin ===
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const WEBSITE_URL = 'https://tifusa62.github.io/New-Dapur-Kana/index.html';

const OWNER_USER_ID = 844673353;
const ADMIN_USER_IDS = [81358099];
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const data = req.body;
  if (data.message) await handleMessage(data.message);
  else if (data.callback_query) {} // handleCallbackQuery bisa ditambahkan jika dibutuhkan
  res.status(200).send('OK');
  }
  module.exports = handler;

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id;
  const userName = message.from.first_name || 'User';
  await saveUserToDatabase(userId, userName, chatId);

  const isOwner = userId === OWNER_USER_ID;
  const isAdmin = ADMIN_USER_IDS.includes(userId);

  switch (text) {
    case '/start':
      if (isOwner) sendOwnerWelcomeMessage(chatId, userName);
      else sendWelcomeMessage(chatId, userName);
      break;
    case '🍽️ Lihat Menu':
      showMenu(chatId);
      break;
    case '🛒 Pesanan Saya':
      showMyOrders(chatId, userId);
      break;
    case '🌐 Buka Website':
      sendMessage(chatId, getWebsiteText());
      break;
    case '📞 Kontak':
      sendMessage(chatId, getContactText());
      break;
    case '❓ Bantuan':
      sendMessage(chatId, getHelpText());
      break;
    case '👑 Panel Admin':
      if (isAdmin) showAdminPanel(chatId);
      else sendMessage(chatId, '❌ Anda tidak memiliki akses ke panel admin.');
      break;
    case '📊 Laporan Pesanan':
      if (isAdmin) showOrderReport(chatId);
      break;
    case '📈 Statistik':
      if (isAdmin) showStatistics(chatId);
      break;
    case '👥 Data User':
      if (isAdmin) showUserData(chatId);
      break;
    case '🍽️ Kelola Menu':
      if (isAdmin) showMenuManagement(chatId);
      break;
    case '📢 Broadcast':
  if (isOwner) {
    sendMessage(chatId, `📢 Silakan ketik pesan seperti:

/broadcast Halo semua!`);
  }
  break;
    default:
      if (text.startsWith('/broadcast ') && isOwner) {
        const msg = text.replace('/broadcast ', '');
        sendBroadcastMessage(msg);
        sendMessage(chatId, '✅ Broadcast dikirim.');
      } else {
        sendMessage(chatId, '🤖 Maaf, perintah tidak dikenali. Ketik /start.');
      }
  }
}

async function sendMessage(chatId, text, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown'
  };
  if (keyboard) payload.reply_markup = { keyboard, resize_keyboard: true };

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function saveUserToDatabase(userId, userName, chatId) {
  await supabase.from('user_telegram').upsert({
    user_id: userId,
    nama: userName,
    chat_id: chatId,
    created_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

function sendWelcomeMessage(chatId, userName) {
  const text = `🎉 Selamat datang di Dapur Kana, ${userName}!
🍽️ Kami menyediakan berbagai hidangan lezat untuk Anda.`;
  const keyboard = [['🍽️ Lihat Menu', '🛒 Pesanan Saya'], ['🌐 Buka Website', '📞 Kontak'], ['❓ Bantuan']];
  sendMessage(chatId, text, keyboard);
}

function sendOwnerWelcomeMessage(chatId, userName) {
  const text = `👑 Selamat datang Owner ${userName}!
🎛️ Panel Admin Dapur Kana siap digunakan.`;
  const keyboard = [['👑 Panel Admin', '📊 Laporan Pesanan'], ['📈 Statistik', '👥 Data User'], ['🍽️ Kelola Menu', '📢 Broadcast'], ['🍽️ Lihat Menu', '🌐 Buka Website']];
  sendMessage(chatId, text, keyboard);
}

async function showMenu(chatId) {
  const { data: menu } = await supabase.from('menu').select('*');
  if (!menu || menu.length === 0) return sendMessage(chatId, '📭 Menu belum tersedia');

  let text = `*MENU DAPUR KANA:*
\n`;
  menu.forEach((m, i) => {
    text += `${i + 1}. *${m.nama}* - Rp ${m.harga.toLocaleString()}\n${m.deskripsi || ''}\n\n`;
  });
  sendMessage(chatId, text);
}

async function showMyOrders(chatId, userId) {
  const { data: pesanan } = await supabase.from('pesanan').select('*').eq('user_id', userId);
  if (!pesanan || pesanan.length === 0) return sendMessage(chatId, '🚫 Tidak ada pesanan');

  let text = '*PESANAN ANDA:*\n';
  pesanan.forEach((p, i) => {
    text += `#${i + 1} - Rp ${p.total_harga}\n${p.metode} | ${p.status} | ${p.waktu}\n\n`;
  });
  sendMessage(chatId, text);
}

function getWebsiteText() {
  return `🌐 Website: [Klik di sini](${WEBSITE_URL})`;
}

function getContactText() {
  return `📞 Kontak Dapur Kana:\nWhatsapp: 0823-3493-5818\nEmail: oishidzato@gmail.com`;
}

function getHelpText() {
  return `❓ Bantuan:\nGunakan menu /start untuk memulai kembali.`;
}

async function showAdminPanel(chatId) {
  const { data: users } = await supabase.from('user_telegram').select('*');
  const { data: orders } = await supabase.from('pesanan').select('*');
  const { data: menu } = await supabase.from('menu').select('*');

  const text = `👑 *Panel Admin*

📊 Total Pengguna: ${users.length}
📦 Total Pesanan: ${orders.length}
🍽️ Total Menu: ${menu.length}`;
  sendMessage(chatId, text);
}

async function showOrderReport(chatId) {
  const { data } = await supabase.from('pesanan').select('*');
  const total = data.reduce((acc, p) => acc + p.total_harga, 0);
  sendMessage(chatId, `📊 Total Transaksi: ${data.length}\n💰 Total Omzet: Rp ${total.toLocaleString()}`);
}

async function showStatistics(chatId) {
  const { data: pesanan } = await supabase.from('pesanan').select('*');
  const grouped = pesanan.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  let text = '*Statistik Status Pesanan:*\n';
  for (let status in grouped) {
    text += `• ${status}: ${grouped[status]} pesanan\n`;
  }
  sendMessage(chatId, text);
}

async function showUserData(chatId) {
  const { data } = await supabase.from('user_telegram').select('*');
  const text = `📋 Total user: ${data.length}`;
  sendMessage(chatId, text);
}

async function showMenuManagement(chatId) {
  const { data } = await supabase.from('menu').select('*');
  if (!data || data.length === 0) return sendMessage(chatId, 'Menu kosong');
  let text = '*Kelola Menu:*\n';
  data.forEach((m, i) => {
    text += `${i + 1}. *${m.nama}* - Rp ${m.harga.toLocaleString()}\n`;
  });
  sendMessage(chatId, text);
}

async function sendBroadcastMessage(message) {
  const { data: users } = await supabase.from('user_telegram').select('chat_id');
  for (let u of users) {
    await sendMessage(u.chat_id, `📢 ${message}`);
    await new Promise(r => setTimeout(r, 100));
  }
}


