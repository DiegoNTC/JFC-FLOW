import {
  linha1,
  linha2
} from "./core/state.js";

import {
  atualizarTodasLinhas
} from "./render/renderLinha.js";

import {
  configurarDropzone
} from "./dragdrop/dropzone.js";

import {
  optimizeLinha
} from "./actions/optimize.js";

import {
  balanceLinha
} from "./actions/balance.js";

import "./dragdrop/dragStart.js";

import {
  removerItem
} from "./actions/removerItem.js";

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

// =========================
// ELEMENTOS
// =========================

const dropzoneL1 =
  document.getElementById("dropzone-l1");

const dropzoneL2 =
  document.getElementById("dropzone-l2");

const ganttL1 =
  document.getElementById("gantt-l1");

const ganttL2 =
  document.getElementById("gantt-l2");

const kpiL1 =
  document.getElementById("kpi-l1");

const kpiL2 =
  document.getElementById("kpi-l2");

const clockL1 =
  document.getElementById("clock-l1");

const clockL2 =
  document.getElementById("clock-l2");

const capacityL1 =
  document.getElementById("capacity-l1");

const capacityL2 =
  document.getElementById("capacity-l2");

const statusL1 =
  document.getElementById("status-l1");

const statusL2 =
  document.getElementById("status-l2");

const oeeL1 =
  document.getElementById("oee-l1");

const oeeL2 =
  document.getElementById("oee-l2");

const optimizeBtn =
  document.getElementById("optimizeBtn");

const balanceBtn =
  document.getElementById("balanceBtn");

const syncBtn =
  document.getElementById("syncBtn");

const balanceamentoGeralBtn =
  document.getElementById("balanceamentoGeralBtn");

const balanceamentoLinhaBtn =
  document.getElementById("balanceamentoLinhaBtn");

const linhaBalanceamentoSelect =
  document.getElementById("linhaBalanceamentoSelect");

const scaleL1 =
  document.getElementById("scale-l1");

const scaleL2 =
  document.getElementById("scale-l2");


// =========================
// ESTADO TEMPORÁRIO DO FLUXO REAL
// =========================

let ultimoPlanejamentoComCapacidade = null;

let ultimoResultadoSincronizacao = null;

let ultimaPersistencia = null;


// =========================
// CONFIG RENDER MANUAL
// =========================

const renderConfigL1 = {

  dropzone: dropzoneL1,
  gantt: ganttL1,
  scale: scaleL1,
  kpi: kpiL1,
  clock: clockL1,
  capacity: capacityL1,
  status: statusL1,
  oee: oeeL1

};

const renderConfigL2 = {

  dropzone: dropzoneL2,
  gantt: ganttL2,
  scale: scaleL2,
  kpi: kpiL2,
  clock: clockL2,
  capacity: capacityL2,
  status: statusL2,
  oee: oeeL2

};


// =========================
// PLANEJAMENTO REAL
// =========================

function normalizarCodigoProduto(
  codigo
) {

  return String(codigo || "")
    .trim();

}

function consolidarProdutosCSVDoDia(
  dadosCSV
) {

  const mapa =
    new Map();

  (dadosCSV || []).forEach(item => {

    const codigo =
      normalizarCodigoProduto(
        item.codigo
      );

    if (!codigo) {
      return;
    }

    const demanda =
      Number(
        item.demandaFinal ??
        item.pedidos ??
        item.previa ??
        0
      ) || 0;

    if (!mapa.has(codigo)) {

      mapa.set(
        codigo,
        {
          codigo,
          nomeOficial:
            item.produto || item.nomeOficial || "",
          descricaoCSV:
            item.produto || item.nomeOficial || "",
          demandaFinal:
            demanda
        }
      );

      return;

    }

    const existente =
      mapa.get(codigo);

    existente.demandaFinal +=
      demanda;

    if (
      !existente.nomeOficial &&
      item.produto
    ) {

      existente.nomeOficial =
        item.produto;

      existente.descricaoCSV =
        item.produto;

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

      demanda:
        linha.resumo?.demandaTotal,

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
      "Importe primeiro o TXT da Base Técnica."
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
      "Sincronize o CSV e o TXT antes de analisar o balanceamento."
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
      "Sincronize o CSV e o TXT antes de analisar o balanceamento."
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
      "Sincronize o CSV e o TXT antes de analisar o balanceamento."
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

function inicializarImportacoes() {

  configurarImportacaoCSV((dados) => {

    setDadosCSV(
      dados
    );

    console.log(
      "CSV salvo temporariamente para sincronização:",
      dados.length,
      "registros"
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
// REMOVER ITEM GLOBAL
// =========================

window.removerItem = (id) => {

  removerItem(
    id
  );

  atualizarTodasLinhas(
    renderConfigL1,
    renderConfigL2,
    linha1,
    linha2
  );

};


// =========================
// BOTÕES DO SEQUENCIADOR MANUAL
// =========================

function inicializarBotoesSequenciador() {

  if (optimizeBtn) {

    optimizeLinha(
      optimizeBtn,
      linha1,
      linha2,
      renderConfigL1,
      renderConfigL2
    );

  } else {

    console.warn(
      "Botão optimizeBtn não encontrado."
    );

  }

  if (balanceBtn) {

    balanceLinha(
      balanceBtn,
      linha1,
      linha2,
      renderConfigL1,
      renderConfigL2
    );

  } else {

    console.warn(
      "Botão balanceBtn não encontrado."
    );

  }

}


// =========================
// DROPZONES
// =========================

function inicializarDropzones() {

  if (dropzoneL1) {

    configurarDropzone(
      "L1",
      dropzoneL1,
      linha1,
      ganttL1,
      scaleL1,
      kpiL1,
      clockL1,
      capacityL1,
      statusL1,
      oeeL1
    );

  } else {

    console.warn(
      "Dropzone L1 não encontrada."
    );

  }

  if (dropzoneL2) {

    configurarDropzone(
      "L2",
      dropzoneL2,
      linha2,
      ganttL2,
      scaleL2,
      kpiL2,
      clockL2,
      capacityL2,
      statusL2,
      oeeL2
    );

  } else {

    console.warn(
      "Dropzone L2 não encontrada."
    );

  }

}


// =========================
// INICIALIZAÇÃO
// =========================

function iniciarJFCFlow() {

  console.log(
    "JFC FLOW iniciado."
  );

  inicializarImportacoes();

  inicializarSincronizacao();

  inicializarBalanceamentoReal();

  inicializarBotoesSequenciador();

  inicializarDropzones();

  renderEditorCapacidade(
    recalcularPlanejamentoComCapacidade
  );

  renderCadastroProduto({
    onSalvar: () => {

      recalcularPlanejamentoComCapacidade();

    }
  });

  recalcularPlanejamentoComCapacidade();

}

iniciarJFCFlow();