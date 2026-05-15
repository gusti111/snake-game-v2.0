const express = require("express");
const path = require("path"); // Modul wajib untuk navigasi direktori absolut
const app = express();

// 1. Mengunci folder 'public' dengan path absolut agar Vercel tidak bingung
app.use(express.static(path.join(__dirname, "public")));

// 2. Fallback eksplisit: Jika rute utama diakses, paksa kirim index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ekspor untuk Vercel Serverless
module.exports = app;

// Jalankan listener HANYA di lokal agar tidak bentrok dengan Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running di http://localhost:${PORT}`);
  });
}