/**
 * ======================================================
 * JFC FLOW
 * Módulo: sugestorBalanceamento
 * Versão: 1.3.0
 *
 * Responsabilidade:
 * Analisar o planejamento com capacidade e sugerir
 * oportunidades de balanceamento entre linhas.
 *
 * Modos:
 * - Geral: analisa todas as linhas críticas.
 * - Por linha: analisa somente uma linha de origem.
 * ======================================================
 */

function numero(valor) {

  return Number(valor) || 0;

}

function ordenarPorMaiorTempo(a, b) {

  return numero(b.tempoTotalPlanejadoMin) -
    numero(a.tempoTotalPlanejadoMin);

}

function linhaEhOrigem(
  linhaOrigem,
  linhaDestino
) {

  return linhaOrigem.linha === linhaDestino.linha;

}

function produtoPodeIrParaLinha(
  produto,
  linhaDestino
) {

  const linhasPermitidas =
    produto.linhasPermitidas || [];

  return linhasPermitidas.includes(
    linhaDestino.linha
  );

}

function obterRotasDoProdutoNaLinha(
  produto,
  linha
) {

  const rotas =
    produto.rotasTecnicasProduto || [];

  return rotas.filter(rota => {

    return rota.linha === linha;

  });

}

function calcularTempoProdutoNaLinha(
  produto,
  linha
) {

  const rotasDestino =
    obterRotasDoProdutoNaLinha(
      produto,
      linha
    );

  if (rotasDestino.length === 0) {

    return {

      valido: false,

      motivo: "SEM_ROTA_DESTINO",

      motivoTexto:
        "Produto não possui rota técnica detalhada para a linha destino.",

      tempoProducaoMin: 0,

      setupMin: 0,

      tempoTotalMin: 0,

      produtividadeKgHora: 0,

      etapasTecnicas: 0

    };

  }

  const demandaFinal =
    numero(produto.demandaFinal);

  let maiorTempoUnitarioMin = 0;

  let maiorTempoBaseMin = 0;

  let maiorSetupMin = 0;

  let maiorProdutividadeKgHora = 0;

  rotasDestino.forEach(rota => {

    const unidadeBaseTXT =
      numero(rota.unidadeDia);

    const tempoBaseTXTMin =
      numero(rota.tempoProducaoMin);

    const tempoUnitarioMin =
      unidadeBaseTXT > 0
        ? tempoBaseTXTMin / unidadeBaseTXT
        : 0;

    maiorTempoUnitarioMin = Math.max(
      maiorTempoUnitarioMin,
      tempoUnitarioMin
    );

    maiorTempoBaseMin = Math.max(
      maiorTempoBaseMin,
      tempoBaseTXTMin
    );

    maiorSetupMin = Math.max(
      maiorSetupMin,
      numero(rota.setupMin)
    );

    maiorProdutividadeKgHora = Math.max(
      maiorProdutividadeKgHora,
      numero(rota.produtividadeKgHora)
    );

  });

  let tempoProducaoMin = 0;

  let statusCalculo = "";

  if (maiorTempoUnitarioMin > 0) {

    tempoProducaoMin = Math.ceil(
      demandaFinal * maiorTempoUnitarioMin
    );

    statusCalculo = "CALCULADO_POR_DEMANDA_DESTINO";

  } else {

    tempoProducaoMin =
      maiorTempoBaseMin;

    statusCalculo =
      "USANDO_TEMPO_TECNICO_DESTINO";

  }

  return {

    valido: true,

    motivo: "OK",

    motivoTexto:
      "Tempo calculado pela rota técnica da linha destino.",

    demandaFinal,

    tempoProducaoMin,

    setupMin: maiorSetupMin,

    tempoTotalMin:
      tempoProducaoMin + maiorSetupMin,

    produtividadeKgHora:
      maiorProdutividadeKgHora,

    etapasTecnicas:
      rotasDestino.length,

    statusCalculo

  };

}

function destinoTemSaldo(
  linhaDestino,
  tempoDestinoMin
) {

  const saldoDestino =
    numero(linhaDestino.capacidade?.saldoMin);

  return saldoDestino >= tempoDestinoMin;

}

function validarMovimento(
  linhaOrigem,
  linhaDestino,
  produto
) {

  if (
    linhaEhOrigem(
      linhaOrigem,
      linhaDestino
    )
  ) {

    return {

      valido: false,

      motivo: "MESMA_LINHA",

      motivoTexto:
        "Destino é a mesma linha da origem."

    };

  }

  if (
    !produtoPodeIrParaLinha(
      produto,
      linhaDestino
    )
  ) {

    return {

      valido: false,

      motivo: "LINHA_NAO_PERMITIDA",

      motivoTexto:
        "Produto não possui rota técnica para a linha destino."

    };

  }

  const calculoDestino =
    calcularTempoProdutoNaLinha(
      produto,
      linhaDestino.linha
    );

  if (!calculoDestino.valido) {

    return {

      valido: false,

      motivo:
        calculoDestino.motivo,

      motivoTexto:
        calculoDestino.motivoTexto,

      calculoDestino

    };

  }

  if (
    !destinoTemSaldo(
      linhaDestino,
      calculoDestino.tempoTotalMin
    )
  ) {

    return {

      valido: false,

      motivo: "SALDO_INSUFICIENTE",

      motivoTexto:
        "Linha destino não possui saldo suficiente considerando o tempo real nessa linha.",

      calculoDestino

    };

  }

  return {

    valido: true,

    motivo: "OK",

    motivoTexto:
      "Movimento permitido.",

    calculoDestino

  };

}

function criarSugestao(
  linhaOrigem,
  linhaDestino,
  produto,
  validacao
) {

  const tempoOrigemMin =
    numero(produto.tempoTotalPlanejadoMin);

  const tempoDestinoMin =
    numero(validacao.calculoDestino?.tempoTotalMin);

  return {

    tipo: "MOVER_PRODUTO_COM_TEMPO_DESTINO",

    codigo: produto.codigo,

    nomeOficial: produto.nomeOficial,

    produto,

    origem: {

      linha: linhaOrigem.linha,

      status: linhaOrigem.capacidade?.statusTexto,

      tempoPlanejadoMin:
        linhaOrigem.capacidade?.tempoPlanejadoMin,

      saldoMin:
        linhaOrigem.capacidade?.saldoMin

    },

    destino: {

      linha: linhaDestino.linha,

      status: linhaDestino.capacidade?.statusTexto,

      tempoPlanejadoMin:
        linhaDestino.capacidade?.tempoPlanejadoMin,

      saldoMin:
        linhaDestino.capacidade?.saldoMin

    },

    impactoEstimado: {

      tempoProdutoOrigemMin:
        tempoOrigemMin,

      tempoProdutoDestinoMin:
        tempoDestinoMin,

      variacaoTempoMin:
        tempoDestinoMin - tempoOrigemMin,

      saldoOrigemDepois:
        numero(linhaOrigem.capacidade?.saldoMin) +
        tempoOrigemMin,

      saldoDestinoDepois:
        numero(linhaDestino.capacidade?.saldoMin) -
        tempoDestinoMin

    },

    calculoDestino:
      validacao.calculoDestino,

    validacao: {

      linhaPermitida: true,

      linhasPermitidas:
        produto.linhasPermitidas || [],

      motivoTexto:
        validacao.motivoTexto

    },

    observacao:
      "Sugestão validada por capacidade, linha permitida e tempo específico da linha destino."

  };

}

function criarBloqueio(
  linhaOrigem,
  linhaDestino,
  produto,
  validacao
) {

  return {

    codigo: produto.codigo,

    nomeOficial: produto.nomeOficial,

    origem: linhaOrigem.linha,

    destino: linhaDestino.linha,

    tempoProdutoOrigemMin:
      produto.tempoTotalPlanejadoMin,

    tempoProdutoDestinoMin:
      validacao.calculoDestino?.tempoTotalMin || 0,

    saldoDestinoMin:
      linhaDestino.capacidade?.saldoMin,

    linhasPermitidas:
      produto.linhasPermitidas || [],

    motivo:
      validacao.motivo,

    motivoTexto:
      validacao.motivoTexto

  };

}

function linhaEstaCritica(linha) {

  return linha.capacidade?.status === "ESTOURADA" ||
    linha.capacidade?.status === "ATENCAO";

}

function classificarLinhas(
  planejamentoComCapacidade,
  opcoes = {}
) {

  const linhas =
    planejamentoComCapacidade?.linhas || [];

  const linhaOrigemFiltro =
    opcoes.linhaOrigem || null;

  let linhasCriticas = [];

  if (linhaOrigemFiltro) {

    linhasCriticas =
      linhas.filter(linha => {

        return linha.linha === linhaOrigemFiltro;

      });

  } else {

    linhasCriticas =
      linhas.filter(linhaEstaCritica);

  }

  const linhasComSaldo =
    linhas.filter(linha => {

      return numero(linha.capacidade?.saldoMin) > 0;

    });

  return {

    linhasCriticas,

    linhasComSaldo,

    modo:
      linhaOrigemFiltro
        ? "POR_LINHA"
        : "GERAL",

    linhaOrigem:
      linhaOrigemFiltro

  };

}

export function sugerirBalanceamento(
  planejamentoComCapacidade,
  opcoes = {}
) {

  const {
    linhasCriticas,
    linhasComSaldo,
    modo,
    linhaOrigem
  } = classificarLinhas(
    planejamentoComCapacidade,
    opcoes
  );

  const sugestoes = [];

  const bloqueios = [];

  linhasCriticas.forEach(linhaOrigemAtual => {

    const produtosOrdenados =
      [...(linhaOrigemAtual.produtos || [])]
        .sort(ordenarPorMaiorTempo);

    produtosOrdenados.forEach(produto => {

      let sugestaoCriada = false;

      for (
        const linhaDestino of linhasComSaldo
      ) {

        const validacao =
          validarMovimento(
            linhaOrigemAtual,
            linhaDestino,
            produto
          );

        if (!validacao.valido) {

          bloqueios.push(
            criarBloqueio(
              linhaOrigemAtual,
              linhaDestino,
              produto,
              validacao
            )
          );

          continue;

        }

        sugestoes.push(
          criarSugestao(
            linhaOrigemAtual,
            linhaDestino,
            produto,
            validacao
          )
        );

        sugestaoCriada = true;

        break;

      }

      if (!sugestaoCriada) {

        console.debug(
          "Nenhuma linha válida encontrada para:",
          produto.codigo,
          produto.nomeOficial
        );

      }

    });

  });

  return {

    modo,

    linhaOrigem,

    sugestoes,

    bloqueios,

    resumo: {

      modo,

      linhaOrigem,

      linhasCriticas:
        linhasCriticas.length,

      linhasComSaldo:
        linhasComSaldo.length,

      sugestoesGeradas:
        sugestoes.length,

      movimentosBloqueados:
        bloqueios.length

    }

  };

}