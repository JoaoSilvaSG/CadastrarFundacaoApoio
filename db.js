const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.sqlite');

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar no banco', err);
      } else {
        console.log('Conectado ao SQLite:', DB_PATH);
      }
    });
  }

  run(sql, params = []) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new Database();
