/**
 * ======================================================
 * JFC FLOW
 * Módulo: parseCSV
 * Versão: 1.2.0
 *
 * Responsabilidade:
 * Ler o CSV de pedidos.
 *
 * Regra importante:
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
    .replace(/^"|"$/g, "");

}

function normalizarCategoria(categoria) {

  return limparTexto(categoria)
    .toLowerCase()
    .trim();

}

/**
 * CSV esperado:
 *
 * Data,
 * Produto,
 * Previa,
 * Pedidos Prioritarios,
 * Pedidos,
 * Producao,
 * Categoria,
 * Código
 *
 * Observação:
 * O produto pode conter vírgula no nome.
 * Por isso lemos as colunas fixas pelo final da linha.
 */
export function parseCSV(textoCSV) {

  const linhas = String(textoCSV || "")
    .split(/\r?\n/)
    .filter(linha => linha.trim() !== "");

  const resultado = [];

  for (let i = 1; i < linhas.length; i++) {

    const linha = linhas[i];

    const partes = linha.split(",");

    if (partes.length < 8) {
      continue;
    }

    /**
     * Lendo do final para o início.
     * Isso evita erro quando o nome do produto contém vírgula.
     */
    const codigo = limparTexto(
      partes[partes.length - 1]
    );

    const categoria = limparTexto(
      partes[partes.length - 2]
    );

    const producao = limparTexto(
      partes[partes.length - 3]
    );

    const pedidos = limparTexto(
      partes[partes.length - 4]
    );

    const prioridade = limparTexto(
      partes[partes.length - 5]
    );

    const previa = limparTexto(
      partes[partes.length - 6]
    );

    const data = limparTexto(
      partes[0]
    );

    const produto = limparTexto(
      partes
        .slice(1, partes.length - 6)
        .join(",")
    );

    const categoriaNormalizada =
      normalizarCategoria(categoria);

    /**
     * Mantém apenas as categorias definidas no projeto.
     */
    if (
      Array.isArray(categoriasPermitidas) &&
      categoriasPermitidas.length > 0 &&
      !categoriasPermitidas.includes(categoriaNormalizada)
    ) {
      continue;
    }

    resultado.push({

      data,

      /**
       * Código oficial do ERP.
       * Mantido como texto para preservar zeros à esquerda.
       */
      codigo,

      produto,

      previa: parseNumero(previa),

      prioridade: parseNumero(prioridade),

      pedidos: parseNumero(pedidos),

      producao: parseNumero(producao),

      categoria,

      demandaFinal:
        parseNumero(pedidos) > 0
          ? parseNumero(pedidos) + parseNumero(prioridade)
          : parseNumero(previa) + parseNumero(prioridade)

    });

  }

  return resultado;

}