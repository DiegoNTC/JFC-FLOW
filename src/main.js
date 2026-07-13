import {
  configurarImportacaoCSV
} from "./importers/csvImportHandler.js";

import {
  configurarImportacaoTXT
} from "./importers/txtImportHandler.js";

import {
  setDadosCSV,
  getDadosCSV,
  setBaseTXT,
  getBaseTXT
} from "./core/importState.js";

import {
  sincronizarProdutos
} from "./services/sincronizadorProdutos.js";

import {
  aplicarResultadoSincronizacao,
  carregarProdutosMestre,
  carregarSugestoesVinculo,
  carregarPendenciasVinculo,
  confirmarSugestaoVinculo
} from "./repositories/cadastroMestreRepository.js";

import {
  renderSincronizacao
} from "./render/renderSincronizacao.js";

import {
  renderPlanejamentoReal
} from "./render/renderPlanejamentoReal.js";

import {
  gerarPlanejamentoReal
} from "./services/geradorPlanejamentoReal.js";

import {
  avaliarCapacidadePlanejamento
} from "./services/avaliadorCapacidade.js";

import {
  renderEditorCapacidade
} from "./render/renderEditorCapacidade.js";

import {
  sugerirBalanceamento
} from "./services/sugestorBalanceamento.js";

import {
  renderBalanceamento
} from "./render/renderBalanceamento.js";

import {
  simularBalanceamento
} from "./services/simuladorBalanceamento.js";

import {
  aplicarBalanceamentoSimulado
} from "./services/aplicadorBalanceamentoSimulado.js";

import {
  renderPlanejamentoSimulado
} from "./render/renderPlanejamentoSimulado.js";

import {
  renderCadastroProduto
} from "./render/renderCadastroProduto.js";

import {
  gerarSequenciamentoPlanejamento
} from "./services/geradorSequenciamentoLinha.js";

import {
  renderSequenciamentoProducao
} from "./render/renderSequenciamentoProducao.js";

import {
  moverBlocoPlanejamento
} from "./services/movimentadorSequenciamentoService.js";

import {
  renderFamiliasSetup
} from "./render/renderFamiliasSetup.js";

import {
  renderPlanoFinalDia
} from "./render/renderPlanoFinalDia.js";

import {
  gerarTimelineTurno
} from "./services/geradorTimelineTurno.js";

import {
  renderTimelineTurno
} from "./render/renderTimelineTurno.js";


import {
  gerarPdfOrdemProducao
} from "./services/geradorPdfOrdemProducaoService.js";

import {
  inicializarDadosProjetoJSON,
  inicializarPainelDadosProjeto,
  marcarAlteracaoLocal,
  garantirBaseTecnicaNativaCarregada
} from "./services/persistenciaDadosProjetoService.js";

// =========================
// ELEMENTOS
// =========================

const syncBtn =
  document.getElementById("syncBtn");

const balanceamentoGeralBtn =
  document.getElementById("balanceamentoGeralBtn");

const balanceamentoLinhaBtn =
  document.getElementById("balanceamentoLinhaBtn");

const linhaBalanceamentoSelect =
  document.getElementById("linhaBalanceamentoSelect");


// =========================
// ESTADO TEMPORÁRIO DO FLUXO REAL
// =========================

let ultimoPlanejamentoComCapacidade = null;

let ultimoResultadoSincronizacao = null;

let ultimaPersistencia = null;


// =========================
// PLANEJAMENTO REAL
// =========================

function normalizarCodigoProduto(
  codigo
) {

  return String(codigo || "")
    .trim();

}

function numeroCSV(
  valor
) {

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

function obterCampoCSV(
  item,
  nomes,
  padrao = 0
) {

  for (const nome of nomes) {

    if (
      item &&
      item[nome] !== undefined &&
      item[nome] !== null &&
      item[nome] !== ""
    ) {
      return item[nome];
    }

  }

  return padrao;

}

function calcularDemandaCSVConsolidada({
  previa,
  prioridade,
  pedidos
}) {

  if (pedidos > 0) {
    return pedidos + prioridade;
  }

  if (previa > 0) {
    return previa;
  }

  return prioridade;

}

function criarChaveConsolidacaoPlanejamentoCSV(
  item
) {

  const codigo =
    normalizarCodigoProduto(
      item.codigo ??
      item.Código ??
      item.Codigo ??
      item.CODIGO ??
      ""
    );

  if (codigo) {
    return `CODIGO:${codigo}`;
  }

  const nome =
    String(
      item.produto ||
      item.nomeOficial ||
      item.descricaoCSV ||
      item.descricao ||
      ""
    )
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  return nome
    ? `NOME:${nome}`
    : "SEM_IDENTIFICACAO";

}

function consolidarProdutosCSVDoDia(
  dadosCSV
) {

  /**
   * Regra ajustada:
   * 1. O CSV é lido linha a linha no parseCSV.
   * 2. Cada linha calcula sua própria demanda corretamente.
   * 3. Para o Planejamento/Sequenciamento, juntamos as linhas do
   *    mesmo SKU por código, somando a demanda final.
   *
   * Assim o sistema não erra a leitura do CSV, mas também não mostra
   * o mesmo produto repetido várias vezes dentro da mesma família.
   */

  const mapa =
    new Map();

  (dadosCSV || [])
    .forEach((item, index) => {

      const codigo =
        normalizarCodigoProduto(
          item.codigo ??
          item.Código ??
          item.Codigo ??
          item.CODIGO ??
          ""
        );

      const nomeOficial =
        item.produto ||
        item.nomeOficial ||
        item.descricaoCSV ||
        item.descricao ||
        "";

      const demandaFinal =
        item.csvLinhaALinha === true ||
        item.csvConsolidado === false ||
        item.csvConsolidadoOperacional === true
          ? numeroCSV(
              item.demandaFinal ??
              item.quantidadeCSV ??
              0
            )
          : calcularDemandaCSVConsolidada({
              previa:
                numeroCSV(
                  obterCampoCSV(
                    item,
                    [
                      "previa",
                      "Previa",
                      "PREVIA"
                    ]
                  )
                ),
              prioridade:
                numeroCSV(
                  obterCampoCSV(
                    item,
                    [
                      "prioridade",
                      "Prioridade",
                      "Pedidos Prioritarios",
                      "Pedidos Prioritários",
                      "prioritario",
                      "prioritarios"
                    ]
                  )
                ),
              pedidos:
                numeroCSV(
                  obterCampoCSV(
                    item,
                    [
                      "pedidos",
                      "Pedidos",
                      "PEDIDOS",
                      "Pedidos "
                    ]
                  )
                )
            });

      if (
        (!codigo && !nomeOficial) ||
        demandaFinal <= 0
      ) {
        return;
      }

      const chave =
        criarChaveConsolidacaoPlanejamentoCSV(
          item
        );

      const csvRegistroId =
        item.csvRegistroId ||
        item.chavePlanejamentoCSV ||
        `${codigo || nomeOficial || "SEM_CODIGO"}__CSV_ITEM_${index + 1}`;

      if (!mapa.has(chave)) {

        const idAgregado =
          `${codigo || nomeOficial || "SEM_CODIGO"}__CSV_AGREGADO`;

        mapa.set(
          chave,
          {
            codigo,
            nomeOficial,
            descricaoCSV:
              nomeOficial,
            demandaFinal: 0,
            quantidadeCSV: 0,
            csvLinhaALinha:
              true,
            csvConsolidadoOperacional:
              true,
            csvRegistroId:
              idAgregado,
            chavePlanejamentoCSV:
              idAgregado,
            csvRegistrosOrigem: [],
            csvLinhasNumero: [],
            linhasOrigemCSV: []
          }
        );

      }

      const acumulado =
        mapa.get(chave);

      acumulado.demandaFinal +=
        demandaFinal;

      acumulado.quantidadeCSV =
        acumulado.demandaFinal;

      acumulado.csvRegistrosOrigem.push(
        csvRegistroId
      );

      acumulado.csvLinhasNumero.push(
        item.csvLinhaNumero ??
        item.linhaOrigemCSV?.numeroLinhaCSV ??
        index + 1
      );

      acumulado.linhasOrigemCSV.push(
        item.linhaOrigemCSV ??
        item
      );

      if (!acumulado.nomeOficial && nomeOficial) {
        acumulado.nomeOficial = nomeOficial;
        acumulado.descricaoCSV = nomeOficial;
      }

    });

  return Array.from(
    mapa.values()
  );

}

function montarProdutosMestreParaPlanejamento(
  produtosMestre,
  dadosCSVDoDia
) {

  const produtosCSVDoDia =
    consolidarProdutosCSVDoDia(
      dadosCSVDoDia
    );

  const mapaMestre =
    new Map();

  (produtosMestre || []).forEach(produtoMestre => {

    const codigo =
      normalizarCodigoProduto(
        produtoMestre.codigo
      );

    if (codigo) {

      mapaMestre.set(
        codigo,
        produtoMestre
      );

    }

  });

  const produtosPlanejamento =
    [];

  const produtosSemCadastro =
    [];

  produtosCSVDoDia.forEach(produtoCSV => {

    const produtoMestre =
      mapaMestre.get(
        produtoCSV.codigo
      );

    if (!produtoMestre) {

      produtosSemCadastro.push(
        produtoCSV
      );

      return;

    }

    produtosPlanejamento.push({

      ...produtoMestre,

      codigo:
        produtoCSV.codigo,

      nomeOficial:
        produtoCSV.nomeOficial ||
        produtoMestre.nomeOficial,

      descricao:
        produtoCSV.nomeOficial ||
        produtoMestre.descricao,

      descricaoCSV:
        produtoCSV.descricaoCSV ||
        produtoMestre.descricaoCSV,

      demandaReferencia:
        produtoCSV.demandaFinal,

      demandaFinal:
        produtoCSV.demandaFinal,

      quantidadeCSV:
        produtoCSV.demandaFinal,

      csvLinhaALinha:
        true,

      csvRegistroId:
        produtoCSV.csvRegistroId,

      chavePlanejamentoCSV:
        produtoCSV.chavePlanejamentoCSV || produtoCSV.csvRegistroId,

      csvLinhaNumero:
        produtoCSV.csvLinhaNumero,

      indiceOrigemCSV:
        produtoCSV.indiceOrigemCSV,

      linhaOrigemCSV:
        produtoCSV.linhaOrigemCSV,

      linhasOrigemCSV:
        produtoCSV.linhasOrigemCSV || [],

      origemPlanejamento: {
        csvAtual: true,
        cadastroMestre: true
      }

    });

  });

  if (produtosSemCadastro.length > 0) {

    console.warn(
      "PRODUTOS DO CSV SEM CADASTRO MESTRE:",
      produtosSemCadastro
    );

  }

  console.log(
    "PRODUTOS DO CSV DO DIA:",
    produtosCSVDoDia.length
  );

  console.log(
    "PRODUTOS PLANEJADOS APÓS CRUZAR CSV + CADASTRO:",
    produtosPlanejamento.length
  );

  return produtosPlanejamento;

}

function calcularPlanejamentoCompleto(
  produtosMestre,
  dadosCSVDoDia = []
) {

  const produtosParaPlanejamento =
    montarProdutosMestreParaPlanejamento(
      produtosMestre || [],
      dadosCSVDoDia || []
    );

  const planejamentoReal =
    gerarPlanejamentoReal(
      produtosParaPlanejamento
    );

  const planejamentoComCapacidade =
    avaliarCapacidadePlanejamento(
      planejamentoReal
    );

  return {

    planejamentoReal,

    planejamentoComCapacidade,

    produtosParaPlanejamento

  };

}

function gerarSequenciamentoComPreservacao(
  planejamentoComCapacidade
) {

  const planejamentoAnterior =
    ultimoPlanejamentoComCapacidade;

  return gerarSequenciamentoPlanejamento(
    planejamentoComCapacidade,
    {
      planejamentoAnterior,
      preservarSequenciaAnterior: true
    }
  );

}

function calcularBalanceamentoCompleto(
  planejamentoComCapacidade,
  opcoes = {}
) {

  const sugestoesBalanceamento =
    sugerirBalanceamento(
      planejamentoComCapacidade,
      opcoes
    );

  const simulacaoBalanceamento =
    simularBalanceamento(
      planejamentoComCapacidade,
      sugestoesBalanceamento
    );

  return {

    sugestoesBalanceamento,

    simulacaoBalanceamento

  };

}

function logarPlanejamento(
  resultadoSincronizacao,
  persistencia,
  planejamentoComCapacidade
) {

  const linhasPlanejadas =
    planejamentoComCapacidade?.linhas || [];

  console.log(
    "RESULTADO SINCRONIZAÇÃO REAL:",
    resultadoSincronizacao
  );

  console.log(
    "PERSISTÊNCIA CADASTRO MESTRE:",
    persistencia
  );

  console.log(
    "PLANEJAMENTO COM CAPACIDADE:",
    planejamentoComCapacidade
  );

  console.table(
    linhasPlanejadas.map(linha => ({

      linha:
        linha.linha,

      produtos:
        linha.resumo?.totalProdutos,

      quantidadeCSV:
        linha.resumo?.quantidadeTotalCSV ?? linha.resumo?.demandaTotal,

      kgPlanejado:
        linha.resumo?.kgTotalPlanejado ?? linha.resumo?.kgTotal,

      capacidadeMin:
        linha.capacidade?.capacidadeMin,

      tempoPlanejadoMin:
        linha.capacidade?.tempoPlanejadoMin,

      saldoMin:
        linha.capacidade?.saldoMin,

      utilizacao:
        `${linha.capacidade?.utilizacaoPercentual || 0}%`,

      status:
        linha.capacidade?.statusTexto

    }))
  );

}

function renderizarPlanoFinalETimeline(
  planejamentoSequenciado
) {

  renderPlanoFinalDia(
    planejamentoSequenciado
  );

  if (
    !window.jfcPlanoFinalDia ||
    !Array.isArray(window.jfcPlanoFinalDia.linhas) ||
    window.jfcPlanoFinalDia.linhas.length === 0
  ) {

    renderTimelineTurno(
      null
    );

    return;

  }

  const timelineTurno =
    gerarTimelineTurno(
      window.jfcPlanoFinalDia,
      {
        inicioTurno: "07:00"
      }
    );

  renderTimelineTurno(
    timelineTurno
  );

}

function moverBlocoSequenciamento({
  linha,
  blocoId,
  direcao
}) {

  if (!ultimoPlanejamentoComCapacidade) {

    console.warn(
      "Nenhum planejamento disponível para mover bloco."
    );

    return;

  }

  const resultado =
    moverBlocoPlanejamento(
      ultimoPlanejamentoComCapacidade,
      linha,
      blocoId,
      direcao
    );

  if (!resultado.movido) {

    console.warn(
      resultado.motivo || "Bloco não foi movido."
    );

    return;

  }

  marcarAlteracaoLocal(
    "sequenciaManualFamilias"
  );

  ultimoPlanejamentoComCapacidade =
    resultado.planejamento;

  renderPlanejamentoReal(
    ultimoPlanejamentoComCapacidade
  );

  renderSequenciamentoProducao(
    ultimoPlanejamentoComCapacidade,
    {
      onMoverBloco:
        moverBlocoSequenciamento
    }
  );

  renderizarPlanoFinalETimeline(
    ultimoPlanejamentoComCapacidade
  );

  renderBalanceamento(
    null
  );

  renderPlanejamentoSimulado(
    null
  );

  console.log(
    "BLOCO MOVIDO E PLANEJAMENTO RECALCULADO:",
    ultimoPlanejamentoComCapacidade
  );

}


// =========================
// RENDERIZAÇÃO DO BALANCEAMENTO
// =========================

function renderizarResultadoBalanceamento(
  sugestoesBalanceamento,
  simulacaoBalanceamento
) {

  if (!ultimoPlanejamentoComCapacidade) {

    alert(
      "Sincronize o CSV e o TXT antes de visualizar a simulação."
    );

    return;

  }

  const resultadoSimulado =
    aplicarBalanceamentoSimulado(
      ultimoPlanejamentoComCapacidade,
      simulacaoBalanceamento
    );

  console.log(
    "BALANCEAMENTO GERADO:",
    sugestoesBalanceamento
  );

  console.log(
    "SIMULAÇÃO DE BALANCEAMENTO:",
    simulacaoBalanceamento
  );

  console.log(
    "PLANEJAMENTO SIMULADO APLICADO:",
    resultadoSimulado
  );

  renderBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

  renderPlanejamentoSimulado(
    resultadoSimulado
  );

}


// =========================
// SINCRONIZAÇÃO
// =========================

function renderizarResultadoSincronizacao(
  resultado,
  persistencia,
  planejamentoComCapacidade
) {

  const planejamentoSequenciado =
    gerarSequenciamentoComPreservacao(
      planejamentoComCapacidade
    );

  ultimoPlanejamentoComCapacidade =
    planejamentoSequenciado;

  renderPlanejamentoReal(
    planejamentoSequenciado
  );

  renderSequenciamentoProducao(
    planejamentoSequenciado,
    {
      onMoverBloco:
        moverBlocoSequenciamento
    }
  );

  renderizarPlanoFinalETimeline(
    planejamentoSequenciado
  );

  renderBalanceamento(
    null
  );

  renderPlanejamentoSimulado(
    null
  );

  renderSincronizacao(
    resultado,
    persistencia,
    {
      onConfirmarSugestao: (sugestao) => {

        const produtoConfirmado =
          confirmarSugestaoVinculo(
            sugestao
          );

        marcarAlteracaoLocal(
          "cadastroMestre"
        );

        console.log(
          "PRODUTO CONFIRMADO MANUALMENTE:",
          produtoConfirmado
        );

        const novaPersistencia = {

          produtosMestre:
            carregarProdutosMestre(),

          sugestoes:
            carregarSugestoesVinculo(),

          pendencias:
            carregarPendenciasVinculo()

        };

        const {
          planejamentoComCapacidade:
          novoPlanejamentoComCapacidade
        } =
          calcularPlanejamentoCompleto(
            novaPersistencia.produtosMestre,
            getDadosCSV()
          );

        const novasSugestoes =
          carregarSugestoesVinculo();

        const novasPendencias =
          carregarPendenciasVinculo();

        const novoResultado = {

          ...resultado,

          sugestoes:
            novasSugestoes,

          pendentes:
            novasPendencias,

          estatisticas: {

            ...resultado.estatisticas,

            sugestoes:
              novasSugestoes.length,

            pendentes:
              novasPendencias.length

          }

        };

        ultimoResultadoSincronizacao =
          novoResultado;

        ultimaPersistencia =
          novaPersistencia;

        renderizarResultadoSincronizacao(
          novoResultado,
          novaPersistencia,
          novoPlanejamentoComCapacidade
        );

      }
    }
  );

}

function executarSincronizacao() {

  const dadosCSV =
    getDadosCSV();

  const baseTXT =
    getBaseTXT();

  if (
    !dadosCSV ||
    dadosCSV.length === 0
  ) {

    alert(
      "Importe primeiro o CSV de pedidos."
    );

    return;

  }

  if (
    !baseTXT ||
    !baseTXT.produtosTecnicos ||
    baseTXT.produtosTecnicos.length === 0
  ) {

    alert(
      "A base técnica nativa ainda não foi carregada. Recarregue os JSONs do GitHub ou importe o TXT técnico manualmente."
    );

    return;

  }

  const cadastroAtual =
    carregarProdutosMestre();

  const resultadoSincronizacao =
    sincronizarProdutos(
      dadosCSV,
      baseTXT,
      cadastroAtual
    );

  const persistencia =
    aplicarResultadoSincronizacao(
      resultadoSincronizacao
    );

  marcarAlteracaoLocal(
    "cadastroMestre"
  );

  const {
    planejamentoComCapacidade
  } =
    calcularPlanejamentoCompleto(
      persistencia.produtosMestre,
      dadosCSV
    );

  ultimoResultadoSincronizacao =
    resultadoSincronizacao;

  ultimaPersistencia =
    persistencia;

  logarPlanejamento(
    resultadoSincronizacao,
    persistencia,
    planejamentoComCapacidade
  );

  renderizarResultadoSincronizacao(
    resultadoSincronizacao,
    persistencia,
    planejamentoComCapacidade
  );

}


// =========================
// RECÁLCULO DE CAPACIDADE
// =========================

function recalcularPlanejamentoComCapacidade() {

  const produtosMestre =
    carregarProdutosMestre();

  renderFamiliasSetup({
    onSalvar: () => {

      marcarAlteracaoLocal(
        "familiasSetup"
      );

      recalcularPlanejamentoComCapacidade();

    }
  });

  const dadosCSV =
    getDadosCSV();

  if (
    !produtosMestre ||
    produtosMestre.length === 0 ||
    !dadosCSV ||
    dadosCSV.length === 0
  ) {

    ultimoPlanejamentoComCapacidade =
      null;

    renderPlanejamentoReal(
      null
    );

    renderSequenciamentoProducao(
      null
    );

    renderPlanoFinalDia(
      null
    );

    renderTimelineTurno(
      null
    );

    renderBalanceamento(
      null
    );

    renderPlanejamentoSimulado(
      null
    );

    console.warn(
      "Planejamento não recalculado: é necessário ter Cadastro Mestre e CSV importado."
    );

    return;

  }

  const {
    planejamentoComCapacidade
  } =
    calcularPlanejamentoCompleto(
      produtosMestre,
      dadosCSV
    );

  const planejamentoSequenciado =
    gerarSequenciamentoComPreservacao(
      planejamentoComCapacidade
    );

  ultimoPlanejamentoComCapacidade =
    planejamentoSequenciado;

  renderPlanejamentoReal(
    planejamentoSequenciado
  );

  renderSequenciamentoProducao(
    planejamentoSequenciado,
    {
      onMoverBloco:
        moverBlocoSequenciamento
    }
  );

  renderizarPlanoFinalETimeline(
    planejamentoSequenciado
  );

  renderBalanceamento(
    null
  );

  renderPlanejamentoSimulado(
    null
  );

  console.log(
    "PLANEJAMENTO SEQUENCIADO POR FAMÍLIA:",
    planejamentoSequenciado
  );

}


// =========================
// BALANCEAMENTO SOB DEMANDA
// =========================

function executarBalanceamentoGeral() {

  if (!ultimoPlanejamentoComCapacidade) {

    alert(
      "Suba o CSV e aguarde a sincronização com a base técnica antes de analisar o balanceamento."
    );

    return;

  }

  const {
    sugestoesBalanceamento,
    simulacaoBalanceamento
  } =
    calcularBalanceamentoCompleto(
      ultimoPlanejamentoComCapacidade
    );

  renderizarResultadoBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

}

function executarBalanceamentoPorLinha() {

  if (!ultimoPlanejamentoComCapacidade) {

    alert(
      "Suba o CSV e aguarde a sincronização com a base técnica antes de analisar o balanceamento."
    );

    return;

  }

  const linhaOrigem =
    linhaBalanceamentoSelect?.value;

  if (!linhaOrigem) {

    alert(
      "Selecione uma linha para balancear."
    );

    return;

  }

  const {
    sugestoesBalanceamento,
    simulacaoBalanceamento
  } =
    calcularBalanceamentoCompleto(
      ultimoPlanejamentoComCapacidade,
      {
        linhaOrigem
      }
    );

  renderizarResultadoBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

}

function executarBalanceamentoLinhaDireta(
  linhaOrigem
) {

  if (!ultimoPlanejamentoComCapacidade) {

    alert(
      "Suba o CSV e aguarde a sincronização com a base técnica antes de analisar o balanceamento."
    );

    return;

  }

  if (!linhaOrigem) {

    alert(
      "Linha de origem não informada."
    );

    return;

  }

  if (linhaBalanceamentoSelect) {

    linhaBalanceamentoSelect.value =
      linhaOrigem;

  }

  const {
    sugestoesBalanceamento,
    simulacaoBalanceamento
  } =
    calcularBalanceamentoCompleto(
      ultimoPlanejamentoComCapacidade,
      {
        linhaOrigem
      }
    );

  renderizarResultadoBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

}

function inicializarBalanceamentoReal() {

  if (balanceamentoGeralBtn) {

    balanceamentoGeralBtn.addEventListener(
      "click",
      executarBalanceamentoGeral
    );

  } else {

    console.warn(
      "Botão balanceamentoGeralBtn não encontrado."
    );

  }

  if (balanceamentoLinhaBtn) {

    balanceamentoLinhaBtn.addEventListener(
      "click",
      executarBalanceamentoPorLinha
    );

  } else {

    console.warn(
      "Botão balanceamentoLinhaBtn não encontrado."
    );

  }

  window.addEventListener(
    "jfc:balancear-linha",
    (event) => {

      executarBalanceamentoLinhaDireta(
        event.detail?.linha
      );

    }
  );

}


// =========================
// IMPORTAÇÕES CSV / TXT
// =========================

function baseTecnicaEstaCarregada() {

  const baseTXT =
    getBaseTXT();

  return Boolean(
    baseTXT &&
    Array.isArray(baseTXT.produtosTecnicos) &&
    baseTXT.produtosTecnicos.length > 0
  );

}

function csvEstaCarregado() {

  const dadosCSV =
    getDadosCSV();

  return Boolean(
    Array.isArray(dadosCSV) &&
    dadosCSV.length > 0
  );

}

function tentarSincronizarAutomaticamente(origem = "") {

  if (
    !csvEstaCarregado() ||
    !baseTecnicaEstaCarregada()
  ) {

    console.log(
      "Sincronização automática aguardando CSV e base técnica.",
      origem
    );

    return;

  }

  console.log(
    "Sincronização automática iniciada.",
    origem
  );

  executarSincronizacao();

}

function inicializarImportacoes() {

  configurarImportacaoCSV(async (dados) => {

    setDadosCSV(
      dados
    );

    console.log(
      "CSV salvo temporariamente para sincronização:",
      dados.length,
      "registros"
    );

    try {

      const resultadoBaseTecnica =
        await garantirBaseTecnicaNativaCarregada({
          forcarRecarregar: true
        });

      console.log(
        "Base Técnica carregada automaticamente ao importar CSV:",
        resultadoBaseTecnica
      );

    } catch (erro) {

      console.error(
        "Não foi possível carregar data/base_tecnica.json ao importar CSV:",
        erro
      );

      alert(
        "CSV importado, mas a Base Técnica nativa não foi carregada. Verifique se data/base_tecnica.json existe, se está preenchido e se você está abrindo pelo Live Server ou GitHub Pages."
      );

    }

    tentarSincronizarAutomaticamente(
      "csv + base_tecnica_json"
    );

  });

  configurarImportacaoTXT((baseTecnica) => {

    setBaseTXT(
      baseTecnica
    );

    console.log(
      "TXT salvo temporariamente para sincronização:",
      baseTecnica?.estatisticas
    );

    marcarAlteracaoLocal(
      "baseTecnica"
    );

    tentarSincronizarAutomaticamente(
      "txt"
    );

  });

}


// =========================
// BOTÃO SINCRONIZAR
// =========================

function inicializarSincronizacao() {

  if (!syncBtn) {

    console.warn(
      "Botão syncBtn não encontrado."
    );

    return;

  }

  syncBtn.addEventListener(
    "click",
    executarSincronizacao
  );

}


// =========================
// PDF - ORDEM DE PRODUÇÃO POR LINHA
// =========================

async function executarGeracaoPDFOrdemProducao(evento = {}) {

  if (!ultimoPlanejamentoComCapacidade) {

    alert(
      "Nenhum planejamento sequenciado disponível para gerar PDF. Suba o CSV e aguarde a sincronização com a base técnica."
    );

    return;

  }

  try {

    const linhaSelecionada =
      evento?.detail?.linha || null;

    await gerarPdfOrdemProducao(
      ultimoPlanejamentoComCapacidade,
      {
        inicioTurno: "07:00",
        linhasSelecionadas:
          linhaSelecionada
            ? [linhaSelecionada]
            : null,
        linhaSelecionada
      }
    );

  } catch (erro) {

    console.error(
      "Erro ao gerar PDF da ordem de produção:",
      erro
    );

    alert(
      erro?.message || "Não foi possível gerar o PDF da ordem de produção."
    );

  }

}

function inicializarGeracaoPDFOrdemProducao() {

  window.addEventListener(
    "jfc:gerar-pdf-ordem-producao",
    executarGeracaoPDFOrdemProducao
  );

}


// =========================
// DADOS OFICIAIS JSON / GITHUB
// =========================

function renderizarCadastrosBase() {

  renderCadastroProduto({
    onSalvar: () => {

      marcarAlteracaoLocal(
        "cadastroMestre"
      );

      recalcularPlanejamentoComCapacidade();

    }
  });

  renderFamiliasSetup({
    onSalvar: () => {

      marcarAlteracaoLocal(
        "familiasSetup"
      );

      recalcularPlanejamentoComCapacidade();

    }
  });

}

// =========================
// INICIALIZAÇÃO
// =========================

async function iniciarJFCFlow() {

  console.log(
    "JFC FLOW iniciado."
  );

  await inicializarDadosProjetoJSON();

  inicializarImportacoes();

  inicializarSincronizacao();

  inicializarBalanceamentoReal();

  inicializarGeracaoPDFOrdemProducao();

  inicializarPainelDadosProjeto({
    onDadosRecarregados: () => {

      renderizarCadastrosBase();

      recalcularPlanejamentoComCapacidade();

    }
  });

  renderEditorCapacidade(
    recalcularPlanejamentoComCapacidade
  );

  renderizarCadastrosBase();

  recalcularPlanejamentoComCapacidade();

}

iniciarJFCFlow();