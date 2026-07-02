/**
 * ======================================================
 * JFC FLOW
 * Módulo: txtImporter
 * Versão: 1.0.2
 *
 * Responsabilidade:
 * Ler o TXT oficial da fábrica e converter em uma
 * Base Técnica estruturada.
 *
 * Este arquivo NÃO vincula código do ERP.
 * O TXT não possui código.
 *
 * O vínculo Código ERP ↔ Produto TXT será feito depois
 * pelo sincronizador CSV + TXT.
 *
 * Regras importantes:
 *
 * 1. A numeração do TXT:
 *    1. Produto A
 *    2. Produto B
 *    3. Produto C
 *
 *    representa a ordem real de entrada do produto na linha.
 *
 * 2. A rota operacional:
 *    [N:L1→B/C:L6]
 *    [N:L1>B/C:L6]
 *    [N:L1-B/C:L6]
 *
 *    representa:
 *    - srcLinha: linha da Zona Negra
 *    - dstLinha: linha da Zona Branca/Cinza
 *    - rotaCruzada: true quando origem e destino são diferentes
 * ======================================================
 */

function parseNumero(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return 0;
  }

  const texto = String(valor)
    .trim()
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  return Number(texto) || 0;

}

function parseTempoParaMinutos(valor) {

  if (!valor) {
    return 0;
  }

  const texto = String(valor)
    .trim()
    .toLowerCase()
    .replace(/\s/g, "");

  if (texto.includes("<1min")) {
    return 1;
  }

  let total = 0;

  const horas =
    texto.match(/(\d+(?:\.\d+)?)h/);

  const minutos =
    texto.match(/(\d+(?:\.\d+)?)min/);

  if (horas) {
    total += Number(horas[1]) * 60;
  }

  if (minutos) {
    total += Number(minutos[1]);
  }

  if (
    !horas &&
    !minutos &&
    /^\d+(?:\.\d+)?$/.test(texto)
  ) {
    total = Number(texto);
  }

  return Math.round(total);

}

function normalizarLinha(nomeLinha) {

  const texto = String(nomeLinha || "")
    .trim()
    .toUpperCase();

  if (
    texto === "LT" ||
    texto.includes("TOMATE")
  ) {
    return "TOMATE";
  }

  const numero =
    texto.match(/(\d+)/);

  if (numero) {
    return `L${numero[1]}`;
  }

  return texto;

}

function normalizarDescricao(texto) {

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

}

function normalizarZonaOperacional(zona) {

  const texto = String(zona || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (texto.includes("NEGRA")) {
    return "NEGRA";
  }

  if (texto.includes("BRANCA")) {
    return "BRANCA";
  }

  if (texto.includes("CINZA")) {
    return "CINZA";
  }

  return texto || "SEM_ZONA";

}

function criarTransferenciaPadrao(linhaAtual) {

  const linha =
    normalizarLinha(linhaAtual);

  return {
    raw: null,

    valido: false,

    srcLinha: linha,

    dstLinha: linha,

    linhaOrigemNegra: linha,

    linhaDestinoBrancaCinza: linha,

    linhaOrigem: linha,

    linhaDestino: linha,

    rotaCruzada: false,

    zonaOrigem: "NEGRA",

    zonaDestino: "BRANCA_CINZA"
  };

}

function interpretarTransferencia(
  transferenciaRaw,
  linhaAtual
) {

  const padrao =
    criarTransferenciaPadrao(
      linhaAtual
    );

  const raw =
    String(transferenciaRaw || "")
      .trim();

  if (!raw) {
    return padrao;
  }

  /**
   * Formatos aceitos:
   *
   * N:L1→B/C:L6
   * N:L1>B/C:L6
   * N:L1-B/C:L6
   * N:L1->B/C:L6
   * N:L1 / B/C:L6
   * N:LT→B/C:L6
   * N:TOMATE→B/C:L6
   */
  const texto =
    raw
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/BC:/g, "B/C:");

  const match =
    texto.match(
      /N:([A-Z0-9]+)(?:→|->|>|-|\/)B\/?C:([A-Z0-9]+)/
    );

  if (!match) {

    return {
      ...padrao,

      raw,

      valido: false
    };

  }

  const srcLinha =
    normalizarLinha(
      match[1]
    );

  const dstLinha =
    normalizarLinha(
      match[2]
    );

  return {
    raw,

    valido: true,

    srcLinha,

    dstLinha,

    linhaOrigemNegra:
      srcLinha,

    linhaDestinoBrancaCinza:
      dstLinha,

    linhaOrigem:
      srcLinha,

    linhaDestino:
      dstLinha,

    rotaCruzada:
      srcLinha !== dstLinha,

    zonaOrigem:
      "NEGRA",

    zonaDestino:
      "BRANCA_CINZA"
  };

}

function extrairTransferencia(
  descricaoBruta,
  linhaAtual
) {

  const texto =
    String(descricaoBruta || "")
      .trim();

  const match =
    texto.match(/\s*\[([^\]]+)\]\s*$/);

  if (!match) {

    return {
      descricaoLimpa:
        texto,

      transferencia:
        criarTransferenciaPadrao(
          linhaAtual
        )
    };

  }

  const transferenciaRaw =
    match[1].trim();

  const descricaoLimpa =
    texto
      .replace(/\s*\[[^\]]+\]\s*$/, "")
      .trim();

  return {
    descricaoLimpa,

    transferencia:
      interpretarTransferencia(
        transferenciaRaw,
        linhaAtual
      )
  };

}

function extrairSequenciaENomeProdutoTXT(linha) {

  const texto =
    String(linha || "")
      .trim();

  const match =
    texto.match(/^(\d+)\.\s*(.+)$/);

  if (!match) {

    return {
      sequenciaTXT: null,
      nomeProdutoTXT: texto
    };

  }

  return {
    sequenciaTXT:
      Number(match[1]),

    nomeProdutoTXT:
      match[2].trim()
  };

}

function criarIdTecnico(produto) {

  return [
    produto.linha,
    produto.zona,
    produto.ordemLinhaTXT,
    produto.srcLinha,
    produto.dstLinha,
    produto.descricaoNormalizada
  ].join("|");

}

function ehLinhaResumo(linha) {

  return /^▶\s+(?:LINHA\s+)?(.+?)\s+[—-]\s+(.+)$/i
    .test(linha);

}

function ehLinhaZona(linha) {

  return /^\[(.+?)\]$/
    .test(linha);

}

function ehLinhaProduto(linha) {

  return /^(\d+)\.\s+(.+)$/
    .test(linha);

}

function ehLinhaDetalhe(linha) {

  return /^([\d.,]+)u\/dia\s*\|\s*([\d.,]+)kg\/dia\s*\|\s*([\d.,]+)kg\/h\s*\|\s*Setup:([^|]+)\|\s*Prod:([^|]+)\|\s*Acum:(.+)$/i
    .test(linha);

}

function ehLinhaEstrutural(linha) {

  return (
    ehLinhaResumo(linha) ||
    ehLinhaZona(linha) ||
    ehLinhaProduto(linha) ||
    ehLinhaDetalhe(linha)
  );

}

/**
 * Importa o TXT da fábrica.
 *
 * Retorno:
 *
 * {
 *   meta,
 *   linhasResumo,
 *   produtosTecnicos,
 *   linhasNaoInterpretadas,
 *   estatisticas
 * }
 */
export function importarTXT(conteudoTXT) {

  const linhasArquivo =
    String(conteudoTXT || "")
      .split(/\r?\n/);

  const produtosTecnicos = [];

  const linhasResumo = [];

  const linhasNaoInterpretadas = [];

  const linhasNaoVazias =
    linhasArquivo
      .map(linha => linha.trim())
      .filter(Boolean);

  const meta = {

    titulo:
      linhasNaoVazias[0] || "",

    referencia:
      linhasNaoVazias[1] || "",

    totalLinhasArquivo:
      linhasArquivo.length

  };

  let linhaAtual = null;

  let linhaOriginalAtual = null;

  let zonaAtual = null;

  let produtoPendente = null;

  for (
    let i = 0;
    i < linhasArquivo.length;
    i++
  ) {

    const raw =
      linhasArquivo[i];

    const linha =
      raw.trim();

    if (!linha) {
      continue;
    }

    if (/^(=|-){5,}$/.test(linha)) {
      continue;
    }

    /**
     * O TXT real geralmente tem título e referência nas duas primeiras linhas.
     * Mas em testes pequenos, a primeira linha pode ser:
     * ▶ LINHA 1 ...
     *
     * Por isso só pulamos título/referência se a linha NÃO for estrutural.
     */
    if (
      (
        linha === meta.titulo ||
        linha === meta.referencia
      ) &&
      !ehLinhaEstrutural(linha)
    ) {
      continue;
    }

    /**
     * Exemplo:
     * ▶ LINHA 2 — 1.5k u/dia | 15.7t kg/dia
     * ▶ TOMATE — ...
     */
    const matchLinha =
      linha.match(
        /^▶\s+(?:LINHA\s+)?(.+?)\s+[—-]\s+(.+)$/i
      );

    if (matchLinha) {

      linhaOriginalAtual =
        matchLinha[1].trim();

      linhaAtual =
        normalizarLinha(
          linhaOriginalAtual
        );

      zonaAtual =
        null;

      produtoPendente =
        null;

      linhasResumo.push({

        linha:
          linhaAtual,

        linhaOriginal:
          linhaOriginalAtual,

        resumo:
          matchLinha[2].trim(),

        raw

      });

      continue;

    }

    /**
     * Exemplo:
     * [Zona Negra]
     * [Zona Branca]
     * [Zona Cinza (espelho)]
     */
    const matchZona =
      linha.match(/^\[(.+?)\]$/);

    if (matchZona) {

      zonaAtual =
        matchZona[1].trim();

      produtoPendente =
        null;

      continue;

    }

    /**
     * Exemplo:
     * 1. TIRAS DE ALFACE AMERICANA JFC
     * 2. CEBOLA FATIADA 200G [N:L1→B/C:L6]
     */
    const matchProduto =
      linha.match(/^(\d+)\.\s+(.+)$/);

    if (
      matchProduto &&
      linhaAtual &&
      zonaAtual
    ) {

      const dadosProdutoTXT =
        extrairSequenciaENomeProdutoTXT(
          linha
        );

      const sequenciaTXT =
        dadosProdutoTXT.sequenciaTXT;

      const descricaoBruta =
        dadosProdutoTXT.nomeProdutoTXT;

      const {
        descricaoLimpa,
        transferencia
      } =
        extrairTransferencia(
          descricaoBruta,
          linhaAtual
        );

      const zonaOperacional =
        normalizarZonaOperacional(
          zonaAtual
        );

      produtoPendente = {

        linhaArquivo:
          i + 1,

        /**
         * Linha da seção do TXT.
         */
        linha:
          linhaAtual,

        linhaOriginal:
          linhaOriginalAtual,

        zona:
          zonaAtual,

        zonaOperacional,

        /**
         * Ordem real do TXT.
         */
        sequencia:
          sequenciaTXT,

        sequenciaTXT:
          sequenciaTXT,

        ordemTXT:
          sequenciaTXT,

        ordemLinhaTXT:
          sequenciaTXT,

        codigo:
          null,

        descricaoTXT:
          descricaoLimpa,

        descricaoTXTBruta:
          descricaoBruta,

        descricaoNormalizada:
          normalizarDescricao(
            descricaoLimpa
          ),

        /**
         * Rota operacional real.
         */
        transferencia,

        srcLinha:
          transferencia.srcLinha,

        dstLinha:
          transferencia.dstLinha,

        linhaOrigemNegra:
          transferencia.linhaOrigemNegra,

        linhaDestinoBrancaCinza:
          transferencia.linhaDestinoBrancaCinza,

        linhaOrigem:
          transferencia.linhaOrigem,

        linhaDestino:
          transferencia.linhaDestino,

        rotaCruzada:
          transferencia.rotaCruzada,

        zonaOrigem:
          transferencia.zonaOrigem,

        zonaDestino:
          transferencia.zonaDestino,

        transferenciaValida:
          transferencia.valido,

        rawProduto:
          raw

      };

      continue;

    }

    /**
     * Exemplo:
     * 1284u/dia | 14565.9kg/dia | 2160kg/h | Setup:0min | Prod:6h45min | Acum:6h45min
     */
    const matchDetalhe =
      linha.match(
        /^([\d.,]+)u\/dia\s*\|\s*([\d.,]+)kg\/dia\s*\|\s*([\d.,]+)kg\/h\s*\|\s*Setup:([^|]+)\|\s*Prod:([^|]+)\|\s*Acum:(.+)$/i
      );

    if (
      matchDetalhe &&
      produtoPendente
    ) {

      const setupTexto =
        matchDetalhe[4].trim();

      const prodTexto =
        matchDetalhe[5].trim();

      const acumTexto =
        matchDetalhe[6].trim();

      const produtoTecnico = {

        ...produtoPendente,

        unidadeDia:
          parseNumero(
            matchDetalhe[1]
          ),

        kgDia:
          parseNumero(
            matchDetalhe[2]
          ),

        produtividadeKgHora:
          parseNumero(
            matchDetalhe[3]
          ),

        setupTexto,

        setupMin:
          parseTempoParaMinutos(
            setupTexto
          ),

        prodTexto,

        tempoProducaoMin:
          parseTempoParaMinutos(
            prodTexto
          ),

        acumTexto,

        acumuladoMin:
          parseTempoParaMinutos(
            acumTexto
          ),

        ativo:
          true,

        origem: {
          txt: true
        },

        rawDetalhe:
          raw

      };

      produtoTecnico.idTecnico =
        criarIdTecnico(
          produtoTecnico
        );

      produtosTecnicos.push(
        produtoTecnico
      );

      produtoPendente =
        null;

      continue;

    }

    linhasNaoInterpretadas.push({

      numero:
        i + 1,

      conteudo:
        raw

    });

  }

  return {

    meta,

    linhasResumo,

    produtosTecnicos,

    linhasNaoInterpretadas,

    estatisticas: {

      totalProdutosTecnicos:
        produtosTecnicos.length,

      totalLinhasProducao:
        linhasResumo.length,

      totalLinhasNaoInterpretadas:
        linhasNaoInterpretadas.length

    }

  };

}