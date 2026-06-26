/**
 * ======================================================
 * Modelo de Produto
 * ======================================================
 */

export class Produto {

    constructor(dados) {

        this.codigo = dados.codigo;

        this.descricao = dados.descricao;

        this.categoria = dados.categoria || "";

        this.linha = dados.linha;

        this.zona = dados.zona;

        this.sequencia = dados.sequencia;

        this.tempo = dados.tempo;

        this.setup = dados.setup;

        this.produtividade = dados.produtividade;

        this.observacao = dados.observacao || "";

    }

}