require('dotenv').config();
const { Telegraf, session, Markup } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Bot & Gemini
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Pakai model yang lu bilang udah jalan
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

// Aktifin fitur Session (memori bot)
bot.use(session());

// Middleware buat ngasih memori default kalau user baru nge-chat
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = { mode: 'chat', history: [] };
    }
    return next();
});

console.log('🤖 Bot Multi-Mode siap tempur broskie! Menunggu perintah...');

// ==========================================
// 1. TRIGGER DROPDOWN MENU KETIKA DISAPA
// ==========================================
bot.hears(/^(halo|hai|p|bot|menu)$/i, async (ctx) => {
    // Reset history ngobrol setiap kali manggil menu baru
    ctx.session.history = []; 
    
    await ctx.reply('Woyyy broskie! Mau dibantu apa kita hari ini? Pilih mode di bawah:', 
        Markup.inlineKeyboard([
            [Markup.button.callback('💬 Tanya Sekarep (Ngobrol)', 'mode_chat')],
            [Markup.button.callback('📝 Rangkum Papan Tulis', 'mode_papan')],
            [Markup.button.callback('📸 Analisis Foto Bebas', 'mode_foto')],
            [Markup.button.callback('🎓 Bedah Soal UTBK', 'mode_utbk')]
        ])
    );
});

// ==========================================
// 2. LOGIC KETIKA TOMBOL DROPDOWN DIPENCET
// ==========================================
bot.action(/mode_(.+)/, async (ctx) => {
    const selectedMode = ctx.match[1];
    
    // Simpan pilihan mode ke memori bot
    ctx.session.mode = selectedMode;
    ctx.session.history = []; // bersihin riwayat chat sebelumnya

    let replyMsg = '';
    if (selectedMode === 'chat') replyMsg = 'Gas! Mode ngobrol aktif. Mau bahas apa nih?';
    if (selectedMode === 'papan') replyMsg = 'Siap! Mode papan tulis. Jepret catatannya dan kirim ke mari 🚀';
    if (selectedMode === 'foto') replyMsg = 'Mode foto bebas. Kirim gambar apa aja, nanti gw tebak/jelasin isinya 🕵️‍♂️';
    if (selectedMode === 'utbk') replyMsg = 'Mode Tutor UTBK! Kirim teks atau foto soalnya, mari kita bedah *logic*-nya sampai tuntas 🧠';

    await ctx.answerCbQuery(); // Biar loading di tombol Telegramnya hilang
    await ctx.reply(replyMsg);
});

// ==========================================
// 3. LOGIC BUAT NERIMA TEKS (TEXT MESSAGE)
// ==========================================
bot.on('text', async (ctx) => {
    const userMode = ctx.session.mode;
    const userText = ctx.message.text;

    // Kalau disapa pakai halo/p/menu, jangan masuk ke AI
    if (/^(halo|hai|p|bot|menu)$/i.test(userText)) return;

    try {
        await ctx.reply('Bentar, lagi mikir... 🤔');

        if (userMode === 'chat') {
            // Mode Tanya Sekarep (Bisa nyambung konteks/balas-balasan)
            const chat = model.startChat({ history: ctx.session.history });
            const result = await chat.sendMessage(userText);
            const responseText = result.response.text();
            
            // Simpan riwayat obrolan ke session
            ctx.session.history.push(
                { role: "user", parts: [{ text: userText }] },
                { role: "model", parts: [{ text: responseText }] }
            );

            await ctx.reply(responseText, { parse_mode: 'Markdown' }).catch(() => ctx.reply(responseText));
            
        } else if (userMode === 'utbk') {
            // Mode UTBK (Bisa lewat teks juga kalau males foto)
            const prompt = `Lu adalah tutor cerdas. Bedah soal berikut dengan detail. Berikan penjelasan konsepnya, langkah penyelesaian, dan jawaban akhirnya: \n\n${userText}`;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            await ctx.reply(responseText, { parse_mode: 'Markdown' }).catch(() => ctx.reply(responseText));

        } else {
            // Kalau lagi di mode foto tapi ngirim teks
            await ctx.reply('Woy, lu kan lagi milih mode Foto/Papan! Kirim gambarnya dong, jangan teks doang 🤣 (Atau ketik "menu" buat ganti mode)');
        }
    } catch (error) {
        console.error(error);
        await ctx.reply('Waduh error bos! Coba cek terminal.');
    }
});

// ==========================================
// 4. LOGIC BUAT NERIMA FOTO (PHOTO MESSAGE)
// ==========================================
bot.on('photo', async (ctx) => {
    const userMode = ctx.session.mode;

    // Kalau user milih mode Chat tapi malah ngirim foto
    if (userMode === 'chat') {
        return ctx.reply('Lu lagi di Mode Ngobrol woy! Kalau mau analisis foto, ketik "menu" dan pilih mode yang ada fotonya.');
    }

    try {
        await ctx.reply('Lagi scan gambarnya nih broskie, tunggu ya... 🚀');
        
        const photo = ctx.message.photo.pop();
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);
        
        const response = await fetch(fileLink.href);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        const imagePart = {
            inlineData: { data: base64Image, mimeType: "image/jpeg" }
        };

        let prompt = '';

        // Tentukan sistem prompt berdasarkan mode yang lagi aktif
        if (userMode === 'papan') {
            prompt = 'Lu adalah asisten belajar. Baca tulisan di papan tulis ini, perbaiki kalimat yang terpotong, dan buatkan rangkuman terstruktur. Pisahkan konsep utama, rumus, dan kesimpulan menggunakan Markdown.';
        } else if (userMode === 'foto') {
            prompt = 'Tolong deskripsikan gambar ini dengan detail, informatif, dan gaya bahasa santai.';
        } else if (userMode === 'utbk') {
            prompt = 'Lu adalah tutor. Di dalam gambar ini ada soal ujian. Tolong baca soalnya, bedah konsep utamanya, jelaskan alasan mengapa jawaban yang salah itu salah, dan berikan jawaban yang benar beserta penjelasan logisnya secara terstruktur.';
        }

        const result = await model.generateContent([prompt, imagePart]);
        const summary = result.response.text();
        
        // Trik Fallback biar nggak kena error entity Markdown Telegram
        try {
            await ctx.reply(summary, { parse_mode: 'Markdown' });
        } catch (e) {
            console.log("Fallback ke raw text");
            await ctx.reply(summary); 
        }

    } catch (error) {
        console.error(error);
        ctx.reply('Waduh error nih! Coba ulangi atau cek terminal.');
    }
});

// Jalankan bot
bot.launch();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));