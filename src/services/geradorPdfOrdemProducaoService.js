/**
 * ======================================================
 * JFC FLOW
 * Modulo: geradorPdfOrdemProducaoService
 * Versao: 1.4.0
 *
 * Responsabilidade:
 * Gerar PDF da Ordem de Producao por linha usando o
 * planejamento sequenciado atual.
 *
 * Campos do PDF:
 * Inicio, Termino, Duracao, Codigo, Item, Familia, Zona,
 * Linha, Quantidade, Kg/dia, Kg/h, Horario de inicio, Horario de termino e Quantidade produzida.
 * O cabecalho segue o modelo da Ordem de Producao antiga.
 * ======================================================
 */

const JSPDF_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

const AUTOTABLE_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js";

const SM = {
  folhoso: {
    folhoso: 5,
    raiz: 20,
    tomate: 15,
    crucifero: 10,
    cebola: 25,
    mcd: 10,
    outros: 20
  },
  raiz: {
    folhoso: 20,
    raiz: 5,
    tomate: 20,
    crucifero: 20,
    cebola: 20,
    mcd: 20,
    outros: 15
  },
  tomate: {
    folhoso: 15,
    raiz: 20,
    tomate: 5,
    crucifero: 15,
    cebola: 20,
    mcd: 10,
    outros: 20
  },
  crucifero: {
    folhoso: 10,
    raiz: 20,
    tomate: 15,
    crucifero: 5,
    cebola: 20,
    mcd: 15,
    outros: 15
  },
  cebola: {
    folhoso: 25,
    raiz: 20,
    tomate: 20,
    crucifero: 20,
    cebola: 5,
    mcd: 20,
    outros: 20
  },
  mcd: {
    folhoso: 10,
    raiz: 20,
    tomate: 10,
    crucifero: 15,
    cebola: 20,
    mcd: 5,
    outros: 20
  },
  outros: {
    folhoso: 20,
    raiz: 15,
    tomate: 20,
    crucifero: 15,
    cebola: 20,
    mcd: 20,
    outros: 10
  }
};

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

  const valorTexto =
    String(valor).trim();

  let normalizado =
    valorTexto;

  if (valorTexto.includes(",")) {
    normalizado =
      valorTexto
        .replace(/\./g, "")
        .replace(",", ".");
  }

  const convertido =
    Number(
      normalizado
        .replace(/[^0-9.-]/g, "")
    );

  return Number.isFinite(convertido)
    ? convertido
    : padrao;

}

function formatarNumero(valor) {

  return numero(valor, 0).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 0
    }
  );

}

function formatarQuantidadeTotal(valor) {

  return numero(valor, 0).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

}

function formatarKg(valor) {

  return numero(valor, 0).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

}

function formatarKgHora(valor) {

  const kgHora =
    numero(valor, 0);

  if (kgHora <= 0) {
    return "-";
  }

  return `${kgHora.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 2
    }
  )} kg/h`;

}

function formatarMinutos(minutos) {

  const total =
    Math.max(
      0,
      Math.round(numero(minutos, 0))
    );

  if (total < 60) {
    return `${total}min`;
  }

  const horas =
    Math.floor(total / 60);

  const resto =
    total % 60;

  if (resto === 0) {
    return `${horas}h`;
  }

  return `${horas}h${resto}min`;

}

function horaParaMinutos(hora) {

  const [horas, minutos] =
    texto(hora || "07:00")
      .split(":")
      .map(parte => Number(parte));

  if (
    !Number.isFinite(horas) ||
    !Number.isFinite(minutos)
  ) {
    return 7 * 60;
  }

  return horas * 60 + minutos;

}

function minutosParaHora(totalMinutos) {

  const total =
    Math.max(
      0,
      Math.round(numero(totalMinutos, 0))
    );

  const dias =
    Math.floor(total / 1440);

  const minutosDia =
    total % 1440;

  const horas =
    Math.floor(minutosDia / 60);

  const minutos =
    minutosDia % 60;

  const horaFormatada =
    `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

  return dias > 0
    ? `${horaFormatada} +${dias}d`
    : horaFormatada;

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
          `Nao foi possivel carregar a biblioteca de PDF: ${src}`
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

function obterProdutosLinha(linha = {}) {

  if (Array.isArray(linha.produtos)) {
    return linha.produtos;
  }

  if (Array.isArray(linha.itens)) {
    return linha.itens;
  }

  if (Array.isArray(linha.produtosSequenciados)) {
    return linha.produtosSequenciados;
  }

  if (Array.isArray(linha.produtosPlanejados)) {
    return linha.produtosPlanejados;
  }

  if (Array.isArray(linha.itensSequenciados)) {
    return linha.itensSequenciados;
  }

  if (Array.isArray(linha.itensPlanejados)) {
    return linha.itensPlanejados;
  }

  return [];

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

function obterCodigoProduto(produto = {}) {

  return texto(
    produto.codigo ??
    produto.codigoProduto ??
    produto.codProduto ??
    produto.cod ??
    produto.codigoCSV
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


function normalizarTextoComparacao(valor) {

  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function normalizarCategoriaSetup(valor) {

  const categoria =
    normalizarTextoComparacao(valor);

  if (!categoria) {
    return "";
  }

  if (
    categoria.includes("mcd") ||
    categoria.includes("mcdonald") ||
    categoria.includes("mc donald")
  ) {
    return "mcd";
  }

  if (categoria.includes("cebola")) {
    return "cebola";
  }

  if (categoria.includes("tomate")) {
    return "tomate";
  }

  if (
    categoria.includes("crucifero") ||
    categoria.includes("repolho") ||
    categoria.includes("brocolis") ||
    categoria.includes("couve flor") ||
    categoria.includes("couveflor")
  ) {
    return "crucifero";
  }

  if (
    categoria.includes("raiz") ||
    categoria.includes("cenoura") ||
    categoria.includes("beterraba") ||
    categoria.includes("batata") ||
    categoria.includes("abobora") ||
    categoria.includes("abobrinha") ||
    categoria.includes("chuchu") ||
    categoria.includes("mandioca") ||
    categoria.includes("aipim") ||
    categoria.includes("vagem")
  ) {
    return "raiz";
  }

  if (
    categoria.includes("folhoso") ||
    categoria.includes("alface") ||
    categoria.includes("rucula") ||
    categoria.includes("agriao") ||
    categoria.includes("acelga") ||
    categoria.includes("chicoria") ||
    categoria.includes("escarola") ||
    categoria.includes("espinafre") ||
    categoria.includes("couve manteiga") ||
    categoria.includes("yakissoba") ||
    categoria.includes("salada") ||
    categoria.includes("mista") ||
    categoria.includes("tropical") ||
    categoria.includes("arco") ||
    categoria.includes("mix")
  ) {
    return "folhoso";
  }

  if (SM[categoria]) {
    return categoria;
  }

  return "outros";

}

function obterCategoriaSetupProduto(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  const candidato =
    produto.categoriaSetup ??
    produto.categoriaOperacional ??
    produto.categoriaProduto ??
    produto.categoria ??
    produto.cat ??
    produto.tipoCategoria ??
    produto.grupoSetup ??
    rota.categoriaSetup ??
    rota.categoriaOperacional ??
    rota.categoria ??
    rota.cat ??
    obterFamiliaProduto(produto) ??
    obterNomeProduto(produto);

  const categoria =
    normalizarCategoriaSetup(candidato);

  return categoria || "outros";

}

function obterFamiliaProduto(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  return texto(
    produto.familiaSequenciamento ??
    produto.familiaOperacional ??
    produto.familiaSetup ??
    produto.classeSetup ??
    produto.familia ??
    produto.categoriaSetup ??
    rota.familiaSequenciamento ??
    rota.familiaOperacional ??
    rota.familiaSetup ??
    rota.classeSetup ??
    rota.familia ??
    "SEM FAMILIA"
  ).toUpperCase();

}

function normalizarZona(valor) {

  const zona =
    texto(valor)
      .replace(/Zona/gi, "")
      .replace(/\(espelho\)/gi, "")
      .replace(/_/g, " ")
      .replace(/\s*\/\s*/g, " / ")
      .replace(/\s+/g, " ")
      .trim();

  return zona || "-";

}

function obterZonaProduto(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  return normalizarZona(
    produto.zonaOperacional ??
    produto.zonasOperacionaisTexto ??
    produto.zona ??
    produto.zonasTexto ??
    rota.zonaOperacional ??
    rota.zona ??
    "-"
  ).toUpperCase();

}


function normalizarLinhaComparacao(valor) {

  return texto(valor)
    .toUpperCase()
    .replace(/LINHA\s+/g, "L")
    .replace(/[^A-Z0-9]/g, "")
    .trim();

}

function obterLinhaNegraProduto(produto = {}, linhaPadrao = "") {

  const rota =
    obterPrimeiraRota(produto);

  return texto(
    produto.srcLinha ??
    produto.linhaOrigemNegra ??
    produto.linhaNegra ??
    produto.linhaProcessamento ??
    rota.srcLinha ??
    rota.linhaOrigemNegra ??
    rota.linhaNegra ??
    rota.linhaProcessamento ??
    produto.linhaSequenciamento ??
    produto.linhaPlanejada ??
    produto.linhaCadastro ??
    produto.linhaPrincipal ??
    produto.linha ??
    linhaPadrao
  );

}

function produtoPertenceZonaNegra(produto = {}, nomeLinha = "") {

  const zona =
    obterZonaProduto(produto);

  /**
   * Regra do PDF da Ordem de Producao:
   * o documento operacional deve mostrar somente a Zona Negra.
   * Produtos que aparecem como BRANCA/CINZA sao etapas de embalagem
   * ou espelho e nao devem entrar neste PDF.
   */
  const zonaEhSomenteBrancaOuCinza =
    (zona.includes("BRANCA") || zona.includes("CINZA")) &&
    !zona.includes("NEGRA");

  if (zonaEhSomenteBrancaOuCinza) {
    return false;
  }

  const linhaNegra =
    normalizarLinhaComparacao(
      obterLinhaNegraProduto(produto, nomeLinha)
    );

  const linhaAtual =
    normalizarLinhaComparacao(nomeLinha);

  if (
    linhaNegra &&
    linhaAtual &&
    linhaNegra !== linhaAtual
  ) {
    return false;
  }

  return true;

}

function obterQuantidadeProduto(produto = {}) {

  return numero(
    produto.quantidadeCSV ??
    produto.demandaFinal ??
    produto.demandaReferencia ??
    produto.demanda ??
    produto.unidadeDia ??
    produto.unidades,
    0
  );

}

function obterKgProduto(produto = {}) {

  return numero(
    produto.kgPlanejado ??
    produto.kgTotal ??
    produto.kgDia ??
    produto.demandaKg ??
    produto.pesoLiquido ??
    produto.pesoBruto,
    0
  );

}

function obterTempoProducaoProduto(produto = {}) {

  const tempo =
    numero(
      produto.tempoProducaoPlanejadoMin ??
      produto.tempoProducaoMin ??
      produto.tempoPlanejadoMin ??
      produto.prodMin ??
      produto.tempoMin ??
      produto.tempo,
      0
    );

  if (tempo > 0) {
    return Math.max(1, Math.round(tempo));
  }

  const kg =
    obterKgProduto(produto);

  const kgHora =
    obterKgHoraProduto(produto);

  if (kg > 0 && kgHora > 0) {
    return Math.max(1, Math.ceil((kg / kgHora) * 60));
  }

  return 0;

}

function familiasSaoIguais(produtoAnterior = {}, produtoAtual = {}) {

  const familiaAnterior =
    normalizarTextoComparacao(
      obterFamiliaProduto(produtoAnterior)
    );

  const familiaAtual =
    normalizarTextoComparacao(
      obterFamiliaProduto(produtoAtual)
    );

  return Boolean(
    familiaAnterior &&
    familiaAtual &&
    familiaAnterior === familiaAtual
  );

}

function obterSetupInformadoProduto(produto = {}) {

  return Math.max(
    0,
    Math.round(
      numero(
        produto.setupAplicadoMin ??
        produto.setupMin ??
        produto.setupBaseMin ??
        produto.setupTrocaMin,
        0
      )
    )
  );

}

function obterSetupEntreProdutos(produtoAnterior, produtoAtual) {

  if (!produtoAnterior || !produtoAtual) {
    return 0;
  }

  if (
    familiasSaoIguais(
      produtoAnterior,
      produtoAtual
    )
  ) {
    return 0;
  }

  const categoriaAnterior =
    obterCategoriaSetupProduto(produtoAnterior);

  const categoriaAtual =
    obterCategoriaSetupProduto(produtoAtual);

  const setupMatriz =
    SM[categoriaAnterior]?.[categoriaAtual];

  if (Number.isFinite(setupMatriz)) {
    return Math.max(
      0,
      Math.round(setupMatriz)
    );
  }

  return obterSetupInformadoProduto(produtoAtual);

}

function obterKgHoraProduto(produto = {}) {

  const rota =
    obterPrimeiraRota(produto);

  const informado =
    numero(
      produto.produtividadeKgHora ??
      produto.kgHora ??
      produto.produtividade ??
      rota.produtividadeKgHora ??
      rota.kgHora ??
      rota.produtividade,
      0
    );

  if (informado > 0) {
    return informado;
  }

  const kg =
    obterKgProduto(produto);

  const tempoMin =
    numero(
      produto.tempoProducaoPlanejadoMin ??
      produto.tempoProducaoMin,
      0
    );

  if (kg > 0 && tempoMin > 0) {
    return kg / (tempoMin / 60);
  }

  return 0;

}

function ordenarLinhas(a, b) {

  const linhaA =
    texto(a.linha ?? a.nomeLinha ?? a.nome ?? a.id);

  const linhaB =
    texto(b.linha ?? b.nomeLinha ?? b.nome ?? b.id);

  const normalizar = valor => {

    const textoLinha = texto(valor).toUpperCase();

    if (textoLinha === "TOMATE" || textoLinha === "LT") {
      return 999;
    }

    const numeroLinha =
      Number(textoLinha.replace(/\D/g, ""));

    return Number.isFinite(numeroLinha)
      ? numeroLinha
      : 998;

  };

  return normalizar(linhaA) - normalizar(linhaB);

}

function normalizarLinhaFiltro(valor) {

  return texto(valor)
    .toUpperCase()
    .replace(/LINHA\s+/g, "L")
    .replace(/\s+/g, "")
    .trim();

}

function linhaFoiSelecionada(nomeLinha, opcoes = {}) {

  const selecionadas =
    Array.isArray(opcoes.linhasSelecionadas)
      ? opcoes.linhasSelecionadas
      : opcoes.linhaSelecionada
        ? [opcoes.linhaSelecionada]
        : [];

  if (selecionadas.length === 0) {
    return true;
  }

  const linhaNormalizada =
    normalizarLinhaFiltro(nomeLinha);

  return selecionadas
    .map(normalizarLinhaFiltro)
    .some(linha => linha === linhaNormalizada);

}

function montarLinhasPDF(planejamento, opcoes = {}) {

  const inicioTurnoMin =
    horaParaMinutos(opcoes.inicioTurno || "07:00");

  const linhas =
    Array.isArray(planejamento?.linhas)
      ? planejamento.linhas
        .slice()
        .filter(linha => {

          const nomeLinha =
            texto(linha.linha ?? linha.nomeLinha ?? linha.nome ?? linha.id);

          return linhaFoiSelecionada(
            nomeLinha,
            opcoes
          );

        })
        .sort(ordenarLinhas)
      : [];

  const resultado = [];

  linhas.forEach(linha => {

    const nomeLinha =
      texto(linha.linha ?? linha.nomeLinha ?? linha.nome ?? linha.id);

    const produtos =
      obterProdutosLinha(linha)
        .filter(produto => {

          if (
            !produtoPertenceZonaNegra(
              produto,
              nomeLinha
            )
          ) {
            return false;
          }

          return (
            obterQuantidadeProduto(produto) > 0 ||
            obterKgProduto(produto) > 0 ||
            obterTempoProducaoProduto(produto) > 0
          );

        });

    if (produtos.length === 0) {
      return;
    }

    let cursor =
      inicioTurnoMin;

    let totalSetupMin =
      0;

    const linhasProduto =
      produtos.map((produto, indice) => {

        const produtoAnterior =
          indice > 0
            ? produtos[indice - 1]
            : null;

        const setupMin =
          obterSetupEntreProdutos(
            produtoAnterior,
            produto
          );

        totalSetupMin += setupMin;

        cursor += setupMin;

        const inicio =
          cursor;

        const duracaoMin =
          obterTempoProducaoProduto(produto);

        const termino =
          inicio + duracaoMin;

        cursor =
          termino;

        return {
          seq: indice + 1,
          inicio,
          termino,
          duracaoMin,
          setupMin,
          codigo: obterCodigoProduto(produto),
          item: obterNomeProduto(produto),
          familia: obterFamiliaProduto(produto),
          zona: "NEGRA",
          linha: nomeLinha,
          quantidade: obterQuantidadeProduto(produto),
          kgDia: obterKgProduto(produto),
          kgHora: obterKgHoraProduto(produto),
          categoriaSetup: obterCategoriaSetupProduto(produto)
        };

      });

    const totalQuantidade =
      linhasProduto.reduce((soma, item) => soma + item.quantidade, 0);

    const totalKg =
      linhasProduto.reduce((soma, item) => soma + item.kgDia, 0);

    const totalProducaoMin =
      linhasProduto.reduce((soma, item) => soma + item.duracaoMin, 0);

    const totalTempoMin =
      totalProducaoMin + totalSetupMin;

    const kgHoraValidos =
      linhasProduto
        .map(item => item.kgHora)
        .filter(valor => numero(valor, 0) > 0);

    const mediaKgHora =
      kgHoraValidos.length > 0
        ? kgHoraValidos.reduce((soma, valor) => soma + numero(valor, 0), 0) / kgHoraValidos.length
        : 0;

    resultado.push({
      linha: nomeLinha,
      produtos: linhasProduto,
      totalQuantidade,
      totalKg,
      totalProducaoMin,
      totalSetupMin,
      totalTempoMin,
      mediaKgHora,
      inicio: linhasProduto[0]?.inicio ?? inicioTurnoMin,
      termino: linhasProduto[linhasProduto.length - 1]?.termino ?? inicioTurnoMin
    });

  });

  return resultado;

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
    ? `ordem_producao_jfc_${linha}_${data}_${hora}.pdf`
    : `ordem_producao_jfc_todas_linhas_${data}_${hora}.pdf`;

}

function adicionarCabecalho(doc, opcoes = {}) {

  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("JFC FLOW - ORDEM DE PRODUCAO", 10, 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const linhaPDF =
    opcoes.linhaSelecionada
      ? ` | Linha: ${opcoes.linhaSelecionada}`
      : " | Linhas: todas";

  doc.text(
    `Inicio: ${opcoes.inicioTurno || "07:00"}${linhaPDF} | Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    10,
    15
  );

}

function adicionarAssinaturaSupervisor(doc, opcoes = {}) {

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const margemInferior =
    24;

  let y =
    (doc.lastAutoTable?.finalY || 25) + 18;

  if (y > pageHeight - margemInferior) {
    doc.addPage("landscape");
    adicionarCabecalho(doc, opcoes);
    y = 60;
  }

  const linhaInicio =
    pageWidth / 2 - 45;

  const linhaFim =
    pageWidth / 2 + 45;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(linhaInicio, y, linhaFim, y);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Assinatura do Supervisor",
    pageWidth / 2,
    y + 6,
    {
      align: "center"
    }
  );

}

export async function gerarPdfOrdemProducao(
  planejamento,
  opcoes = {}
) {

  if (
    !planejamento ||
    !Array.isArray(planejamento.linhas) ||
    planejamento.linhas.length === 0
  ) {
    throw new Error("Nao existe planejamento sequenciado para gerar PDF.");
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

  const linhasPDF =
    montarLinhasPDF(
      planejamento,
      opcoes
    );

  if (linhasPDF.length === 0) {
    throw new Error(
      opcoes.linhaSelecionada
        ? `A linha ${opcoes.linhaSelecionada} nao possui produtos para gerar PDF.`
        : "Nenhuma linha com produto foi encontrada para gerar PDF."
    );
  }

  adicionarCabecalho(
    doc,
    opcoes
  );

  const head = [[
    "Início",
    "Término",
    "Duração",
    "Código",
    "Item",
    "Família",
    "Zona",
    "Linha",
    "Quantidade",
    "Kg/dia",
    "Kg/h",
    "Horário de início",
    "Horário de término",
    "Quantidade produzida"
  ]];

  const body = [];

  linhasPDF.forEach(linha => {

    body.push([
      {
        content:
          String(linha.linha || "").toUpperCase(),
        colSpan: 14,
        styles: {
          fillColor: [222, 218, 212],
          textColor: [26, 24, 20],
          fontStyle: "bold",
          fontSize: 9,
          halign: "left"
        }
      }
    ]);

    linha.produtos.forEach(item => {

      body.push([
        minutosParaHora(item.inicio),
        minutosParaHora(item.termino),
        formatarMinutos(item.duracaoMin),
        item.codigo || "-",
        item.item || "-",
        item.familia || "-",
        item.zona || "-",
        item.linha || "-",
        formatarNumero(item.quantidade),
        formatarKg(item.kgDia),
        formatarKgHora(item.kgHora),
        "",
        "",
        ""
      ]);

    });

    body.push([
      "",
      "",
      formatarMinutos(linha.totalTempoMin),
      "",
      `TOTAL ${String(linha.linha || "").toUpperCase()} | Produção: ${formatarMinutos(linha.totalProducaoMin)} | Setup: ${formatarMinutos(linha.totalSetupMin)}`,
      "",
      "",
      linha.linha || "-",
      formatarQuantidadeTotal(linha.totalQuantidade),
      formatarKg(linha.totalKg),
      formatarKgHora(linha.mediaKgHora),
      "",
      "",
      ""
    ]);

  });

  if (linhasPDF.length > 1) {

    const totalGeralQuantidade =
      linhasPDF.reduce((soma, linha) => soma + linha.totalQuantidade, 0);

    const totalGeralKg =
      linhasPDF.reduce((soma, linha) => soma + linha.totalKg, 0);

    const totalGeralTempo =
      linhasPDF.reduce((soma, linha) => soma + linha.totalTempoMin, 0);

    const totalGeralProducao =
      linhasPDF.reduce((soma, linha) => soma + linha.totalProducaoMin, 0);

    const totalGeralSetup =
      linhasPDF.reduce((soma, linha) => soma + linha.totalSetupMin, 0);

    const kgHoraGeral =
      linhasPDF.flatMap(linha =>
        linha.produtos
          .map(produto => produto.kgHora)
          .filter(valor => numero(valor, 0) > 0)
      );

    const mediaGeralKgHora =
      kgHoraGeral.length > 0
        ? kgHoraGeral.reduce((soma, valor) => soma + numero(valor, 0), 0) / kgHoraGeral.length
        : 0;

    body.push([
      "",
      "",
      formatarMinutos(totalGeralTempo),
      "",
      `TOTAL GERAL | Produção: ${formatarMinutos(totalGeralProducao)} | Setup: ${formatarMinutos(totalGeralSetup)}`,
      "",
      "",
      "Todas",
      formatarQuantidadeTotal(totalGeralQuantidade),
      formatarKg(totalGeralKg),
      formatarKgHora(mediaGeralKgHora),
      "",
      "",
      ""
    ]);

  }

  doc.autoTable({
    head,
    body,
    startY: 25,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 6.2,
      cellPadding: 1.15,
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
      fontSize: 6.2,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 13, halign: "center" },
      1: { cellWidth: 13, halign: "center" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 55 },
      5: { cellWidth: 19 },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 16 },
      8: { cellWidth: 18, halign: "right" },
      9: { cellWidth: 15, halign: "right" },
      10: { cellWidth: 17, halign: "right" },
      11: { cellWidth: 19, halign: "center" },
      12: { cellWidth: 19, halign: "center" },
      13: { cellWidth: 22, halign: "center" }
    },
    margin: {
      top: 25,
      right: 6,
      bottom: 20,
      left: 6
    },
    didParseCell: data => {

      if (data.section !== "body") {
        return;
      }

      const primeiraCelula =
        data.row.raw?.[0];

      const valorItem =
        texto(data.row.raw?.[4]);

      const ehCabecalhoLinha =
        primeiraCelula?.colSpan === 14;

      const ehTotal =
        valorItem.startsWith("TOTAL ");

      if (ehCabecalhoLinha) {
        return;
      }

      if (ehTotal) {
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [15, 23, 42];
        return;
      }

      data.cell.styles.fillColor = [255, 247, 246];

    },
    didDrawPage: data => {

      adicionarCabecalho(
        doc,
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

  adicionarAssinaturaSupervisor(
    doc,
    opcoes
  );

  const nomeArquivo =
    opcoes.nomeArquivo || gerarNomeArquivo(opcoes);

  doc.save(
    nomeArquivo
  );

  return {
    linhas:
      linhasPDF.length,

    produtos:
      linhasPDF.reduce((soma, linha) => soma + linha.produtos.length, 0),

    arquivo:
      nomeArquivo
  };

}
