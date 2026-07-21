/**
 * ======================================================
 * JFC FLOW
 * Modulo: integradorMateriaPrimaService
 * Versao: 1.0.0
 *
 * Responsabilidade:
 * Integrar a importacao XLSX de materia-prima ao fluxo atual
 * sem mexer no main.js.
 *
 * Ao clicar em Gerar PDF da linha, o sistema tambem gera
 * o PDF consolidado de materia-prima da mesma linha.
 * ======================================================
 */

import {
  configurarImportacaoMateriaPrima
} from "../importers/xlsxMateriaPrimaImporter.js";

import {
  setBaseMateriaPrima,
  getBaseMateriaPrima,
  limparBaseMateriaPrima
} from "../repositories/materiaPrimaRepository.js";

import {
  gerarPdfMateriaPrimaConsolidada
} from "./geradorPdfMateriaPrimaService.js";

if (!window.__jfcMateriaPrimaIntegradorAtivo) {

  window.__jfcMateriaPrimaIntegradorAtivo = true;

  inicializarIntegradorMateriaPrima();

}

function formatarKg(valor) {

  const numero =
    Number(valor) || 0;

  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

}

function aguardar(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));

}

function obterStatusMateriaPrima() {

  return document.getElementById("materiaPrimaStatus");

}

function atualizarStatusMateriaPrima(baseMateriaPrima, mensagemExtra = "") {

  const status =
    obterStatusMateriaPrima();

  if (!status) {
    return;
  }

  if (
    !baseMateriaPrima ||
    !Array.isArray(baseMateriaPrima.registros) ||
    baseMateriaPrima.registros.length === 0
  ) {

    status.textContent =
      mensagemExtra || "Matéria-prima: nenhuma planilha importada";

    status.style.color =
      "#64748b";

    return;

  }

  const estatisticas =
    baseMateriaPrima.estatisticas || {};

  status.textContent =
    mensagemExtra ||
    `Matéria-prima: ${estatisticas.totalRegistros || baseMateriaPrima.registros.length} registros | ${estatisticas.totalLinhas || 0} linhas | ${formatarKg(estatisticas.pesoBrutoTotal)} kg bruto`;

  status.style.color =
    "#14532d";

}

function criarInputMateriaPrima() {

  let input =
    document.getElementById("materiaPrimaInput");

  if (input) {
    return input;
  }

  input =
    document.createElement("input");

  input.type = "file";
  input.id = "materiaPrimaInput";
  input.className = "file-input";
  input.accept = ".xlsx,.xls";

  const secao =
    document.querySelector(".real-planning-section") || document.body;

  secao.prepend(
    input
  );

  return input;

}

function criarBotaoMateriaPrima() {

  const actionButtons =
    document.querySelector(".action-buttons");

  if (!actionButtons) {
    return;
  }

  if (!document.getElementById("importMateriaPrimaBtn")) {

    const label =
      document.createElement("label");

    label.id = "importMateriaPrimaBtn";
    label.htmlFor = "materiaPrimaInput";
    label.className = "action-button secondary-action";
    label.textContent = "🥬 Importar Matéria-Prima";

    actionButtons.appendChild(
      label
    );

  }

  if (!document.getElementById("limparMateriaPrimaBtn")) {

    const botaoLimpar =
      document.createElement("button");

    botaoLimpar.type = "button";
    botaoLimpar.id = "limparMateriaPrimaBtn";
    botaoLimpar.className = "action-button secondary-action";
    botaoLimpar.textContent = "🧹 Limpar Matéria-Prima";

    botaoLimpar.addEventListener("click", () => {

      limparBaseMateriaPrima();

      atualizarStatusMateriaPrima(
        null,
        "Matéria-prima: base local limpa"
      );

    });

    actionButtons.appendChild(
      botaoLimpar
    );

  }

  if (!document.getElementById("materiaPrimaStatus")) {

    const status =
      document.createElement("span");

    status.id = "materiaPrimaStatus";
    status.style.fontSize = "12px";
    status.style.fontWeight = "700";
    status.style.color = "#64748b";
    status.style.alignSelf = "center";
    status.textContent = "Matéria-prima: nenhuma planilha importada";

    actionButtons.appendChild(
      status
    );

  }

}

function prepararControleMateriaPrima() {

  criarInputMateriaPrima();

  criarBotaoMateriaPrima();

  configurarImportacaoMateriaPrima(baseMateriaPrima => {

    setBaseMateriaPrima(
      baseMateriaPrima
    );

    atualizarStatusMateriaPrima(
      baseMateriaPrima
    );

    console.log(
      "BASE DE MATERIA-PRIMA IMPORTADA:",
      baseMateriaPrima
    );

  });

  atualizarStatusMateriaPrima(
    getBaseMateriaPrima()
  );

}

async function gerarRelatorioMateriaPrimaDoEvento(evento = {}) {

  const baseMateriaPrima =
    getBaseMateriaPrima();

  const linhaSelecionada =
    evento?.detail?.linha || null;

  if (
    !baseMateriaPrima ||
    !Array.isArray(baseMateriaPrima.registros) ||
    baseMateriaPrima.registros.length === 0
  ) {

    atualizarStatusMateriaPrima(
      null,
      "Matéria-prima: importe a planilha XLSX para baixar o relatório junto com o PDF"
    );

    console.warn(
      "PDF de materia-prima nao gerado: nenhuma planilha XLSX importada."
    );

    return;

  }

  try {

    /**
     * Pequena espera para o PDF da Ordem de Producao iniciar primeiro.
     * Assim, no clique em Gerar PDF, o navegador baixa primeiro a ordem
     * e em seguida o relatorio de materia-prima.
     */
    await aguardar(550);

    const resultado =
      await gerarPdfMateriaPrimaConsolidada(
        baseMateriaPrima,
        {
          linhasSelecionadas:
            linhaSelecionada
              ? [linhaSelecionada]
              : null,
          linhaSelecionada
        }
      );

    atualizarStatusMateriaPrima(
      baseMateriaPrima,
      `Matéria-prima: PDF gerado (${resultado.arquivo})`
    );

    console.log(
      "PDF DE MATERIA-PRIMA GERADO:",
      resultado
    );

  } catch (erro) {

    console.error(
      "Erro ao gerar PDF consolidado de materia-prima:",
      erro
    );

    atualizarStatusMateriaPrima(
      baseMateriaPrima,
      `Matéria-prima: erro ao gerar PDF${linhaSelecionada ? ` da ${linhaSelecionada}` : ""}`
    );

    alert(
      erro?.message || "Nao foi possivel gerar o PDF consolidado de materia-prima."
    );

  }

}

function inicializarIntegradorMateriaPrima() {

  const iniciar = () => {

    prepararControleMateriaPrima();

    window.addEventListener(
      "jfc:gerar-pdf-ordem-producao",
      gerarRelatorioMateriaPrimaDoEvento
    );

  };

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      {
        once: true
      }
    );

  } else {

    iniciar();

  }

}
