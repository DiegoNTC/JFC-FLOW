/**
 * ======================================================
 * JFC FLOW
 * Módulo: sincronizadorProdutos
 * Versão: 1.1.2
 *
 * Regra principal:
 * O nome oficial do produto SEMPRE vem do CSV.
 *
 * CSV:
 * - Código oficial do ERP
 * - Nome oficial do produto
 * - Demanda
 *
 * TXT:
 * - Linha
 * - Zona
 * - Ordem de entrada
 * - Setup
 * - Tempo
 * - Produtividade
 * - Rota operacional real
 *
 * O TXT nunca altera o nome oficial do produto.
 *
 * Regra operacional extraída do sequenciador real:
 * Um produto pode cortar em uma linha e embalar em outra:
 *
 * [N:L1→B/C:L6]
 *
 * Isso precisa chegar no Cadastro Mestre como:
 * - srcLinha
 * - dstLinha
 * - linhaOrigemNegra
 * - linhaDestinoBrancaCinza
 * - rotaCruzada
 * ======================================================
 */

import {
  encontrarMelhorCorrespondencia,
  listarSugestoesCorrespondencia
} from "./similaridadeService.js";

import {
  criarChaveTexto,
  normalizarTextoForte
} from "./normalizadorTexto.js";

/**
 * Código é regra de negócio.
 * Nunca converter para Number.
 */
function normalizarCodigo(codigo) {

  if (
    codigo === null ||
    codigo === undefined
  ) {
    return "";
  }

  return String(codigo).trim();

}

function parseNumero(valor) {

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

  return valor;

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

function normalizarOrdemTXT(rota) {

  return parseNumero(
    rota?.ordemLinhaTXT ??
    rota?.ordemTXT ??
    rota?.sequenciaTXT ??
    rota?.sequencia ??
    0
  );

}

function pegarCodigoCSV(item) {

  return normalizarCodigo(
    item?.codigo ??
    item?.Código ??
    item?.CODIGO ??
    item?.Codigo ??
    ""
  );

}

function pegarDescricaoCSV(item) {

  return String(
    item?.produto ??
    item?.Produto ??
    item?.descricao ??
    item?.Descrição ??
    item?.descricaoCSV ??
    item?.nomeOficial ??
    ""
  ).trim();

}

function calcularDemandaFinal(item) {

  const previa =
    parseNumero(
      item?.previa ??
      item?.Previa ??
      item?.PREVIA ??
      0
    );

  const pedidos =
    parseNumero(
      item?.pedidos ??
      item?.Pedidos ??
      item?.PEDIDOS ??
      0
    );

  const prioridade =
    parseNumero(
      item?.prioridade ??
      item?.Prioridade ??
      item?.["Pedidos Prioritarios"] ??
      item?.["Pedidos Prioritários"] ??
      item?.prioritario ??
      item?.prioritarios ??
      0
    );

  /**
   * Regra definida:
   * Se existir Pedido, usar Pedido + Prioridade.
   * Se não existir Pedido, usar Prévia + Prioridade.
   */
  if (pedidos > 0) {
    return pedidos + prioridade;
  }

  return previa + prioridade;

}

/**
 * Consolida o CSV por código.
 *
 * Se o mesmo código aparecer mais de uma vez,
 * soma a demanda final.
 *
 * Importante:
 * Código continua como texto.
 */
function prepararProdutosCSV(dadosCSV) {

  const mapa = new Map();

  dadosCSV.forEach((item, index) => {

    const codigo =
      pegarCodigoCSV(item);

    const descricaoCSV =
      pegarDescricaoCSV(item);

    if (
      !codigo &&
      !descricaoCSV
    ) {
      return;
    }

    const chaveMapa =
      codigo ||
      `SEM_CODIGO_${index}`;

    const demandaFinal =
      calcularDemandaFinal(item);

    if (!mapa.has(chaveMapa)) {

      mapa.set(
        chaveMapa,
        {
          codigo,

          nomeOficial:
            descricaoCSV,

          descricaoCSV,

          descricaoNormalizadaCSV:
            normalizarTextoForte(descricaoCSV),

          demandaFinal,

          linhasOrigemCSV:
            [item],

          indiceOrigem:
            index
        }
      );

      return;

    }

    const existente =
      mapa.get(chaveMapa);

    existente.demandaFinal +=
      demandaFinal;

    existente.linhasOrigemCSV.push(
      item
    );

    if (
      !existente.descricaoCSV &&
      descricaoCSV
    ) {

      existente.nomeOficial =
        descricaoCSV;

      existente.descricaoCSV =
        descricaoCSV;

      existente.descricaoNormalizadaCSV =
        normalizarTextoForte(descricaoCSV);

    }

  });

  return Array.from(
    mapa.values()
  );

}

/**
 * O TXT pode ter o mesmo produto em várias zonas.
 * Por isso agrupamos por descrição técnica.
 */
function agruparProdutosTXTPorDescricao(produtosTecnicos) {

  const mapa = new Map();

  produtosTecnicos.forEach(produtoTXT => {

    const descricaoTXT =
      String(
        produtoTXT?.descricaoTXT ??
        produtoTXT?.descricao ??
        ""
      ).trim();

    if (!descricaoTXT) {
      return;
    }

    const chave =
      criarChaveTexto(descricaoTXT);

    if (!mapa.has(chave)) {

      mapa.set(
        chave,
        {
          descricaoTXT,

          descricaoNormalizadaTXT:
            chave,

          rotasTecnicas:
            [],

          origem: {
            txt: true
          }
        }
      );

    }

    mapa
      .get(chave)
      .rotasTecnicas
      .push(produtoTXT);

  });

  return Array.from(
    mapa.values()
  );

}

function buscarCadastroExistente(cadastroAtual, codigo) {

  return cadastroAtual.find(item => {

    return normalizarCodigo(item.codigo) === codigo;

  });

}

function buscarGrupoTXTVinculado(
  existente,
  gruposTXT
) {

  if (!existente) {
    return null;
  }

  const chaveTXTExistente =
    existente.descricaoNormalizadaTXT ||
    criarChaveTexto(
      existente.descricaoTXT || ""
    );

  if (!chaveTXTExistente) {
    return null;
  }

  return gruposTXT.find(grupo => {

    return grupo.descricaoNormalizadaTXT === chaveTXTExistente;

  }) || null;

}

function montarTransferenciaNormalizada(
  rota
) {

  const linhaBase =
    normalizarLinha(
      rota?.linha ||
      rota?.linhaPrincipal ||
      ""
    );

  const transferencia =
    rota?.transferencia || {};

  const srcLinha =
    normalizarLinha(
      rota?.srcLinha ??
      rota?.linhaOrigemNegra ??
      rota?.linhaOrigem ??
      transferencia?.srcLinha ??
      transferencia?.linhaOrigemNegra ??
      transferencia?.linhaOrigem ??
      linhaBase
    );

  const dstLinha =
    normalizarLinha(
      rota?.dstLinha ??
      rota?.linhaDestinoBrancaCinza ??
      rota?.linhaDestino ??
      transferencia?.dstLinha ??
      transferencia?.linhaDestinoBrancaCinza ??
      transferencia?.linhaDestino ??
      linhaBase
    );

  const rotaCruzada =
    srcLinha &&
    dstLinha &&
    srcLinha !== dstLinha;

  return {
    raw:
      transferencia?.raw ??
      rota?.transferenciaRaw ??
      null,

    valido:
      Boolean(
        rota?.transferenciaValida ??
        transferencia?.valido ??
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
      rota?.zonaOrigem ??
      transferencia?.zonaOrigem ??
      "NEGRA",

    zonaDestino:
      rota?.zonaDestino ??
      transferencia?.zonaDestino ??
      "BRANCA_CINZA"
  };

}

function prepararRotaTecnica(
  produtoCSV,
  grupoTXT,
  rota
) {

  const ordemTXT =
    normalizarOrdemTXT(
      rota
    );

  const transferencia =
    montarTransferenciaNormalizada(
      rota
    );

  const zonaOperacional =
    normalizarZonaOperacional(
      rota?.zonaOperacional ??
      rota?.zona
    );

  return {

    ...rota,

    codigo:
      produtoCSV.codigo,

    nomeOficial:
      produtoCSV.nomeOficial,

    descricao:
      produtoCSV.nomeOficial,

    descricaoCSV:
      produtoCSV.descricaoCSV,

    descricaoTXT:
      rota?.descricaoTXT ||
      grupoTXT?.descricaoTXT,

    descricaoTXTBruta:
      rota?.descricaoTXTBruta ||
      rota?.descricaoTXT ||
      grupoTXT?.descricaoTXT,

    descricaoNormalizada:
      rota?.descricaoNormalizada ||
      grupoTXT?.descricaoNormalizadaTXT,

    /**
     * Campos oficiais da ordem técnica vinda do TXT.
     */
    sequencia:
      ordemTXT,

    sequenciaTXT:
      ordemTXT,

    ordemTXT:
      ordemTXT,

    ordemLinhaTXT:
      ordemTXT,

    /**
     * Campos operacionais extraídos do sequenciador real.
     */
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

    /**
     * Campo preparado para a futura timeline.
     * O sequenciador real usa lead time entre Negra e Branca.
     */
    leadTimeMin:
      parseNumero(
        rota?.leadTimeMin ??
        rota?.leadTime ??
        10
      )

  };

}

function prepararRotasTecnicas(
  produtoCSV,
  grupoTXT
) {

  return (grupoTXT?.rotasTecnicas || [])
    .map(rota => {

      return prepararRotaTecnica(
        produtoCSV,
        grupoTXT,
        rota
      );

    });

}

function normalizarRotasTecnicasExistentes(
  produtoCSV,
  existente
) {

  return (existente?.rotasTecnicas || [])
    .map(rota => {

      const grupoFake = {
        descricaoTXT:
          existente.descricaoTXT ||
          rota.descricaoTXT,

        descricaoNormalizadaTXT:
          existente.descricaoNormalizadaTXT ||
          rota.descricaoNormalizada
      };

      return prepararRotaTecnica(
        produtoCSV,
        grupoFake,
        rota
      );

    });

}

function criarProdutoMestre(
  produtoCSV,
  grupoTXT,
  comparacao
) {

  const rotasTecnicas =
    prepararRotasTecnicas(
      produtoCSV,
      grupoTXT
    );

  return {

    id:
      produtoCSV.codigo,

    codigo:
      produtoCSV.codigo,

    /**
     * Nome oficial do produto.
     * Regra de negócio:
     * Sempre seguir o CSV.
     */
    nomeOficial:
      produtoCSV.nomeOficial,

    descricao:
      produtoCSV.nomeOficial,

    descricaoCSV:
      produtoCSV.descricaoCSV,

    /**
     * A descrição do TXT fica somente como referência técnica.
     */
    descricaoTXT:
      grupoTXT.descricaoTXT,

    descricaoNormalizadaCSV:
      produtoCSV.descricaoNormalizadaCSV,

    descricaoNormalizadaTXT:
      grupoTXT.descricaoNormalizadaTXT,

    demandaReferencia:
      produtoCSV.demandaFinal,

    rotasTecnicas,

    /**
     * Espelho rápido da primeira rota.
     */
    zonaOperacional:
      rotasTecnicas[0]?.zonaOperacional || "",

    srcLinha:
      rotasTecnicas[0]?.srcLinha || "",

    dstLinha:
      rotasTecnicas[0]?.dstLinha || "",

    linhaOrigemNegra:
      rotasTecnicas[0]?.linhaOrigemNegra || "",

    linhaDestinoBrancaCinza:
      rotasTecnicas[0]?.linhaDestinoBrancaCinza || "",

    rotaCruzada:
      rotasTecnicas.some(rota => rota.rotaCruzada),

    vinculoConfirmado:
      true,

    vinculoTipo:
      comparacao.tipo,

    scoreVinculo:
      comparacao.score,

    ativo:
      true,

    origem: {
      csv: true,
      txt: true
    },

    criadoEm:
      new Date().toISOString(),

    atualizadoEm:
      new Date().toISOString()

  };

}

function criarPendencia(
  produtoCSV,
  motivo,
  sugestoes = []
) {

  return {

    codigo:
      produtoCSV.codigo,

    nomeOficial:
      produtoCSV.nomeOficial,

    descricao:
      produtoCSV.nomeOficial,

    descricaoCSV:
      produtoCSV.descricaoCSV,

    demandaFinal:
      produtoCSV.demandaFinal,

    motivo,

    status:
      "PENDENTE_REVISAO",

    sugestoes

  };

}

function montarSugestoes(
  produtoCSV,
  gruposTXT
) {

  return listarSugestoesCorrespondencia(
    produtoCSV,
    gruposTXT,
    60,
    5
  ).map(item => ({

    codigo:
      produtoCSV.codigo,

    nomeOficial:
      produtoCSV.nomeOficial,

    descricaoCSV:
      produtoCSV.descricaoCSV,

    descricaoTXT:
      item.descricaoTXT,

    score:
      item.score,

    tipo:
      item.tipo,

    status:
      item.status,

    rotasTecnicas:
      item.produtoTXT
        ? prepararRotasTecnicas(
            produtoCSV,
            item.produtoTXT
          )
        : []

  }));

}

/**
 * Função principal.
 *
 * dadosCSV:
 * Array vindo do parseCSV.
 *
 * baseTXT:
 * Pode ser:
 * - retorno completo do importarTXT()
 * - ou direto um array de produtosTecnicos.
 *
 * cadastroAtual:
 * Produtos já vinculados anteriormente.
 */
export function sincronizarProdutos(
  dadosCSV,
  baseTXT,
  cadastroAtual = []
) {

  const produtosCSV =
    prepararProdutosCSV(
      Array.isArray(dadosCSV)
        ? dadosCSV
        : []
    );

  const produtosTecnicosTXT =
    Array.isArray(baseTXT)
      ? baseTXT
      : baseTXT?.produtosTecnicos || [];

  const gruposTXT =
    agruparProdutosTXTPorDescricao(
      produtosTecnicosTXT
    );

  const vinculadosAutomaticamente = [];

  const sugestoes = [];

  const pendentes = [];

  const jaCadastrados = [];

  produtosCSV.forEach(produtoCSV => {

    if (!produtoCSV.codigo) {

      pendentes.push(
        criarPendencia(
          produtoCSV,
          "Produto do CSV sem código."
        )
      );

      return;

    }

    if (!produtoCSV.descricaoCSV) {

      pendentes.push(
        criarPendencia(
          produtoCSV,
          "Produto do CSV sem descrição."
        )
      );

      return;

    }

    const existente =
      buscarCadastroExistente(
        cadastroAtual,
        produtoCSV.codigo
      );

    if (
      existente &&
      existente.vinculoConfirmado
    ) {

      const grupoTXTAtual =
        buscarGrupoTXTVinculado(
          existente,
          gruposTXT
        );

      const rotasTecnicas =
        grupoTXTAtual
          ? prepararRotasTecnicas(
              produtoCSV,
              grupoTXTAtual
            )
          : normalizarRotasTecnicasExistentes(
              produtoCSV,
              existente
            );

      jaCadastrados.push({

        ...existente,

        nomeOficial:
          produtoCSV.nomeOficial ||
          existente.nomeOficial,

        descricao:
          produtoCSV.nomeOficial ||
          existente.nomeOficial,

        descricaoCSV:
          produtoCSV.descricaoCSV,

        descricaoTXT:
          grupoTXTAtual?.descricaoTXT ||
          existente.descricaoTXT,

        descricaoNormalizadaCSV:
          produtoCSV.descricaoNormalizadaCSV,

        descricaoNormalizadaTXT:
          grupoTXTAtual?.descricaoNormalizadaTXT ||
          existente.descricaoNormalizadaTXT,

        demandaReferencia:
          produtoCSV.demandaFinal,

        rotasTecnicas,

        zonaOperacional:
          rotasTecnicas[0]?.zonaOperacional ||
          existente.zonaOperacional ||
          "",

        srcLinha:
          rotasTecnicas[0]?.srcLinha ||
          existente.srcLinha ||
          "",

        dstLinha:
          rotasTecnicas[0]?.dstLinha ||
          existente.dstLinha ||
          "",

        linhaOrigemNegra:
          rotasTecnicas[0]?.linhaOrigemNegra ||
          existente.linhaOrigemNegra ||
          "",

        linhaDestinoBrancaCinza:
          rotasTecnicas[0]?.linhaDestinoBrancaCinza ||
          existente.linhaDestinoBrancaCinza ||
          "",

        rotaCruzada:
          rotasTecnicas.some(rota => rota.rotaCruzada) ||
          existente.rotaCruzada ||
          false,

        origemCSVAtualizada:
          true,

        atualizadoEm:
          new Date().toISOString()

      });

      return;

    }

    const melhor =
      encontrarMelhorCorrespondencia(
        produtoCSV,
        gruposTXT,
        70
      );

    /**
     * Vínculo automático somente para:
     * EXATO, NORMALIZADO ou NORMALIZADO_FORTE.
     *
     * Similaridade apenas gera sugestão.
     */
    if (
      melhor.produtoTXT &&
      melhor.podeVincularAutomaticamente
    ) {

      vinculadosAutomaticamente.push(
        criarProdutoMestre(
          produtoCSV,
          melhor.produtoTXT,
          melhor
        )
      );

      return;

    }

    const listaSugestoes =
      montarSugestoes(
        produtoCSV,
        gruposTXT
      );

    if (
      melhor.produtoTXT &&
      melhor.score >= 80
    ) {

      const rotasMelhorSugestao =
        prepararRotasTecnicas(
          produtoCSV,
          melhor.produtoTXT
        );

      sugestoes.push({

        codigo:
          produtoCSV.codigo,

        nomeOficial:
          produtoCSV.nomeOficial,

        descricao:
          produtoCSV.nomeOficial,

        descricaoCSV:
          produtoCSV.descricaoCSV,

        demandaFinal:
          produtoCSV.demandaFinal,

        melhorSugestao: {

          codigo:
            produtoCSV.codigo,

          nomeOficial:
            produtoCSV.nomeOficial,

          descricaoCSV:
            produtoCSV.descricaoCSV,

          descricaoTXT:
            melhor.descricaoTXT,

          score:
            melhor.score,

          tipo:
            melhor.tipo,

          status:
            melhor.status,

          rotasTecnicas:
            rotasMelhorSugestao

        },

        sugestoes:
          listaSugestoes,

        status:
          "AGUARDANDO_CONFIRMACAO"

      });

      return;

    }

    pendentes.push(
      criarPendencia(
        produtoCSV,
        "Não foi encontrada correspondência segura no TXT.",
        listaSugestoes
      )
    );

  });

  return {

    vinculadosAutomaticamente,

    sugestoes,

    pendentes,

    jaCadastrados,

    gruposTXT,

    produtosCSV,

    estatisticas: {

      totalCSV:
        produtosCSV.length,

      totalTXT:
        produtosTecnicosTXT.length,

      totalDescricoesTXT:
        gruposTXT.length,

      vinculadosAutomaticamente:
        vinculadosAutomaticamente.length,

      sugestoes:
        sugestoes.length,

      pendentes:
        pendentes.length,

      jaCadastrados:
        jaCadastrados.length

    }

  };

}