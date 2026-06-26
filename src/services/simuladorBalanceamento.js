/**
 * ======================================================
 * JFC FLOW
 * Módulo: simuladorBalanceamento
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Simular quais sugestões de balanceamento podem ser
 * aplicadas em conjunto, sem estourar a linha destino.
 *
 * Importante:
 * Este módulo não altera o planejamento original.
 * Ele apenas calcula um cenário recomendado.
 * ======================================================
 */

function numero(valor) {

  return Number(valor) || 0;

}

function clonarSaldosPorLinha(
  planejamentoComCapacidade
) {

  const saldos = {};

  const linhas =
    planejamentoComCapacidade?.linhas || [];

  linhas.forEach(linha => {

    saldos[linha.linha] = {

      linha: linha.linha,

      saldoMin:
        numero(linha.capacidade?.saldoMin),

      tempoPlanejadoMin:
        numero(linha.capacidade?.tempoPlanejadoMin),

      capacidadeMin:
        numero(linha.capacidade?.capacidadeMin),

      statusOriginal:
        linha.capacidade?.status,

      statusTextoOriginal:
        linha.capacidade?.statusTexto

    };

  });

  return saldos;

}

function ordenarSugestoesPorPrioridade(
  sugestoes
) {

  return [...sugestoes].sort((a, b) => {

    const origemA =
      numero(a.origem?.saldoMin);

    const origemB =
      numero(b.origem?.saldoMin);

    const tempoA =
      numero(a.impactoEstimado?.tempoProdutoOrigemMin);

    const tempoB =
      numero(b.impactoEstimado?.tempoProdutoOrigemMin);

    /**
     * Primeiro prioriza a origem mais negativa.
     * Depois prioriza produtos que aliviam mais tempo.
     */
    if (origemA !== origemB) {
      return origemA - origemB;
    }

    return tempoB - tempoA;

  });

}

function movimentoJaUsado(
  movimentosSelecionados,
  sugestao
) {

  return movimentosSelecionados.some(item => {

    return item.codigo === sugestao.codigo &&
      item.origem?.linha === sugestao.origem?.linha;

  });

}

function destinoSuportaMovimento(
  saldosVirtuais,
  sugestao
) {

  const destino =
    sugestao.destino?.linha;

  const tempoDestino =
    numero(
      sugestao.impactoEstimado?.tempoProdutoDestinoMin
    );

  if (!saldosVirtuais[destino]) {
    return false;
  }

  return saldosVirtuais[destino].saldoMin >= tempoDestino;

}

function aplicarMovimentoVirtual(
  saldosVirtuais,
  sugestao
) {

  const origem =
    sugestao.origem?.linha;

  const destino =
    sugestao.destino?.linha;

  const tempoOrigem =
    numero(
      sugestao.impactoEstimado?.tempoProdutoOrigemMin
    );

  const tempoDestino =
    numero(
      sugestao.impactoEstimado?.tempoProdutoDestinoMin
    );

  if (saldosVirtuais[origem]) {

    saldosVirtuais[origem].saldoMin +=
      tempoOrigem;

    saldosVirtuais[origem].tempoPlanejadoMin -=
      tempoOrigem;

  }

  if (saldosVirtuais[destino]) {

    saldosVirtuais[destino].saldoMin -=
      tempoDestino;

    saldosVirtuais[destino].tempoPlanejadoMin +=
      tempoDestino;

  }

}

function classificarStatusVirtual(
  linha
) {

  const capacidade =
    numero(linha.capacidadeMin);

  const tempo =
    numero(linha.tempoPlanejadoMin);

  if (tempo <= 0) {
    return "SEM_CARGA";
  }

  if (capacidade <= 0) {
    return "SEM_CAPACIDADE";
  }

  const uso =
    Math.round(
      (tempo / capacidade) * 100
    );

  if (uso < 70) {
    return "OCIOSA";
  }

  if (uso <= 100) {
    return "OK";
  }

  if (uso <= 110) {
    return "ATENCAO";
  }

  return "ESTOURADA";

}

function traduzirStatus(status) {

  const mapa = {

    SEM_CARGA: "Sem carga",

    SEM_CAPACIDADE: "Sem capacidade",

    OCIOSA: "Ociosa",

    OK: "OK",

    ATENCAO: "Atenção",

    ESTOURADA: "Estourada"

  };

  return mapa[status] || status;

}

function montarResumoLinhas(
  saldosVirtuais
) {

  return Object.values(saldosVirtuais).map(linha => {

    const capacidade =
      numero(linha.capacidadeMin);

    const tempo =
      numero(linha.tempoPlanejadoMin);

    const utilizacaoPercentual =
      capacidade > 0
        ? Math.round((tempo / capacidade) * 100)
        : 0;

    const status =
      classificarStatusVirtual(linha);

    return {

      linha: linha.linha,

      capacidadeMin: capacidade,

      tempoPlanejadoMin: tempo,

      saldoMin:
        numero(linha.saldoMin),

      utilizacaoPercentual,

      status,

      statusTexto:
        traduzirStatus(status),

      statusOriginal:
        linha.statusOriginal,

      statusTextoOriginal:
        linha.statusTextoOriginal

    };

  });

}

function calcularResumo(
  movimentosSelecionados,
  movimentosIgnorados,
  linhasDepois
) {

  const linhasEstouradasDepois =
    linhasDepois.filter(linha => {

      return linha.status === "ESTOURADA";

    }).length;

  const linhasAtencaoDepois =
    linhasDepois.filter(linha => {

      return linha.status === "ATENCAO";

    }).length;

  const tempoMovidoOrigemMin =
    movimentosSelecionados.reduce((soma, item) => {

      return soma +
        numero(item.impactoEstimado?.tempoProdutoOrigemMin);

    }, 0);

  const tempoMovidoDestinoMin =
    movimentosSelecionados.reduce((soma, item) => {

      return soma +
        numero(item.impactoEstimado?.tempoProdutoDestinoMin);

    }, 0);

  return {

    movimentosSelecionados:
      movimentosSelecionados.length,

    movimentosIgnorados:
      movimentosIgnorados.length,

    tempoMovidoOrigemMin,

    tempoMovidoDestinoMin,

    variacaoTotalMin:
      tempoMovidoDestinoMin - tempoMovidoOrigemMin,

    linhasEstouradasDepois,

    linhasAtencaoDepois

  };

}

export function simularBalanceamento(
  planejamentoComCapacidade,
  resultadoBalanceamento
) {

  const sugestoes =
    resultadoBalanceamento?.sugestoes || [];

  const saldosVirtuais =
    clonarSaldosPorLinha(
      planejamentoComCapacidade
    );

  const sugestoesOrdenadas =
    ordenarSugestoesPorPrioridade(
      sugestoes
    );

  const movimentosSelecionados = [];

  const movimentosIgnorados = [];

  sugestoesOrdenadas.forEach(sugestao => {

    if (
      movimentoJaUsado(
        movimentosSelecionados,
        sugestao
      )
    ) {

      movimentosIgnorados.push({

        ...sugestao,

        motivoIgnorado:
          "Produto já selecionado em outro movimento."

      });

      return;

    }

    if (
      !destinoSuportaMovimento(
        saldosVirtuais,
        sugestao
      )
    ) {

      movimentosIgnorados.push({

        ...sugestao,

        motivoIgnorado:
          "Destino não possui saldo virtual suficiente após movimentos anteriores."

      });

      return;

    }

    aplicarMovimentoVirtual(
      saldosVirtuais,
      sugestao
    );

    movimentosSelecionados.push(
      sugestao
    );

  });

  const linhasDepois =
    montarResumoLinhas(
      saldosVirtuais
    );

  return {

    movimentosSelecionados,

    movimentosIgnorados,

    linhasDepois,

    resumo:
      calcularResumo(
        movimentosSelecionados,
        movimentosIgnorados,
        linhasDepois
      )

  };

}