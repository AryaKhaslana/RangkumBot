require('dotenv').config();
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Bot & Gemini
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('🤖 Bot Rangkuman (Powered by Gemini) siap tempur broskie! Menunggu foto...');

// Listener khusus untuk gambar/foto
bot.on('photo', async (ctx) => {
    try {
        await ctx.reply('Tunggu bentar, Gemini lagi mikir keras baca tulisan di foto lu... 🚀');
        
        // 1. Ambil resolusi gambar paling tajam dari Telegram
        const photo = ctx.message.photo.pop();
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);
        
        // 2. Download dan ubah ke format Base64
        const response = await fetch(fileLink.href);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // 3. Siapin Model Gemini 1.5 Flash (Paling ngebut buat baca foto)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = 'Lu adalah asisten belajar yang cerdas. Baca tulisan di papan tulis ini, perbaiki kalimat yang terpotong, dan buatkan rangkuman terstruktur. Pisahkan konsep utama, rumus (jika ada), dan kesimpulan. Gunakan format Markdown agar rapi.';
        
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
            }
        };

        // 4. Eksekusi Nembak API Gemini
        const result = await model.generateContent([prompt, imagePart]);
        const summary = result.response.text();
        
        // 5. Kirim balik ke Telegram pakai format Markdown
        try {
            await ctx.reply(summary, { parse_mode: 'Markdown' });
        } catch (parseError) {
            console.log("Telegram rewel soal format Markdown, kirim versi raw aja 🚀");
            // Kalau error formatting, kirim ulang tanpa parse_mode
            await ctx.reply(summary); 
        }

    } catch (error) {
        console.error("Ini errornya bro:", error);
        ctx.reply('Waduh *error* nih bro! Coba cek *log* di terminal.');
    }
});

// Jalankan bot
bot.launch();

// Biar bot mati dengan rapi kalau terminal di-close (Ctrl+C)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));