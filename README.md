# 🤖 Bot Rangkuman Papan Tulis (Smart Board Summarizer)

Bot Telegram pintar yang dirancang untuk mempermudah proses belajar dengan cara mengubah foto catatan di papan tulis menjadi rangkuman teks terstruktur secara otomatis. Sangat cocok untuk menghemat waktu mencatat di kelas!

Bot ini ditenagai oleh **Google Gemini 1.5 Flash** untuk memproses *Optical Character Recognition* (OCR) sekaligus *Natural Language Processing* (NLP) agar rangkuman yang dihasilkan rapi, mudah dibaca, dan berformat Markdown.

## ✨ Fitur Utama
- **Instant OCR & Summarization**: Kirim foto papan tulis, bot akan langsung membaca dan merangkum intisarinya.
- **Auto-Formatting**: Mengelompokkan teks menjadi Konsep Utama, Rumus (jika ada), dan Kesimpulan.
- **Graceful Fallback**: Dilengkapi dengan *error handling* jika Telegram gagal melakukan *parsing* format Markdown, sehingga catatan tetap aman terkirim dalam format *raw text*.
- **Background Process Ready**: Terkonfigurasi untuk berjalan mulus di *background* menggunakan PM2.

## 🛠️ Tech Stack
- **Environment**: [Node.js](https://nodejs.org/) (v18+)
- **Bot Framework**: [Telegraf](https://telegraf.js.org/)
- **AI Engine**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini 1.5 Flash)
- **Process Manager**: [PM2](https://pm2.keymetrics.io/) (Untuk scheduling & background task)
