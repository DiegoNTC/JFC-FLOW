
import { formatarHora } from "../core/utils.js";

export function renderCard(
  dropzone,
  produto,
  setup,
  inicioProduto,
  fimProduto
) {

  const item =
    document.createElement("div");

  item.classList.add(
    "sequenced-item"
  );

  item.innerHTML = `

    <div class="item-header">

      <div class="item-title">
        ${produto.nome}
      </div>

      <div class="item-actions">

        <button
          class="move-btn"
          onclick="removerItem('${produto.id}')"
        >
          ✕
        </button>

      </div>

    </div>

    <div class="item-badges">

      <span class="badge badge-category">
        ${produto.categoria}
      </span>

      <span class="badge badge-weight">
        ${produto.peso}
      </span>

      <span class="badge badge-time">
        ${produto.tempo} min
      </span>

      <span class="badge badge-setup">
        Setup ${setup}m
      </span>

    </div>

    <div class="item-time">

      <span>
        ${formatarHora(inicioProduto)}
      </span>

      →

      <span>
        ${formatarHora(fimProduto)}
      </span>

    </div>

  `;

  dropzone.appendChild(item);

}