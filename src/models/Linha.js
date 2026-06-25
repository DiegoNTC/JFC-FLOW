/**
 * ======================================================
 * JFC FLOW
 * Model: Linha
 * ======================================================
 */

export default class Linha {

    constructor(nome) {

        this.nome = nome;

        this.produtos = [];

        this.tempoTotal = 0;

        this.setupTotal = 0;

        this.capacidade = 0;

    }

}