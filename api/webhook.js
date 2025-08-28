// === Telegram & Supabase Bot (Vercel) - Versi Lengkap Owner/Admin ===

import { createClient } from '@supabase/supabase-js';

import axios from 'axios';

import getRawBody from 'raw-body';



const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_KEY = process.env.SUPABASE_KEY;



const OWNER_USER_ID = 844673353;

const ADMIN_USER_IDS = [81358099];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);





export const config = {

  api: {

    bodyParser: false

  }

};



export default async function handler(req, res) {

  console.log('🚀 Webhook endpoint hit!');

  

  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');



  try {

    const rawBody = await getRawBody(req);

    const data = JSON.parse(rawBody.toString('utf8'));

    console.log('📥 Webhook Data:', data);



    if (data.message) {

      await handleMessage(data.message);

    }      
if (data.callback_query) {
await handleCallbackQuery(data.callback_query);
}

    



    return res.status(200).send('OK');

  } catch (err) {

    console.error('Webhook Error:', err);

    return res.status(500).send('Error handling update');

  }

}



async function handleMessage(message) {

  console.log('✅ handleMessage triggered:', message.text);

  const chatId = message.chat.id;

  const text = message.text;

  const userId = message.from.id;

  const userName = message.from.first_name || 'User';



  await saveUserToDatabase(userId, userName, chatId);



  const isOwner = userId === OWNER_USER_ID;

  const isAdmin = isAdminUser(userId);
  
  // 🔹 Tangani input manual untuk tanggal/bulan
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) && isAdmin) {
    return showOrderDetail(chatId, "date", text);
  }
  if (/^\d{4}-\d{2}$/.test(text) && isAdmin) {
    return showOrderDetail(chatId, "month_custom", text);
  }

  switch (text) {

    case '/start':

      if (isOwner) await sendOwnerWelcomeMessage(chatId, userName);

      else await sendWelcomeMessage(chatId, userName);

      break;



    case '🍽️ Lihat Menu':

      await showMenu(chatId);

      break;



    case '🛒 Pesanan Saya':

      await showMyOrders(chatId, userId);

      break;



    case '🌐 Buka Website':

      await sendMessage(chatId, '🌐 Klik tombol di bawah untuk buka website:', {

        inline_keyboard: [[

          {

            text: "🔗 Buka Website",

            url: `https://tifusa62.github.io/New-Dapur-Kana/index.html?uid=${userId}`

          }

        ]]

      });

      break;



    case '📞 Kontak':

      await sendMessage(chatId, getContactText());

      break;



    case '❓ Bantuan':

      await sendMessage(chatId, getHelpText());

      break;



    case '👑 Panel Admin':

      if (isAdmin) await showAdminPanel(chatId);

      else await sendMessage(chatId, '❌ Anda tidak memiliki akses ke panel admin.');

      break;



    case '📊 Laporan Pesanan':

      if (isAdmin) await showOrderReport(chatId);

      break;



    case '📈 Statistik':

      if (isAdmin) await showStatistics(chatId);

      break;



    case '👥 Data User':

      if (isAdmin) await showUserData(chatId);

      break;



    case '🍽️ Kelola Menu':

      if (isAdmin) await showMenuManagement(chatId);

      break;



    case '📢 Broadcast':

      if (isOwner) {

        await sendMessage(

          chatId,

          "📢 Silakan ketik pesan broadcast dengan format:\n\n" +

          "`/broadcast Teks pesan`\n\n" +

          "Atau kirim foto + caption untuk broadcast foto.",

          { parse_mode: "Markdown" }

        );

      }

      break;



    default:

      // ✅ Deteksi /broadcast teks

      if (text && text.startsWith('/broadcast ') && isOwner) {

        const msg = text.replace('/broadcast ', '');

        await sendBroadcastMessage({ message: msg });

        await sendMessage(chatId, '✅ Broadcast teks terkirim.');

      }

      // ✅ Deteksi broadcast foto (owner kirim gambar + caption)

      else if (message.photo && isOwner) {

        const fileId = message.photo[message.photo.length - 1].file_id;

        const caption = message.caption || "";

        await sendBroadcastMessage({ message: caption, photo: fileId });

        await sendMessage(chatId, '✅ Broadcast foto terkirim.');

      }

      else {

        await sendMessage(chatId, '🤖 Maaf, perintah tidak dikenali. Ketik /start.');

      }

  }

}



async function sendMessage(chatId, text, replyMarkup = null) {

  const payload = {

    chat_id: chatId,

    text: text,

    parse_mode: 'Markdown'

  };



  if (replyMarkup) {

    payload.reply_markup = replyMarkup;

  }



  try {

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, payload);

  } catch (error) {

    console.error('Error sending message:', error.response?.data || error.message);

  }

}



async function saveUserToDatabase(userId, userName, chatId) {

  await supabase.from('user_telegram').upsert({

    user_id: userId,

    nama: userName,

    chat_id: chatId,

    created_at: new Date().toISOString()

  }, { onConflict: 'user_id' });

}



async function sendWelcomeMessage(chatId, userName) {

  const text = `🎉 Selamat datang di *Dapur Kana*, ${userName}!  

Kami siap menyajikan berbagai pilihan menu rumahan yang enak, sehat, dan praktis 🍱🍰



📌 *Cara Menggunakan Bot Ini:*

1️⃣ Gunakan tombol menu di bawah untuk mulai berinteraksi  

2️⃣ Pilih \`🍽️ Lihat Menu\` untuk melihat daftar makanan & minuman  

3️⃣ Klik \`🛒 Pesanan Saya\` untuk melihat riwayat pesananmu  

4️⃣ Pilih \`🌐 Buka Website\` untuk pemesanan lengkap  



🛍️ *Cara Pemesanan via Website:*

1. Klik tombol \`🌐 Buka Website\`  

2. Pilih menu favoritmu, isi jumlah & data pesanan  

3. Pilih metode pembayaran (COD / Transfer)  

4. Jika Transfer, upload bukti pembayaran  

5. Klik *Pesan Sekarang* dan tunggu konfirmasi  



⚡ *Atau Order Instan Lewat Aplikasi:*

🍴 GoFood: [Klik di sini](https://gofood.link/a/zVUowgj)  

🛵 ShopeeFood: [Klik di sini](https://shopee.co.id/universal-link/now-food/shop/22294798?deep_and_deferred=1&shareChannel=copy_link)



📞 *Kontak & Bantuan:*  

Klik \`📞 Kontak\` untuk info lebih lanjut.



Terima kasih sudah memilih Dapur Kana! 💚`;



  const keyboard = {

    keyboard: [

      ['🍽️ Lihat Menu', '🛒 Pesanan Saya'],

      ['🌐 Buka Website', '📞 Kontak'],

      ['❓ Bantuan']

    ],

    resize_keyboard: true,

    one_time_keyboard: false

  };



  await sendMessage(chatId, text, keyboard);

}

async function sendOwnerWelcomeMessage(chatId, userName) {

  const text = `👑 Selamat datang Owner ${userName}!\n🎛️ Panel Admin Dapur Kana siap digunakan.`;

  await sendMessage(chatId, text, {

  keyboard: [

    ['👑 Panel Admin', '📊 Laporan Pesanan'],

    ['📈 Statistik', '👥 Data User'],

    ['🍽️ Kelola Menu', '📢 Broadcast'],

    ['🍽️ Lihat Menu', '🌐 Buka Website']

  ],

  resize_keyboard: true,

  one_time_keyboard: false

});

}

async function showMenu(chatId) {

  const { data: menu } = await supabase.from('menu').select('*');

  if (!menu || menu.length === 0) return sendMessage(chatId, '📭 Menu belum tersedia');



  let text = `*MENU DAPUR KANA:*

\n`;

  menu.forEach((m, i) => {

    const harga = (m.price !== null && m.price !== undefined)

  ? `Rp ${Number(m.price).toLocaleString()}`

  : 'Harga tidak tersedia';



text += `${i + 1}. *${m.name}* - ${harga}\n${m.description || ''}\n\n`;

  });

  await sendMessage(chatId, text);

}



async function showMyOrders(chatId, userId) {

  const { data: userData } = await supabase

    .from('user_telegram')

    .select('nama')

    .eq('user_id', userId)

    .single();



  const userName = userData?.nama || 'Pengguna';



  const { data: pesananList } = await supabase

    .from('pesanan')

    .select('id, metode, created_at, akses_via')

    .eq('telegram_user_id', userId)

    .order('created_at', { ascending: false });



  if (!pesananList || pesananList.length === 0) {

    return sendMessage(chatId, `📭 Hai *${userName}*, kamu belum pernah melakukan pesanan.`);

  }



  let text = `*📦 Riwayat Pesanan untuk ${userName}:*\n\n`;



  for (let i = 0; i < pesananList.length; i++) {

    const p = pesananList[i];



    const tgl = new Date(p.created_at).toLocaleString('id-ID', {

      dateStyle: 'medium',

      timeStyle: 'short',

      timeZone: 'Asia/Jakarta'

    });



    // Ambil item pesanan untuk id_pesanan ini

    const { data: itemList } = await supabase

      .from('item_pesanan')

      .select('id_menu, jumlah')

      .eq('id_pesanan', p.id);



    // Ambil data menu untuk semua id_menu (sekali query)

    const idMenuList = itemList?.map(item => item.id_menu) || [];

    let menuMap = {};



    if (idMenuList.length > 0) {

      const { data: menuList } = await supabase

        .from('menu')

        .select('id, name')

        .in('id', idMenuList);



      menuList.forEach(menu => {

        menuMap[menu.id] = menu.name;

      });

    }



    const itemText = itemList.length > 0

      ? itemList.map(item => {

          const name = menuMap[item.id_menu] || 'Item Tidak Dikenal';

          return `${name} x${item.jumlah}`;

        }).join(', ')

      : 'Tidak ada item';



    text += `*#${i + 1}* - _${tgl}_\n`;

    text += `• Metode: *${p.metode}*\n`;

    text += `• Via: ${p.akses_via || '-'}\n`;

    text += `• Item: ${itemText}\n\n`;

  }



  await sendMessage(chatId, text);

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

  await sendMessage(chatId, text);

}



async function showOrderReport(chatId) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Query Supabase
  const { data: todayOrders } = await supabase
    .from("pesanan")
    .select("total_harga")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  const { data: monthOrders } = await supabase
    .from("pesanan")
    .select("total_harga")
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  const totalToday = todayOrders?.length || 0;
  const omzetToday = todayOrders?.reduce((a, b) => a + (b.total_harga || 0), 0) || 0;

  const totalMonth = monthOrders?.length || 0;
  const omzetMonth = monthOrders?.reduce((a, b) => a + (b.total_harga || 0), 0) || 0;

  const bulanNama = new Date().toLocaleString("id-ID", { month: "long", year: "numeric" });
  const tglHariIni = new Date().toLocaleDateString("id-ID", { dateStyle: "long" });

  let text = `📊 *Laporan Pesanan*\n\n`;
  text += `📅 Hari ini (${tglHariIni})\n• Total Pesanan: ${totalToday}\n• Omzet: Rp${omzetToday.toLocaleString()}\n\n`;
  text += `📅 Bulan ini (${bulanNama})\n• Total Pesanan: ${totalMonth}\n• Omzet: Rp${omzetMonth.toLocaleString()}`;

  // Tombol inline
  const keyboard = {
    inline_keyboard: [
      [
        { text: "📋 Rincian Hari Ini", callback_data: "detail_today" },
        { text: "📋 Rincian Bulan Ini", callback_data: "detail_month" }
      ],
      [
        { text: "📅 Pilih Tanggal", callback_data: "pick_date" },
        { text: "📅 Pilih Bulan", callback_data: "pick_month" }
      ]
    ]
  };

  await sendMessage(chatId, text, keyboard);
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

  await sendMessage(chatId, text);

}



async function showUserData(chatId) {

  const { data } = await supabase.from('user_telegram').select('*');

  const text = `📋 Total user: ${data.length}`;

  await sendMessage(chatId, text);

}



async function showMenuManagement(chatId) {

  const url = 'https://tifusa62.github.io/New-Dapur-Kana/owner.html';

  const text = `🛠️ *Kelola Menu*\n\nKlik link berikut untuk mengelola menu Dapur Kana:\n${url}`;

  await sendMessage(chatId, text);

}

// --- Broadcast ke semua user ---

async function sendBroadcastMessage({ message, photo }) {

  const { data: users, error } = await supabase.from("user_telegram").select("chat_id");

  if (error) {

    console.error("Error ambil user:", error);

    return;

  }



  for (let u of users) {

    try {

      if (photo) {

        // broadcast foto (pakai file_id supaya cepat, tidak perlu URL)

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            chat_id: u.chat_id,

            photo: photo,

            caption: `📢 ${message || ""}`

          })

        });

      } else {

        // broadcast teks

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            chat_id: u.chat_id,

            text: `📢 ${message}`

          })

        });

      }

      await new Promise(r => setTimeout(r, 200)); // biar aman flood limit

    } catch (err) {

      console.error("Gagal kirim ke", u.chat_id, err);

    }

  }

}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "detail_today") {
    await showOrderDetail(chatId, "today");
  } else if (data === "detail_month") {
    await showOrderDetail(chatId, "month");
  } else if (data === "pick_date") {
    await sendMessage(chatId, "📅 Masukkan tanggal dengan format: `YYYY-MM-DD`", { force_reply: true });
  } else if (data === "pick_month") {
    await sendMessage(chatId, "📅 Masukkan bulan dengan format: `YYYY-MM`", { force_reply: true });
  }
}
async function showOrderDetail(chatId, mode, customDate = null) {
  let start, end;

  if (mode === "today") {
    const today = new Date();
    start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    end = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  } else if (mode === "month") {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  } else if (mode === "date") {
    start = new Date(customDate + "T00:00:00").toISOString();
    end = new Date(customDate + "T23:59:59").toISOString();
  } else if (mode === "month_custom") {
    const [year, month] = customDate.split("-");
    start = new Date(year, month - 1, 1).toISOString();
    end = new Date(year, month, 0, 23, 59, 59).toISOString();
  }

  const { data: pesananList } = await supabase
    .from("pesanan")
    .select("id, nama, no_hp, alamat, metode, total_harga, created_at, status")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  if (!pesananList || pesananList.length === 0) {
    return sendMessage(chatId, "📭 Tidak ada pesanan pada periode ini.");
  }

  let totalOmzet = 0;
  let reportText = `📋 *Rincian Pesanan (${mode})*\n\n`;

  for (let p of pesananList) {
    totalOmzet += p.total_harga || 0;

    const { data: itemList } = await supabase
      .from("item_pesanan")
      .select("id_menu, jumlah, harga_satuan")
      .eq("id_pesanan", p.id);

    const idMenuList = itemList?.map(it => it.id_menu) || [];
    let menuMap = {};
    if (idMenuList.length > 0) {
      const { data: menuList } = await supabase
        .from("menu")
        .select("id, name")
        .in("id", idMenuList);
      menuList.forEach(m => (menuMap[m.id] = m.name));
    }

    const itemsText = itemList && itemList.length > 0
      ? itemList.map(it => {
          const nama = menuMap[it.id_menu] || "Item?";
          return `- ${nama} x${it.jumlah} @Rp${(it.harga_satuan || 0).toLocaleString()}`;
        }).join("\n")
      : "Tidak ada item";

    const tgl = new Date(p.created_at).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta"
    });

    reportText += `🆔 *ID:* ${p.id}\n👤 ${p.nama} | 📞 ${p.no_hp}\n🏠 ${p.alamat}\n📅 ${tgl}\n💳 ${p.metode} | 📦 ${p.status}\n🍽️ Item:\n${itemsText}\n💰 Rp${(p.total_harga || 0).toLocaleString()}\n\n`;
  }

  reportText += `📦 Total Pesanan: ${pesananList.length}\n💰 Omzet: Rp${totalOmzet.toLocaleString()}`;

  await sendMessage(chatId, reportText);
}

// --- Cek admin ---

function isAdminUser(id) {

  const admins = [OWNER_USER_ID, ...ADMIN_USER_IDS];

  return admins.includes(id);

}
