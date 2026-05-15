// server.js
// Menjalankan server dengan Express.js
// Menyajikan file dari folder public dan menjalankan aplikasi di browser

const express = require("express");
const app = express();

app.use(express.static("public"));

// [PENGEMBANGAN] Export app agar kompatibel dengan Vercel (serverless)
module.exports = app;

app.listen(3000, () => {
  console.log("Server running di http://localhost:3000");
});
