class Foundation {
  constructor({ id = null, nome, cnpj, email = '', telefone = '', instituicao = '' }) {
    this.id = id;
    this.nome = nome;
    this.cnpj = cnpj;
    this.email = email;
    this.telefone = telefone;
    this.instituicao = instituicao;
  }

  validate() {
    function normalizeCNPJ(cnpjAux) {
      if (!cnpjAux) return '';
      return cnpjAux.replace(/\D/g, '');
    }

    const errors = [];
    if (!this.nome || this.nome.trim().length < 3) errors.push('Nome inválido.');
    if (!this.cnpj || normalizeCNPJ(this.cnpj).length !== 14) errors.push('CNPJ inválido (14 dígitos).');
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) errors.push('Email inválido.');
    return errors;
  }
}

module.exports = Foundation;
