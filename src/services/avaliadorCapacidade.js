/**
 * ======================================================
 * JFC FLOW
 * Módulo: avaliadorCapacidade
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Avaliar o planejamento real contra a capacidade
 * disponível de cada linha.
 * ======================================================
 */

import {
  capacidadeLinhas,
  capacidadePadraoMin
} from "../data/capacidadeLinhas.js";

function numero(valor) {

  return Number(valor) || 0;

}

function calcularUtilizacaoPercentual(
  tempoPlanejadoMin,
  capacidadeMin
) {

  if (capacidadeMin <= 0) {
    return 0;
  }

  return Math.round(
    (tempoPlanejadoMin / capacidadeMin) * 100
  );

}

function classificarStatus(
  utilizacaoPercentual,
  tempoPlanejadoMin
) {

  if (tempoPlanejadoMin <= 0) {
    return "SEM_CARGA";
  }

  if (utilizacaoPercentual < 70) {
    return "OCIOSA";
  }

  if (utilizacaoPercentual <= 100) {
    return "OK";
  }

  if (utilizacaoPercentual <= 110) {
    return "ATENCAO";
  }

  return "ESTOURADA";

}

function traduzirStatus(status) {

  const mapa = {

    SEM_CARGA: "Sem carga",

    OCIOSA: "Ociosa",

    OK: "OK",

    ATENCAO: "Atenção",

    ESTOURADA: "Estourada"

  };

  return mapa[status] || status;

}

function obterResumoLinhaParaCapacidade(
  linhaPlanejada
) {

  const resumoSequenciamento =
    linhaPlanejada?.resumoSequenciamento;

  const resumo =
    linhaPlanejada?.resumo || {};

  if (resumoSequenciamento) {

    return {
      ...resumo,

      tempoTotalMin:
        resumoSequenciamento.tempoTotalMin ??
        resumo.tempoTotalMin,

      setupTotalMin:
        resumoSequenciamento.setupAplicadoMin ??
        resumo.setupTotalMin,

      tempoProducaoMin:
        resumoSequenciamento.tempoProducaoMin ??
        resumo.tempoProducaoMin,

      kgTotalPlanejado:
        resumoSequenciamento.kgTotal ??
        resumo.kgTotalPlanejado,

      kgTotal:
        resumoSequenciamento.kgTotal ??
        resumo.kgTotal,

      origemSequencia:
        "SEQUENCIAMENTO_POR_FAMILIA",

      sequenciaAplicada:
        true
    };

  }

  return resumo;

}

function avaliarLinha(linhaPlanejada) {

  const linha =
    linhaPlanejada.linha;

  const capacidade =
    capacidadeLinhas[linha]?.capacidadeMin ??
    capacidadePadraoMin;

  const resumoLinha =
    obterResumoLinhaParaCapacidade(
      linhaPlanejada
    );

  const tempoPlanejadoMin =
    numero(resumoLinha?.tempoTotalMin);

  const setupTotalMin =
    numero(resumoLinha?.setupTotalMin);

  const saldoMin =
    capacidade - tempoPlanejadoMin;

  const utilizacaoPercentual =
    calcularUtilizacaoPercentual(
      tempoPlanejadoMin,
      capacidade
    );

  const status =
    classificarStatus(
      utilizacaoPercentual,
      tempoPlanejadoMin
    );

  return {

    ...linhaPlanejada,

    resumo:
      resumoLinha,

    capacidade: {

      capacidadeMin: capacidade,

      tempoPlanejadoMin,

      setupTotalMin,

      saldoMin,

      utilizacaoPercentual,

      status,

      statusTexto: traduzirStatus(status),

      origemCalculo:
        resumoLinha?.sequenciaAplicada
          ? "SEQUENCIAMENTO_POR_FAMILIA"
          : "PLANEJAMENTO_REAL"

    }

  };

}

function calcularResumoCapacidade(linhasAvaliadas) {

  return linhasAvaliadas.reduce((resumo, linha) => {

    const capacidade =
      linha.capacidade || {};

    resumo.capacidadeTotalMin +=
      numero(capacidade.capacidadeMin);

    resumo.tempoPlanejadoTotalMin +=
      numero(capacidade.tempoPlanejadoMin);

    resumo.setupTotalMin +=
      numero(capacidade.setupTotalMin);

    if (capacidade.status === "OK") {
      resumo.linhasOK += 1;
    }

    if (capacidade.status === "OCIOSA") {
      resumo.linhasOciosas += 1;
    }

    if (capacidade.status === "ATENCAO") {
      resumo.linhasAtencao += 1;
    }

    if (capacidade.status === "ESTOURADA") {
      resumo.linhasEstouradas += 1;
    }

    if (capacidade.status === "SEM_CARGA") {
      resumo.linhasSemCarga += 1;
    }

    return resumo;

  }, {

    capacidadeTotalMin: 0,

    tempoPlanejadoTotalMin: 0,

    setupTotalMin: 0,

    linhasOK: 0,

    linhasOciosas: 0,

    linhasAtencao: 0,

    linhasEstouradas: 0,

    linhasSemCarga: 0

  });

}

export function avaliarCapacidadePlanejamento(
  planejamentoReal
) {

  const linhas =
    planejamentoReal?.linhas || [];

  const linhasAvaliadas =
    linhas.map(avaliarLinha);

  const resumoCapacidade =
    calcularResumoCapacidade(linhasAvaliadas);

  const utilizacaoGeralPercentual =
    resumoCapacidade.capacidadeTotalMin > 0
      ? Math.round(
          (
            resumoCapacidade.tempoPlanejadoTotalMin /
            resumoCapacidade.capacidadeTotalMin
          ) * 100
        )
      : 0;

  return {

    ...planejamentoReal,

    linhas: linhasAvaliadas,

    capacidade: {

      ...resumoCapacidade,

      saldoTotalMin:
        resumoCapacidade.capacidadeTotalMin -
        resumoCapacidade.tempoPlanejadoTotalMin,

      utilizacaoGeralPercentual

    }

  };

}