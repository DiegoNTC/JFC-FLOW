/**
 * ======================================================
 * JFC FLOW
 * Model: Produto
 * Versão: 0.6.0
 * ======================================================
 */

export default class Produto {

    constructor(dados) {

        this.codigo = dados.codigo;

        this.descricao = dados.descricao;

        this.linha = dados.linha;

        this.categoria = dados.categoria;

        this.tempoCaixa = Number(dados.tempoCaixa);

        this.ativo = dados.ativo ?? true;

    }

}