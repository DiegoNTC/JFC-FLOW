const STORAGE_KEY =
  "jfc_flow_produto_familia_manual_v1";

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

export function buscarFamiliaManualProduto(
  codigoProduto
) {

  const codigo =
    String(codigoProduto ?? "").trim();

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
    String(codigoProduto ?? "").trim();

  const familiaFinal =
    String(familia ?? "").trim();

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

  return familiaFinal;

}

export function removerFamiliaManualProduto(
  codigoProduto
) {

  const codigo =
    String(codigoProduto ?? "").trim();

  if (!codigo) {
    return;
  }

  const mapa =
    carregarMapa();

  delete mapa[codigo];

  salvarMapa(
    mapa
  );

}