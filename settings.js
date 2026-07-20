const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('./db'); // 19回目のやり取りで作成したdb.js

// 画像保存先の設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/settings-images/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `icon-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// 保存処理（POST /api/settings）
router.post('/api/settings', upload.single('image'), (req, res) => {
  const { department, employeeName, intervalSeconds, lastAccidentDate, weatherSource } = req.body;

  // バリデーション（サーバー側でも念のため再チェック）
  const interval = Number(intervalSeconds);
  if (!Number.isFinite(interval) || interval < 1) {
    return res.status(400).json({ error: '切り替え間隔が不正です' });
  }

  const imagePath = req.file ? `/uploads/settings-images/${req.file.filename}` : null;
  const updatedAt = new Date().toISOString();

  // 既存の image_path を保持したい（画像未指定時は上書きしない）ため、
  // まず現在のレコードを取得してから保存処理に進む
  db.get('SELECT image_path FROM settings WHERE id = 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '取得に失敗しました' });
    }

    const finalImagePath = imagePath ?? (row ? row.image_path : null);

    db.run(
      `INSERT INTO settings (id, department, employee_name, interval_seconds, last_accident_date, weather_source, image_path, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         department = excluded.department,
         employee_name = excluded.employee_name,
         interval_seconds = excluded.interval_seconds,
         last_accident_date = excluded.last_accident_date,
         weather_source = excluded.weather_source,
         image_path = excluded.image_path,
         updated_at = excluded.updated_at`,
      [department, employeeName, interval, lastAccidentDate, weatherSource, finalImagePath, updatedAt],
      function (err) {
        if (err) {
          return res.status(500).json({ error: '保存に失敗しました' });
        }
        res.status(200).json({ message: '保存しました' });
      }
    );
  });
});

// 取得処理（GET /api/settings）
router.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '取得に失敗しました' });
    }
    res.status(200).json(row ?? null);
  });
});

module.exports = router;