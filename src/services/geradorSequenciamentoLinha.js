/**
 * ======================================================
 * JFC FLOW
 * Módulo: geradorSequenciamentoLinha
 * Versão: 1.0.2
 *
 * Responsabilidade:
 * Gerar o sequenciamento por família, respeitando:
 * 1) ordem manual editada pelo PCP;
 * 2) ordem real de entrada vinda do TXT;
 * 3) ordem da família como fallback;
 * 4) nome da família;
 * 5) nome do produto.
 *
 * Regra principal:
 * A numeração do TXT:
 * 1. Produto A
 * 2. Produto B
 * 3. Produto C
 *
 * é a ordem real de entrada na linha e deve ser respeitada.
 *
 * Regra de setup:
 * - Primeiro produto da linha: setup 0.
 * - Mesma família do produto anterior: setup 0.
 * - Mudança de família: aplica o setup da família/produto atual.
 * ======================================================
 */

import {
  aplicarFamiliaCadastradaAoProduto
} from "./familiaCadastroService.js";

function texto(valor) {

  return String(valor ?? "").trim();

}

function numero(valor, padrao = 0) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {

    return padrao;

  }

  const textoValor =
    String(valor)
      .trim();

  let textoNormalizado =
    textoValor;

  if (
    textoValor.includes(",")
  ) {

    textoNormalizado =
      textoValor
        .replace(/\./g, "")
        .replace(",", ".");

  }

  const convertido =
    Number(
      textoNormalizado
        .replace(/[^0-9.-]/g, "")
    );

  return Number.isFinite(convertido)
    ? convertido
    : padrao;

}

function normalizarNumeroOrdem(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {

    return null;

  }

  const convertido =
    numero(
      valor,
      null
    );

  return Number.isFinite(convertido)
    ? convertido
    : null;

}

function obterPrimeiraRota(produto = {}) {

  if (
    Array.isArray(produto.rotasTecnicas) &&
    produto.rotasTecnicas.length > 0
  ) {

    return produto.rotasTecnicas[0] || {};

  }

  if (
    Array.isArray(produto.rotasTecnicasProduto) &&
    produto.rotasTecnicasProduto.length > 0
  ) {

    return produto.rotasTecnicasProduto[0] || {};

  }

  if (
    Array.isArray(produto.rotasOriginais) &&
    produto.rotasOriginais.length > 0
  ) {

    return produto.rotasOriginais[0] || {};

  }

  if (
    Array.isArray(produto.rotas) &&
    produto.rotas.length > 0
  ) {

    return produto.rotas[0] || {};

  }

  return produto.rotaTecnica || produto.rota || {};

}

/**
 * Ordem real do TXT.
 *
 * Prioridade:
 * - ordemLinhaTXT
 * - ordemTXT
 * - sequenciaTXT
 * - sequenciaPrincipal
 * - sequencia
 * - rota.*
 */
export function obterOrdemTXT(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  return normalizarNumeroOrdem(
    produto.ordemLinhaTXT ??
    produto.ordemTXT ??
    produto.ordemTxt ??
    produto.sequenciaTXT ??
    produto.sequenciaTxt ??
    produto.sequenciaPrincipal ??
    produto.sequencia ??
    produto.ordemBaseTXT ??
    produto.ordemBaseTxt ??
    produto.ordemRoteiro ??
    produto.sequenciaRoteiro ??
    produto.sequenciaProducao ??
    produto.ordemProducaoTXT ??
    rota.ordemLinhaTXT ??
    rota.ordemTXT ??
    rota.ordemTxt ??
    rota.sequenciaTXT ??
    rota.sequenciaTxt ??
    rota.sequenciaPrincipal ??
    rota.sequencia ??
    rota.ordemBaseTXT ??
    rota.ordemBaseTxt ??
    rota.ordemRoteiro ??
    rota.sequenciaRoteiro ??
    rota.sequenciaProducao ??
    rota.ordemProducaoTXT
  );

}

export function obterOrdemManual(produto = {}) {

  return normalizarNumeroOrdem(
    produto.ordemSequenciamentoManual ??
    produto.ordemManual ??
    produto.ordemPlanejadaManual ??
    produto.ordemEditada ??
    produto.ordemUsuario
  );

}

function obterOrdemFamilia(produto = {}) {

  return normalizarNumeroOrdem(
    produto.ordemFamiliaTXT ??
    produto.ordemFamilia ??
    produto.familiaOrdemTXT ??
    produto.familiaSequenciaTXT
  );

}

function obterNomeProduto(produto = {}) {

  return texto(
    produto.nomeOficial ??
    produto.nomeProduto ??
    produto.produtoVenda ??
    produto.produto ??
    produto.descricaoCSV ??
    produto.descricaoTXT ??
    produto.descricao ??
    produto.nome
  );

}

function obterCodigoProduto(produto = {}) {

  return texto(
    produto.codigo ??
    produto.codigoProduto ??
    produto.codProduto ??
    produto.cod
  );

}

function normalizarFamilia(valor) {

  const familia =
    texto(valor)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  return familia || "SEM FAMÍLIA";

}

function obterFamiliaSetup(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  return normalizarFamilia(
    produto.familiaSetup ??
    produto.classeSetup ??
    produto.familia ??
    produto.categoria ??
    produto.grupoSetup ??
    produto.categoriaSetup ??
    rota.familiaSetup ??
    rota.classeSetup ??
    rota.familia ??
    rota.categoria ??
    rota.grupoSetup ??
    rota.categoriaSetup ??
    obterNomeProduto(produto).split(" ")[0]
  );

}

function obterSetupBaseMin(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  return numero(
    produto.setupTrocaMin ??
    produto.setupBaseMin ??
    produto.setupMin ??
    produto.setup ??
    rota.setupTrocaMin ??
    rota.setupBaseMin ??
    rota.setupMin ??
    rota.setup,
    0
  );

}

function obterKgPlanejado(produto = {}) {

  return numero(
    produto.kgPlanejado ??
    produto.demandaKg ??
    produto.demandaTotalKg ??
    produto.kgTotal ??
    produto.kgDia ??
    produto.pesoLiquido ??
    produto.pesoBruto ??
    produto.demandaFinal ??
    produto.demandaReferencia ??
    produto.demanda,
    0
  );

}

function obterTempoProducaoMin(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  const tempoInformado =
    numero(
      produto.tempoProducaoPlanejadoMin ??
      produto.tempoPlanejadoMin ??
      produto.tempoProducaoMin ??
      produto.tempoMin ??
      produto.tempo ??
      rota.tempoProducaoPlanejadoMin ??
      rota.tempoPlanejadoMin ??
      rota.tempoProducaoMin ??
      rota.prodMin ??
      rota.tempoMin ??
      rota.tempo,
      null
    );

  if (tempoInformado !== null) {

    return tempoInformado;

  }

  const kgPlanejado =
    obterKgPlanejado(produto);

  const produtividadeKgHora =
    numero(
      produto.produtividadeKgHora ??
      produto.kgHora ??
      rota.produtividadeKgHora ??
      rota.kgHora,
      0
    );

  if (
    kgPlanejado > 0 &&
    produtividadeKgHora > 0
  ) {

    return Math.ceil(
      (kgPlanejado / produtividadeKgHora) * 60
    );

  }

  return 0;

}

/**
 * Comparador oficial do Sequenciamento por Família.
 *
 * Ordem:
 * 1. Ordem manual
 * 2. Ordem real do TXT
 * 3. Ordem da família
 * 4. Nome da família
 * 5. Nome do produto
 */
function compararProdutosSequenciamento(produtoA, produtoB) {

  const ordemManualA =
    obterOrdemManual(produtoA);

  const ordemManualB =
    obterOrdemManual(produtoB);

  if (
    ordemManualA !== null ||
    ordemManualB !== null
  ) {

    const diferencaManual =
      (ordemManualA ?? 999999) -
      (ordemManualB ?? 999999);

    if (diferencaManual !== 0) {
      return diferencaManual;
    }

  }

  const ordemTXTA =
    obterOrdemTXT(produtoA);

  const ordemTXTB =
    obterOrdemTXT(produtoB);

  if (
    ordemTXTA !== null ||
    ordemTXTB !== null
  ) {

    const diferencaTXT =
      (ordemTXTA ?? 999999) -
      (ordemTXTB ?? 999999);

    if (diferencaTXT !== 0) {
      return diferencaTXT;
    }

  }

  const ordemFamiliaA =
    obterOrdemFamilia(produtoA);

  const ordemFamiliaB =
    obterOrdemFamilia(produtoB);

  if (
    ordemFamiliaA !== null ||
    ordemFamiliaB !== null
  ) {

    const diferencaFamilia =
      (ordemFamiliaA ?? 999999) -
      (ordemFamiliaB ?? 999999);

    if (diferencaFamilia !== 0) {
      return diferencaFamilia;
    }

  }

  const familiaA =
    obterFamiliaSetup(produtoA);

  const familiaB =
    obterFamiliaSetup(produtoB);

  const diferencaNomeFamilia =
    familiaA.localeCompare(
      familiaB,
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

  if (diferencaNomeFamilia !== 0) {
    return diferencaNomeFamilia;
  }

  return obterNomeProduto(produtoA)
    .localeCompare(
      obterNomeProduto(produtoB),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

}

function criarSlug(valor) {

  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "familia";

}

function obterNomeLinha(linhaPlanejada = {}) {

  return texto(
    linhaPlanejada.linha ??
    linhaPlanejada.nomeLinha ??
    linhaPlanejada.nome ??
    linhaPlanejada.id
  );

}

function criarProdutoSequenciado(
  produto,
  indice,
  familiaAnterior
) {

  const familiaSetup =
    obterFamiliaSetup(produto);

  const setupBaseMin =
    obterSetupBaseMin(produto);

  const setupAplicadoMin =
    indice === 0 || familiaSetup === familiaAnterior
      ? 0
      : setupBaseMin;

  const tempoProducaoPlanejadoMin =
    obterTempoProducaoMin(produto);

  const tempoTotalPlanejadoMin =
    tempoProducaoPlanejadoMin + setupAplicadoMin;

  const ordemTXT =
    obterOrdemTXT(produto);

  const ordemSequenciamentoManual =
    obterOrdemManual(produto);

  return {
    ...produto,

    ordemProducao:
      indice + 1,

    ordemPlanejada:
      indice + 1,

    ordemTXT:
      ordemTXT ?? produto.ordemTXT ?? null,

    sequenciaTXT:
      ordemTXT ?? produto.sequenciaTXT ?? null,

    ordemLinhaTXT:
      ordemTXT ?? produto.ordemLinhaTXT ?? null,

    ordemSequenciamentoManual,

    familiaSetup,

    classeSetup:
      familiaSetup,

    setupBaseMin,

    setupAplicadoMin,

    tempoProducaoPlanejadoMin,

    tempoTotalPlanejadoMin,

    kgPlanejado:
      obterKgPlanejado(produto),

    codigo:
      obterCodigoProduto(produto) || produto.codigo,

    nomeOficial:
      obterNomeProduto(produto) || produto.nomeOficial
  };

}

function somarProdutos(produtos, campo) {

  return produtos.reduce((total, produto) => {

    return total + numero(produto[campo], 0);

  }, 0);

}

function criarResumoSequenciamento(produtos, blocos) {

  return {
    totalProdutos:
      produtos.length,

    totalBlocos:
      blocos.length,

    kgTotal:
      somarProdutos(produtos, "kgPlanejado"),

    tempoProducaoMin:
      somarProdutos(produtos, "tempoProducaoPlanejadoMin"),

    setupAplicadoMin:
      somarProdutos(produtos, "setupAplicadoMin"),

    tempoTotalMin:
      somarProdutos(produtos, "tempoTotalPlanejadoMin")
  };

}

function criarBlocosFamilia(
  produtosSequenciados,
  nomeLinha
) {

  const blocos = [];

  produtosSequenciados.forEach((produto) => {

    const ultimoBloco =
      blocos[blocos.length - 1];

    if (
      ultimoBloco &&
      ultimoBloco.familiaSetup === produto.familiaSetup
    ) {

      ultimoBloco.produtos.push(produto);
      return;

    }

    const ordemBloco =
      blocos.length + 1;

    const blocoId =
      `${nomeLinha || "LINHA"}-${ordemBloco}-${criarSlug(produto.familiaSetup)}`;

    blocos.push({
      id:
        blocoId,

      blocoId,

      linha:
        nomeLinha,

      ordemBloco,

      familiaSetup:
        produto.familiaSetup,

      classeSetup:
        produto.classeSetup,

      produtos: [
        produto
      ]
    });

  });

  return blocos.map((bloco) => {

    const ordensTXT =
      bloco.produtos
        .map(obterOrdemTXT)
        .filter(valor => valor !== null)
        .sort((a, b) => a - b);

    return {
      ...bloco,

      totalProdutos:
        bloco.produtos.length,

      kgTotal:
        somarProdutos(bloco.produtos, "kgPlanejado"),

      tempoProducaoMin:
        somarProdutos(bloco.produtos, "tempoProducaoPlanejadoMin"),

      setupAplicadoMin:
        somarProdutos(bloco.produtos, "setupAplicadoMin"),

      tempoTotalMin:
        somarProdutos(bloco.produtos, "tempoTotalPlanejadoMin"),

      ordemTXTInicial:
        ordensTXT.length > 0
          ? ordensTXT[0]
          : null,

      ordemTXTFinal:
        ordensTXT.length > 0
          ? ordensTXT[ordensTXT.length - 1]
          : null
    };

  });

}

export function gerarSequenciamentoLinha(
  linhaPlanejada,
  opcoes = {}
) {

  if (!linhaPlanejada) {
    return linhaPlanejada;
  }

  const nomeLinha =
    obterNomeLinha(
      linhaPlanejada
    );

  const produtosOriginais =
    Array.isArray(linhaPlanejada.produtos)
      ? linhaPlanejada.produtos
      : Array.isArray(linhaPlanejada.itens)
        ? linhaPlanejada.itens
        : [];

  const comparador =
    opcoes.comparador ||
    compararProdutosSequenciamento;

  const produtosOrdenados =
    produtosOriginais
      .map(produto => {

        return aplicarFamiliaCadastradaAoProduto(
          produto
        );

      })
      .sort(
        comparador
      );

  let familiaAnterior =
    null;

  const produtosSequenciados =
    produtosOrdenados.map((produto, indice) => {

      const produtoSequenciado =
        criarProdutoSequenciado(
          produto,
          indice,
          familiaAnterior
        );

      familiaAnterior =
        produtoSequenciado.familiaSetup;

      return produtoSequenciado;

    });

  const blocos =
    criarBlocosFamilia(
      produtosSequenciados,
      nomeLinha
    );

  return {
    ...linhaPlanejada,

    linha:
      nomeLinha || linhaPlanejada.linha,

    produtos:
      produtosSequenciados,

    blocos,

    resumoSequenciamento:
      criarResumoSequenciamento(
        produtosSequenciados,
        blocos
      )
  };

}

export function gerarSequenciamentoPlanejamento(
  planejamento,
  opcoes = {}
) {

  if (!planejamento) {
    return planejamento;
  }

  const linhasOriginais =
    planejamento.linhas ||
    [];

  const linhasSequenciadas =
    linhasOriginais.map(linha => {

      return gerarSequenciamentoLinha(
        linha,
        opcoes
      );

    });

  const resumoSequenciamento =
    linhasSequenciadas.reduce((resumo, linha) => {

      const resumoLinha =
        linha.resumoSequenciamento || {};

      resumo.totalLinhas += 1;

      resumo.totalProdutos +=
        numero(resumoLinha.totalProdutos, 0);

      resumo.totalBlocos +=
        numero(resumoLinha.totalBlocos, 0);

      resumo.kgTotal +=
        numero(resumoLinha.kgTotal, 0);

      resumo.tempoProducaoMin +=
        numero(resumoLinha.tempoProducaoMin, 0);

      resumo.setupAplicadoMin +=
        numero(resumoLinha.setupAplicadoMin, 0);

      resumo.tempoTotalMin +=
        numero(resumoLinha.tempoTotalMin, 0);

      return resumo;

    }, {
      totalLinhas:
        0,

      totalProdutos:
        0,

      totalBlocos:
        0,

      kgTotal:
        0,

      tempoProducaoMin:
        0,

      setupAplicadoMin:
        0,

      tempoTotalMin:
        0
    });

  return {
    ...planejamento,

    linhas:
      linhasSequenciadas,

    resumoSequenciamento
  };

}