/**
 * ======================================================
 * JFC FLOW
 * Planning Engine
 *
 * Responsável por transformar
 * Pedido -> Planejamento
 * ======================================================
 */

export default class PlanningEngine {

    constructor() {

        this.pedidos = [];

    }

    adicionarPedido(pedido) {

        this.pedidos.push(pedido);

    }

    limpar() {

        this.pedidos = [];

    }

    getPedidos() {

        return this.pedidos;

    }

}