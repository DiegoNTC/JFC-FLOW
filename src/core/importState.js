/**
 * ======================================================
 * JFC FLOW
 * Módulo: importState
 *
 * Responsabilidade:
 * Guardar temporariamente os arquivos importados e manter
 * cache local da Base Técnica nativa carregada via JSON.
 *
 * Observação:
 * O CSV continua sendo importado no uso diário.
 * A Base Técnica pode vir de data/base_tecnica.json ou do
 * TXT importado manualmente para manutenção.
 * ======================================================
 */

const STORAGE_BASE_TECNICA_CACHE =
  "jfc_flow_base_tecnica_cache_v1";

let dadosCSVAtual = [];

let baseTXTAtual = null;

function storageDisponivel() {

  return typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined";

}

function baseTecnicaValida(base) {

  return Boolean(
    base &&
    Array.isArray(base.produtosTecnicos) &&
    base.produtosTecnicos.length > 0
  );

}

function salvarBaseTecnicaCache(base) {

  if (!storageDisponivel() || !baseTecnicaValida(base)) {
    return;
  }

  try {

    window.localStorage.setItem(
      STORAGE_BASE_TECNICA_CACHE,
      JSON.stringify({
        atualizadoEm: new Date().toISOString(),
        baseTecnica: base
      })
    );

  } catch (erro) {

    console.warn(
      "Não foi possível salvar cache da base técnica:",
      erro
    );

  }

}

function carregarBaseTecnicaCache() {

  if (!storageDisponivel()) {
    return null;
  }

  try {

    const bruto =
      window.localStorage.getItem(
        STORAGE_BASE_TECNICA_CACHE
      );

    if (!bruto) {
      return null;
    }

    const payload =
      JSON.parse(bruto);

    const base =
      payload?.baseTecnica || payload;

    return baseTecnicaValida(base)
      ? base
      : null;

  } catch (erro) {

    console.warn(
      "Não foi possível carregar cache da base técnica:",
      erro
    );

    return null;

  }

}

export function setDadosCSV(dados) {

  dadosCSVAtual = Array.isArray(dados)
    ? dados
    : [];

}

export function getDadosCSV() {

  return dadosCSVAtual;

}

export function setBaseTXT(base) {

  baseTXTAtual = base || null;

  if (baseTecnicaValida(baseTXTAtual)) {
    salvarBaseTecnicaCache(baseTXTAtual);
  }

}

export function getBaseTXT() {

  if (baseTecnicaValida(baseTXTAtual)) {
    return baseTXTAtual;
  }

  const baseCache =
    carregarBaseTecnicaCache();

  if (baseCache) {
    baseTXTAtual = baseCache;
  }

  return baseTXTAtual;

}

export function limparImportacoes() {

  dadosCSVAtual = [];

  /**
   * Não apagamos o cache da Base Técnica aqui.
   * A base técnica nativa deve continuar disponível para
   * o próximo CSV do dia.
   */
  baseTXTAtual = null;

}

export function limparCacheBaseTecnica() {

  baseTXTAtual = null;

  if (storageDisponivel()) {
    window.localStorage.removeItem(
      STORAGE_BASE_TECNICA_CACHE
    );
  }

}
