/**
 * ======================================================
 * JFC FLOW
 * Módulo: capacidadeRepository
 * Versão: 1.0.1
 *
 * Responsabilidade:
 * Guardar e consultar capacidade por linha.
 *
 * Usa localStorage por enquanto.
 * ======================================================
 */

import {
  capacidadeLinhas,
  capacidadePadraoMin
} from "../data/capacidadeLinhas.js";

const STORAGE_CAPACIDADES =
  "jfc_flow_capacidades_linhas";

function lerStorage() {

  try {

    const dados =
      localStorage.getItem(STORAGE_CAPACIDADES);

    if (!dados) {
      return {};
    }

    return JSON.parse(dados);

  } catch (erro) {

    console.error(
      "Erro ao ler capacidades do localStorage:",
      erro
    );

    return {};

  }

}

function salvarStorage(capacidades) {

  try {

    localStorage.setItem(
      STORAGE_CAPACIDADES,
      JSON.stringify(capacidades)
    );

  } catch (erro) {

    console.error(
      "Erro ao salvar capacidades no localStorage:",
      erro
    );

  }

}

export function carregarCapacidades() {

  const salvas =
    lerStorage();

  const resultado = {};

  Object.keys(capacidadeLinhas).forEach(linha => {

    resultado[linha] = {

      ...capacidadeLinhas[linha],

      capacidadeMin:
        Number(salvas[linha]?.capacidadeMin) ||
        capacidadeLinhas[linha].capacidadeMin ||
        capacidadePadraoMin

    };

  });

  return resultado;

}

export function getCapacidadeLinha(linha) {

  const capacidades =
    carregarCapacidades();

  return (
    Number(capacidades[linha]?.capacidadeMin) ||
    capacidadePadraoMin
  );

}

export function salvarCapacidadeLinha(
  linha,
  capacidadeMin
) {

  const capacidades =
    carregarCapacidades();

  capacidades[linha] = {

    ...(capacidades[linha] || {}),

    capacidadeMin:
      Number(capacidadeMin) || capacidadePadraoMin

  };

  salvarStorage(capacidades);

  return capacidades;

}

export function salvarCapacidades(listaCapacidades) {

  const capacidades =
    carregarCapacidades();

  Object.entries(listaCapacidades || {}).forEach(
    ([linha, dados]) => {

      capacidades[linha] = {

        ...(capacidades[linha] || {}),

        capacidadeMin:
          Number(dados.capacidadeMin) ||
          Number(dados) ||
          capacidadePadraoMin

      };

    }
  );

  salvarStorage(capacidades);

  return capacidades;

}

export function resetarCapacidades() {

  localStorage.removeItem(STORAGE_CAPACIDADES);

  return carregarCapacidades();

}