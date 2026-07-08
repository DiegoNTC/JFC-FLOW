/**
 * ======================================================
 * JFC FLOW
 * Módulo: movimentadorSequenciamentoService
 *
 * Responsabilidade:
 * Mover blocos/famílias dentro de uma linha e gerar ordem manual.
 * ======================================================
 */

import {
  gerarSequenciamentoPlanejamento
} from "./geradorSequenciamentoLinha.js";

import {
  salvarSequenciaManualFamiliasLinha
} from "../repositories/sequenciamentoManualRepository.js";

function texto(valor) {

  return String(valor ?? "").trim();

}

function normalizarDirecao(direcao) {

  const valor =
    texto(direcao)
      .toLowerCase();

  if (["up", "cima", "subir", "acima", "-1"].includes(valor)) {
    return -1;
  }

  if (["down", "baixo", "descer", "abaixo", "1"].includes(valor)) {
    return 1;
  }

  return 0;

}

function obterIdBloco(bloco) {

  return texto(
    bloco?.id ??
    bloco?.blocoId
  );

}

function obterNomeLinha(linha) {

  return texto(
    linha?.linha ??
    linha?.nomeLinha ??
    linha?.nome ??
    linha?.id
  );

}


function obterFamiliaBloco(bloco) {

  return texto(
    bloco?.familiaSetup ??
    bloco?.familiaSequenciamento ??
    bloco?.classeSetup ??
    bloco?.familia ??
    bloco?.nomeFamilia
  );

}

function clonar(objeto) {

  if (typeof structuredClone === "function") {
    return structuredClone(objeto);
  }

  return JSON.parse(
    JSON.stringify(objeto)
  );

}

export function moverBlocoPlanejamento(
  planejamento,
  linhaAlvo,
  blocoId,
  direcao
) {

  if (!planejamento) {

    return {
      movido: false,
      motivo: "Nenhum planejamento informado.",
      planejamento
    };

  }

  const deslocamento =
    normalizarDirecao(direcao);

  if (deslocamento === 0) {

    return {
      movido: false,
      motivo: "Direção inválida para movimentação.",
      planejamento
    };

  }

  const planejamentoClone =
    clonar(planejamento);

  const linhas =
    planejamentoClone.linhas || [];

  const linha =
    linhas.find(item => {

      return obterNomeLinha(item) === texto(linhaAlvo);

    });

  if (!linha) {

    return {
      movido: false,
      motivo: `Linha ${linhaAlvo} não encontrada.`,
      planejamento
    };

  }

  const blocos =
    [...(linha.blocos || [])];

  const indiceAtual =
    blocos.findIndex(bloco => {

      return obterIdBloco(bloco) === texto(blocoId);

    });

  if (indiceAtual < 0) {

    return {
      movido: false,
      motivo: "Bloco não encontrado para movimentação.",
      planejamento
    };

  }

  const novoIndice =
    indiceAtual + deslocamento;

  if (
    novoIndice < 0 ||
    novoIndice >= blocos.length
  ) {

    return {
      movido: false,
      motivo: "O bloco já está no limite da linha.",
      planejamento
    };

  }

  const temporario =
    blocos[indiceAtual];

  blocos[indiceAtual] =
    blocos[novoIndice];

  blocos[novoIndice] =
    temporario;

  const familiasOrdenadas =
    blocos
      .map(obterFamiliaBloco)
      .filter(Boolean);

  salvarSequenciaManualFamiliasLinha(
    obterNomeLinha(linha),
    familiasOrdenadas
  );

  const mapaOrdemFamiliaManual =
    new Map(
      familiasOrdenadas.map((familia, index) => {

        return [
          familia,
          index + 1
        ];

      })
    );

  const produtosReordenados =
    blocos.flatMap(bloco => {

      const familiaBloco =
        obterFamiliaBloco(
          bloco
        );

      const ordemFamiliaManual =
        mapaOrdemFamiliaManual.get(
          familiaBloco
        ) || null;

      return (bloco.produtos || [])
        .map((produto, indexProdutoNoBloco) => {

          return {
            ...produto,

            ordemBlocoFamiliaManual:
              ordemFamiliaManual,

            ordemFamiliaManual:
              ordemFamiliaManual,

            origemOrdemBlocoFamilia:
              "MANUAL_PCP",

            indiceProdutoNaFamiliaManual:
              indexProdutoNoBloco + 1
          };

        });

    });

  linha.produtos =
    produtosReordenados;

  const planejamentoSequenciado =
    gerarSequenciamentoPlanejamento(
      planejamentoClone
    );

  return {
    movido: true,
    planejamento: planejamentoSequenciado
  };

}
