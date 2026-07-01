/**
 * ======================================================
 * JFC FLOW
 * Módulo: geradorPlanejamentoReal
 * Versão: 1.0.1
 *
 * Responsabilidade:
 * Gerar o planejamento real com base no Cadastro Mestre.
 *
 * Entrada:
 * - Produtos Mestre
 *
 * Saída:
 * - Produtos planejados por linha
 * - Tempo planejado
 * - Setup planejado
 * - Resumo por linha
 *
 * Regra:
 * Nome oficial e demanda vêm do CSV.
 * Tempo, setup, linha, zona e ordem vêm do TXT.
 *
 * Regra importante:
 * A numeração do TXT:
 * 1. Produto A
 * 2. Produto B
 * 3. Produto C
 *
 * representa a ordem real de entrada do produto na linha.
 * Essa ordem deve ser preservada como:
 * - sequenciaTXT
 * - ordemTXT
 * - ordemLinhaTXT
 * - sequenciaPrincipal
 * ======================================================
 */

function numero(valor) {

  return Number(valor) || 0;

}

function obterOrdemTXTRota(
  rota
) {

  return numero(
    rota?.ordemLinhaTXT ??
    rota?.ordemTXT ??
    rota?.sequenciaTXT ??
    rota?.sequencia ??
    0
  );

}

function obterMenorSequenciaValida(
  sequencias = []
) {

  const validas =
    sequencias
      .map(numero)
      .filter(valor => valor > 0);

  if (validas.length === 0) {
    return 0;
  }

  return Math.min(
    ...validas
  );

}

function obterOrdemProdutoPlanejado(
  produto
) {

  return numero(
    produto?.ordemLinhaTXT ??
    produto?.ordemTXT ??
    produto?.sequenciaTXT ??
    produto?.sequenciaPrincipal ??
    0
  );

}

function ordenarLinhas(a, b) {

  const linhaA = a.linha;
  const linhaB = b.linha;

  if (linhaA === "TOMATE") {
    return 1;
  }

  if (linhaB === "TOMATE") {
    return -1;
  }

  const numA = Number(String(linhaA).replace(/\D/g, ""));
  const numB = Number(String(linhaB).replace(/\D/g, ""));

  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }

  return String(linhaA).localeCompare(String(linhaB));

}

function extrairLinhasPermitidas(produtoMestre) {

  const rotas =
    produtoMestre.rotasTecnicas || [];

  const linhas =
    rotas
      .map(rota => rota.linha)
      .filter(Boolean);

  return Array.from(
    new Set(linhas)
  );

}

function agruparRotasPorLinha(rotas) {

  const mapa = new Map();

  rotas.forEach(rota => {

    const linha =
      rota.linha || "Sem linha";

    if (!mapa.has(linha)) {
      mapa.set(linha, []);
    }

    mapa.get(linha).push(rota);

  });

  return mapa;

}

function calcularTempoBaseDaLinha(rotas) {

  let maiorTempoMin = 0;

  let maiorSetupMin = 0;

  let maiorProdutividade = 0;

  let menorSequencia = Infinity;

  rotas.forEach(rota => {

    maiorTempoMin = Math.max(
      maiorTempoMin,
      numero(rota.tempoProducaoMin)
    );

    maiorSetupMin = Math.max(
      maiorSetupMin,
      numero(rota.setupMin)
    );

    maiorProdutividade = Math.max(
      maiorProdutividade,
      numero(rota.produtividadeKgHora)
    );

    const sequencia =
      obterOrdemTXTRota(
        rota
      );

    if (sequencia > 0) {
      menorSequencia = Math.min(
        menorSequencia,
        sequencia
      );
    }

  });

  return {

    tempoBaseMin:
      maiorTempoMin,

    setupBaseMin:
      maiorSetupMin,

    produtividadeKgHora:
      maiorProdutividade,

    sequenciaPrincipal:
      menorSequencia === Infinity
        ? 0
        : menorSequencia

  };

}

function selecionarLinhaPrincipal(produtoMestre) {

  const rotas =
    produtoMestre.rotasTecnicas || [];

  const rotasPorLinha =
    agruparRotasPorLinha(rotas);

  const candidatas =
    Array.from(rotasPorLinha.entries())
      .map(([linha, rotasLinha]) => {

        const base =
          calcularTempoBaseDaLinha(rotasLinha);

        return {

          linha,

          rotas: rotasLinha,

          ...base

        };

      });

  if (candidatas.length === 0) {
    return null;
  }

  /**
   * Regra inicial:
   * 1. Menor sequência técnica do TXT.
   * 2. Maior produtividade.
   * 3. Menor tempo base.
   */
  candidatas.sort((a, b) => {

    if (a.sequenciaPrincipal !== b.sequenciaPrincipal) {
      return a.sequenciaPrincipal - b.sequenciaPrincipal;
    }

    if (a.produtividadeKgHora !== b.produtividadeKgHora) {
      return b.produtividadeKgHora - a.produtividadeKgHora;
    }

    return a.tempoBaseMin - b.tempoBaseMin;

  });

  return candidatas[0];

}

function criarProdutoPlanejado(produtoMestre, rota) {

  const demandaFinal =
    numero(produtoMestre.demandaReferencia);

  const unidadeBaseTXT =
    numero(rota.unidadeDia);

  const tempoBaseTXTMin =
    numero(rota.tempoProducaoMin);

  const tempoUnitarioMin =
    unidadeBaseTXT > 0
      ? tempoBaseTXTMin / unidadeBaseTXT
      : 0;

  const ordemTXT =
    obterOrdemTXTRota(
      rota
    );

  return {

    codigo:
      produtoMestre.codigo,

    nomeOficial:
      produtoMestre.nomeOficial,

    descricaoCSV:
      produtoMestre.descricaoCSV,

    descricaoTXT:
      produtoMestre.descricaoTXT,

    linha:
      rota.linha || "Sem linha",

    /**
     * Ordem real vinda do TXT.
     */
    sequenciaTXT:
      ordemTXT,

    ordemTXT:
      ordemTXT,

    ordemLinhaTXT:
      ordemTXT,

    linhasPermitidas:
      extrairLinhasPermitidas(produtoMestre),

    rotasTecnicasProduto:
      produtoMestre.rotasTecnicas || [],

    zonas: new Set([
      rota.zona || ""
    ]),

    sequencias: [
      ordemTXT
    ],

    demandaFinal,

    unidadeBaseTXT,

    tempoBaseTXTMin,

    tempoUnitarioMin,

    setupMin:
      numero(rota.setupMin),

    setupTrocaMin:
      numero(rota.setupMin),

    setupBaseMin:
      numero(rota.setupMin),

    produtividadeKgHora:
      numero(rota.produtividadeKgHora),

    etapasTecnicas:
      1,

    rotasOriginais: [
      rota
    ]

  };

}

function mesclarRota(produtoPlanejado, rota) {

  produtoPlanejado.zonas.add(
    rota.zona || ""
  );

  const ordemTXT =
    obterOrdemTXTRota(
      rota
    );

  produtoPlanejado.sequencias.push(
    ordemTXT
  );

  const menorOrdemAtual =
    obterMenorSequenciaValida(
      produtoPlanejado.sequencias
    );

  produtoPlanejado.sequenciaTXT =
    menorOrdemAtual;

  produtoPlanejado.ordemTXT =
    menorOrdemAtual;

  produtoPlanejado.ordemLinhaTXT =
    menorOrdemAtual;

  produtoPlanejado.etapasTecnicas += 1;

  const unidadeBaseTXT =
    numero(rota.unidadeDia);

  const tempoBaseTXTMin =
    numero(rota.tempoProducaoMin);

  const tempoUnitarioMin =
    unidadeBaseTXT > 0
      ? tempoBaseTXTMin / unidadeBaseTXT
      : 0;

  /**
   * Usamos o maior tempo unitário encontrado.
   * É uma regra conservadora para não subestimar capacidade.
   */
  produtoPlanejado.tempoUnitarioMin = Math.max(
    produtoPlanejado.tempoUnitarioMin,
    tempoUnitarioMin
  );

  produtoPlanejado.tempoBaseTXTMin = Math.max(
    produtoPlanejado.tempoBaseTXTMin,
    tempoBaseTXTMin
  );

  produtoPlanejado.unidadeBaseTXT = Math.max(
    produtoPlanejado.unidadeBaseTXT,
    unidadeBaseTXT
  );

  produtoPlanejado.setupMin = Math.max(
    produtoPlanejado.setupMin,
    numero(rota.setupMin)
  );

  produtoPlanejado.setupTrocaMin = Math.max(
    numero(produtoPlanejado.setupTrocaMin),
    numero(rota.setupMin)
  );

  produtoPlanejado.setupBaseMin = Math.max(
    numero(produtoPlanejado.setupBaseMin),
    numero(rota.setupMin)
  );

  produtoPlanejado.produtividadeKgHora = Math.max(
    produtoPlanejado.produtividadeKgHora,
    numero(rota.produtividadeKgHora)
  );

  produtoPlanejado.rotasOriginais.push(
    rota
  );

}

function finalizarProdutoPlanejado(produto) {

  const sequenciaPrincipal =
    obterMenorSequenciaValida(
      produto.sequencias
    );

  let tempoProducaoPlanejadoMin = 0;

  let statusCalculo = "";

  if (produto.tempoUnitarioMin > 0) {

    tempoProducaoPlanejadoMin = Math.ceil(
      produto.demandaFinal * produto.tempoUnitarioMin
    );

    statusCalculo = "CALCULADO_POR_DEMANDA";

  } else {

    /**
     * Fallback:
     * Caso o TXT não tenha unidade base, usa o tempo técnico original.
     */
    tempoProducaoPlanejadoMin =
      produto.tempoBaseTXTMin;

    statusCalculo =
      "USANDO_TEMPO_TECNICO_TXT";

  }

  const setupFinalMin =
    numero(
      produto.setupMin ??
      produto.setupBaseMin ??
      produto.setupTrocaMin
    );

  const tempoTotalPlanejadoMin =
    tempoProducaoPlanejadoMin + setupFinalMin;

  return {

    ...produto,

    /**
     * Ordem real vinda do TXT preservada no produto planejado.
     */
    sequenciaTXT:
      sequenciaPrincipal,

    ordemTXT:
      sequenciaPrincipal,

    ordemLinhaTXT:
      sequenciaPrincipal,

    setupMin:
      setupFinalMin,

    setupTrocaMin:
      numero(produto.setupTrocaMin ?? setupFinalMin),

    setupBaseMin:
      numero(produto.setupBaseMin ?? setupFinalMin),

    zonasTexto: Array.from(produto.zonas)
      .filter(Boolean)
      .join(" / "),

    sequenciaPrincipal,

    tempoProducaoPlanejadoMin,

    tempoTotalPlanejadoMin,

    statusCalculo,

    possuiLinhaAlternativa:
      produto.linhasAlternativas?.length > 0,

    linhasAlternativas:
      produto.linhasAlternativas || []

  };

}

function ordenarProdutosPlanejados(
  produtoA,
  produtoB
) {

  const ordemA =
    obterOrdemProdutoPlanejado(
      produtoA
    );

  const ordemB =
    obterOrdemProdutoPlanejado(
      produtoB
    );

  if (ordemA !== ordemB) {
    return ordemA - ordemB;
  }

  return String(produtoA.nomeOficial || "")
    .localeCompare(
      String(produtoB.nomeOficial || ""),
      "pt-BR"
    );

}

function agruparProdutosPorLinha(produtosMestre) {

  const mapaLinhas = new Map();

  produtosMestre.forEach(produtoMestre => {

    const linhaPrincipal =
      selecionarLinhaPrincipal(
        produtoMestre
      );

    if (
      !linhaPrincipal ||
      !linhaPrincipal.rotas ||
      linhaPrincipal.rotas.length === 0
    ) {
      return;
    }

    const linha =
      linhaPrincipal.linha || "Sem linha";

    if (!mapaLinhas.has(linha)) {
      mapaLinhas.set(linha, new Map());
    }

    const mapaProdutos =
      mapaLinhas.get(linha);

    const chaveProduto = [
      produtoMestre.codigo,
      produtoMestre.nomeOficial,
      linha
    ].join("|");

    linhaPrincipal.rotas.forEach(rota => {

      if (!mapaProdutos.has(chaveProduto)) {

        const produtoPlanejado =
          criarProdutoPlanejado(
            produtoMestre,
            rota
          );

        produtoPlanejado.linhaPrincipal =
          linha;

        produtoPlanejado.linhaPlanejada =
          linha;

        produtoPlanejado.linhasAlternativas =
          produtoPlanejado.linhasPermitidas.filter(
            item => item !== linha
          );

        mapaProdutos.set(
          chaveProduto,
          produtoPlanejado
        );

        return;

      }

      mesclarRota(
        mapaProdutos.get(chaveProduto),
        rota
      );

    });

  });

  const linhas = Array.from(mapaLinhas.entries())
    .map(([linha, mapaProdutos]) => {

      const produtos =
        Array.from(mapaProdutos.values())
          .map(finalizarProdutoPlanejado)
          .sort(ordenarProdutosPlanejados);

      const tempoTotalLinhaMin =
        produtos.reduce((soma, produto) => {

          return soma + produto.tempoTotalPlanejadoMin;

        }, 0);

      const setupTotalLinhaMin =
        produtos.reduce((soma, produto) => {

          return soma + produto.setupMin;

        }, 0);

      const demandaTotalLinha =
        produtos.reduce((soma, produto) => {

          return soma + produto.demandaFinal;

        }, 0);

      return {

        linha,

        produtos,

        resumo: {

          totalProdutos:
            produtos.length,

          demandaTotal:
            demandaTotalLinha,

          tempoTotalMin:
            tempoTotalLinhaMin,

          setupTotalMin:
            setupTotalLinhaMin

        }

      };

    })
    .sort(ordenarLinhas);

  return linhas;

}

function calcularResumoGeral(linhas) {

  return linhas.reduce((resumo, linha) => {

    resumo.totalLinhas += 1;

    resumo.totalProdutos +=
      linha.resumo.totalProdutos;

    resumo.demandaTotal +=
      linha.resumo.demandaTotal;

    resumo.tempoTotalMin +=
      linha.resumo.tempoTotalMin;

    resumo.setupTotalMin +=
      linha.resumo.setupTotalMin;

    return resumo;

  }, {

    totalLinhas:
      0,

    totalProdutos:
      0,

    demandaTotal:
      0,

    tempoTotalMin:
      0,

    setupTotalMin:
      0

  });

}

export function gerarPlanejamentoReal(produtosMestre) {

  const produtos =
    Array.isArray(produtosMestre)
      ? produtosMestre
      : [];

  const linhas =
    agruparProdutosPorLinha(produtos);

  const resumo =
    calcularResumoGeral(linhas);

  return {

    linhas,

    resumo,

    criadoEm:
      new Date().toISOString()

  };

}