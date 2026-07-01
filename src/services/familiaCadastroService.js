import {
  carregarFamiliasSetup,
  buscarFamiliaSetupPorNome,
  mesclarFamiliasSetup,
  normalizarChaveFamilia
} from "../repositories/familiaSetupRepository.js";

import {
  inferirFamiliaSetup
} from "./familiaSetupService.js";

import {
  buscarFamiliaManualProduto
} from "../repositories/produtoFamiliaManualRepository.js";

export function normalizarNumeroOrdem(
  valor
) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(
      String(valor)
        .replace(",", ".")
        .trim()
    );

  if (Number.isNaN(numero)) {
    return null;
  }

  return numero;

}

export function obterOrdemTXTProduto(
  produto
) {

  return normalizarNumeroOrdem(
    produto.ordemTXT ??
    produto.ordemTxt ??
    produto.sequenciaTXT ??
    produto.sequenciaTxt ??
    produto.ordemBaseTXT ??
    produto.ordemBaseTxt ??
    produto.ordemRoteiro ??
    produto.sequenciaProducao ??
    produto.ordemProducaoTXT ??
    produto.ordem ??
    produto.sequencia
  );

}

export function obterOrdemManualProduto(
  produto
) {

  return normalizarNumeroOrdem(
    produto.ordemSequenciamentoManual ??
    produto.ordemManual ??
    produto.ordemPlanejadaManual
  );

}

export function obterNomeProdutoSequenciamento(
  produto
) {

  return String(
    produto.nomeOficial ??
    produto.nome ??
    produto.produto ??
    produto.descricao ??
    produto.descricaoCSV ??
    produto.descricaoTXT ??
    ""
  ).trim();

}

export function obterFamiliaBaseProduto(
  produto
) {

  const codigoProduto =
    String(
      produto.codigo ??
      produto.codigoProduto ??
      produto.codProduto ??
      ""
    ).trim();

  const familiaManual =
    buscarFamiliaManualProduto(
      codigoProduto
    );

  if (familiaManual) {
    return familiaManual;
  }

  const familiaDireta =
    produto.familiaSetupOriginal ??
    produto.familiaSetup ??
    produto.familia ??
    produto.classeSetup ??
    produto.grupoSetup ??
    produto.categoriaSetup ??
    produto.grupo ??
    "";

  const familiaNormalizada =
    String(
      familiaDireta ?? ""
    ).trim();

  if (familiaNormalizada) {
    return familiaNormalizada;
  }

  return inferirFamiliaSetup(
    obterNomeProdutoSequenciamento(
      produto
    )
  );

}

export function montarFamiliasBaseAPartirProdutos(
  produtos = []
) {

  const mapa =
    new Map();

  produtos.forEach(produto => {

    const familiaOriginal =
      obterFamiliaBaseProduto(
        produto
      );

    const chave =
      normalizarChaveFamilia(
        familiaOriginal
      );

    if (!chave) {
      return;
    }

    const ordemTXT =
      obterOrdemTXTProduto(
        produto
      );

    const setupTrocaMin =
      normalizarNumeroOrdem(
        produto.setupTrocaMin ??
        produto.setupMin ??
        produto.tempoSetupMin ??
        produto.setup
      );

    const existente =
      mapa.get(
        chave
      );

    if (!existente) {

      mapa.set(
        chave,
        {
          chave,

          familiaOriginal,

          nomeFamilia:
            familiaOriginal,

          nomeTXTReferencia:
            familiaOriginal,

          ordemTXT,

          setupTrocaMin,

          ativa:
            true
        }
      );

      return;

    }

    if (
      existente.ordemTXT === null ||
      existente.ordemTXT === undefined ||
      (
        ordemTXT !== null &&
        ordemTXT < existente.ordemTXT
      )
    ) {

      existente.ordemTXT =
        ordemTXT;

    }

    if (
      existente.setupTrocaMin === null ||
      existente.setupTrocaMin === undefined
    ) {

      existente.setupTrocaMin =
        setupTrocaMin;

    }

  });

  return Array.from(
    mapa.values()
  );

}

export function sincronizarFamiliasComProdutos(
  produtos = []
) {

  const familiasBase =
    montarFamiliasBaseAPartirProdutos(
      produtos
    );

  return mesclarFamiliasSetup(
    familiasBase
  );

}

export function aplicarFamiliaCadastradaAoProduto(
  produto
) {

  const familiaBase =
    obterFamiliaBaseProduto(
      produto
    );

  const cadastro =
    buscarFamiliaSetupPorNome(
      familiaBase
    );

  if (
    !cadastro ||
    cadastro.ativa === false
  ) {

    return {
      ...produto,

      familiaSetupOriginal:
        familiaBase,

      familiaSetup:
        familiaBase,

      familiaTXTReferencia:
        familiaBase,

      ordemFamiliaTXT:
        obterOrdemTXTProduto(
          produto
        )
    };

  }

  const ordemFamiliaTXT =
    normalizarNumeroOrdem(
      cadastro.ordemTXT
    );

  const setupFamilia =
    normalizarNumeroOrdem(
      cadastro.setupTrocaMin
    );

  return {
    ...produto,

    familiaSetupOriginal:
      familiaBase,

    familiaSetup:
      cadastro.nomeFamilia ||
      familiaBase,

    classeSetup:
      cadastro.nomeFamilia ||
      familiaBase,

    familiaTXTReferencia:
      cadastro.nomeTXTReferencia ||
      familiaBase,

    ordemFamiliaTXT:
      ordemFamiliaTXT ??
      obterOrdemTXTProduto(
        produto
      ),

    setupTrocaMin:
      setupFamilia ??
      produto.setupTrocaMin,

    setupBaseMin:
      setupFamilia ??
      produto.setupBaseMin ??
      produto.setupTrocaMin
  };

}

export function obterOrdemFamiliaProduto(
  produto
) {

  const familiaBase =
    produto.familiaSetupOriginal ||
    obterFamiliaBaseProduto(
      produto
    );

  const cadastro =
    buscarFamiliaSetupPorNome(
      familiaBase
    );

  const ordemCadastro =
    normalizarNumeroOrdem(
      cadastro?.ordemTXT
    );

  if (ordemCadastro !== null) {
    return ordemCadastro;
  }

  return normalizarNumeroOrdem(
    produto.ordemFamiliaTXT
  );

}

export function compararProdutosPorOrdemFamiliaTXT(
  produtoA,
  produtoB
) {

  const ordemManualA =
    obterOrdemManualProduto(
      produtoA
    );

  const ordemManualB =
    obterOrdemManualProduto(
      produtoB
    );

  if (
    ordemManualA !== null ||
    ordemManualB !== null
  ) {

    return (
      (ordemManualA ?? 999999) -
      (ordemManualB ?? 999999)
    );

  }

  const ordemFamiliaA =
    obterOrdemFamiliaProduto(
      produtoA
    );

  const ordemFamiliaB =
    obterOrdemFamiliaProduto(
      produtoB
    );

  if (
    ordemFamiliaA !== null ||
    ordemFamiliaB !== null
  ) {

    return (
      (ordemFamiliaA ?? 999999) -
      (ordemFamiliaB ?? 999999)
    );

  }

  const ordemTXTA =
    obterOrdemTXTProduto(
      produtoA
    );

  const ordemTXTB =
    obterOrdemTXTProduto(
      produtoB
    );

  if (
    ordemTXTA !== null ||
    ordemTXTB !== null
  ) {

    return (
      (ordemTXTA ?? 999999) -
      (ordemTXTB ?? 999999)
    );

  }

  const familiaA =
    obterFamiliaBaseProduto(
      produtoA
    );

  const familiaB =
    obterFamiliaBaseProduto(
      produtoB
    );

  const comparacaoFamilia =
    String(familiaA)
      .localeCompare(
        String(familiaB),
        "pt-BR"
      );

  if (comparacaoFamilia !== 0) {
    return comparacaoFamilia;
  }

  return obterNomeProdutoSequenciamento(
    produtoA
  ).localeCompare(
    obterNomeProdutoSequenciamento(produtoB),
    "pt-BR"
  );

}

export function obterFamiliasCadastradasOrdenadas() {

  return carregarFamiliasSetup()
    .sort((a, b) => {

      const ordemA =
        normalizarNumeroOrdem(
          a.ordemTXT
        ) ?? 999999;

      const ordemB =
        normalizarNumeroOrdem(
          b.ordemTXT
        ) ?? 999999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(a.nomeFamilia || "")
        .localeCompare(
          String(b.nomeFamilia || ""),
          "pt-BR"
        );

    });

}