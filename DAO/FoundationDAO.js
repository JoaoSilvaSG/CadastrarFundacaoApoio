const db = require('../db');
const Foundation = require('../models/Foundation');

class FoundationDAO {
  async init() {
    const fs = require('fs');
    const path = require('path');
    const initSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'init.sql'), 'utf8');
    await db.run(initSql).catch(err => {
      return new Promise((resolve, reject) => {
        db.db.exec(initSql, (e) => e ? reject(e) : resolve());
      });
    });
  }

  async create(data) {
    const f = new Foundation(data);
    const errs = f.validate();
    if (errs.length) throw { status: 400, message: errs.join(' ') };
    try {
      const res = await db.run(
        `INSERT INTO fundacoes (nome, cnpj, email, telefone, instituicao) VALUES (?, ?, ?, ?, ?)`,
        [f.nome, f.cnpj, f.email, f.telefone, f.instituicao]
      );
      f.id = res.id;
      return f;
    } catch (err) {
      if (err && err.message && err.message.includes('UNIQUE')) {
        throw { status: 409, message: 'Já existe uma fundação com esse CNPJ.' };
      }
      throw err;
    }
  }

  async findByCNPJ(cnpj) {
    const normalized = Foundation.normalizeCNPJ(cnpj);
    const row = await db.get(`SELECT * FROM fundacoes WHERE cnpj = ?`, [normalized]);
    return row ? new Foundation(row) : null;
  }

  async findById(id) {
    const row = await db.get(`SELECT * FROM fundacoes WHERE id = ?`, [id]);
    return row ? new Foundation(row) : null;
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw { status: 404, message: 'Fundação não encontrada.' };

    const updated = new Foundation({
      id,
      nome: data.nome ?? existing.nome,
      cnpj: data.cnpj ?? existing.cnpj,
      email: data.email ?? existing.email,
      telefone: data.telefone ?? existing.telefone,
      instituicao: data.instituicao ?? existing.instituicao
    });

    const errs = updated.validate();
    if (errs.length) throw { status: 400, message: errs.join(' ') };

    await db.run(
      `UPDATE fundacoes SET nome = ?, cnpj = ?, email = ?, telefone = ?, instituicao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [updated.nome, updated.cnpj, updated.email, updated.telefone, updated.instituicao, id]
    );
    return updated;
  }

  async delete(id) {
    const res = await db.run(`DELETE FROM fundacoes WHERE id = ?`, [id]);
    if (res.changes === 0) throw { status: 404, message: 'Fundação não encontrada.' };
    return true;
  }

  async listAll() {
    const rows = await db.all(`SELECT * FROM fundacoes ORDER BY id DESC`);
    return rows.map(r => new Foundation(r));
  }
}

module.exports = new FoundationDAO();
