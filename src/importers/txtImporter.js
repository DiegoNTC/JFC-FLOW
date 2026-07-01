/**
 * ======================================================
 * JFC FLOW
 * Módulo: txtImporter
 * Versão: 1.0.1
 *
 * Responsabilidade:
 * Ler o TXT oficial da fábrica e converter em produtos técnicos.
 *
 * Regra importante:
 * A numeração do TXT:
 * 1. Produto A
 * 2. Produto B
 * 3. Produto C
 *
 * representa a ordem real de entrada do produto na linha.
 * Essa ordem será salva como:
 * - sequencia
 * - sequenciaTXT
 * - ordemTXT
 * - ordemLinhaTXT
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

  const horas = texto.match(/(\d+(?:\.\d+)?)h/);

  const minutos = texto.match(/(\d+(?:\.\d+)?)min/);

  if (horas) {

    total +=
      Number(horas[1]) * 60;

  }

  if (minutos) {

    total +=
      Number(minutos[1]);

  }

  if (
    !horas &&
    !minutos &&
    /^\d+(?:\.\d+)?$/.test(texto)
  ) {

    total =
      Number(texto);

  }

  return Math.round(
    total
  );

}

function normalizarLinha(nomeLinha) {

  const texto = String(nomeLinha || "")
    .trim()
    .toUpperCase();

  const numero = texto.match(/(\d+)/);

  if (numero) {
    return `L${numero[1]}`;
  }

  if (
    texto.includes("TOMATE") ||
    texto === "LT"
  ) {
    return "TOMATE";
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

function extrairTransferencia(descricaoBruta) {

  const texto =
    String(descricaoBruta || "").trim();

  const match =
    texto.match(/\s*\[([^\]]+)\]\s*$/);

  if (!match) {

    return {
      descricaoLimpa: texto,
      transferencia: null
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
    transferencia: {
      raw: transferenciaRaw
    }
  };

}

function extrairSequenciaENomeProdutoTXT(
  linha
) {

  const texto =
    String(linha || "").trim();

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
    produto.descricaoNormalizada
  ].join("|");

}

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

    if (
      linha === meta.titulo ||
      linha === meta.referencia
    ) {
      continue;
    }

    /**
     * Exemplo:
     * ▶ LINHA 2 — 1.5k u/dia | 15.7t kg/dia
     */
    const matchLinha =
      linha.match(
        /^▶\s+(?:LINHA\s+)?(.+?)\s+—\s+(.+)$/i
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
     * 1. CEBOLA BRANCA TIRAS MC CX 4KG 4PCT 1KG
     *
     * O número antes do ponto é a ordem real de entrada na linha.
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
          descricaoBruta
        );

      produtoPendente = {

        linhaArquivo:
          i + 1,

        linha:
          linhaAtual,

        linhaOriginal:
          linhaOriginalAtual,

        zona:
          zonaAtual,

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

        transferencia,

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