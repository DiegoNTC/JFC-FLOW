/**
 * ======================================================
 * JFC FLOW
 * Módulo: geradorSequenciamentoLinha
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Gerar sequência de produção por linha usando família/setup.
 *
 * Regra:
 * - Primeiro produto da linha não tem setup.
 * - Produto da mesma família do anterior não tem setup.
 * - Quando muda a família, aplica setup de troca do produto atual.
 * ======================================================
 */

import {
  inferirFamiliaSetup
} from "./familiaSetupService.js";

function texto(valor) {

  return String(valor ?? "")
    .trim();

}

function numero(valor) {

  return Number(
    String(valor ?? "")
      .replace(",", ".")
  ) || 0;

}

function arredondar(
  valor,
  casas = 2
) {

  const fator =
    10 ** casas;

  return Math.round(numero(valor) * fator) / fator;

}

function normalizarFamilia(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

function obterNomeProduto(produto) {

  return (
    produto?.nomeOficial ||
    produto?.descricaoCSV ||
    produto?.descricao ||
    produto?.produto ||
    produto?.descricaoTXT ||
    ""
  );

}

function obterCodigoProduto(produto) {

  return texto(
    produto?.codigo ||
    produto?.codigoProduto ||
    produto?.codProduto ||
    produto?.id ||
    ""
  );

}

function obterFamiliaProduto(produto) {

  const familia =
    produto?.familiaSetup ||
    produto?.classeSetup ||
    produto?.familia ||
    produto?.grupoSetup ||
    "";

  if (texto(familia)) {
    return normalizarFamilia(familia);
  }

  return normalizarFamilia(
    inferirFamiliaSetup(produto)
  );

}

function obterLinhaProduto(produto, linhaPadrao = "") {

  return texto(
    produto?.linhaPlanejada ||
    produto?.linhaPrincipal ||
    produto?.linha ||
    produto?.linhaDestino ||
    linhaPadrao
  );

}

function obterSequenciaProduto(
  produto,
  index
) {

  const sequencia =
    produto?.ordemPlanejada ??
    produto?.ordemProducao ??
    produto?.sequenciaTXT ??
    produto?.sequenciaPrincipal ??
    produto?.sequencia ??
    produto?.ordem ??
    index + 1;

  return numero(sequencia);

}

function obterSetupBaseProduto(produto) {

  return numero(
    produto?.setupTrocaMin ??
    produto?.setupBaseMin ??
    produto?.setupMin ??
    produto?.setup ??
    0
  );

}

function obterTempoProducaoProduto(produto) {

  const tempoProducao =
    produto?.tempoProducaoPlanejadoMin ??
    produto?.tempoProducaoMin ??
    produto?.tempoMin ??
    produto?.tempoPlanejadoMin;

  if (tempoProducao !== undefined && tempoProducao !== null) {
    return numero(tempoProducao);
  }

  /**
   * Fallback:
   * Se o produto antigo só tiver tempo total, usa esse tempo.
   * Depois, quando o projeto estiver 100% padronizado,
   * o ideal é sempre usar tempoProducaoPlanejadoMin.
   */
  return numero(
    produto?.tempoTotalPlanejadoMin ??
    produto?.tempoTotalMin ??
    0
  );

}

function obterKgPlanejadoProduto(produto) {

  return numero(
    produto?.kgPlanejado ??
    produto?.pesoPlanejadoKg ??
    produto?.demandaKg ??
    produto?.kgDia ??
    produto?.pesoLiquido ??
    produto?.pesoBruto ??
    0
  );

}

function ordenarProdutosPorSequencia(
  produtos
) {

  return produtos
    .map((produto, index) => ({
      produto,
      indexOriginal: index,
      sequencia: obterSequenciaProduto(
        produto,
        index
      )
    }))
    .sort((a, b) => {

      if (a.sequencia !== b.sequencia) {
        return a.sequencia - b.sequencia;
      }

      return a.indexOriginal - b.indexOriginal;

    })
    .map(item => item.produto);

}

function recalcularProdutosDaLinha(
  produtos,
  linha
) {

  const produtosOrdenados =
    ordenarProdutosPorSequencia(
      produtos
    );

  let familiaAnterior =
    null;

  return produtosOrdenados.map((produto, index) => {

    const familiaAtual =
      obterFamiliaProduto(produto);

    const setupBaseMin =
      obterSetupBaseProduto(produto);

    let setupAplicadoMin =
      0;

    if (
      index > 0 &&
      familiaAnterior &&
      familiaAtual !== familiaAnterior
    ) {

      setupAplicadoMin =
        setupBaseMin;

    }

    const tempoProducaoPlanejadoMin =
      obterTempoProducaoProduto(produto);

    const tempoTotalPlanejadoMin =
      tempoProducaoPlanejadoMin +
      setupAplicadoMin;

    const produtoRecalculado = {

      ...produto,

      codigo:
        obterCodigoProduto(produto),

      nomeOficial:
        obterNomeProduto(produto),

      linhaPlanejada:
        obterLinhaProduto(produto, linha),

      ordemProducao:
        index + 1,

      ordemPlanejada:
        index + 1,

      familiaSetup:
        familiaAtual,

      classeSetup:
        familiaAtual,

      setupBaseMin:
        arredondar(setupBaseMin),

      setupAplicadoMin:
        arredondar(setupAplicadoMin),

      tempoProducaoPlanejadoMin:
        arredondar(tempoProducaoPlanejadoMin),

      tempoTotalPlanejadoMin:
        arredondar(tempoTotalPlanejadoMin),

      kgPlanejado:
        arredondar(
          obterKgPlanejadoProduto(produto)
        )

    };

    familiaAnterior =
      familiaAtual;

    return produtoRecalculado;

  });

}

function agruparProdutosEmBlocos(
  produtos
) {

  const blocos =
    [];

  produtos.forEach(produto => {

    const familia =
      produto.familiaSetup ||
      produto.classeSetup ||
      "SEM_FAMILIA";

    const ultimoBloco =
      blocos[blocos.length - 1];

    const deveCriarNovoBloco =
      !ultimoBloco ||
      ultimoBloco.familiaSetup !== familia;

    if (deveCriarNovoBloco) {

      blocos.push({

        id:
          `${familia}-${blocos.length + 1}`,

        ordem:
          blocos.length + 1,

        familiaSetup:
          familia,

        classeSetup:
          familia,

        produtos:
          [],

        quantidadeProdutos:
          0,

        kgTotal:
          0,

        tempoProducaoMin:
          0,

        setupEntradaMin:
          produto.setupAplicadoMin || 0,

        tempoTotalMin:
          0

      });

    }

    const blocoAtual =
      blocos[blocos.length - 1];

    blocoAtual.produtos.push(
      produto
    );

    blocoAtual.quantidadeProdutos =
      blocoAtual.produtos.length;

    blocoAtual.kgTotal =
      arredondar(
        blocoAtual.kgTotal +
        numero(produto.kgPlanejado)
      );

    blocoAtual.tempoProducaoMin =
      arredondar(
        blocoAtual.tempoProducaoMin +
        numero(produto.tempoProducaoPlanejadoMin)
      );

    blocoAtual.tempoTotalMin =
      arredondar(
        blocoAtual.tempoTotalMin +
        numero(produto.tempoTotalPlanejadoMin)
      );

  });

  return blocos;

}

function calcularResumoLinha(
  produtos,
  blocos
) {

  const tempoProducaoMin =
    produtos.reduce((total, produto) => {

      return total + numero(
        produto.tempoProducaoPlanejadoMin
      );

    }, 0);

  const setupAplicadoMin =
    produtos.reduce((total, produto) => {

      return total + numero(
        produto.setupAplicadoMin
      );

    }, 0);

  const tempoTotalMin =
    tempoProducaoMin + setupAplicadoMin;

  const kgTotal =
    produtos.reduce((total, produto) => {

      return total + numero(
        produto.kgPlanejado
      );

    }, 0);

  return {

    totalProdutos:
      produtos.length,

    totalBlocos:
      blocos.length,

    kgTotal:
      arredondar(kgTotal),

    tempoProducaoMin:
      arredondar(tempoProducaoMin),

    setupAplicadoMin:
      arredondar(setupAplicadoMin),

    tempoTotalMin:
      arredondar(tempoTotalMin)

  };

}

function obterProdutosDaLinha(
  linhaPlanejada
) {

  if (Array.isArray(linhaPlanejada?.produtos)) {
    return linhaPlanejada.produtos;
  }

  if (Array.isArray(linhaPlanejada?.itens)) {
    return linhaPlanejada.itens;
  }

  if (Array.isArray(linhaPlanejada?.skus)) {
    return linhaPlanejada.skus;
  }

  if (Array.isArray(linhaPlanejada?.pedidos)) {
    return linhaPlanejada.pedidos;
  }

  return [];

}

function obterNomeLinha(
  linhaPlanejada,
  fallback = ""
) {

  return texto(
    linhaPlanejada?.linha ||
    linhaPlanejada?.nomeLinha ||
    linhaPlanejada?.id ||
    linhaPlanejada?.codigo ||
    fallback
  );

}

export function gerarSequenciamentoLinha(
  linhaPlanejada,
  opcoes = {}
) {

  const linha =
    obterNomeLinha(
      linhaPlanejada,
      opcoes.linha || ""
    );

  const produtosOriginais =
    obterProdutosDaLinha(
      linhaPlanejada
    );

  const produtos =
    recalcularProdutosDaLinha(
      produtosOriginais,
      linha
    );

  const blocos =
    agruparProdutosEmBlocos(
      produtos
    );

  const resumo =
    calcularResumoLinha(
      produtos,
      blocos
    );

  return {

    ...linhaPlanejada,

    linha,

    produtos,

    blocos,

    resumoSequenciamento:
      resumo,

    tempoProducaoMin:
      resumo.tempoProducaoMin,

    setupAplicadoMin:
      resumo.setupAplicadoMin,

    tempoTotalPlanejadoMin:
      resumo.tempoTotalMin,

    totalBlocos:
      resumo.totalBlocos

  };

}

function obterLinhasDoPlanejamento(
  planejamento
) {

  if (!planejamento) {
    return [];
  }

  if (Array.isArray(planejamento)) {
    return planejamento;
  }

  if (Array.isArray(planejamento.linhas)) {
    return planejamento.linhas;
  }

  if (
    planejamento.linhas &&
    typeof planejamento.linhas === "object"
  ) {
    return Object.values(
      planejamento.linhas
    );
  }

  if (Array.isArray(planejamento.linhasPlanejadas)) {
    return planejamento.linhasPlanejadas;
  }

  if (Array.isArray(planejamento.linhasComCapacidade)) {
    return planejamento.linhasComCapacidade;
  }

  if (Array.isArray(planejamento.planejamentoPorLinha)) {
    return planejamento.planejamentoPorLinha;
  }

  if (
    planejamento.planejamentoPorLinha &&
    typeof planejamento.planejamentoPorLinha === "object"
  ) {
    return Object.values(
      planejamento.planejamentoPorLinha
    );
  }

  return [];

}

export function gerarSequenciamentoPlanejamento(
  planejamento,
  opcoes = {}
) {

  const linhasOriginais =
    obterLinhasDoPlanejamento(
      planejamento
    );

  const linhasSequenciadas =
    linhasOriginais.map((linha, index) => {

      return gerarSequenciamentoLinha(
        linha,
        {
          ...opcoes,
          linha:
            linha?.linha ||
            linha?.nomeLinha ||
            `L${index + 1}`
        }
      );

    });

  const resumoGeral =
    linhasSequenciadas.reduce((total, linha) => {

      const resumo =
        linha.resumoSequenciamento || {};

      return {

        totalLinhas:
          total.totalLinhas + 1,

        totalProdutos:
          total.totalProdutos + numero(
            resumo.totalProdutos
          ),

        totalBlocos:
          total.totalBlocos + numero(
            resumo.totalBlocos
          ),

        kgTotal:
          total.kgTotal + numero(
            resumo.kgTotal
          ),

        tempoProducaoMin:
          total.tempoProducaoMin + numero(
            resumo.tempoProducaoMin
          ),

        setupAplicadoMin:
          total.setupAplicadoMin + numero(
            resumo.setupAplicadoMin
          ),

        tempoTotalMin:
          total.tempoTotalMin + numero(
            resumo.tempoTotalMin
          )

      };

    }, {
      totalLinhas: 0,
      totalProdutos: 0,
      totalBlocos: 0,
      kgTotal: 0,
      tempoProducaoMin: 0,
      setupAplicadoMin: 0,
      tempoTotalMin: 0
    });

  const resumoFinal = {

    totalLinhas:
      resumoGeral.totalLinhas,

    totalProdutos:
      resumoGeral.totalProdutos,

    totalBlocos:
      resumoGeral.totalBlocos,

    kgTotal:
      arredondar(resumoGeral.kgTotal),

    tempoProducaoMin:
      arredondar(resumoGeral.tempoProducaoMin),

    setupAplicadoMin:
      arredondar(resumoGeral.setupAplicadoMin),

    tempoTotalMin:
      arredondar(resumoGeral.tempoTotalMin)

  };

  return {

    ...planejamento,

    linhas:
      linhasSequenciadas,

    linhasSequenciadas,

    resumoSequenciamento:
      resumoFinal

  };

}