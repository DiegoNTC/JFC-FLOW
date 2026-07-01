/**
 * ======================================================
 * JFC FLOW
 * Módulo: sincronizadorProdutos
 * Versão: 1.1.1
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
 * - Ordem de entrada na linha
 * - Setup
 * - Tempo
 * - Produtividade
 *
 * O TXT nunca altera o nome oficial do produto.
 *
 * Regra importante:
 * A sequência do TXT precisa ser preservada em todas as rotas técnicas:
 * - sequencia
 * - sequenciaTXT
 * - ordemTXT
 * - ordemLinhaTXT
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

function normalizarOrdemTXT(
  rota
) {

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

  const previa = parseNumero(
    item?.previa ??
    item?.Previa ??
    item?.PREVIA ??
    0
  );

  const pedidos = parseNumero(
    item?.pedidos ??
    item?.Pedidos ??
    item?.PEDIDOS ??
    0
  );

  const prioridade = parseNumero(
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

    mapa.get(chave)
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
      existente.descricaoTXT ||
      ""
    );

  if (!chaveTXTExistente) {
    return null;
  }

  return gruposTXT.find(grupo => {

    return grupo.descricaoNormalizadaTXT === chaveTXTExistente;

  }) || null;

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
     * A numeração 1., 2., 3. do TXT precisa chegar até o planejamento.
     */
    sequencia:
      ordemTXT,

    sequenciaTXT:
      ordemTXT,

    ordemTXT:
      ordemTXT,

    ordemLinhaTXT:
      ordemTXT

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

      const ordemTXT =
        normalizarOrdemTXT(
          rota
        );

      return {

        ...rota,

        codigo:
          produtoCSV.codigo,

        nomeOficial:
          produtoCSV.nomeOficial ||
          existente.nomeOficial,

        descricao:
          produtoCSV.nomeOficial ||
          existente.nomeOficial,

        descricaoCSV:
          produtoCSV.descricaoCSV ||
          existente.descricaoCSV,

        sequencia:
          ordemTXT,

        sequenciaTXT:
          ordemTXT,

        ordemTXT:
          ordemTXT,

        ordemLinhaTXT:
          ordemTXT

      };

    });

}

function criarProdutoMestre(produtoCSV, grupoTXT, comparacao) {

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

function criarPendencia(produtoCSV, motivo, sugestoes = []) {

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

function montarSugestoes(produtoCSV, gruposTXT) {

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
      item.produtoTXT?.rotasTecnicas || []

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
            prepararRotasTecnicas(
              produtoCSV,
              melhor.produtoTXT
            )

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