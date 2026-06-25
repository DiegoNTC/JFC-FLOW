/**
 * ======================================================
 * JFC FLOW
 * Model: Pedido
 * ======================================================
 */

export default class Pedido {

    constructor(dados) {

        this.codigo = dados.codigo;

        this.quantidade = Number(dados.quantidade);

        this.prioridade = Number(dados.prioridade ?? 0);

        this.pedidoFinal =
            this.quantidade +
            this.prioridade;

    }

}