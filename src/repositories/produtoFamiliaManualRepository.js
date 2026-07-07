import {
  carregarProdutosMestre,
  salvarProdutosMestre
} from "./cadastroMestreRepository.js";

const STORAGE_KEY =
  "jfc_flow_produto_familia_manual_v1";

function normalizarCodigo(
  codigo
) {

  return String(
    codigo ?? ""
  ).trim();

}

function normalizarTexto(
  valor
) {

  return String(
    valor ?? ""
  ).trim();

}

function carregarMapa() {

  try {

    const bruto =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!bruto) {
      return {};
    }

    const dados =
      JSON.parse(
        bruto
      );

    return dados && typeof dados === "object"
      ? dados
      : {};

  } catch (erro) {

    console.error(
      "Erro ao carregar famílias manuais por produto:",
      erro
    );

    return {};

  }

}

function salvarMapa(
  mapa
) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(mapa)
  );

}

function atualizarRotaComFamiliaManual(
  rota,
  familiaManual
) {

  return {
    ...rota,

    familiaSetup:
      familiaManual,

    classeSetup:
      familiaManual,

    familia:
      familiaManual,

    familiaSequenciamento:
      familiaManual,

    familiaOperacional:
      familiaManual,

    familiaManualPCP:
      familiaManual,

    familiaManualAplicada:
      true
  };

}

function restaurarRotaFamiliaAutomatica(
  rota,
  familiaSetupOriginal,
  familiaSequenciamentoOriginal
) {

  return {
    ...rota,

    familiaSetup:
      familiaSetupOriginal || rota.familiaSetup,

    classeSetup:
      familiaSetupOriginal || rota.classeSetup,

    familia:
      familiaSetupOriginal || rota.familia,

    familiaSequenciamento:
      familiaSequenciamentoOriginal || rota.familiaSequenciamento,

    familiaOperacional:
      familiaSequenciamentoOriginal || rota.familiaOperacional,

    familiaManualPCP:
      null,

    familiaManualAplicada:
      false
  };

}

function aplicarFamiliaManualNoCadastroMestre(
  codigoProduto,
  familiaManual
) {

  const codigo =
    normalizarCodigo(
      codigoProduto
    );

  const familiaFinal =
    normalizarTexto(
      familiaManual
    );

  if (!codigo || !familiaFinal) {
    return null;
  }

  const produtos =
    carregarProdutosMestre();

  let produtoAtualizado =
    null;

  const produtosAtualizados =
    produtos.map(produto => {

      const mesmoCodigo =
        normalizarCodigo(produto.codigo) === codigo;

      if (!mesmoCodigo) {
        return produto;
      }

      const familiaSetupAntesManual =
        produto.familiaSetupAntesManual ||
        produto.familiaSetup ||
        produto.classeSetup ||
        produto.familia ||
        "";

      const familiaSequenciamentoAntesManual =
        produto.familiaSequenciamentoAntesManual ||
        produto.familiaSequenciamento ||
        produto.familiaOperacional ||
        produto.familiaSetup ||
        produto.classeSetup ||
        "";

      const rotasTecnicas =
        Array.isArray(produto.rotasTecnicas)
          ? produto.rotasTecnicas.map(rota => {

              return atualizarRotaComFamiliaManual(
                rota,
                familiaFinal
              );

            })
          : [];

      produtoAtualizado = {
        ...produto,

        familiaSetupAntesManual,

        familiaSequenciamentoAntesManual,

        familiaSetup:
          familiaFinal,

        classeSetup:
          familiaFinal,

        familia:
          familiaFinal,

        familiaSequenciamento:
          familiaFinal,

        familiaOperacional:
          familiaFinal,

        familiaManualPCP:
          familiaFinal,

        familiaManualAplicada:
          true,

        familiaManualAtualizadaEm:
          new Date().toISOString(),

        rotasTecnicas,

        atualizadoEm:
          new Date().toISOString()
      };

      return produtoAtualizado;

    });

  if (produtoAtualizado) {
    salvarProdutosMestre(
      produtosAtualizados
    );
  }

  return produtoAtualizado;

}

function removerFamiliaManualDoCadastroMestre(
  codigoProduto
) {

  const codigo =
    normalizarCodigo(
      codigoProduto
    );

  if (!codigo) {
    return null;
  }

  const produtos =
    carregarProdutosMestre();

  let produtoAtualizado =
    null;

  const produtosAtualizados =
    produtos.map(produto => {

      const mesmoCodigo =
        normalizarCodigo(produto.codigo) === codigo;

      if (!mesmoCodigo) {
        return produto;
      }

      const familiaSetupOriginal =
        produto.familiaSetupAntesManual ||
        produto.familiaSetup ||
        produto.classeSetup ||
        "";

      const familiaSequenciamentoOriginal =
        produto.familiaSequenciamentoAntesManual ||
        produto.familiaSequenciamento ||
        produto.familiaOperacional ||
        familiaSetupOriginal ||
        "";

      const rotasTecnicas =
        Array.isArray(produto.rotasTecnicas)
          ? produto.rotasTecnicas.map(rota => {

              return restaurarRotaFamiliaAutomatica(
                rota,
                familiaSetupOriginal,
                familiaSequenciamentoOriginal
              );

            })
          : [];

      produtoAtualizado = {
        ...produto,

        familiaSetup:
          familiaSetupOriginal,

        classeSetup:
          familiaSetupOriginal,

        familia:
          familiaSetupOriginal,

        familiaSequenciamento:
          familiaSequenciamentoOriginal,

        familiaOperacional:
          familiaSequenciamentoOriginal,

        familiaManualPCP:
          null,

        familiaManualAplicada:
          false,

        rotasTecnicas,

        atualizadoEm:
          new Date().toISOString()
      };

      return produtoAtualizado;

    });

  if (produtoAtualizado) {
    salvarProdutosMestre(
      produtosAtualizados
    );
  }

  return produtoAtualizado;

}

export function sincronizarCadastroMestreComFamiliasManuais() {

  const mapa =
    carregarMapa();

  const entradas =
    Object.entries(mapa)
      .map(([codigo, familia]) => ({
        codigo:
          normalizarCodigo(codigo),

        familia:
          normalizarTexto(familia)
      }))
      .filter(item => item.codigo && item.familia);

  if (entradas.length === 0) {
    return {
      total: 0,
      alterados: 0
    };
  }

  const produtos =
    carregarProdutosMestre();

  let alterados =
    0;

  const produtosAtualizados =
    produtos.map(produto => {

      const codigoProduto =
        normalizarCodigo(
          produto.codigo
        );

      const entrada =
        entradas.find(item => item.codigo === codigoProduto);

      if (!entrada) {
        return produto;
      }

      const jaAplicado =
        produto.familiaManualAplicada === true &&
        normalizarTexto(produto.familiaManualPCP) === entrada.familia &&
        normalizarTexto(produto.familiaSetup) === entrada.familia &&
        normalizarTexto(produto.familiaSequenciamento) === entrada.familia;

      if (jaAplicado) {
        return produto;
      }

      alterados += 1;

      const familiaSetupAntesManual =
        produto.familiaSetupAntesManual ||
        produto.familiaSetup ||
        produto.classeSetup ||
        produto.familia ||
        "";

      const familiaSequenciamentoAntesManual =
        produto.familiaSequenciamentoAntesManual ||
        produto.familiaSequenciamento ||
        produto.familiaOperacional ||
        produto.familiaSetup ||
        produto.classeSetup ||
        "";

      const rotasTecnicas =
        Array.isArray(produto.rotasTecnicas)
          ? produto.rotasTecnicas.map(rota => {

              return atualizarRotaComFamiliaManual(
                rota,
                entrada.familia
              );

            })
          : [];

      return {
        ...produto,

        familiaSetupAntesManual,

        familiaSequenciamentoAntesManual,

        familiaSetup:
          entrada.familia,

        classeSetup:
          entrada.familia,

        familia:
          entrada.familia,

        familiaSequenciamento:
          entrada.familia,

        familiaOperacional:
          entrada.familia,

        familiaManualPCP:
          entrada.familia,

        familiaManualAplicada:
          true,

        familiaManualAtualizadaEm:
          new Date().toISOString(),

        rotasTecnicas,

        atualizadoEm:
          new Date().toISOString()
      };

    });

  if (alterados > 0) {
    salvarProdutosMestre(
      produtosAtualizados
    );
  }

  return {
    total:
      entradas.length,

    alterados
  };

}

export function buscarFamiliaManualProduto(
  codigoProduto
) {

  const codigo =
    normalizarCodigo(
      codigoProduto
    );

  if (!codigo) {
    return null;
  }

  const mapa =
    carregarMapa();

  return mapa[codigo] || null;

}

export function salvarFamiliaManualProduto(
  codigoProduto,
  familia
) {

  const codigo =
    normalizarCodigo(
      codigoProduto
    );

  const familiaFinal =
    normalizarTexto(
      familia
    );

  if (!codigo || !familiaFinal) {
    return null;
  }

  const mapa =
    carregarMapa();

  mapa[codigo] =
    familiaFinal;

  salvarMapa(
    mapa
  );

  aplicarFamiliaManualNoCadastroMestre(
    codigo,
    familiaFinal
  );

  return familiaFinal;

}

export function removerFamiliaManualProduto(
  codigoProduto
) {

  const codigo =
    normalizarCodigo(
      codigoProduto
    );

  if (!codigo) {
    return;
  }

  const mapa =
    carregarMapa();

  delete mapa[codigo];

  salvarMapa(
    mapa
  );

  removerFamiliaManualDoCadastroMestre(
    codigo
  );

}

export function salvarFamiliasManuaisProdutos(
  codigosProdutos = [],
  familia
) {

  const familiaFinal =
    normalizarTexto(
      familia
    );

  if (!familiaFinal) {
    return [];
  }

  const codigosValidos =
    Array.from(
      new Set(
        (codigosProdutos || [])
          .map(normalizarCodigo)
          .filter(Boolean)
      )
    );

  if (codigosValidos.length === 0) {
    return [];
  }

  const mapa =
    carregarMapa();

  codigosValidos.forEach(codigo => {

    mapa[codigo] =
      familiaFinal;

  });

  salvarMapa(
    mapa
  );

  codigosValidos.forEach(codigo => {

    aplicarFamiliaManualNoCadastroMestre(
      codigo,
      familiaFinal
    );

  });

  return codigosValidos;

}

export function removerFamiliasManuaisProdutos(
  codigosProdutos = []
) {

  const codigosValidos =
    Array.from(
      new Set(
        (codigosProdutos || [])
          .map(normalizarCodigo)
          .filter(Boolean)
      )
    );

  if (codigosValidos.length === 0) {
    return [];
  }

  const mapa =
    carregarMapa();

  codigosValidos.forEach(codigo => {

    delete mapa[codigo];

  });

  salvarMapa(
    mapa
  );

  codigosValidos.forEach(codigo => {

    removerFamiliaManualDoCadastroMestre(
      codigo
    );

  });

  return codigosValidos;

}
