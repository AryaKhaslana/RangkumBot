require('dotenv').config();

async function cariModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("Bentar broskie, lagi ngintip server Google... 🕵️‍♂️");

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("\n=== DAFTAR MODEL YANG BISA LU PAKE ===");
        
        // Looping semua model dari server
        data.models.forEach(model => {
            // Kita saring yang cuma bisa dipake buat generate teks/gambar
            if (model.supportedGenerationMethods.includes("generateContent")) {
                // Hapus tulisan 'models/' di depannya biar lu gampang copy
                const namaModelClean = model.name.replace('models/', '');
                console.log(`✅ ${namaModelClean}`);
            }
        });
        console.log("======================================\n");
        console.log("💡 Tips: Copy salah satu nama di atas dan paste ke index.js lu!");

    } catch (error) {
        console.error("Waduh gagal ngecek bos:", error);
    }
}

cariModel();