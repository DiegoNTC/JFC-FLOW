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

function calcularPlanejamentoCompleto(
  produtosMestre
) {

  const planejamentoReal =
    gerarPlanejamentoReal(
      produtosMestre || []
    );

  const planejamentoComCapacidade =
    avaliarCapacidadePlanejamento(
      planejamentoReal
    );

  const sugestoesBalanceamento =
    sugerirBalanceamento(
      planejamentoComCapacidade
    );

  const simulacaoBalanceamento =
    simularBalanceamento(
      planejamentoComCapacidade,
      sugestoesBalanceamento
    );

  return {

    planejamentoReal,

    planejamentoComCapacidade,

    sugestoesBalanceamento,

    simulacaoBalanceamento

  };

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
  planejamentoComCapacidade,
  sugestoesBalanceamento,
  simulacaoBalanceamento
) {

  const linhasPlanejadas =
    planejamentoComCapacidade?.linhas || [];

  const sugestoes =
    sugestoesBalanceamento?.sugestoes || [];

  const bloqueios =
    sugestoesBalanceamento?.bloqueios || [];

  const movimentosSelecionados =
    simulacaoBalanceamento?.movimentosSelecionados || [];

  const linhasDepois =
    simulacaoBalanceamento?.linhasDepois || [];

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

      linha: linha.linha,

      produtos: linha.resumo?.totalProdutos,

      demanda: linha.resumo?.demandaTotal,

      capacidadeMin: linha.capacidade?.capacidadeMin,

      tempoPlanejadoMin: linha.capacidade?.tempoPlanejadoMin,

      saldoMin: linha.capacidade?.saldoMin,

      utilizacao: `${linha.capacidade?.utilizacaoPercentual || 0}%`,

      status: linha.capacidade?.statusTexto

    }))
  );

  console.log(
    "SUGESTÕES DE BALANCEAMENTO:",
    sugestoesBalanceamento
  );

  console.table(
    sugestoes.map(sugestao => ({

      codigo: sugestao.codigo,

      produto: sugestao.nomeOficial,

      origem: sugestao.origem?.linha,

      destino: sugestao.destino?.linha,

      tempoOrigemMin:
        sugestao.impactoEstimado?.tempoProdutoOrigemMin,

      tempoDestinoMin:
        sugestao.impactoEstimado?.tempoProdutoDestinoMin,

      variacaoMin:
        sugestao.impactoEstimado?.variacaoTempoMin,

      saldoOrigemDepois:
        sugestao.impactoEstimado?.saldoOrigemDepois,

      saldoDestinoDepois:
        sugestao.impactoEstimado?.saldoDestinoDepois,

      linhasPermitidas:
        sugestao.validacao?.linhasPermitidas?.join(", ")

    }))
  );

  console.table(
    bloqueios.slice(0, 30).map(bloqueio => ({

      codigo: bloqueio.codigo,

      produto: bloqueio.nomeOficial,

      origem: bloqueio.origem,

      destino: bloqueio.destino,

      tempoOrigemMin:
        bloqueio.tempoProdutoOrigemMin,

      tempoDestinoMin:
        bloqueio.tempoProdutoDestinoMin,

      saldoDestinoMin:
        bloqueio.saldoDestinoMin,

      linhasPermitidas:
        bloqueio.linhasPermitidas?.join(", "),

      motivo:
        bloqueio.motivoTexto

    }))
  );

  console.log(
    "SIMULAÇÃO DE BALANCEAMENTO:",
    simulacaoBalanceamento
  );

  console.table(
    movimentosSelecionados.map(item => ({

      codigo: item.codigo,

      produto: item.nomeOficial,

      origem: item.origem?.linha,

      destino: item.destino?.linha,

      tempoOrigemMin:
        item.impactoEstimado?.tempoProdutoOrigemMin,

      tempoDestinoMin:
        item.impactoEstimado?.tempoProdutoDestinoMin,

      saldoOrigemDepois:
        item.impactoEstimado?.saldoOrigemDepois,

      saldoDestinoDepois:
        item.impactoEstimado?.saldoDestinoDepois

    }))
  );

  console.table(
    linhasDepois.map(linha => ({

      linha: linha.linha,

      capacidadeMin: linha.capacidadeMin,

      tempoDepoisMin: linha.tempoPlanejadoMin,

      saldoDepoisMin: linha.saldoMin,

      utilizacaoDepois:
        `${linha.utilizacaoPercentual || 0}%`,

      statusAntes:
        linha.statusTextoOriginal,

      statusDepois:
        linha.statusTexto

    }))
  );

}


// =========================
// SINCRONIZAÇÃO
// =========================

function renderizarResultadoSincronizacao(
  resultado,
  persistencia,
  planejamentoComCapacidade,
  sugestoesBalanceamento,
  simulacaoBalanceamento
) {

  renderPlanejamentoReal(
    planejamentoComCapacidade
  );

  renderBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );
  renderSincronizacao(
    resultado,
    persistencia,
    {
      onConfirmarSugestao: (sugestao) => {

        const produtoConfirmado =
          confirmarSugestaoVinculo(sugestao);

        console.log(
          "PRODUTO CONFIRMADO MANUALMENTE:",
          produtoConfirmado
        );

        const novaPersistencia = {

          produtosMestre: carregarProdutosMestre(),

          sugestoes: carregarSugestoesVinculo(),

          pendencias: carregarPendenciasVinculo()

        };

        const {
          planejamentoComCapacidade:
          novoPlanejamentoComCapacidade,

          sugestoesBalanceamento:
          novasSugestoesBalanceamento,

          simulacaoBalanceamento:
          novaSimulacaoBalanceamento
        } = calcularPlanejamentoCompleto(
          novaPersistencia.produtosMestre
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

        renderizarResultadoSincronizacao(
          novoResultado,
          novaPersistencia,
          novoPlanejamentoComCapacidade,
          novasSugestoesBalanceamento,
          novaSimulacaoBalanceamento
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
    planejamentoComCapacidade,
    sugestoesBalanceamento,
    simulacaoBalanceamento
  } = calcularPlanejamentoCompleto(
    persistencia.produtosMestre
  );

  logarPlanejamento(
    resultadoSincronizacao,
    persistencia,
    planejamentoComCapacidade,
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

  renderizarResultadoSincronizacao(
    resultadoSincronizacao,
    persistencia,
    planejamentoComCapacidade,
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

}


// =========================
// RECÁLCULO DE CAPACIDADE
// =========================

function recalcularPlanejamentoComCapacidade() {

  const produtosMestre =
    carregarProdutosMestre();

  if (
    !produtosMestre ||
    produtosMestre.length === 0
  ) {

    renderPlanejamentoReal(null);

    renderBalanceamento(null);

    return;

  }

  const {
    planejamentoComCapacidade,
    sugestoesBalanceamento,
    simulacaoBalanceamento
  } = calcularPlanejamentoCompleto(
    produtosMestre
  );

  renderPlanejamentoReal(
    planejamentoComCapacidade
  );

  renderBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

  console.log(
    "PLANEJAMENTO RECALCULADO COM NOVA CAPACIDADE:",
    planejamentoComCapacidade
  );

  console.log(
    "BALANCEAMENTO RECALCULADO:",
    sugestoesBalanceamento
  );

  console.log(
    "SIMULAÇÃO RECALCULADA:",
    simulacaoBalanceamento
  );

}


// =========================
// IMPORTAÇÕES CSV / TXT
// =========================

function inicializarImportacoes() {

  configurarImportacaoCSV((dados) => {

    setDadosCSV(dados);

    console.log(
      "CSV salvo temporariamente para sincronização:",
      dados.length,
      "registros"
    );

  });

  configurarImportacaoTXT((baseTecnica) => {

    setBaseTXT(baseTecnica);

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

  removerItem(id);

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

  recalcularPlanejamentoComCapacidade();

}

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
  } = calcularBalanceamentoCompleto(
    ultimoPlanejamentoComCapacidade
  );

  console.log(
    "BALANCEAMENTO GERAL:",
    sugestoesBalanceamento
  );

  console.log(
    "SIMULAÇÃO GERAL:",
    simulacaoBalanceamento
  );

  renderBalanceamento(
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
  } = calcularBalanceamentoCompleto(
    ultimoPlanejamentoComCapacidade,
    {
      linhaOrigem
    }
  );

  console.log(
    `BALANCEAMENTO DA LINHA ${linhaOrigem}:`,
    sugestoesBalanceamento
  );

  console.log(
    `SIMULAÇÃO DA LINHA ${linhaOrigem}:`,
    simulacaoBalanceamento
  );

  renderBalanceamento(
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
  } = calcularBalanceamentoCompleto(
    ultimoPlanejamentoComCapacidade,
    {
      linhaOrigem
    }
  );

  console.log(
    `BALANCEAMENTO DIRETO DA LINHA ${linhaOrigem}:`,
    sugestoesBalanceamento
  );

  console.log(
    `SIMULAÇÃO DIRETA DA LINHA ${linhaOrigem}:`,
    simulacaoBalanceamento
  );

  renderBalanceamento(
    sugestoesBalanceamento,
    simulacaoBalanceamento
  );

}

iniciarJFCFlow();
