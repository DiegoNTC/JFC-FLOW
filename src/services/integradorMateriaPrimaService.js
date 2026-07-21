/**
 * ======================================================
 * JFC FLOW
 * Modulo: integradorMateriaPrimaService
 * Versao: 1.1.0
 *
 * Responsabilidade:
 * Integrar a importacao XLSX de materia-prima ao fluxo atual
 * sem mexer no main.js.
 *
 * Ao clicar em Gerar PDF da linha, o sistema tambem gera
 * o PDF consolidado de materia-prima da mesma linha.
 *
 * Correcao 1.1.0:
 * Para PDF de uma linha especifica, o relatorio de materia-prima
 * passa a filtrar pelos produtos que aparecem na Ordem de Producao
 * daquela linha na tela, e nao apenas pela coluna "linha" da planilha.
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

function texto(valor) {

  return String(valor ?? "").trim();

}

function normalizarTexto(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function normalizarLinha(valor) {

  const textoNormalizado =
    normalizarTexto(valor);

  if (!textoNormalizado) {
    return "";
  }

  if (
    textoNormalizado === "TOMATE" ||
    textoNormalizado === "LT" ||
    textoNormalizado.includes("LINHA TOMATE")
  ) {
    return "TOMATE";
  }

  const numeroLinha =
    textoNormalizado.match(/\d+/)?.[0];

  if (numeroLinha) {
    return `L${Number(numeroLinha)}`;
  }

  return textoNormalizado.replace(/\s+/g, "");

}

function normalizarCodigoProduto(valor) {

  return texto(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

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

function adicionarUnico(lista, valor, normalizador) {

  const valorNormalizado =
    normalizador(valor);

  if (
    valorNormalizado &&
    !lista.includes(valorNormalizado)
  ) {
    lista.push(valorNormalizado);
  }

}

function coletarProdutosPlanejadosDaLinhaNaTela(linhaSelecionada) {

  const linhaAlvo =
    normalizarLinha(linhaSelecionada);

  const resultado = {
    linha:
      linhaAlvo,
    codigos: [],
    nomes: [],
    encontrouLinha:
      false
  };

  if (!linhaAlvo) {
    return resultado;
  }

  const cards =
    Array.from(
      document.querySelectorAll(".real-line-card")
    );

  cards.forEach(card => {

    const linhaCard =
      normalizarLinha(
        card.querySelector("summary strong")?.textContent || ""
      );

    if (linhaCard !== linhaAlvo) {
      return;
    }

    resultado.encontrouLinha =
      true;

    const linhasTabela =
      Array.from(
        card.querySelectorAll("tbody tr")
      );

    linhasTabela.forEach(tr => {

      const colunas =
        Array.from(
          tr.querySelectorAll("td")
        );

      const codigo =
        texto(colunas[0]?.textContent || "");

      const nome =
        texto(colunas[1]?.textContent || "");

      adicionarUnico(
        resultado.codigos,
        codigo,
        normalizarCodigoProduto
      );

      adicionarUnico(
        resultado.nomes,
        nome,
        normalizarTexto
      );

    });

  });

  return resultado;

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

    const filtroProdutos =
      linhaSelecionada
        ? coletarProdutosPlanejadosDaLinhaNaTela(linhaSelecionada)
        : {
            codigos: [],
            nomes: []
          };

    const usandoFiltroDaOrdem =
      linhaSelecionada &&
      (
        filtroProdutos.codigos.length > 0 ||
        filtroProdutos.nomes.length > 0
      );

    if (
      linhaSelecionada &&
      !usandoFiltroDaOrdem
    ) {

      console.warn(
        "Materia-prima: nao foi possivel coletar produtos da Ordem de Producao na tela. O relatorio usara a coluna linha da planilha como fallback.",
        {
          linhaSelecionada,
          filtroProdutos
        }
      );

    }

    window.__jfcMateriaPrimaUltimoFiltro = {
      linhaSelecionada,
      usandoFiltroDaOrdem,
      filtroProdutos
    };

    const resultado =
      await gerarPdfMateriaPrimaConsolidada(
        baseMateriaPrima,
        {
          linhasSelecionadas:
            linhaSelecionada
              ? [linhaSelecionada]
              : null,
          linhaSelecionada,
          codigosProdutosPermitidos:
            usandoFiltroDaOrdem
              ? filtroProdutos.codigos
              : [],
          nomesProdutosPermitidos:
            usandoFiltroDaOrdem
              ? filtroProdutos.nomes
              : []
        }
      );

    atualizarStatusMateriaPrima(
      baseMateriaPrima,
      usandoFiltroDaOrdem
        ? `Matéria-prima: PDF gerado pela Ordem da ${linhaSelecionada} (${resultado.arquivo})`
        : `Matéria-prima: PDF gerado (${resultado.arquivo})`
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
