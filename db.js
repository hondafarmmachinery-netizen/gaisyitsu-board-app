const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// プロジェクト内に database.sqlite というファイルを作成・接続する
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('SQLiteデータベースに接続しました');
  }
});

// settings テーブルを作成（すでに存在する場合は何もしない）
db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    department TEXT,
    employee_name TEXT,
    interval_seconds INTEGER,
    last_accident_date TEXT,
    weather_source TEXT,
    image_path TEXT,
    updated_at TEXT
  )
`, (err) => {
  if (err) {
    console.error('テーブル作成エラー:', err.message);
  } else {
    console.log('settings テーブルを準備しました');
  }
});

module.exports = db;