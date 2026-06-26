/**
 * ======================================================
 * JFC FLOW
 * Módulo: importState
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Guardar temporariamente os arquivos importados.
 * ======================================================
 */

let dadosCSVAtual = [];

let baseTXTAtual = null;

export function setDadosCSV(dados) {

  dadosCSVAtual = Array.isArray(dados)
    ? dados
    : [];

}

export function getDadosCSV() {

  return dadosCSVAtual;

}

export function setBaseTXT(base) {

  baseTXTAtual = base || null;

}

export function getBaseTXT() {

  return baseTXTAtual;

}

export function limparImportacoes() {

  dadosCSVAtual = [];

  baseTXTAtual = null;

}