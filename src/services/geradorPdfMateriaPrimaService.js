/**
 * ======================================================
 * JFC FLOW
 * Modulo: geradorPdfMateriaPrimaService
 * Versao: 1.0.0
 *
 * Responsabilidade:
 * Gerar PDF consolidado de materia-prima por linha.
 * O relatorio soma a mesma materia-prima dentro da linha,
 * mesmo quando ela aparece em produtos diferentes.
 * ======================================================
 */

import {
  consolidarMateriaPrimaPorLinha
} from "./relatorioMateriaPrimaService.js";

const JSPDF_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

const AUTOTABLE_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js";

function texto(valor) {

  return String(valor ?? "").trim();

}

function numero(valor) {

  const convertido =
    Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;

}

function formatarKg(valor) {

  return numero(valor).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

}

function formatarNumero(valor) {

  return numero(valor).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  );

}

function carregarScript(src) {

  return new Promise((resolve, reject) => {

    const existente =
      document.querySelector(`script[src="${src}"]`);

    if (existente) {

      if (existente.dataset.carregado === "true") {
        resolve();
        return;
      }

      existente.addEventListener("load", () => resolve(), { once: true });
      existente.addEventListener("error", () => reject(new Error(`Erro ao carregar ${src}`)), { once: true });
      return;

    }

    const script =
      document.createElement("script");

    script.src = src;
    script.async = true;

    script.addEventListener("load", () => {
      script.dataset.carregado = "true";
      resolve();
    }, { once: true });

    script.addEventListener("error", () => {
      reject(
        new Error(
          `Nao foi possivel carregar a biblioteca PDF: ${src}`
        )
      );
    }, { once: true });

    document.head.appendChild(script);

  });

}

async function garantirBibliotecasPDF() {

  if (!window.jspdf?.jsPDF) {
    await carregarScript(JSPDF_URL);
  }

  if (!window.jspdf?.jsPDF) {
    throw new Error("Biblioteca jsPDF nao carregada.");
  }

  const testeDoc =
    new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  if (typeof testeDoc.autoTable !== "function") {
    await carregarScript(AUTOTABLE_URL);
  }

}

function gerarNomeArquivo(opcoes = {}) {

  const agora =
    new Date();

  const data =
    agora.toISOString().slice(0, 10);

  const hora =
    String(agora.getHours()).padStart(2, "0") +
    String(agora.getMinutes()).padStart(2, "0");

  const linha =
    texto(opcoes.linhaSelecionada || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  return linha
    ? `materia_prima_consolidada_${linha}_${data}_${hora}.pdf`
    : `materia_prima_consolidada_todas_linhas_${data}_${hora}.pdf`;

}

function adicionarCabecalho(doc, relatorio, opcoes = {}) {

  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 21, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("JFC FLOW - RELATORIO CONSOLIDADO DE MATERIA-PRIMA", 10, 8);

  const linhaPDF =
    opcoes.linhaSelecionada
      ? `Linha: ${opcoes.linhaSelecionada}`
      : "Linhas: todas";

  const arquivo =
    relatorio?.arquivoOrigem
      ? ` | Planilha: ${relatorio.arquivoOrigem}`
      : "";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `${linhaPDF}${arquivo} | Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    10,
    15
  );

}

function montarBodyResumo(relatorio) {

  const body = [];

  relatorio.linhas.forEach(linha => {

    body.push([
      {
        content:
          `${String(linha.linha || "").toUpperCase()} | Total bruto: ${formatarKg(linha.totalPesoBruto)} kg | Total liquido: ${formatarKg(linha.totalPesoLiquido)} kg`,
        colSpan: 5,
        styles: {
          fillColor: [222, 218, 212],
          textColor: [26, 24, 20],
          fontStyle: "bold",
          fontSize: 9,
          halign: "left"
        }
      }
    ]);

    linha.materiais.forEach(material => {

      body.push([
        linha.linha,
        material.materiaPrima || "-",
        formatarNumero(material.totalProdutos),
        formatarKg(material.pesoBruto),
        formatarKg(material.pesoLiquido)
      ]);

    });

    body.push([
      linha.linha,
      "TOTAL DA LINHA",
      "-",
      formatarKg(linha.totalPesoBruto),
      formatarKg(linha.totalPesoLiquido)
    ]);

  });

  if (relatorio.linhas.length > 1) {

    body.push([
      "Todas",
      "TOTAL GERAL",
      "-",
      formatarKg(relatorio.resumo.totalPesoBruto),
      formatarKg(relatorio.resumo.totalPesoLiquido)
    ]);

  }

  return body;

}

function montarBodyDetalhado(relatorio) {

  const body = [];

  relatorio.linhas.forEach(linha => {

    body.push([
      {
        content:
          `${String(linha.linha || "").toUpperCase()} - DETALHADO POR PRODUTO`,
        colSpan: 6,
        styles: {
          fillColor: [226, 232, 240],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "left"
        }
      }
    ]);

    linha.detalhesProduto.forEach(item => {

      body.push([
        linha.linha,
        item.codigoProduto || "-",
        item.produtoVenda || "-",
        item.materiaPrima || "-",
        formatarKg(item.pesoBruto),
        formatarKg(item.pesoLiquido)
      ]);

    });

  });

  return body;

}

export async function gerarPdfMateriaPrimaConsolidada(baseMateriaPrima, opcoes = {}) {

  const relatorio =
    consolidarMateriaPrimaPorLinha(
      baseMateriaPrima,
      opcoes
    );

  if (
    !relatorio ||
    !Array.isArray(relatorio.linhas) ||
    relatorio.linhas.length === 0
  ) {
    throw new Error(
      opcoes.linhaSelecionada
        ? `A linha ${opcoes.linhaSelecionada} nao possui materia-prima importada.`
        : "Nenhuma materia-prima foi encontrada para gerar o PDF."
    );
  }

  await garantirBibliotecasPDF();

  const { jsPDF } =
    window.jspdf;

  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

  adicionarCabecalho(
    doc,
    relatorio,
    opcoes
  );

  doc.autoTable({
    head: [[
      "Linha",
      "Materia-prima consolidada",
      "Produtos",
      "Peso bruto total kg",
      "Peso liquido total kg"
    ]],
    body:
      montarBodyResumo(relatorio),
    startY: 27,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.4,
      cellPadding: 1.3,
      lineColor: [180, 175, 168],
      lineWidth: 0.18,
      textColor: [26, 24, 20],
      overflow: "linebreak",
      valign: "top"
    },
    headStyles: {
      fillColor: [49, 20, 17],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.4,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: 150 },
      2: { cellWidth: 24, halign: "center" },
      3: { cellWidth: 36, halign: "right" },
      4: { cellWidth: 36, halign: "right" }
    },
    margin: {
      top: 25,
      right: 7,
      bottom: 16,
      left: 7
    },
    didParseCell: data => {

      if (data.section !== "body") {
        return;
      }

      const primeiraCelula =
        data.row.raw?.[0];

      const materia =
        texto(data.row.raw?.[1]);

      const ehCabecalhoLinha =
        primeiraCelula?.colSpan === 5;

      if (ehCabecalhoLinha) {
        return;
      }

      if (
        materia === "TOTAL DA LINHA" ||
        materia === "TOTAL GERAL"
      ) {
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.fontStyle = "bold";
        return;
      }

      data.cell.styles.fillColor = [255, 247, 246];

    },
    didDrawPage: data => {

      adicionarCabecalho(
        doc,
        relatorio,
        opcoes
      );

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Pagina ${data.pageNumber} - JFC FLOW`,
        pageWidth / 2,
        pageHeight - 5,
        {
          align: "center"
        }
      );

    }
  });

  const inicioDetalhe =
    (doc.lastAutoTable?.finalY || 27) + 8;

  doc.autoTable({
    head: [[
      "Linha",
      "Codigo",
      "Produto",
      "Materia-prima",
      "Peso bruto kg",
      "Peso liquido kg"
    ]],
    body:
      montarBodyDetalhado(relatorio),
    startY:
      inicioDetalhe,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 6.5,
      cellPadding: 1.15,
      lineColor: [180, 175, 168],
      lineWidth: 0.18,
      textColor: [26, 24, 20],
      overflow: "linebreak",
      valign: "top"
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.5,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 105 },
      3: { cellWidth: 75 },
      4: { cellWidth: 31, halign: "right" },
      5: { cellWidth: 31, halign: "right" }
    },
    margin: {
      top: 25,
      right: 7,
      bottom: 16,
      left: 7
    },
    didParseCell: data => {

      if (data.section !== "body") {
        return;
      }

      const primeiraCelula =
        data.row.raw?.[0];

      const ehCabecalhoLinha =
        primeiraCelula?.colSpan === 6;

      if (ehCabecalhoLinha) {
        return;
      }

      data.cell.styles.fillColor = [248, 250, 252];

    },
    didDrawPage: data => {

      adicionarCabecalho(
        doc,
        relatorio,
        opcoes
      );

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Pagina ${data.pageNumber} - JFC FLOW`,
        pageWidth / 2,
        pageHeight - 5,
        {
          align: "center"
        }
      );

    }
  });

  const nomeArquivo =
    opcoes.nomeArquivo || gerarNomeArquivo(opcoes);

  doc.save(
    nomeArquivo
  );

  return {
    linhas:
      relatorio.linhas.length,
    materiasPrimas:
      relatorio.resumo.totalMateriasPrimas,
    detalhes:
      relatorio.resumo.totalDetalhes,
    pesoBruto:
      relatorio.resumo.totalPesoBruto,
    pesoLiquido:
      relatorio.resumo.totalPesoLiquido,
    arquivo:
      nomeArquivo
  };

}
