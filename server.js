const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Middleware untuk menyajikan file statis (HTML, CSS, Gambar) dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_profile",
  port: process.env.DB_PORT || 3306
};

let pool;

async function initializeDbPool() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log("Berhasil terhubung ke database MySQL!");
  } catch (error) {
    console.error("Gagal terhubung ke database MySQL:", error);
    process.exit(1);
  }
}

initializeDbPool();

app.get("/api/profiles", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM profiles ORDER BY createdAt DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Kesalahan saat mengambil profil:", error);
    res.status(500).json({ message: "Kesalahan server internal." });
  }
});

app.get("/api/profiles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Profil tidak ditemukan." });
    }
    res.json(rows);
  } catch (error) {
    console.error("Kesalahan saat mengambil profil berdasarkan ID:", error);
    res.status(500).json({ message: "Kesalahan server internal." });
  }
});

app.post("/api/profiles", async (req, res) => {
  const { name, description } = req.body;
  const id = Date.now().toString();
  const createdAt = new Date();
  const modifiedAt = new Date();

  if (!name || !description) {
    return res.status(400).json({ message: "Nama dan deskripsi diperlukan." });
  }

  try {
    await pool.query(
      "INSERT INTO profiles (id, name, description, createdAt, modifiedAt) VALUES (?, ?, ?, ?, ?)",
      [id, name, description, createdAt, modifiedAt]
    );
    res.status(201).json({
      id,
      name,
      description,
      createdAt,
      modifiedAt,
      message: "Profil berhasil ditambahkan.",
    });
  } catch (error) {
    console.error("Kesalahan saat menambahkan profil:", error);
    res.status(500).json({ message: "Kesalahan server internal." });
  }
});

app.put("/api/profiles/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const modifiedAt = new Date();

  if (!name || !description) {
    return res.status(400).json({ message: "Nama dan deskripsi diperlukan." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE profiles SET name = ?, description = ?, modifiedAt = ? WHERE id = ?",
      [name, description, modifiedAt, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Profil tidak ditemukan." });
    }
    res.json({
      id,
      name,
      description,
      modifiedAt,
      message: "Profil berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Kesalahan saat memperbarui profil:", error);
    res.status(500).json({ message: "Kesalahan server internal." });
  }
});

app.delete("/api/profiles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM profiles WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Profil tidak ditemukan." });
    }
    res.json({ message: "Profil berhasil dihapus." });
  } catch (error) {
    console.error("Kesalahan saat menghapus profil:", error);
    res.status(500).json({ message: "Kesalahan server internal." });
  }
});

app.listen(port, () => {
  console.log(`Server backend berjalan di http://localhost:${port}`);
});
