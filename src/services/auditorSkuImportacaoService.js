/**
 * ======================================================
 * JFC FLOW
 * Módulo: auditorSkuImportacaoService
 *
 * Responsabilidade:
 * Conferir a rastreabilidade entre CSV, Cadastro Mestre,
 * pendências/sugestões e Planejamento Real.
 *
 * Regra operacional:
 * Se um SKU veio no CSV com volume válido, ele não pode
 * sumir silenciosamente. Ele precisa aparecer como:
 * - Planejado;
 * - Pendente sem Cadastro/TXT;
 * - Aguardando confirmação;
 * - Inativo;
 * - Sem rota/linha;
 * - Não planejado por outro motivo.
 * ======================================================
 */

import {
  consolidarItensCSVLegado,
  normalizarCodigoLegado,
  normalizarNomeLegado,
  numeroLegado
} from "./calculadoraPlanejamentoLegadoService.js";

function texto(valor) {

  return String(valor ?? "")
    .trim();

}

function codigo(valor) {

  return normalizarCodigoLegado(
    valor
  );

}

function chaveNome(valor) {

  return normalizarNomeLegado(
    valor
  );

}

function obterCodigoProduto(produto = {}) {

  return codigo(
    produto.codigo ??
    produto.codigoProduto ??
    produto.codProduto ??
    produto.id ??
    ""
  );

}

function obterNomeProduto(produto = {}) {

  return texto(
    produto.nomeOficial ??
    produto.descricaoCSV ??
    produto.descricao ??
    produto.produto ??
    produto.nome ??
    ""
  );

}

function obterLinhaProduto(produto = {}) {

  return texto(
    produto.linhaSequenciamento ??
    produto.linhaPlanejada ??
    produto.linhaCadastro ??
    produto.linhaPrincipal ??
    produto.linha ??
    produto.rotasTecnicas?.[0]?.linha ??
    produto.rotasTecnicas?.[0]?.srcLinha ??
    produto.rotasTecnicas?.[0]?.linhaOrigemNegra ??
    ""
  );

}

function produtoTemRotaTecnica(produto = {}) {

  return Array.isArray(produto.rotasTecnicas) &&
    produto.rotasTecnicas.length > 0;

}

function construirMapaPorCodigo(lista = []) {

  const mapa = new Map();

  (lista || []).forEach(item => {

    const chave =
      obterCodigoProduto(item);

    if (chave) {
      mapa.set(chave, item);
    }

  });

  return mapa;

}

function construirMapaPlanejados(planejamentoComCapacidade = {}) {

  const mapaCodigo = new Map();
  const mapaNome = new Map();

  const linhas =
    Array.isArray(planejamentoComCapacidade?.linhas)
      ? planejamentoComCapacidade.linhas
      : [];

  linhas.forEach(linha => {

    const produtos =
      Array.isArray(linha.produtos)
        ? linha.produtos
        : [];

    produtos.forEach(produto => {

      const cod =
        obterCodigoProduto(produto);

      const nome =
        chaveNome(
          obterNomeProduto(produto)
        );

      const registro = {
        ...produto,
        linhaPlanejadaFinal: linha.linha
      };

      if (cod) {
        mapaCodigo.set(cod, registro);
      }

      if (nome) {
        mapaNome.set(nome, registro);
      }

    });

  });

  return {
    mapaCodigo,
    mapaNome
  };

}

function construirMapaPendencias(pendencias = []) {

  const mapaCodigo = new Map();
  const mapaNome = new Map();

  (pendencias || []).forEach(item => {

    const cod =
      obterCodigoProduto(item);

    const nome =
      chaveNome(
        obterNomeProduto(item)
      );

    if (cod) {
      mapaCodigo.set(cod, item);
    }

    if (nome) {
      mapaNome.set(nome, item);
    }

  });

  return {
    mapaCodigo,
    mapaNome
  };

}

function buscarPorCodigoOuNome(
  itemCSV,
  mapas
) {

  const cod =
    codigo(itemCSV.codigo);

  const nome =
    chaveNome(
      itemCSV.nomeOficial ||
      itemCSV.descricaoCSV
    );

  if (
    cod &&
    mapas.mapaCodigo?.has(cod)
  ) {
    return mapas.mapaCodigo.get(cod);
  }

  if (
    nome &&
    mapas.mapaNome?.has(nome)
  ) {
    return mapas.mapaNome.get(nome);
  }

  return null;

}

function criarItemAuditoria({
  itemCSV,
  produtoMestre,
  produtoPlanejado,
  pendencia,
  sugestao
}) {

  const quantidadeCSV =
    numeroLegado(
      itemCSV.demandaFinal ??
      itemCSV.quantidadeCSV ??
      0
    );

  const codigoProduto =
    codigo(itemCSV.codigo);

  const nomeProduto =
    texto(
      itemCSV.nomeOficial ||
      itemCSV.descricaoCSV
    );

  if (produtoPlanejado) {

    return {
      status: "PLANEJADO",
      statusTexto: "Planejado",
      severidade: "OK",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: produtoPlanejado.linhaPlanejadaFinal || produtoPlanejado.linhaSequenciamento || "-",
      familia: produtoPlanejado.familiaSequenciamento || produtoPlanejado.familia || produtoPlanejado.familiaSetup || "-",
      kgPlanejado: numeroLegado(produtoPlanejado.kgPlanejado),
      tempoMin: numeroLegado(produtoPlanejado.tempoTotalPlanejadoMin),
      motivo: "SKU entrou no Planejamento Real.",
      acao: "Nenhuma"
    };

  }

  if (pendencia) {

    return {
      status: "PENDENTE",
      statusTexto: "Pendente",
      severidade: "ERRO",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: "-",
      familia: "-",
      kgPlanejado: 0,
      tempoMin: 0,
      motivo: pendencia.motivo || "SKU ficou em pendência de vínculo.",
      acao: "Corrigir vínculo com TXT/Cadastro Mestre"
    };

  }

  if (sugestao) {

    return {
      status: "AGUARDANDO_CONFIRMACAO",
      statusTexto: "Aguardando confirmação",
      severidade: "ATENCAO",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: "-",
      familia: "-",
      kgPlanejado: 0,
      tempoMin: 0,
      motivo: "Existe sugestão de vínculo, mas ainda não foi confirmada.",
      acao: "Confirmar sugestão de vínculo"
    };

  }

  if (!produtoMestre) {

    return {
      status: "SEM_CADASTRO_MESTRE",
      statusTexto: "Sem Cadastro Mestre",
      severidade: "ERRO",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: "-",
      familia: "-",
      kgPlanejado: 0,
      tempoMin: 0,
      motivo: "SKU veio no CSV com volume, mas não existe no Cadastro Mestre confirmado.",
      acao: "Cadastrar ou vincular produto"
    };

  }

  if (produtoMestre.ativo === false) {

    return {
      status: "INATIVO",
      statusTexto: "Inativo",
      severidade: "ATENCAO",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: obterLinhaProduto(produtoMestre) || "-",
      familia: produtoMestre.familiaSequenciamento || produtoMestre.familiaSetup || "-",
      kgPlanejado: 0,
      tempoMin: 0,
      motivo: "SKU existe no Cadastro Mestre, mas está marcado como inativo.",
      acao: "Ativar produto ou remover demanda do CSV"
    };

  }

  if (!produtoTemRotaTecnica(produtoMestre)) {

    return {
      status: "SEM_ROTA_TECNICA",
      statusTexto: "Sem rota técnica",
      severidade: "ERRO",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: obterLinhaProduto(produtoMestre) || "-",
      familia: produtoMestre.familiaSequenciamento || produtoMestre.familiaSetup || "-",
      kgPlanejado: 0,
      tempoMin: 0,
      motivo: "SKU existe no Cadastro Mestre, mas não possui rota técnica/TXT válida.",
      acao: "Vincular produto ao TXT ou revisar Cadastro Mestre"
    };

  }

  if (!obterLinhaProduto(produtoMestre)) {

    return {
      status: "SEM_LINHA",
      statusTexto: "Sem linha",
      severidade: "ERRO",
      codigo: codigoProduto,
      nomeOficial: nomeProduto,
      quantidadeCSV,
      linha: "-",
      familia: produtoMestre.familiaSequenciamento || produtoMestre.familiaSetup || "-",
      kgPlanejado: 0,
      tempoMin: 0,
      motivo: "SKU existe no Cadastro Mestre, mas está sem linha de sequenciamento/técnica.",
      acao: "Definir linha de sequenciamento"
    };

  }

  return {
    status: "NAO_PLANEJADO",
    statusTexto: "Não planejado",
    severidade: "ATENCAO",
    codigo: codigoProduto,
    nomeOficial: nomeProduto,
    quantidadeCSV,
    linha: obterLinhaProduto(produtoMestre) || "-",
    familia: produtoMestre.familiaSequenciamento || produtoMestre.familiaSetup || "-",
    kgPlanejado: 0,
    tempoMin: 0,
    motivo: "SKU tem Cadastro Mestre, mas não apareceu no Planejamento Real.",
    acao: "Revisar filtros, linha, rotas ou regra de planejamento"
  };

}

function contarPorStatus(itens = []) {

  return itens.reduce((mapa, item) => {

    mapa[item.status] =
      (mapa[item.status] || 0) + 1;

    return mapa;

  }, {});

}

export function auditarSKUsImportacao({
  dadosCSV = [],
  produtosMestre = [],
  planejamentoComCapacidade = {},
  pendencias = [],
  sugestoes = []
} = {}) {

  const csvConsolidado =
    consolidarItensCSVLegado(
      dadosCSV
    );

  const mapaMestre =
    construirMapaPorCodigo(
      produtosMestre
    );

  const mapasPlanejados =
    construirMapaPlanejados(
      planejamentoComCapacidade
    );

  const mapasPendencias =
    construirMapaPendencias(
      pendencias
    );

  const mapasSugestoes =
    construirMapaPendencias(
      sugestoes
    );

  const itens =
    csvConsolidado.map(itemCSV => {

      const produtoMestre =
        mapaMestre.get(
          codigo(itemCSV.codigo)
        ) || null;

      const produtoPlanejado =
        buscarPorCodigoOuNome(
          itemCSV,
          mapasPlanejados
        );

      const pendencia =
        buscarPorCodigoOuNome(
          itemCSV,
          mapasPendencias
        );

      const sugestao =
        buscarPorCodigoOuNome(
          itemCSV,
          mapasSugestoes
        );

      return criarItemAuditoria({
        itemCSV,
        produtoMestre,
        produtoPlanejado,
        pendencia,
        sugestao
      });

    });

  const contagemStatus =
    contarPorStatus(
      itens
    );

  const planejados =
    contagemStatus.PLANEJADO || 0;

  const pendentes =
    itens.filter(item => item.severidade === "ERRO").length;

  const alertas =
    itens.filter(item => item.severidade === "ATENCAO").length;

  const totalCSV =
    csvConsolidado.length;

  return {
    resumo: {
      totalCSV,
      planejados,
      naoPlanejados: totalCSV - planejados,
      pendentes,
      alertas,
      percentualPlanejado:
        totalCSV > 0
          ? Math.round((planejados / totalCSV) * 100)
          : 0,
      contagemStatus
    },
    itens,
    divergencias:
      itens.filter(item => item.status !== "PLANEJADO")
  };

}
