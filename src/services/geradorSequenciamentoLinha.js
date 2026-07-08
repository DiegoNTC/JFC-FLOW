/**
 * ======================================================
 * JFC FLOW
 * Módulo: geradorSequenciamentoLinha
 * Versão: 1.1.0
 *
 * Responsabilidade:
 * Gerar o sequenciamento por família, respeitando:
 * 1) ordem manual editada pelo PCP;
 * 2) ordem preservada do planejamento anterior;
 * 3) ordem real de entrada vinda do TXT;
 * 4) ordem da família como fallback;
 * 5) nome da família;
 * 6) nome do produto.
 *
 * Regra principal:
 * A numeração do TXT:
 * 1. Produto A
 * 2. Produto B
 * 3. Produto C
 *
 * é a ordem real inicial de entrada na linha.
 *
 * Porém, depois que o PCP mover produtos manualmente,
 * essa ordem manual deve ser preservada em novas atualizações
 * de pedido/volume.
 *
 * Regra de atualização diária:
 * - Produto que já existia: mantém posição anterior.
 * - Produto novo: entra depois dos existentes, respeitando TXT/família.
 * - Produto que saiu do CSV: não aparece no planejamento do dia.
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

import {
  obterOrdemManualFamilia
} from "../repositories/sequenciamentoManualRepository.js";

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

  if (textoValor.includes(",")) {

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

function normalizarChaveComparacao(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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


function obterOrdemBlocoFamiliaManual(produto = {}) {

  return normalizarNumeroOrdem(
    produto.ordemBlocoFamiliaManual ??
    produto.ordemFamiliaManual ??
    produto.ordemManualFamilia ??
    produto.sequenciaManualFamilia
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

function criarChavesProduto(produto = {}) {

  const codigo =
    normalizarChaveComparacao(
      obterCodigoProduto(produto)
    );

  const nome =
    normalizarChaveComparacao(
      obterNomeProduto(produto)
    );

  const chaves = [];

  if (codigo) {
    chaves.push(
      `CODIGO:${codigo}`
    );
  }

  if (nome) {
    chaves.push(
      `NOME:${nome}`
    );
  }

  return chaves;

}

function normalizarFamilia(valor) {

  let familia =
    texto(valor)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  if (!familia) {
    return "SEM FAMÍLIA";
  }

  /**
   * ======================================================
   * DICIONÁRIO DE EQUIVALÊNCIA DE FAMÍLIAS
   *
   * Objetivo:
   * Corrigir variações de escrita, abreviações e erros comuns
   * para juntar produtos operacionais iguais no mesmo bloco.
   *
   * Exemplo:
   * RUCULA, RUCULA FOLHAS, RUCULA NT -> RUCULA
   * RADICHIO, RADICCHIO -> RADICCHIO
   * ======================================================
   */

  familia = familia
    .replace(/\bHIG\b/g, "")
    .replace(/\bHIGIENIZADA\b/g, "")
    .replace(/\bHIGIENIZADO\b/g, "")
    .replace(/\bFOLHAS\b/g, "")
    .replace(/\bFOLHA\b/g, "")
    .replace(/\bNT\b/g, "")
    .replace(/\bNS\b/g, "")
    .replace(/\bQA\b/g, "")
    .replace(/\bSALADS\b/g, "")
    .replace(/\bSALAD\b/g, "")
    .replace(/\bSALADA\b/g, "")
    .replace(/\bIN NATURA\b/g, "")
    .replace(/\bNATURA\b/g, "")
    .replace(/\bMERCADO\b/g, "")
    .replace(/\bCARREFOUR\b/g, "")
    .replace(/\bPOTE\b/g, "")
    .replace(/\bPC\b/g, "")
    .replace(/\bPCT\b/g, "")
    .replace(/\bUN\b/g, "")
    .replace(/\bKG\b/g, "")
    .replace(/\bG\b/g, "")
    .replace(/\bGR\b/g, "")
    .replace(/\bGRAMAS\b/g, "")
    .replace(/\b\d+[,.]?\d*\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const regrasEquivalencia = [

    {
      destino: "RUCULA",
      termos: [
        "RUCULA",
        "RUCULA FOLHA",
        "RUCULA FOLHAS",
        "RUCULA NT",
        "RUCULA NS"
      ]
    },

    {
      destino: "RADICCHIO",
      termos: [
        "RADICCHIO",
        "RADICHIO",
        "RADICCHIO FOLHA",
        "RADICHIO FOLHA",
        "RADICCHIO HIG",
        "RADICHIO HIG"
      ]
    },

    {
      destino: "ALFACE AMERICANA",
      termos: [
        "ALFACE AMERICANA",
        "ALF AMERICANA",
        "AMERICANA"
      ]
    },

    {
      destino: "ALFACE CRESPA",
      termos: [
        "ALFACE CRESPA",
        "ALF CRESPA",
        "CRESPA"
      ]
    },

    {
      destino: "ALFACE CRESPA ROXA",
      termos: [
        "ALFACE CRESPA ROXA",
        "ALF CRESPA ROXA",
        "CRESPA ROXA"
      ]
    },

    {
      destino: "CEBOLA PICADA",
      termos: [
        "CEBOLA PICADA",
        "CEBOLA PICAD",
        "CEBOLA PIC"
      ]
    },

    {
      destino: "CEBOLA RODELA",
      termos: [
        "CEBOLA RODELA",
        "CEBOLA ROD",
        "CEBOLA EM RODELA"
      ]
    },

    {
      destino: "REPOLHO",
      termos: [
        "REPOLHO",
        "REPOLHO MISTO"
      ]
    }

  ];

  const familiaLimpa =
    familia
      .replace(/\s+/g, " ")
      .trim();

  for (const regra of regrasEquivalencia) {

    const encontrou =
      regra.termos.some(termo => {

        const termoNormalizado =
          termo
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        return (
          familiaLimpa === termoNormalizado ||
          familiaLimpa.startsWith(`${termoNormalizado} `)
        );

      });

    if (encontrou) {
      return regra.destino;
    }

  }

  return familiaLimpa || "SEM FAMÍLIA";

}

function obterFamiliaSetup(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  return normalizarFamilia(
    produto.familiaSequenciamento ??
    produto.familiaOperacional ??
    produto.familiaSetup ??
    produto.classeSetup ??
    produto.familia ??
    produto.categoria ??
    produto.grupoSetup ??
    produto.categoriaSetup ??
    rota.familiaSequenciamento ??
    rota.familiaOperacional ??
    rota.familiaSetup ??
    rota.classeSetup ??
    rota.familia ??
    rota.categoria ??
    rota.grupoSetup ??
    rota.categoriaSetup ??
    obterNomeProduto(produto).split(" ")[0]
  );

}

function obterOrdemBlocoFamilia(produto = {}) {

  return normalizarNumeroOrdem(
    produto.ordemBlocoFamiliaTXT ??
    produto.menorOrdemTXTDaFamilia ??
    produto.ordemFamiliaTXT ??
    produto.ordemFamilia ??
    produto.familiaOrdemTXT ??
    produto.familiaSequenciaTXT ??
    obterOrdemTXT(produto)
  );

}

function calcularMapaOrdemFamilia(produtos = []) {

  const mapa =
    new Map();

  produtos.forEach(produto => {

    const familia =
      obterFamiliaSetup(produto);

    const ordemTXT =
      obterOrdemTXT(produto);

    if (ordemTXT === null) {
      return;
    }

    if (
      !mapa.has(familia) ||
      ordemTXT < mapa.get(familia)
    ) {

      mapa.set(
        familia,
        ordemTXT
      );

    }

  });

  return mapa;

}

function aplicarOrdemBlocoFamilia(produto, mapaOrdemFamilia, nomeLinha) {

  const familia =
    obterFamiliaSetup(produto);

  const ordemManualFamilia =
    obterOrdemManualFamilia(
      nomeLinha,
      familia
    );

  return {
    ...produto,

    familiaSequenciamento:
      produto.familiaSequenciamento ||
      familia,

    familiaSetup:
      familia,

    classeSetup:
      familia,

    ordemBlocoFamiliaManual:
      ordemManualFamilia,

    ordemFamiliaManual:
      ordemManualFamilia,

    origemOrdemBlocoFamilia:
      ordemManualFamilia !== null
        ? "MANUAL_PCP"
        : "TXT",

    ordemBlocoFamiliaTXT:
      mapaOrdemFamilia.get(familia) ??
      obterOrdemTXT(produto) ??
      null
  };

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

function obterNomeLinha(linhaPlanejada = {}) {

  const linha =
    linhaPlanejada || {};

  return texto(
    linha.linha ??
    linha.nomeLinha ??
    linha.nome ??
    linha.id
  );

}

function obterProdutosLinha(linhaPlanejada = {}) {

  const linha =
    linhaPlanejada || {};

  return Array.isArray(linha.produtos)
    ? linha.produtos
    : Array.isArray(linha.itens)
      ? linha.itens
      : [];

}

function obterOrdemPreservadaDoProdutoAnterior(
  produtoAnterior
) {

  /**
   * Só preserva ordem realmente manual.
   *
   * Não usamos ordemProducao nem ordemPlanejada aqui,
   * porque esses campos podem ter sido gerados automaticamente
   * pela ordem do TXT ou por uma sequência antiga.
   *
   * Se usarmos ordemProducao aqui, o sistema deixa de respeitar
   * o TXT nas próximas sincronizações.
   */
  return normalizarNumeroOrdem(
    produtoAnterior.ordemSequenciamentoManual ??
    produtoAnterior.ordemManual ??
    produtoAnterior.ordemPlanejadaManual ??
    produtoAnterior.ordemEditada ??
    produtoAnterior.ordemUsuario
  );

}

function criarMapaSequenciaLinhaAnterior(
  linhaAnterior
) {

  const mapa =
    new Map();

  if (!linhaAnterior) {
    return mapa;
  }

  const produtosAnteriores =
    obterProdutosLinha(
      linhaAnterior
    );

  const nomeLinhaAnterior =
    obterNomeLinha(
      linhaAnterior
    );

  produtosAnteriores.forEach((produtoAnterior, indice) => {

    const ordemPreservada =
      obterOrdemPreservadaDoProdutoAnterior(
        produtoAnterior
      );

    if (ordemPreservada === null) {
      return;
    }

    const registro = {
      produtoAnterior,
      ordemPreservada,
      indiceAnterior:
        indice,
      linhaAnterior:
        nomeLinhaAnterior
    };

    criarChavesProduto(produtoAnterior)
      .forEach(chave => {

        if (!mapa.has(chave)) {
          mapa.set(
            chave,
            registro
          );
        }

      });

  });

  return mapa;

}

function criarMapaLinhasAnteriores(
  planejamentoAnterior
) {

  const mapa =
    new Map();

  const linhas =
    Array.isArray(planejamentoAnterior?.linhas)
      ? planejamentoAnterior.linhas
      : [];

  linhas.forEach(linha => {

    const nomeLinha =
      obterNomeLinha(
        linha
      );

    if (!nomeLinha) {
      return;
    }

    mapa.set(
      nomeLinha,
      linha
    );

  });

  return mapa;

}

function localizarProdutoNaSequenciaAnterior(
  produto,
  mapaSequenciaAnterior
) {

  if (!mapaSequenciaAnterior) {
    return null;
  }

  const chaves =
    criarChavesProduto(
      produto
    );

  for (const chave of chaves) {

    if (mapaSequenciaAnterior.has(chave)) {
      return mapaSequenciaAnterior.get(chave);
    }

  }

  return null;

}

function aplicarOrdemPreservada(
  produto,
  mapaSequenciaAnterior,
  opcoes = {}
) {

  if (opcoes.preservarSequenciaAnterior === false) {
    return produto;
  }

  const ordemManualAtual =
    obterOrdemManual(
      produto
    );

  if (ordemManualAtual !== null) {
    return produto;
  }

  const registroAnterior =
    localizarProdutoNaSequenciaAnterior(
      produto,
      mapaSequenciaAnterior
    );

  if (!registroAnterior) {
    return produto;
  }

  return {
    ...produto,

    ordemSequenciamentoManual:
      registroAnterior.ordemPreservada,

    ordemManualPreservada:
      true,

    origemOrdemManual:
      "PLANEJAMENTO_ANTERIOR",

    linhaSequenciamentoAnterior:
      registroAnterior.linhaAnterior,

    indiceSequenciamentoAnterior:
      registroAnterior.indiceAnterior,

    produtoSequenciamentoAnterior:
      registroAnterior.produtoAnterior
  };

}

/**
 * Comparador oficial do Sequenciamento por Família.
 *
 * Ordem:
 * 1. Ordem manual do PCP.
 * 2. Ordem preservada do planejamento anterior.
 * 3. Menor ordem TXT da família dentro da linha.
 * 4. Nome da família como fallback.
 * 5. Ordem TXT do produto dentro do bloco.
 * 6. Nome do produto.
 *
 * Observação:
 * A ordem preservada entra no mesmo campo de ordem manual:
 * ordemSequenciamentoManual.
 */
function compararProdutosSequenciamento(produtoA, produtoB) {

  const ordemBlocoManualA =
    obterOrdemBlocoFamiliaManual(produtoA);

  const ordemBlocoManualB =
    obterOrdemBlocoFamiliaManual(produtoB);

  if (
    ordemBlocoManualA !== null ||
    ordemBlocoManualB !== null
  ) {

    const diferencaBlocoManual =
      (ordemBlocoManualA ?? 999999) -
      (ordemBlocoManualB ?? 999999);

    if (diferencaBlocoManual !== 0) {
      return diferencaBlocoManual;
    }

  }

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

  const ordemBlocoA =
    obterOrdemBlocoFamilia(produtoA);

  const ordemBlocoB =
    obterOrdemBlocoFamilia(produtoB);

  if (
    ordemBlocoA !== null ||
    ordemBlocoB !== null
  ) {

    const diferencaBloco =
      (ordemBlocoA ?? 999999) -
      (ordemBlocoB ?? 999999);

    if (diferencaBloco !== 0) {
      return diferencaBloco;
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

    familiaSequenciamento:
      familiaSetup,

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
      obterNomeProduto(produto) || produto.nomeOficial,

    sequenciamentoPreservado:
      Boolean(
        produto.ordemManualPreservada ||
        produto.sequenciamentoPreservado
      )
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
      somarProdutos(produtos, "tempoTotalPlanejadoMin"),

    produtosComSequenciaPreservada:
      produtos.filter(produto => produto.sequenciamentoPreservado).length
  };

}

function somarQuantidadeCSV(produtos = []) {

  return produtos.reduce((total, produto) => {

    return total + numero(
      produto.quantidadeCSV ??
      produto.demandaFinal ??
      produto.demandaReferencia ??
      produto.demanda,
      0
    );

  }, 0);

}

function classificarStatusCapacidade(
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

function traduzirStatusCapacidade(status) {

  const mapa = {
    SEM_CARGA: "Sem carga",
    OCIOSA: "Ociosa",
    OK: "OK",
    ATENCAO: "Atenção",
    ESTOURADA: "Estourada"
  };

  return mapa[status] || status;

}

function criarResumoLinhaSequenciada(
  linhaPlanejada = {},
  produtosSequenciados = [],
  blocos = [],
  resumoSequenciamento = {}
) {

  const resumoAnterior =
    linhaPlanejada.resumo || {};

  const quantidadeTotalCSV =
    somarQuantidadeCSV(
      produtosSequenciados
    );

  const kgTotalPlanejado =
    numero(
      resumoSequenciamento.kgTotal,
      0
    );

  return {
    ...resumoAnterior,

    totalProdutos:
      produtosSequenciados.length,

    totalBlocos:
      blocos.length,

    totalFamilias:
      blocos.length,

    demandaTotal:
      quantidadeTotalCSV,

    quantidadeTotalCSV,

    kgTotalPlanejado,

    kgTotal:
      kgTotalPlanejado,

    tempoProducaoMin:
      numero(
        resumoSequenciamento.tempoProducaoMin,
        0
      ),

    setupTotalMin:
      numero(
        resumoSequenciamento.setupAplicadoMin,
        0
      ),

    tempoTotalMin:
      numero(
        resumoSequenciamento.tempoTotalMin,
        0
      ),

    produtosComSequenciaPreservada:
      numero(
        resumoSequenciamento.produtosComSequenciaPreservada,
        0
      ),

    origemSequencia:
      "SEQUENCIAMENTO_POR_FAMILIA",

    sequenciaAplicada:
      true
  };

}

function recalcularCapacidadeLinhaSequenciada(
  capacidadeAnterior = {},
  resumoLinha = {}
) {

  if (
    !capacidadeAnterior ||
    Object.keys(capacidadeAnterior).length === 0
  ) {
    return capacidadeAnterior;
  }

  const capacidadeMin =
    numero(
      capacidadeAnterior.capacidadeMin,
      0
    );

  const tempoPlanejadoMin =
    numero(
      resumoLinha.tempoTotalMin,
      0
    );

  const setupTotalMin =
    numero(
      resumoLinha.setupTotalMin,
      0
    );

  const saldoMin =
    capacidadeMin - tempoPlanejadoMin;

  const utilizacaoPercentual =
    capacidadeMin > 0
      ? Math.round(
          (tempoPlanejadoMin / capacidadeMin) * 100
        )
      : 0;

  const status =
    classificarStatusCapacidade(
      utilizacaoPercentual,
      tempoPlanejadoMin
    );

  return {
    ...capacidadeAnterior,

    tempoPlanejadoMin,

    setupTotalMin,

    saldoMin,

    utilizacaoPercentual,

    status,

    statusTexto:
      traduzirStatusCapacidade(status),

    origemCalculo:
      "SEQUENCIAMENTO_POR_FAMILIA"
  };

}

function recalcularCapacidadeGeralSequenciada(
  capacidadeAnterior = {},
  linhasSequenciadas = []
) {

  if (
    !capacidadeAnterior ||
    Object.keys(capacidadeAnterior).length === 0
  ) {
    return capacidadeAnterior;
  }

  const resumo =
    linhasSequenciadas.reduce((acumulado, linha) => {

      const capacidade =
        linha.capacidade || {};

      acumulado.capacidadeTotalMin +=
        numero(
          capacidade.capacidadeMin,
          0
        );

      acumulado.tempoPlanejadoTotalMin +=
        numero(
          capacidade.tempoPlanejadoMin,
          0
        );

      acumulado.setupTotalMin +=
        numero(
          capacidade.setupTotalMin,
          0
        );

      if (capacidade.status === "OK") {
        acumulado.linhasOK += 1;
      }

      if (capacidade.status === "OCIOSA") {
        acumulado.linhasOciosas += 1;
      }

      if (capacidade.status === "ATENCAO") {
        acumulado.linhasAtencao += 1;
      }

      if (capacidade.status === "ESTOURADA") {
        acumulado.linhasEstouradas += 1;
      }

      if (capacidade.status === "SEM_CARGA") {
        acumulado.linhasSemCarga += 1;
      }

      return acumulado;

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

  const utilizacaoGeralPercentual =
    resumo.capacidadeTotalMin > 0
      ? Math.round(
          (
            resumo.tempoPlanejadoTotalMin /
            resumo.capacidadeTotalMin
          ) * 100
        )
      : 0;

  return {
    ...capacidadeAnterior,
    ...resumo,

    saldoTotalMin:
      resumo.capacidadeTotalMin -
      resumo.tempoPlanejadoTotalMin,

    utilizacaoGeralPercentual,

    origemCalculo:
      "SEQUENCIAMENTO_POR_FAMILIA"
  };

}

function criarResumoPlanejamentoSequenciado(
  resumoAnterior = {},
  linhasSequenciadas = [],
  resumoSequenciamento = {}
) {

  const quantidadeTotalCSV =
    linhasSequenciadas.reduce((total, linha) => {

      return total + numero(
        linha.resumo?.quantidadeTotalCSV ??
        linha.resumo?.demandaTotal,
        0
      );

    }, 0);

  const kgTotalPlanejado =
    numero(
      resumoSequenciamento.kgTotal,
      0
    );

  return {
    ...resumoAnterior,

    totalLinhas:
      linhasSequenciadas.length,

    totalProdutos:
      numero(
        resumoSequenciamento.totalProdutos,
        0
      ),

    totalFamilias:
      numero(
        resumoSequenciamento.totalBlocos,
        0
      ),

    totalBlocos:
      numero(
        resumoSequenciamento.totalBlocos,
        0
      ),

    demandaTotal:
      quantidadeTotalCSV,

    quantidadeTotalCSV,

    kgTotalPlanejado,

    kgTotal:
      kgTotalPlanejado,

    tempoTotalMin:
      numero(
        resumoSequenciamento.tempoTotalMin,
        0
      ),

    tempoProducaoMin:
      numero(
        resumoSequenciamento.tempoProducaoMin,
        0
      ),

    setupTotalMin:
      numero(
        resumoSequenciamento.setupAplicadoMin,
        0
      ),

    origemSequencia:
      "SEQUENCIAMENTO_POR_FAMILIA",

    sequenciaAplicada:
      true
  };

}

function criarBlocosFamilia(
  produtosSequenciados,
  nomeLinha
) {

  const mapaBlocos =
    new Map();

  produtosSequenciados.forEach((produto) => {

    const familia =
      produto.familiaSetup ||
      obterFamiliaSetup(produto);

    const chaveBloco =
      [
        nomeLinha || "SEM_LINHA",
        familia
      ].join("|");

    if (!mapaBlocos.has(chaveBloco)) {

      const ordemBloco =
        mapaBlocos.size + 1;

      const blocoId =
        `${nomeLinha || "LINHA"}-${ordemBloco}-${criarSlug(familia)}`;

      mapaBlocos.set(
        chaveBloco,
        {
          id:
            blocoId,

          blocoId,

          linha:
            nomeLinha,

          ordemBloco,

          familiaSetup:
            familia,

          classeSetup:
            familia,

          produtos:
            []
        }
      );

    }

    mapaBlocos
      .get(chaveBloco)
      .produtos
      .push(produto);

  });

  return Array.from(mapaBlocos.values())
    .map((bloco, indice) => {

      const produtosOrdenados =
        bloco.produtos
          .sort((produtoA, produtoB) => {

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

            return obterNomeProduto(produtoA)
              .localeCompare(
                obterNomeProduto(produtoB),
                "pt-BR",
                {
                  numeric: true,
                  sensitivity: "base"
                }
              );

          });

      const ordensTXT =
        produtosOrdenados
          .map(obterOrdemTXT)
          .filter(valor => valor !== null)
          .sort((a, b) => a - b);

      return {
        ...bloco,

        ordemBloco:
          indice + 1,

        produtos:
          produtosOrdenados,

        totalProdutos:
          produtosOrdenados.length,

        kgTotal:
          somarProdutos(produtosOrdenados, "kgPlanejado"),

        tempoProducaoMin:
          somarProdutos(produtosOrdenados, "tempoProducaoPlanejadoMin"),

        setupAplicadoMin:
          somarProdutos(produtosOrdenados, "setupAplicadoMin"),

        tempoTotalMin:
          somarProdutos(produtosOrdenados, "tempoTotalPlanejadoMin"),

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
    obterProdutosLinha(
      linhaPlanejada
    );

  const linhaAnterior =
    opcoes.linhaAnterior ||
    opcoes.mapaLinhasAnteriores?.get(nomeLinha) ||
    null;

  const mapaSequenciaAnterior =
    criarMapaSequenciaLinhaAnterior(
      linhaAnterior
    );

  const comparador =
    opcoes.comparador ||
    compararProdutosSequenciamento;

  let produtosComSequenciaPreservada = 0;

  const produtosPreparados =
    produtosOriginais
      .map(produto => {

        const produtoComFamilia =
          aplicarFamiliaCadastradaAoProduto(
            produto
          );

        const produtoComOrdemPreservada =
          aplicarOrdemPreservada(
            produtoComFamilia,
            mapaSequenciaAnterior,
            opcoes
          );

        if (produtoComOrdemPreservada.ordemManualPreservada) {
          produtosComSequenciaPreservada += 1;
        }

        return produtoComOrdemPreservada;

      });

  const mapaOrdemFamilia =
    calcularMapaOrdemFamilia(
      produtosPreparados
    );

  const produtosOrdenados =
    produtosPreparados
      .map(produto => {

        return aplicarOrdemBlocoFamilia(
          produto,
          mapaOrdemFamilia,
          nomeLinha
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

  const resumoSequenciamento =
    criarResumoSequenciamento(
      produtosSequenciados,
      blocos
    );

  const resumoLinha =
    criarResumoLinhaSequenciada(
      linhaPlanejada,
      produtosSequenciados,
      blocos,
      resumoSequenciamento
    );

  const capacidadeLinha =
    recalcularCapacidadeLinhaSequenciada(
      linhaPlanejada.capacidade,
      resumoLinha
    );

  return {
    ...linhaPlanejada,

    linha:
      nomeLinha || linhaPlanejada.linha,

    produtos:
      produtosSequenciados,

    blocos,

    resumo:
      resumoLinha,

    resumoSequenciamento,

    capacidade:
      capacidadeLinha,

    sequenciaAplicadaAoPlanejamentoReal:
      true,

    preservacaoSequencia: {
      ativa:
        opcoes.preservarSequenciaAnterior !== false,

      linhaAnteriorEncontrada:
        Boolean(linhaAnterior),

      produtosComSequenciaPreservada
    }
  };

}

export function gerarSequenciamentoPlanejamento(
  planejamento,
  opcoes = {}
) {

  if (!planejamento) {
    return planejamento;
  }

  const planejamentoAnterior =
    opcoes.planejamentoAnterior ||
    opcoes.sequenciamentoAnterior ||
    null;

  const mapaLinhasAnteriores =
    criarMapaLinhasAnteriores(
      planejamentoAnterior
    );

  const linhasOriginais =
    planejamento.linhas ||
    [];

  const linhasSequenciadas =
    linhasOriginais.map(linha => {

      return gerarSequenciamentoLinha(
        linha,
        {
          ...opcoes,
          mapaLinhasAnteriores,
          linhaAnterior:
            mapaLinhasAnteriores.get(
              obterNomeLinha(linha)
            )
        }
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

      resumo.produtosComSequenciaPreservada +=
        numero(resumoLinha.produtosComSequenciaPreservada, 0);

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
        0,

      produtosComSequenciaPreservada:
        0
    });

  const resumoPlanejamentoSequenciado =
    criarResumoPlanejamentoSequenciado(
      planejamento.resumo,
      linhasSequenciadas,
      resumoSequenciamento
    );

  const capacidadeSequenciada =
    recalcularCapacidadeGeralSequenciada(
      planejamento.capacidade,
      linhasSequenciadas
    );

  return {
    ...planejamento,

    linhas:
      linhasSequenciadas,

    resumo:
      resumoPlanejamentoSequenciado,

    resumoSequenciamento,

    capacidade:
      capacidadeSequenciada,

    sequenciaAplicadaAoPlanejamentoReal:
      true,

    preservacaoSequencia: {
      ativa:
        opcoes.preservarSequenciaAnterior !== false,

      planejamentoAnteriorInformado:
        Boolean(planejamentoAnterior),

      totalLinhasAnteriores:
        mapaLinhasAnteriores.size,

      produtosComSequenciaPreservada:
        resumoSequenciamento.produtosComSequenciaPreservada
    }
  };

}