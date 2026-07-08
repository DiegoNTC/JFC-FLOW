/**
 * ======================================================
 * JFC FLOW
 * Módulo: calculadoraPlanejamentoLegadoService
 *
 * Responsabilidade:
 * Centralizar as regras operacionais herdadas do
 * sequenciador antigo validado pelo PCP.
 *
 * Regras principais do legado:
 * 1) Demanda efetiva do CSV:
 *    - se Pedidos > 0: Pedidos + Prioritários;
 *    - senão, se Prévia > 0: Prévia;
 *    - senão: Prioritários.
 *
 * 2) Kg operacional:
 *    - quando o nome possui embalagem em KG, recalcula
 *      quantidade × kg da embalagem;
 *    - quando não possui KG confiável, mantém o kg técnico
 *      da base TXT/Cadastro Mestre;
 *    - como fallback, usa quantidade × kgPorUnidadeTXT.
 *
 * Observação importante:
 * O sequenciador antigo não usava gramagens em G para
 * recalcular todos os SKUs. Vários produtos 150G/200G/500G
 * mantinham o kg base cadastrado. Por isso este módulo
 * usa somente embalagem em KG para recalcular diretamente.
 * ======================================================
 */

export function numeroLegado(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  const textoValor =
    String(valor)
      .trim();

  let normalizado =
    textoValor;

  if (textoValor.includes(",")) {
    normalizado =
      textoValor
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
    : 0;

}

export function textoLegado(valor) {

  return String(valor ?? "")
    .trim();

}

export function normalizarCodigoLegado(codigo) {

  return textoLegado(codigo);

}

export function normalizarNomeLegado(nome) {

  return textoLegado(nome)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

export function calcularDemandaFinalLegada(dados = {}) {

  const previa =
    numeroLegado(
      dados.previa ??
      dados.Previa ??
      dados.PREVIA ??
      dados["Prévia"] ??
      dados["Previa"] ??
      0
    );

  const prioridade =
    numeroLegado(
      dados.prioridade ??
      dados.prioritarios ??
      dados.prioritario ??
      dados.Prioridade ??
      dados["Pedidos Prioritarios"] ??
      dados["Pedidos Prioritários"] ??
      dados["pedidos prioritarios"] ??
      dados["pedidos prioritários"] ??
      0
    );

  const pedidos =
    numeroLegado(
      dados.pedidos ??
      dados.Pedidos ??
      dados.PEDIDOS ??
      dados["Pedidos "] ??
      dados["pedidos "] ??
      0
    );

  if (pedidos > 0) {
    return pedidos + prioridade;
  }

  if (previa > 0) {
    return previa;
  }

  return prioridade;

}

export function consolidarItensCSVLegado(dadosCSV = []) {

  const mapa =
    new Map();

  (dadosCSV || []).forEach((item, indice) => {

    const codigo =
      normalizarCodigoLegado(
        item?.codigo ??
        item?.Código ??
        item?.CODIGO ??
        item?.Codigo ??
        ""
      );

    const nome =
      textoLegado(
        item?.produto ??
        item?.Produto ??
        item?.descricaoCSV ??
        item?.nomeOficial ??
        item?.descricao ??
        ""
      );

    if (!codigo && !nome) {
      return;
    }

    const chave =
      codigo ||
      `SEM_CODIGO:${normalizarNomeLegado(nome) || indice}`;

    if (!mapa.has(chave)) {

      mapa.set(
        chave,
        {
          codigo,
          nomeOficial: nome,
          descricaoCSV: nome,
          descricaoNormalizadaCSV: normalizarNomeLegado(nome),
          previa: 0,
          prioridade: 0,
          pedidos: 0,
          producao: 0,
          categoria: textoLegado(item?.categoria ?? item?.Categoria ?? ""),
          linhasOrigemCSV: [],
          indiceOrigem: indice
        }
      );

    }

    const registro =
      mapa.get(chave);

    registro.previa =
      Math.max(
        numeroLegado(registro.previa),
        numeroLegado(item?.previa ?? item?.Previa ?? item?.["Prévia"] ?? 0)
      );

    registro.prioridade +=
      numeroLegado(
        item?.prioridade ??
        item?.prioritarios ??
        item?.prioritario ??
        item?.["Pedidos Prioritarios"] ??
        item?.["Pedidos Prioritários"] ??
        0
      );

    registro.pedidos +=
      numeroLegado(
        item?.pedidos ??
        item?.Pedidos ??
        item?.["Pedidos "] ??
        0
      );

    registro.producao +=
      numeroLegado(
        item?.producao ??
        item?.Producao ??
        item?.Produção ??
        0
      );

    if (!registro.nomeOficial && nome) {
      registro.nomeOficial = nome;
      registro.descricaoCSV = nome;
      registro.descricaoNormalizadaCSV = normalizarNomeLegado(nome);
    }

    if (!registro.categoria) {
      registro.categoria =
        textoLegado(item?.categoria ?? item?.Categoria ?? "");
    }

    registro.linhasOrigemCSV.push(item);

  });

  return Array.from(mapa.values())
    .map(registro => {

      const demandaFinal =
        calcularDemandaFinalLegada(registro);

      return {
        ...registro,
        demandaFinal,
        quantidadeCSV: demandaFinal,
        demandaReferencia: demandaFinal,
        regraDemanda: "LEGADO_PEDIDOS_PREVIA_PRIORIDADE"
      };

    })
    .filter(registro => numeroLegado(registro.demandaFinal) > 0);

}

export function extrairPesoEmbalagemKgLegado(nomeProduto) {

  const nome =
    normalizarNomeLegado(nomeProduto)
      .replace(",", ".");

  /**
   * Mantemos somente KG para reproduzir a lógica operacional antiga.
   * Ex.: "CX 2KG" => 2 kg/un.
   * Produtos com 150G/200G/500G normalmente mantêm kg base da ficha.
   */
  const matchKg =
    nome.match(/(\d+(?:\.\d+)?)\s*KG\b/);

  if (matchKg) {
    return numeroLegado(matchKg[1]);
  }

  return 0;

}

export function obterKgBaseTecnico(produtoMestre = {}, rota = {}) {

  return numeroLegado(
    rota.kgDia ??
    rota.kgBase ??
    rota.avgKg ??
    produtoMestre.kgDia ??
    produtoMestre.kgBase ??
    produtoMestre.avgKg ??
    produtoMestre.demandaKgBase ??
    0
  );

}

export function calcularKgPlanejadoLegado({
  produtoMestre = {},
  rota = {},
  quantidadeCSV = 0,
  kgPorUnidadeTXT = 0
} = {}) {

  const quantidade =
    numeroLegado(quantidadeCSV);

  const nome =
    produtoMestre.nomeOficial ||
    produtoMestre.descricaoCSV ||
    produtoMestre.descricaoTXT ||
    produtoMestre.descricao ||
    rota.descricaoCSV ||
    rota.descricaoTXT ||
    rota.descricao ||
    "";

  const pesoEmbalagemKg =
    extrairPesoEmbalagemKgLegado(nome);

  if (
    quantidade > 0 &&
    pesoEmbalagemKg > 0
  ) {

    const kgPlanejado =
      quantidade * pesoEmbalagemKg;

    return {
      kgPlanejado,
      kgPorUnidadeOperacional: pesoEmbalagemKg,
      origemKg: "LEGADO_EMBALAGEM_KG_NOME",
      pesoEmbalagemKg
    };

  }

  const kgBaseTecnico =
    obterKgBaseTecnico(
      produtoMestre,
      rota
    );

  if (kgBaseTecnico > 0) {

    return {
      kgPlanejado: kgBaseTecnico,
      kgPorUnidadeOperacional:
        quantidade > 0
          ? kgBaseTecnico / quantidade
          : 0,
      origemKg: "LEGADO_KG_BASE_TECNICO",
      pesoEmbalagemKg: 0
    };

  }

  const kgUnitario =
    numeroLegado(kgPorUnidadeTXT);

  if (
    quantidade > 0 &&
    kgUnitario > 0
  ) {

    return {
      kgPlanejado: quantidade * kgUnitario,
      kgPorUnidadeOperacional: kgUnitario,
      origemKg: "FALLBACK_QTD_X_KG_UN_TXT",
      pesoEmbalagemKg: 0
    };

  }

  return {
    kgPlanejado: 0,
    kgPorUnidadeOperacional: 0,
    origemKg: "SEM_KG_TECNICO",
    pesoEmbalagemKg: 0
  };

}

export function calcularTempoProducaoLegadoMin(
  kgPlanejado,
  produtividadeKgHora
) {

  const kg =
    numeroLegado(kgPlanejado);

  const produtividade =
    numeroLegado(produtividadeKgHora);

  if (
    kg <= 0 ||
    produtividade <= 0
  ) {
    return 0;
  }

  return Math.max(
    1,
    Math.round(
      (kg / produtividade) * 60
    )
  );

}
