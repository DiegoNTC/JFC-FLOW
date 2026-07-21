/**
 * ======================================================
 * JFC FLOW
 * Modulo: materiaPrimaRepository
 * Versao: 1.0.0
 *
 * Responsabilidade:
 * Persistir localmente a planilha de materia-prima importada.
 * ======================================================
 */

const STORAGE_KEY =
  "jfc_flow_materia_prima_xlsx_v1";

function clonar(valor) {

  return JSON.parse(
    JSON.stringify(valor ?? null)
  );

}

export function setBaseMateriaPrima(baseMateriaPrima) {

  const base =
    clonar(baseMateriaPrima || {});

  window.jfcMateriaPrimaBase =
    base;

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(base)
    );

  } catch (erro) {

    console.warn(
      "Nao foi possivel salvar a base de materia-prima no localStorage.",
      erro
    );

  }

  return base;

}

export function getBaseMateriaPrima() {

  if (
    window.jfcMateriaPrimaBase &&
    Array.isArray(window.jfcMateriaPrimaBase.registros)
  ) {
    return window.jfcMateriaPrimaBase;
  }

  try {

    const bruto =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!bruto) {
      return null;
    }

    const base =
      JSON.parse(bruto);

    if (
      !base ||
      !Array.isArray(base.registros)
    ) {
      return null;
    }

    window.jfcMateriaPrimaBase =
      base;

    return base;

  } catch (erro) {

    console.warn(
      "Nao foi possivel carregar a base de materia-prima local.",
      erro
    );

    return null;

  }

}

export function limparBaseMateriaPrima() {

  window.jfcMateriaPrimaBase =
    null;

  try {

    localStorage.removeItem(
      STORAGE_KEY
    );

  } catch (erro) {

    console.warn(
      "Nao foi possivel limpar a base de materia-prima local.",
      erro
    );

  }

}
