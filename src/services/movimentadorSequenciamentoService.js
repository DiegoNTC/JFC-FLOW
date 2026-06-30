/**
 * ======================================================
 * JFC FLOW
 * Módulo: movimentadorSequenciamentoService
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Mover blocos de família dentro de uma linha
 * e recalcular o sequenciamento.
 * ======================================================
 */

import {
  gerarSequenciamentoPlanejamento
} from "./geradorSequenciamentoLinha.js";

function texto(valor) {

  return String(valor ?? "")
    .trim();

}

function clonar(objeto) {

  return JSON.parse(
    JSON.stringify(objeto)
  );

}

function obterLinhasSequenciadas(
  planejamento
) {

  if (Array.isArray(planejamento?.linhasSequenciadas)) {
    return planejamento.linhasSequenciadas;
  }

  if (Array.isArray(planejamento?.linhas)) {
    return planejamento.linhas;
  }

  if (
    planejamento?.linhas &&
    typeof planejamento.linhas === "object"
  ) {
    return Object.values(
      planejamento.linhas
    );
  }

  return [];

}

function obterNomeLinha(
  linha
) {

  return texto(
    linha?.linha ||
    linha?.nomeLinha ||
    linha?.id ||
    linha?.codigo ||
    ""
  );

}

function trocarPosicao(
  lista,
  origem,
  destino
) {

  const novaLista =
    lista.slice();

  const item =
    novaLista[origem];

  novaLista.splice(
    origem,
    1
  );

  novaLista.splice(
    destino,
    0,
    item
  );

  return novaLista;

}

function reordenarProdutosPorBlocos(
  blocos
) {

  const produtos =
    [];

  blocos.forEach(bloco => {

    const produtosBloco =
      Array.isArray(bloco.produtos)
        ? bloco.produtos
        : [];

    produtosBloco.forEach(produto => {

      produtos.push({
        ...produto
      });

    });

  });

  return produtos.map((produto, index) => {

    return {
      ...produto,

      ordemManual:
        true,

      ordemPlanejada:
        index + 1,

      ordemProducao:
        index + 1,

      sequenciaManual:
        index + 1,

      sequenciaTXT:
        index + 1
    };

  });

}

export function moverBlocoPlanejamento(
  planejamento,
  linhaAlvo,
  blocoId,
  direcao
) {

  if (!planejamento) {

    return {
      planejamento,
      movido: false,
      motivo: "Planejamento não informado."
    };

  }

  const copia =
    clonar(
      planejamento
    );

  const linhas =
    obterLinhasSequenciadas(
      copia
    );

  const linhaIndex =
    linhas.findIndex(linha => {

      return obterNomeLinha(linha) === texto(linhaAlvo);

    });

  if (linhaIndex < 0) {

    return {
      planejamento,
      movido: false,
      motivo: "Linha não encontrada."
    };

  }

  const linha =
    linhas[linhaIndex];

  const blocos =
    Array.isArray(linha.blocos)
      ? linha.blocos
      : [];

  const blocoIndex =
    blocos.findIndex(bloco => {

      return texto(bloco.id) === texto(blocoId);

    });

  if (blocoIndex < 0) {

    return {
      planejamento,
      movido: false,
      motivo: "Bloco não encontrado."
    };

  }

  const destino =
    direcao === "cima"
      ? blocoIndex - 1
      : blocoIndex + 1;

  if (
    destino < 0 ||
    destino >= blocos.length
  ) {

    return {
      planejamento,
      movido: false,
      motivo: "Bloco já está no limite da linha."
    };

  }

  const blocosReordenados =
    trocarPosicao(
      blocos,
      blocoIndex,
      destino
    );

  const produtosReordenados =
    reordenarProdutosPorBlocos(
      blocosReordenados
    );

  linhas[linhaIndex] = {
    ...linha,

    produtos:
      produtosReordenados,

    ordemManualAtiva:
      true,

    atualizadoPorMovimento:
      true
  };

  copia.linhas =
    linhas;

  copia.linhasSequenciadas =
    linhas;

  const planejamentoRecalculado =
    gerarSequenciamentoPlanejamento(
      copia
    );

  return {
    planejamento:
      planejamentoRecalculado,

    movido:
      true,

    linha:
      linhaAlvo,

    blocoId,

    direcao
  };

}