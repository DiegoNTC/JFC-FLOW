import { inferirFamiliaSetup } from "./familiaSetupService.js";

/**
 * ======================================================
 * JFC FLOW
 * Módulo: geradorPlanejamentoReal
 * Versão: 1.1.0
 *
 * Responsabilidade:
 * Gerar o planejamento real com base no CSV do dia,
 * no TXT técnico da fábrica e no Cadastro Mestre.
 *
 * Regras principais:
 * - CSV = quantidade/demanda do dia.
 * - TXT = base técnica real: linha técnica, ordem, tempo,
 *   produtividade, setup, zona e rota operacional.
 * - Cadastro Mestre = regra validada pelo PCP.
 *
 * Correção importante:
 * quantidadeCSV não é kg.
 * kgPlanejado = quantidadeCSV × kgPorUnidadeTXT.
 *
 * O Cadastro Mestre pode definir:
 * - linhaSequenciamento
 * - familiaSequenciamento
 * - usarLinhaCadastro
 * - linhasPermitidas
 *
 * Mesmo quando a linha de sequenciamento vem do cadastro,
 * os dados técnicos do TXT continuam preservados no produto.
 * ======================================================
 */

function numero(valor) {

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

function texto(valor) {

  return String(valor ?? "")
    .trim();

}

function normalizarLinha(linha) {

  const valor =
    texto(linha)
      .toUpperCase();

  if (
    valor === "LT" ||
    valor.includes("TOMATE")
  ) {
    return "TOMATE";
  }

  const numeroLinha =
    valor.match(/(\d+)/);

  if (numeroLinha) {
    return `L${numeroLinha[1]}`;
  }

  return valor || "Sem linha";

}

function normalizarZonaOperacional(zona) {

  const valor =
    texto(zona)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  if (valor.includes("NEGRA")) {
    return "NEGRA";
  }

  if (valor.includes("BRANCA")) {
    return "BRANCA";
  }

  if (valor.includes("CINZA")) {
    return "CINZA";
  }

  return valor || "SEM_ZONA";

}

function normalizarFamilia(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

function obterOrdemTXTRota(rota) {

  return numero(
    rota?.ordemLinhaTXT ??
    rota?.ordemTXT ??
    rota?.sequenciaTXT ??
    rota?.sequencia ??
    rota?.sequenciaPrincipal ??
    0
  );

}

function obterMenorSequenciaValida(sequencias = []) {

  const validas =
    sequencias
      .map(numero)
      .filter(valor => valor > 0);

  if (validas.length === 0) {
    return 0;
  }

  return Math.min(
    ...validas
  );

}

function obterOrdemProdutoPlanejado(produto) {

  return numero(
    produto?.ordemLinhaTXT ??
    produto?.ordemTXT ??
    produto?.sequenciaTXT ??
    produto?.sequenciaPrincipal ??
    0
  );

}

function obterTransferenciaRota(rota = {}) {

  const transferencia =
    rota.transferencia || {};

  const linhaBase =
    normalizarLinha(
      rota.linha ||
      rota.linhaPrincipal ||
      rota.linhaPlanejada ||
      ""
    );

  const srcLinha =
    normalizarLinha(
      rota.srcLinha ??
      rota.linhaOrigemNegra ??
      rota.linhaOrigem ??
      transferencia.srcLinha ??
      transferencia.linhaOrigemNegra ??
      transferencia.linhaOrigem ??
      linhaBase
    );

  const dstLinha =
    normalizarLinha(
      rota.dstLinha ??
      rota.linhaDestinoBrancaCinza ??
      rota.linhaDestino ??
      transferencia.dstLinha ??
      transferencia.linhaDestinoBrancaCinza ??
      transferencia.linhaDestino ??
      linhaBase
    );

  const rotaCruzada =
    srcLinha &&
    dstLinha &&
    srcLinha !== dstLinha;

  return {
    raw:
      transferencia.raw ??
      rota.transferenciaRaw ??
      null,

    valido:
      Boolean(
        rota.transferenciaValida ??
        transferencia.valido ??
        false
      ),

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

    rotaCruzada,

    zonaOrigem:
      rota.zonaOrigem ??
      transferencia.zonaOrigem ??
      "NEGRA",

    zonaDestino:
      rota.zonaDestino ??
      transferencia.zonaDestino ??
      "BRANCA_CINZA"
  };

}

function ordenarLinhas(a, b) {

  const linhaA = a.linha;
  const linhaB = b.linha;

  if (linhaA === "TOMATE") {
    return 1;
  }

  if (linhaB === "TOMATE") {
    return -1;
  }

  const numA =
    Number(
      String(linhaA)
        .replace(/\D/g, "")
    );

  const numB =
    Number(
      String(linhaB)
        .replace(/\D/g, "")
    );

  if (
    !Number.isNaN(numA) &&
    !Number.isNaN(numB)
  ) {
    return numA - numB;
  }

  return String(linhaA)
    .localeCompare(
      String(linhaB),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

}

function normalizarListaLinhas(lista) {

  if (!Array.isArray(lista)) {
    return [];
  }

  return Array.from(
    new Set(
      lista
        .filter(Boolean)
        .map(normalizarLinha)
        .filter(Boolean)
    )
  );

}

function extrairLinhasPermitidas(produtoMestre) {

  const rotas =
    produtoMestre.rotasTecnicas || [];

  const linhasCadastro =
    normalizarListaLinhas(
      produtoMestre.linhasPermitidas ||
      produtoMestre.linhasAlternativas ||
      []
    );

  const linhasTecnicas =
    rotas
      .flatMap(rota => {

        const transferencia =
          obterTransferenciaRota(
            rota
          );

        return [
          rota.linha,
          rota.linhaPrincipal,
          transferencia.srcLinha,
          transferencia.dstLinha
        ];

      })
      .filter(Boolean)
      .map(normalizarLinha);

  return Array.from(
    new Set([
      ...linhasCadastro,
      ...linhasTecnicas
    ])
  );

}

function linhaEstaPermitida(linha, linhasPermitidas) {

  if (
    !Array.isArray(linhasPermitidas) ||
    linhasPermitidas.length === 0
  ) {
    return true;
  }

  return linhasPermitidas.includes(
    normalizarLinha(linha)
  );

}

function linhaNormalizadaEhValida(linha) {

  const valor =
    texto(linha);

  return Boolean(
    valor &&
    valor !== "Sem linha" &&
    valor.toUpperCase() !== "SEM LINHA"
  );

}

function obterLinhaCadastroMestre(produtoMestre = {}) {

  /**
   * Regra operacional do PCP:
   * A linha de sequenciamento cadastrada no Cadastro Mestre
   * é a linha onde o produto deve aparecer no Sequenciamento
   * por Família.
   *
   * Antes, o sistema só usava essa linha se
   * usarLinhaCadastro estivesse marcado. Isso fazia alguns produtos
   * continuarem presos à linha técnica do TXT.
   *
   * Agora, se linhaSequenciamento estiver preenchida, ela tem
   * prioridade para o sequenciamento.
   */

  const linhaCadastro =
    normalizarLinha(
      produtoMestre.linhaSequenciamento ||
      produtoMestre.linhaPlanejada ||
      produtoMestre.linhaCadastro ||
      ""
    );

  if (linhaNormalizadaEhValida(linhaCadastro)) {
    return linhaCadastro;
  }

  const linhaPrincipalCadastro =
    normalizarLinha(
      produtoMestre.linhaPrincipal ||
      produtoMestre.linhaTXT ||
      ""
    );

  if (linhaNormalizadaEhValida(linhaPrincipalCadastro)) {
    return linhaPrincipalCadastro;
  }

  return "";

}

function obterLinhaSequenciamento(
  produtoMestre,
  linhaTecnica,
  linhasPermitidas
) {

  const linhaCadastroMestre =
    obterLinhaCadastroMestre(
      produtoMestre
    );

  if (linhaCadastroMestre) {
    return linhaCadastroMestre;
  }

  const linhaTecnicaNormalizada =
    normalizarLinha(
      linhaTecnica ||
      ""
    );

  if (linhaNormalizadaEhValida(linhaTecnicaNormalizada)) {
    return linhaTecnicaNormalizada;
  }

  const primeiraLinhaPermitida =
    normalizarLinha(
      linhasPermitidas?.[0] ||
      ""
    );

  if (linhaNormalizadaEhValida(primeiraLinhaPermitida)) {
    return primeiraLinhaPermitida;
  }

  return "Sem linha";

}

function obterFamiliaSetupTecnica(produtoMestre, rota = {}) {

  return normalizarFamilia(
    produtoMestre.familiaSetup ||
    produtoMestre.classeSetup ||
    produtoMestre.grupoSetup ||
    produtoMestre.categoriaSetup ||
    rota.familiaSetup ||
    rota.classeSetup ||
    rota.grupoSetup ||
    rota.categoriaSetup ||
    ""
  );

}

function obterFamiliaSequenciamento(produtoMestre, rota = {}) {

  /**
   * Regra importante:
   * familiaSequenciamento é a família operacional usada para agrupar
   * os blocos no sequenciamento. Ela não deve herdar automaticamente
   * familiaSetup/classeSetup quando o PCP não preencheu esse campo.
   *
   * Motivo: familiaSetup é técnica e pode vir ampla ou contaminada por
   * cadastro antigo. Foi isso que permitiu produtos como CHICÓRIA e
   * ALFACE ROMANA aparecerem dentro do bloco RÚCULA.
   *
   * Prioridade correta:
   * 1) família operacional explicitamente cadastrada pelo PCP;
   * 2) família operacional da rota, se existir;
   * 3) inferência segura pelo nome do produto;
   * 4) fallback técnico apenas em último caso.
   */

  const familiaOperacionalCadastro =
    normalizarFamilia(
      produtoMestre.familiaSequenciamento ||
      produtoMestre.familiaOperacional ||
      ""
    );

  if (familiaOperacionalCadastro) {
    return familiaOperacionalCadastro;
  }

  const familiaOperacionalRota =
    normalizarFamilia(
      rota.familiaSequenciamento ||
      rota.familiaOperacional ||
      ""
    );

  if (familiaOperacionalRota) {
    return familiaOperacionalRota;
  }

  const familiaInferidaNome =
    normalizarFamilia(
      inferirFamiliaSetup(
        produtoMestre.nomeOficial ||
        produtoMestre.descricaoCSV ||
        produtoMestre.descricaoTXT ||
        produtoMestre.produto ||
        produtoMestre.descricao ||
        ""
      )
    );

  if (familiaInferidaNome) {
    return familiaInferidaNome;
  }

  return obterFamiliaSetupTecnica(
    produtoMestre,
    rota
  ) || "SEM FAMÍLIA";

}

function calcularKgPorUnidadeTXT(rota = {}, produtoMestre = {}) {

  const kgPorUnidadeDireto =
    numero(
      rota.kgPorUnidadeTXT ??
      rota.kgPorUnidade ??
      rota.pesoUnitarioKg ??
      produtoMestre.kgPorUnidadeTXT ??
      produtoMestre.kgPorUnidade ??
      produtoMestre.pesoUnitarioKg
    );

  if (kgPorUnidadeDireto > 0) {
    return kgPorUnidadeDireto;
  }

  const kgDia =
    numero(
      rota.kgDia ??
      produtoMestre.kgDia
    );

  const unidadeDia =
    numero(
      rota.unidadeDia ??
      produtoMestre.unidadeDia
    );

  if (
    kgDia > 0 &&
    unidadeDia > 0
  ) {
    return kgDia / unidadeDia;
  }

  return 0;

}

function calcularTempoPorKg(
  kgPlanejado,
  produtividadeKgHora
) {

  if (
    kgPlanejado <= 0 ||
    produtividadeKgHora <= 0
  ) {
    return 0;
  }

  return Math.ceil(
    (kgPlanejado / produtividadeKgHora) * 60
  );

}

function agruparRotasPorLinha(rotas) {

  const mapa = new Map();

  rotas.forEach(rota => {

    const transferencia =
      obterTransferenciaRota(
        rota
      );

    const linha =
      normalizarLinha(
        rota.linha ||
        transferencia.srcLinha ||
        transferencia.dstLinha ||
        "Sem linha"
      );

    if (!mapa.has(linha)) {
      mapa.set(linha, []);
    }

    mapa.get(linha).push(rota);

  });

  return mapa;

}

function calcularTempoBaseDaLinha(rotas) {

  let maiorTempoMin = 0;

  let maiorSetupMin = 0;

  let maiorProdutividade = 0;

  let menorSequencia = Infinity;

  rotas.forEach(rota => {

    maiorTempoMin = Math.max(
      maiorTempoMin,
      numero(rota.tempoProducaoMin)
    );

    maiorSetupMin = Math.max(
      maiorSetupMin,
      numero(rota.setupMin)
    );

    maiorProdutividade = Math.max(
      maiorProdutividade,
      numero(rota.produtividadeKgHora)
    );

    const sequencia =
      obterOrdemTXTRota(
        rota
      );

    if (sequencia > 0) {
      menorSequencia = Math.min(
        menorSequencia,
        sequencia
      );
    }

  });

  return {

    tempoBaseMin:
      maiorTempoMin,

    setupBaseMin:
      maiorSetupMin,

    produtividadeKgHora:
      maiorProdutividade,

    sequenciaPrincipal:
      menorSequencia === Infinity
        ? 0
        : menorSequencia

  };

}

function selecionarLinhaPrincipal(produtoMestre) {

  const rotas =
    produtoMestre.rotasTecnicas || [];

  const rotasPorLinha =
    agruparRotasPorLinha(rotas);

  const candidatas =
    Array.from(rotasPorLinha.entries())
      .map(([linha, rotasLinha]) => {

        const base =
          calcularTempoBaseDaLinha(rotasLinha);

        return {

          linha,

          rotas:
            rotasLinha,

          ...base

        };

      });

  if (candidatas.length === 0) {
    return null;
  }

  candidatas.sort((a, b) => {

    if (a.sequenciaPrincipal !== b.sequenciaPrincipal) {
      return a.sequenciaPrincipal - b.sequenciaPrincipal;
    }

    if (a.produtividadeKgHora !== b.produtividadeKgHora) {
      return b.produtividadeKgHora - a.produtividadeKgHora;
    }

    return a.tempoBaseMin - b.tempoBaseMin;

  });

  return candidatas[0];

}

function criarProdutoPlanejado(produtoMestre, rota) {

  const quantidadeCSV =
    numero(
      produtoMestre.quantidadeCSV ??
      produtoMestre.demandaFinal ??
      produtoMestre.demandaReferencia
    );

  const unidadeBaseTXT =
    numero(
      rota.unidadeDia ??
      produtoMestre.unidadeDia
    );

  const kgDiaTXT =
    numero(
      rota.kgDia ??
      produtoMestre.kgDia
    );

  const kgPorUnidadeTXT =
    calcularKgPorUnidadeTXT(
      rota,
      produtoMestre
    );

  const kgPlanejado =
    quantidadeCSV * kgPorUnidadeTXT;

  const tempoBaseTXTMin =
    numero(rota.tempoProducaoMin);

  const tempoUnitarioMin =
    unidadeBaseTXT > 0
      ? tempoBaseTXTMin / unidadeBaseTXT
      : 0;

  const produtividadeKgHora =
    numero(
      rota.produtividadeKgHora ??
      produtoMestre.produtividadeKgHora
    );

  const ordemTXT =
    obterOrdemTXTRota(
      rota
    );

  const transferencia =
    obterTransferenciaRota(
      rota
    );

  const zonaOperacional =
    normalizarZonaOperacional(
      rota.zonaOperacional ??
      rota.zona
    );

  const linhaTecnica =
    normalizarLinha(
      rota.linha || "Sem linha"
    );

  const linhasPermitidas =
    extrairLinhasPermitidas(
      produtoMestre
    );

  const linhaSequenciamento =
    obterLinhaSequenciamento(
      produtoMestre,
      linhaTecnica,
      linhasPermitidas
    );

  const familiaSequenciamento =
    obterFamiliaSequenciamento(
      produtoMestre,
      rota
    );

  const familiaSetupTecnica =
    obterFamiliaSetupTecnica(
      produtoMestre,
      rota
    ) || familiaSequenciamento;

  return {

    codigo:
      produtoMestre.codigo,

    nomeOficial:
      produtoMestre.nomeOficial,

    descricaoCSV:
      produtoMestre.descricaoCSV,

    descricaoTXT:
      produtoMestre.descricaoTXT,

    linha:
      linhaSequenciamento,

    linhaSequenciamento,

    linhaPlanejada:
      linhaSequenciamento,

    linhaTecnica,

    linhaTXT:
      linhaTecnica,

    linhaPrincipalTecnica:
      linhaTecnica,

    familiaSequenciamento,

    familiaSetup:
      familiaSetupTecnica,

    familiaSetupTecnica,

    classeSetup:
      familiaSetupTecnica,

    sequenciaTXT:
      ordemTXT,

    ordemTXT:
      ordemTXT,

    ordemLinhaTXT:
      ordemTXT,

    zonaOperacional,

    transferencia,

    transferenciaValida:
      transferencia.valido,

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

    leadTimeMin:
      numero(
        rota.leadTimeMin ??
        rota.leadTime ??
        produtoMestre.leadTimeMin ??
        10
      ),

    linhasPermitidas,

    rotasTecnicasProduto:
      produtoMestre.rotasTecnicas || [],

    zonas: new Set([
      rota.zona || ""
    ]),

    zonasOperacionais: new Set([
      zonaOperacional
    ]),

    sequencias: [
      ordemTXT
    ],

    quantidadeCSV,

    demandaFinal:
      quantidadeCSV,

    demandaReferencia:
      quantidadeCSV,

    unidadeBaseTXT,

    kgDiaTXT,

    kgPorUnidadeTXT,

    kgPlanejado,

    tempoBaseTXTMin,

    tempoUnitarioMin,

    setupMin:
      numero(rota.setupMin),

    setupTrocaMin:
      numero(rota.setupMin),

    setupBaseMin:
      numero(rota.setupMin),

    produtividadeKgHora,

    etapasTecnicas:
      1,

    rotasOriginais: [
      rota
    ],

    rotasOperacionais: [
      {
        linha:
          linhaTecnica,

        linhaSequenciamento,

        zona:
          rota.zona || "",

        zonaOperacional,

        ordemTXT,

        srcLinha:
          transferencia.srcLinha,

        dstLinha:
          transferencia.dstLinha,

        linhaOrigemNegra:
          transferencia.linhaOrigemNegra,

        linhaDestinoBrancaCinza:
          transferencia.linhaDestinoBrancaCinza,

        rotaCruzada:
          transferencia.rotaCruzada,

        transferenciaValida:
          transferencia.valido,

        transferencia,

        setupMin:
          numero(rota.setupMin),

        tempoProducaoMin:
          numero(rota.tempoProducaoMin),

        produtividadeKgHora,

        unidadeDia:
          unidadeBaseTXT,

        kgDia:
          kgDiaTXT,

        kgPorUnidadeTXT,

        leadTimeMin:
          numero(
            rota.leadTimeMin ??
            rota.leadTime ??
            produtoMestre.leadTimeMin ??
            10
          )
      }
    ]

  };

}

function mesclarRota(produtoPlanejado, rota) {

  produtoPlanejado.zonas.add(
    rota.zona || ""
  );

  const ordemTXT =
    obterOrdemTXTRota(
      rota
    );

  const transferencia =
    obterTransferenciaRota(
      rota
    );

  const zonaOperacional =
    normalizarZonaOperacional(
      rota.zonaOperacional ??
      rota.zona
    );

  produtoPlanejado.zonasOperacionais.add(
    zonaOperacional
  );

  produtoPlanejado.sequencias.push(
    ordemTXT
  );

  const menorOrdemAtual =
    obterMenorSequenciaValida(
      produtoPlanejado.sequencias
    );

  produtoPlanejado.sequenciaTXT =
    menorOrdemAtual;

  produtoPlanejado.ordemTXT =
    menorOrdemAtual;

  produtoPlanejado.ordemLinhaTXT =
    menorOrdemAtual;

  produtoPlanejado.transferenciaValida =
    produtoPlanejado.transferenciaValida ||
    transferencia.valido;

  produtoPlanejado.rotaCruzada =
    produtoPlanejado.rotaCruzada ||
    transferencia.rotaCruzada;

  if (transferencia.valido) {

    produtoPlanejado.transferencia =
      transferencia;

    produtoPlanejado.srcLinha =
      transferencia.srcLinha;

    produtoPlanejado.dstLinha =
      transferencia.dstLinha;

    produtoPlanejado.linhaOrigemNegra =
      transferencia.linhaOrigemNegra;

    produtoPlanejado.linhaDestinoBrancaCinza =
      transferencia.linhaDestinoBrancaCinza;

    produtoPlanejado.linhaOrigem =
      transferencia.linhaOrigem;

    produtoPlanejado.linhaDestino =
      transferencia.linhaDestino;

    produtoPlanejado.zonaOrigem =
      transferencia.zonaOrigem;

    produtoPlanejado.zonaDestino =
      transferencia.zonaDestino;

  }

  produtoPlanejado.leadTimeMin = Math.max(
    numero(produtoPlanejado.leadTimeMin),
    numero(
      rota.leadTimeMin ??
      rota.leadTime ??
      10
    )
  );

  const linhaTecnica =
    normalizarLinha(
      rota.linha || "Sem linha"
    );

  const unidadeBaseTXT =
    numero(rota.unidadeDia);

  const kgDiaTXT =
    numero(rota.kgDia);

  const kgPorUnidadeTXT =
    calcularKgPorUnidadeTXT(
      rota,
      produtoPlanejado
    );

  const tempoBaseTXTMin =
    numero(rota.tempoProducaoMin);

  const tempoUnitarioMin =
    unidadeBaseTXT > 0
      ? tempoBaseTXTMin / unidadeBaseTXT
      : 0;

  const produtividadeKgHora =
    numero(rota.produtividadeKgHora);

  produtoPlanejado.rotasOperacionais.push({
    linha:
      linhaTecnica,

    linhaSequenciamento:
      produtoPlanejado.linhaSequenciamento,

    zona:
      rota.zona || "",

    zonaOperacional,

    ordemTXT,

    srcLinha:
      transferencia.srcLinha,

    dstLinha:
      transferencia.dstLinha,

    linhaOrigemNegra:
      transferencia.linhaOrigemNegra,

    linhaDestinoBrancaCinza:
      transferencia.linhaDestinoBrancaCinza,

    rotaCruzada:
      transferencia.rotaCruzada,

    transferenciaValida:
      transferencia.valido,

    transferencia,

    setupMin:
      numero(rota.setupMin),

    tempoProducaoMin:
      tempoBaseTXTMin,

    produtividadeKgHora,

    unidadeDia:
      unidadeBaseTXT,

    kgDia:
      kgDiaTXT,

    kgPorUnidadeTXT,

    leadTimeMin:
      numero(
        rota.leadTimeMin ??
        rota.leadTime ??
        10
      )
  });

  produtoPlanejado.etapasTecnicas += 1;

  produtoPlanejado.tempoUnitarioMin = Math.max(
    produtoPlanejado.tempoUnitarioMin,
    tempoUnitarioMin
  );

  produtoPlanejado.tempoBaseTXTMin = Math.max(
    produtoPlanejado.tempoBaseTXTMin,
    tempoBaseTXTMin
  );

  produtoPlanejado.unidadeBaseTXT = Math.max(
    produtoPlanejado.unidadeBaseTXT,
    unidadeBaseTXT
  );

  produtoPlanejado.kgDiaTXT = Math.max(
    numero(produtoPlanejado.kgDiaTXT),
    kgDiaTXT
  );

  produtoPlanejado.kgPorUnidadeTXT = Math.max(
    numero(produtoPlanejado.kgPorUnidadeTXT),
    kgPorUnidadeTXT
  );

  produtoPlanejado.kgPlanejado =
    numero(produtoPlanejado.quantidadeCSV) *
    numero(produtoPlanejado.kgPorUnidadeTXT);

  produtoPlanejado.setupMin = Math.max(
    produtoPlanejado.setupMin,
    numero(rota.setupMin)
  );

  produtoPlanejado.setupTrocaMin = Math.max(
    numero(produtoPlanejado.setupTrocaMin),
    numero(rota.setupMin)
  );

  produtoPlanejado.setupBaseMin = Math.max(
    numero(produtoPlanejado.setupBaseMin),
    numero(rota.setupMin)
  );

  produtoPlanejado.produtividadeKgHora = Math.max(
    produtoPlanejado.produtividadeKgHora,
    produtividadeKgHora
  );

  produtoPlanejado.rotasOriginais.push(
    rota
  );

}

function finalizarProdutoPlanejado(produto) {

  const sequenciaPrincipal =
    obterMenorSequenciaValida(
      produto.sequencias
    );

  const quantidadeCSV =
    numero(
      produto.quantidadeCSV ??
      produto.demandaFinal
    );

  const kgPorUnidadeTXT =
    numero(produto.kgPorUnidadeTXT);

  const kgPlanejado =
    quantidadeCSV * kgPorUnidadeTXT;

  let tempoProducaoPlanejadoMin = 0;

  let statusCalculo = "";

  if (
    kgPlanejado > 0 &&
    produto.produtividadeKgHora > 0
  ) {

    tempoProducaoPlanejadoMin =
      calcularTempoPorKg(
        kgPlanejado,
        produto.produtividadeKgHora
      );

    statusCalculo =
      "CALCULADO_POR_KG_PLANEJADO";

  } else if (produto.tempoUnitarioMin > 0) {

    tempoProducaoPlanejadoMin = Math.ceil(
      quantidadeCSV * produto.tempoUnitarioMin
    );

    statusCalculo =
      "CALCULADO_POR_QUANTIDADE";

  } else {

    tempoProducaoPlanejadoMin =
      produto.tempoBaseTXTMin;

    statusCalculo =
      "USANDO_TEMPO_TECNICO_TXT";

  }

  const setupFinalMin =
    numero(
      produto.setupMin ??
      produto.setupBaseMin ??
      produto.setupTrocaMin
    );

  const tempoTotalPlanejadoMin =
    tempoProducaoPlanejadoMin + setupFinalMin;

  const zonasTexto =
    Array.from(produto.zonas)
      .filter(Boolean)
      .join(" / ");

  const zonasOperacionaisTexto =
    Array.from(produto.zonasOperacionais || [])
      .filter(Boolean)
      .join(" / ");

  return {

    ...produto,

    sequenciaTXT:
      sequenciaPrincipal,

    ordemTXT:
      sequenciaPrincipal,

    ordemLinhaTXT:
      sequenciaPrincipal,

    setupMin:
      setupFinalMin,

    setupTrocaMin:
      numero(
        produto.setupTrocaMin ??
        setupFinalMin
      ),

    setupBaseMin:
      numero(
        produto.setupBaseMin ??
        setupFinalMin
      ),

    zonasTexto,

    zonasOperacionaisTexto,

    sequenciaPrincipal,

    quantidadeCSV,

    demandaFinal:
      quantidadeCSV,

    kgPorUnidadeTXT,

    kgPlanejado,

    tempoProducaoPlanejadoMin,

    tempoTotalPlanejadoMin,

    statusCalculo,

    possuiLinhaAlternativa:
      produto.linhasAlternativas?.length > 0,

    linhasAlternativas:
      produto.linhasAlternativas || []

  };

}

function ordenarProdutosPlanejados(produtoA, produtoB) {

  const ordemA =
    obterOrdemProdutoPlanejado(
      produtoA
    );

  const ordemB =
    obterOrdemProdutoPlanejado(
      produtoB
    );

  if (ordemA !== ordemB) {
    return ordemA - ordemB;
  }

  return String(produtoA.nomeOficial || "")
    .localeCompare(
      String(produtoB.nomeOficial || ""),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

}

function agruparProdutosPorLinha(produtosMestre) {

  const mapaLinhas = new Map();

  produtosMestre.forEach(produtoMestre => {

    const linhaPrincipalTecnica =
      selecionarLinhaPrincipal(
        produtoMestre
      );

    if (
      !linhaPrincipalTecnica ||
      !linhaPrincipalTecnica.rotas ||
      linhaPrincipalTecnica.rotas.length === 0
    ) {
      return;
    }

    const linhaTecnica =
      normalizarLinha(
        linhaPrincipalTecnica.linha || "Sem linha"
      );

    const linhasPermitidas =
      extrairLinhasPermitidas(
        produtoMestre
      );

    const linhaSequenciamento =
      obterLinhaSequenciamento(
        produtoMestre,
        linhaTecnica,
        linhasPermitidas
      );

    if (!mapaLinhas.has(linhaSequenciamento)) {
      mapaLinhas.set(linhaSequenciamento, new Map());
    }

    const mapaProdutos =
      mapaLinhas.get(linhaSequenciamento);

    const chaveProduto = [
      produtoMestre.codigo,
      produtoMestre.nomeOficial,
      linhaSequenciamento
    ].join("|");

    linhaPrincipalTecnica.rotas.forEach(rota => {

      if (!mapaProdutos.has(chaveProduto)) {

        const produtoPlanejado =
          criarProdutoPlanejado(
            produtoMestre,
            rota
          );

        produtoPlanejado.linhaPrincipal =
          linhaTecnica;

        produtoPlanejado.linhaPrincipalTecnica =
          linhaTecnica;

        produtoPlanejado.linhaPlanejada =
          linhaSequenciamento;

        produtoPlanejado.linhaSequenciamento =
          linhaSequenciamento;

        produtoPlanejado.linha =
          linhaSequenciamento;

        produtoPlanejado.linhasAlternativas =
          linhasPermitidas.filter(
            item => item !== linhaSequenciamento
          );

        mapaProdutos.set(
          chaveProduto,
          produtoPlanejado
        );

        return;

      }

      mesclarRota(
        mapaProdutos.get(chaveProduto),
        rota
      );

    });

  });

  const linhas =
    Array.from(mapaLinhas.entries())
      .map(([linha, mapaProdutos]) => {

        const produtos =
          Array.from(mapaProdutos.values())
            .map(finalizarProdutoPlanejado)
            .sort(ordenarProdutosPlanejados);

        const tempoTotalLinhaMin =
          produtos.reduce((soma, produto) => {

            return soma + produto.tempoTotalPlanejadoMin;

          }, 0);

        const setupTotalLinhaMin =
          produtos.reduce((soma, produto) => {

            return soma + produto.setupMin;

          }, 0);

        const demandaTotalLinha =
          produtos.reduce((soma, produto) => {

            return soma + produto.demandaFinal;

          }, 0);

        const kgTotalPlanejado =
          produtos.reduce((soma, produto) => {

            return soma + numero(produto.kgPlanejado);

          }, 0);

        const totalRotasCruzadas =
          produtos.filter(produto => produto.rotaCruzada)
            .length;

        return {

          linha,

          produtos,

          resumo: {

            totalProdutos:
              produtos.length,

            demandaTotal:
              demandaTotalLinha,

            quantidadeTotalCSV:
              demandaTotalLinha,

            kgTotalPlanejado,

            kgTotal:
              kgTotalPlanejado,

            tempoTotalMin:
              tempoTotalLinhaMin,

            setupTotalMin:
              setupTotalLinhaMin,

            totalRotasCruzadas

          }

        };

      })
      .sort(ordenarLinhas);

  return linhas;

}

function calcularResumoGeral(linhas) {

  return linhas.reduce((resumo, linha) => {

    resumo.totalLinhas += 1;

    resumo.totalProdutos +=
      linha.resumo.totalProdutos;

    resumo.demandaTotal +=
      linha.resumo.demandaTotal;

    resumo.quantidadeTotalCSV +=
      linha.resumo.quantidadeTotalCSV;

    resumo.kgTotalPlanejado +=
      numero(linha.resumo.kgTotalPlanejado);

    resumo.kgTotal +=
      numero(linha.resumo.kgTotalPlanejado);

    resumo.tempoTotalMin +=
      linha.resumo.tempoTotalMin;

    resumo.setupTotalMin +=
      linha.resumo.setupTotalMin;

    resumo.totalRotasCruzadas +=
      numero(linha.resumo.totalRotasCruzadas);

    return resumo;

  }, {

    totalLinhas:
      0,

    totalProdutos:
      0,

    demandaTotal:
      0,

    quantidadeTotalCSV:
      0,

    kgTotalPlanejado:
      0,

    kgTotal:
      0,

    tempoTotalMin:
      0,

    setupTotalMin:
      0,

    totalRotasCruzadas:
      0

  });

}

export function gerarPlanejamentoReal(produtosMestre) {

  const produtos =
    Array.isArray(produtosMestre)
      ? produtosMestre
      : [];

  const linhas =
    agruparProdutosPorLinha(
      produtos
    );

  const resumo =
    calcularResumoGeral(
      linhas
    );

  return {

    linhas,

    resumo,

    criadoEm:
      new Date().toISOString()

  };

}
