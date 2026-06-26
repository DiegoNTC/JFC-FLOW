/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderEditorCapacidade
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Renderizar editor de capacidade por linha.
 * ======================================================
 */

import {
  carregarCapacidades,
  salvarCapacidades,
  resetarCapacidades
} from "../repositories/capacidadeRepository.js";

function criarLinhaInput(linha, dados) {

  return `
    <div class="capacidade-row">

      <label>
        <span>${linha}</span>
        <input
          type="number"
          min="0"
          step="1"
          value="${dados.capacidadeMin}"
          data-linha="${linha}"
          class="capacidade-input"
        >
      </label>

      <small>${dados.descricao || ""}</small>

    </div>
  `;

}

export function renderEditorCapacidade(
  onAtualizar = null
) {

  const container =
    document.getElementById("capacidadeContainer");

  if (!container) {
    console.warn("Container capacidadeContainer não encontrado.");
    return;
  }

  const capacidades =
    carregarCapacidades();

  container.innerHTML = `
    <section class="capacidade-card">

      <div class="capacidade-header">

        <div>
          <h2>Capacidade por Linha</h2>
          <p>
            Informe a capacidade disponível em minutos para cada linha.
            O planejamento será recalculado com esses valores.
          </p>
        </div>

        <span class="capacidade-badge">
          Editável
        </span>

      </div>

      <div class="capacidade-grid">
        ${Object.entries(capacidades)
          .map(([linha, dados]) => criarLinhaInput(linha, dados))
          .join("")}
      </div>

      <div class="capacidade-actions">

        <button id="salvarCapacidadeBtn" class="action-button">
          Salvar capacidades
        </button>

        <button id="resetarCapacidadeBtn" class="action-button secondary-action">
          Resetar 480 min
        </button>

      </div>

    </section>
  `;

  const salvarBtn =
    document.getElementById("salvarCapacidadeBtn");

  const resetarBtn =
    document.getElementById("resetarCapacidadeBtn");

  salvarBtn?.addEventListener("click", () => {

    const inputs =
      container.querySelectorAll(".capacidade-input");

    const novasCapacidades = {};

    inputs.forEach(input => {

      novasCapacidades[input.dataset.linha] = {

        capacidadeMin: Number(input.value) || 0

      };

    });

    salvarCapacidades(novasCapacidades);

    alert("Capacidades salvas com sucesso.");

    if (typeof onAtualizar === "function") {
      onAtualizar();
    }

  });

  resetarBtn?.addEventListener("click", () => {

    resetarCapacidades();

    renderEditorCapacidade(onAtualizar);

    if (typeof onAtualizar === "function") {
      onAtualizar();
    }

  });

}