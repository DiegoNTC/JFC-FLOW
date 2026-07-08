/**
 * ======================================================
 * JFC FLOW
 * Módulo: sequenciamentoManualRepository
 *
 * Responsabilidade:
 * Persistir no localStorage a ordem manual dos blocos
 * de família por linha.
 *
 * Regra:
 * Depois que o PCP movimenta uma família no sequenciamento,
 * a sequência passa a ser manual e tem prioridade sobre TXT.
 * Só muda novamente se o PCP movimentar manualmente de novo
 * ou se limpar o armazenamento manual.
 * ======================================================
 */

const STORAGE_KEY =
  "jfc_flow_sequencia_manual_familias_por_linha_v1";

function texto(valor) {

  return String(valor ?? "").trim();

}

function normalizarChave(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

function normalizarLinha(linha) {

  return normalizarChave(linha);

}

function normalizarFamilia(familia) {

  return normalizarChave(familia);

}

function storageDisponivel() {

  return typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined";

}

export function carregarSequenciasManuaisFamilia() {

  if (!storageDisponivel()) {
    return {};
  }

  try {

    const bruto =
      window.localStorage.getItem(
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
      "Erro ao carregar sequência manual de famílias:",
      erro
    );

    return {};

  }

}

function salvarSequenciasManuaisFamilia(
  dados = {}
) {

  if (!storageDisponivel()) {
    return dados;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(dados)
  );

  return dados;

}

export function salvarSequenciaManualFamiliasLinha(
  linha,
  familiasOrdenadas = []
) {

  const chaveLinha =
    normalizarLinha(linha);

  if (!chaveLinha) {
    return null;
  }

  const familiasValidas =
    Array.from(
      new Set(
        (familiasOrdenadas || [])
          .map(texto)
          .filter(Boolean)
      )
    );

  if (familiasValidas.length === 0) {
    return null;
  }

  const registroFamilias =
    familiasValidas.map((familia, indice) => {

      return {
        chave:
          normalizarFamilia(familia),

        familia,

        ordem:
          indice + 1
      };

    });

  const dados =
    carregarSequenciasManuaisFamilia();

  dados[chaveLinha] = {
    linha:
      texto(linha),

    atualizadoEm:
      new Date().toISOString(),

    familias:
      registroFamilias
  };

  salvarSequenciasManuaisFamilia(
    dados
  );

  return dados[chaveLinha];

}

export function obterSequenciaManualFamiliasLinha(
  linha
) {

  const chaveLinha =
    normalizarLinha(linha);

  if (!chaveLinha) {
    return null;
  }

  const dados =
    carregarSequenciasManuaisFamilia();

  return dados[chaveLinha] || null;

}

export function obterOrdemManualFamilia(
  linha,
  familia
) {

  const sequenciaLinha =
    obterSequenciaManualFamiliasLinha(
      linha
    );

  if (!sequenciaLinha) {
    return null;
  }

  const chaveFamilia =
    normalizarFamilia(
      familia
    );

  if (!chaveFamilia) {
    return null;
  }

  const registro =
    (sequenciaLinha.familias || [])
      .find(item => {

        return normalizarFamilia(
          item.chave || item.familia
        ) === chaveFamilia;

      });

  if (!registro) {
    return null;
  }

  const ordem =
    Number(registro.ordem);

  return Number.isFinite(ordem)
    ? ordem
    : null;

}

export function limparSequenciaManualFamiliasLinha(
  linha
) {

  const chaveLinha =
    normalizarLinha(linha);

  if (!chaveLinha) {
    return {};
  }

  const dados =
    carregarSequenciasManuaisFamilia();

  delete dados[chaveLinha];

  return salvarSequenciasManuaisFamilia(
    dados
  );

}

export function limparTodasSequenciasManuaisFamilia() {

  if (storageDisponivel()) {
    window.localStorage.removeItem(
      STORAGE_KEY
    );
  }

  return {};

}
