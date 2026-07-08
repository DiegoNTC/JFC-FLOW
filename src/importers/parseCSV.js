/**
 * ======================================================
 * JFC FLOW
 * Módulo: parseCSV
 * Versão: 1.4.0
 *
 * Responsabilidade:
 * Ler o CSV de pedidos do dia LINHA A LINHA.
 *
 * Decisão operacional:
 * - NÃO consolidar produtos duplicados.
 * - NÃO somar linhas repetidas.
 * - Cada linha válida do CSV vira um registro independente.
 * - O cruzamento posterior com o Cadastro Mestre decide se o
 *   item entra no planejamento.
 *
 * Categorias permitidas:
 * - processados
 * - institucional
 * - mcdonalds
 *
 * Quantidade da linha:
 * - se Pedidos > 0: Pedidos + Prioritários
 * - senão, se Prévia > 0: Prévia
 * - senão: Prioritários
 *
 * Importante:
 * O código do produto é texto.
 * Nunca converter código para Number.
 * ======================================================
 */

import {
  categoriasPermitidas
} from "../core/categoriasPermitidas.js";

function parseNumero(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  return Number(
    String(valor)
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "")
  ) || 0;

}

function limparTexto(valor) {

  return String(valor || "")
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/""/g, "\"");

}

function normalizarCategoria(categoria) {

  return limparTexto(categoria)
    .toLowerCase()
    .trim();

}

function normalizarCabecalho(valor) {

  return limparTexto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

}

function normalizarChaveTexto(valor) {

  return limparTexto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

function detectarSeparador(linhaCabecalho) {

  const qtdVirgula =
    (linhaCabecalho.match(/,/g) || []).length;

  const qtdPontoVirgula =
    (linhaCabecalho.match(/;/g) || []).length;

  return qtdPontoVirgula > qtdVirgula
    ? ";"
    : ",";

}

function parseLinhaCSV(linha, separador) {

  const colunas = [];
  let atual = "";
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {

    const caractere = linha[i];
    const proximo = linha[i + 1];

    if (caractere === "\"") {

      if (dentroAspas && proximo === "\"") {
        atual += "\"";
        i += 1;
      } else {
        dentroAspas = !dentroAspas;
      }

      continue;

    }

    if (
      caractere === separador &&
      !dentroAspas
    ) {
      colunas.push(limparTexto(atual));
      atual = "";
      continue;
    }

    atual += caractere;

  }

  colunas.push(
    limparTexto(atual)
  );

  return colunas;

}

function localizarIndice(cabecalhos, predicado) {

  return cabecalhos.findIndex(predicado);

}

function obterValor(row, indice, padrao = "") {

  return indice >= 0
    ? row[indice] ?? padrao
    : padrao;

}

function calcularDemandaDaLinha({
  previa,
  prioridade,
  pedidos
}) {

  if (pedidos > 0) {
    return pedidos + prioridade;
  }

  if (previa > 0) {
    return previa;
  }

  return prioridade;

}

function criarIdRegistroCSV({
  codigo,
  produto,
  numeroLinha
}) {

  const base =
    codigo ||
    normalizarChaveTexto(produto) ||
    "SEM_IDENTIFICACAO";

  return `${base}__CSV_LINHA_${numeroLinha}`;

}

/**
 * CSV esperado:
 * Data, Produto, Previa, Pedidos Prioritarios, Pedidos, Producao, Categoria, Código
 */
export function parseCSV(textoCSV) {

  const linhas = String(textoCSV || "")
    .split(/\r?\n/)
    .filter(linha => linha.trim() !== "");

  if (linhas.length === 0) {
    return [];
  }

  const separador =
    detectarSeparador(
      linhas[0]
    );

  const cabecalhoOriginal =
    parseLinhaCSV(
      linhas[0],
      separador
    );

  const cabecalhos =
    cabecalhoOriginal.map(
      normalizarCabecalho
    );

  const indiceData =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("data")
    );

  const indiceProduto =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("produto")
    );

  const indicePrevia =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("previa")
    );

  const indicePrioridade =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("priorit")
    );

  const indicePedidos =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("pedido") && !cabecalho.includes("priorit")
    );

  const indiceProducao =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("producao")
    );

  const indiceCategoria =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("categoria")
    );

  const indiceCodigo =
    localizarIndice(
      cabecalhos,
      cabecalho => cabecalho.includes("codigo") || cabecalho === "cod"
    );

  const registros = [];

  for (let i = 1; i < linhas.length; i++) {

    const row =
      parseLinhaCSV(
        linhas[i],
        separador
      );

    if (row.length === 0) {
      continue;
    }

    const numeroLinhaCSV =
      i + 1;

    const data =
      limparTexto(
        obterValor(row, indiceData, row[0])
      );

    const produto =
      limparTexto(
        obterValor(row, indiceProduto, "")
      );

    const codigo =
      limparTexto(
        obterValor(row, indiceCodigo, "")
      );

    const categoria =
      limparTexto(
        obterValor(row, indiceCategoria, "")
      );

    const categoriaNormalizada =
      normalizarCategoria(categoria);

    if (
      Array.isArray(categoriasPermitidas) &&
      categoriasPermitidas.length > 0 &&
      !categoriasPermitidas.includes(categoriaNormalizada)
    ) {
      continue;
    }

    if (
      !codigo &&
      !produto
    ) {
      continue;
    }

    const previa =
      parseNumero(
        obterValor(row, indicePrevia, 0)
      );

    const prioridade =
      parseNumero(
        obterValor(row, indicePrioridade, 0)
      );

    const pedidos =
      parseNumero(
        obterValor(row, indicePedidos, 0)
      );

    const producao =
      parseNumero(
        obterValor(row, indiceProducao, 0)
      );

    const demandaFinal =
      calcularDemandaDaLinha({
        previa,
        prioridade,
        pedidos
      });

    const csvRegistroId =
      criarIdRegistroCSV({
        codigo,
        produto,
        numeroLinha:
          numeroLinhaCSV
      });

    registros.push({
      data,
      codigo,
      produto,
      nomeOficial:
        produto,
      descricaoCSV:
        produto,
      categoria,
      categoriaNormalizada,
      previa,
      prioridade,
      pedidos,
      producao,
      demandaFinal,
      quantidadeCSV:
        demandaFinal,
      demandaCalculadaPor:
        pedidos > 0
          ? "LINHA_PEDIDOS_MAIS_PRIORITARIOS"
          : previa > 0
            ? "LINHA_PREVIA"
            : "LINHA_PRIORITARIOS",
      csvLinhaALinha:
        true,
      csvConsolidado:
        false,
      csvRegistroId,
      chavePlanejamentoCSV:
        csvRegistroId,
      csvLinhaNumero:
        numeroLinhaCSV,
      indiceOrigemCSV:
        i,
      linhaOrigemCSV: {
        data,
        codigo,
        produto,
        previa,
        prioridade,
        pedidos,
        producao,
        categoria,
        numeroLinhaCSV
      }
    });

  }

  return registros;

}
