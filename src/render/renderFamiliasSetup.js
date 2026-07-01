import {
    carregarProdutosMestre
} from "../repositories/cadastroMestreRepository.js";

import {
    salvarFamiliasSetup,
    normalizarChaveFamilia
} from "../repositories/familiaSetupRepository.js";

import {
    sincronizarFamiliasComProdutos,
    normalizarNumeroOrdem,
    obterFamiliaBaseProduto,
    obterOrdemTXTProduto
} from "../services/familiaCadastroService.js";

import {
    buscarFamiliaManualProduto,
    salvarFamiliaManualProduto,
    removerFamiliaManualProduto
} from "../repositories/produtoFamiliaManualRepository.js";

function escaparHTML(
    valor
) {

    return String(
        valor ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function valorInput(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return escaparHTML(
        valor
    );

}

function obterNomeProduto(
    produto
) {

    return String(
        produto.nomeOficial ||
        produto.descricaoCSV ||
        produto.nome ||
        produto.produto ||
        produto.descricaoTXT ||
        ""
    ).trim();

}

function obterCodigoProduto(
    produto
) {

    return String(
        produto.codigo ||
        produto.codigoProduto ||
        produto.codProduto ||
        "-"
    ).trim();

}

function obterLinhasProduto(
    produto
) {

    const rotas =
        Array.isArray(produto.rotasTecnicas)
            ? produto.rotasTecnicas
            : [];

    const linhasRotas =
        rotas
            .map(rota => rota.linha)
            .filter(Boolean);

    const linhas =
        linhasRotas.length > 0
            ? linhasRotas
            : [
                produto.linha,
                produto.linhaPrincipal,
                produto.linhaPlanejada
            ].filter(Boolean);

    const linhasUnicas =
        Array.from(
            new Set(linhas)
        );

    return linhasUnicas.length > 0
        ? linhasUnicas.join(" / ")
        : "-";

}

function obterDemandaProduto(
    produto
) {

    return (
        produto.demandaReferencia ??
        produto.demandaFinal ??
        produto.demanda ??
        "-"
    );

}

function montarMapaItensPorFamilia(
    produtosMestre = []
) {

    const mapa =
        new Map();

    produtosMestre.forEach(produto => {

        const familiaBase =
            obterFamiliaBaseProduto(
                produto
            );

        const chaveFamilia =
            normalizarChaveFamilia(
                familiaBase
            );

        if (!chaveFamilia) {
            return;
        }

        if (!mapa.has(chaveFamilia)) {
            mapa.set(chaveFamilia, []);
        }

        mapa.get(chaveFamilia).push({
            codigo:
                obterCodigoProduto(produto),

            nome:
                obterNomeProduto(produto),

            linhas:
                obterLinhasProduto(produto),

            demanda:
                obterDemandaProduto(produto),

            ordemTXT:
                obterOrdemTXTProduto(produto),

            familiaAtual:
                familiaBase,

            familiaManual:
                buscarFamiliaManualProduto(
                    obterCodigoProduto(produto)
                )
        });

    });

    mapa.forEach(itens => {

        itens.sort((a, b) => {

            const ordemA =
                a.ordemTXT ?? 999999;

            const ordemB =
                b.ordemTXT ?? 999999;

            if (ordemA !== ordemB) {
                return ordemA - ordemB;
            }

            return String(a.nome)
                .localeCompare(
                    String(b.nome),
                    "pt-BR"
                );

        });

    });

    return mapa;

}

function renderItensFamilia(
    itens = [],
    familias = []
) {

    if (!itens || itens.length === 0) {

        return `
      <details class="familia-itens-details">

        <summary>
          Ver itens
        </summary>

        <div class="familia-itens-empty">
          Nenhum item encontrado para esta família.
        </div>

      </details>
    `;

    }

    const opcoesFamilia =
        familias.map(familia => {

            const nomeOpcao =
                familia.nomeFamilia ||
                familia.familiaOriginal;

            const valorOpcao =
                familia.familiaOriginal ||
                familia.nomeFamilia;

            return `
        <option value="${escaparHTML(valorOpcao)}">
          ${escaparHTML(nomeOpcao)}
        </option>
      `;

        }).join("");

    return `
    <details class="familia-itens-details">

      <summary>
        Ver itens (${itens.length})
      </summary>

      <div class="familia-itens-wrapper">

        <table class="familia-itens-table">

          <thead>
            <tr>
              <th>Ordem TXT</th>
              <th>Código</th>
              <th>Produto</th>
              <th>Linha</th>
              <th>Demanda</th>
              <th>Família atual</th>
              <th>Mover para</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            ${itens.map(item => {

        return `
                <tr data-item-codigo="${escaparHTML(item.codigo)}">

                  <td>${escaparHTML(item.ordemTXT ?? "-")}</td>

                  <td>${escaparHTML(item.codigo)}</td>

                  <td class="familia-item-produto">
                    ${escaparHTML(item.nome)}

                    ${item.familiaManual
                ? `<span class="familia-manual-tag">Manual</span>`
                : ""
            }
                  </td>

                  <td>${escaparHTML(item.linhas)}</td>

                  <td>${escaparHTML(item.demanda)}</td>

                  <td>
                    <strong>${escaparHTML(item.familiaAtual)}</strong>
                  </td>

                  <td>
                    <select data-transferir-familia-select>
                      <option value="__AUTO__">
                        Automático
                      </option>

                      ${opcoesFamilia}
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      class="familia-transferir-btn"
                      data-transferir-familia-btn
                    >
                      Transferir
                    </button>
                  </td>

                </tr>
              `;

    }).join("")}
          </tbody>

        </table>

      </div>

    </details>
  `;

}

function renderLinhaFamilia(
    familia,
    indice,
    itensPorFamilia = new Map(),
    familias = []
) {

    const itens =
        itensPorFamilia.get(
            familia.chave
        ) || [];

    return `
    <tr
      data-familia-chave="${escaparHTML(familia.chave)}"
      data-familia-original="${escaparHTML(familia.familiaOriginal)}"
    >

      <td>
        <strong>${indice + 1}</strong>
      </td>

      <td class="familia-original-cell">

        <strong>${escaparHTML(familia.familiaOriginal)}</strong>

        <small>
          Família detectada pelo sistema
        </small>

        ${renderItensFamilia(itens, familias)}

      </td>

      <td>
        <input
          type="text"
          data-campo="nomeFamilia"
          value="${valorInput(familia.nomeFamilia)}"
          placeholder="Nome da família"
        >
      </td>

      <td>
        <input
          type="text"
          data-campo="nomeTXTReferencia"
          value="${valorInput(familia.nomeTXTReferencia)}"
          placeholder="Nome usado como referência do TXT"
        >
      </td>

      <td>
        <input
          type="number"
          data-campo="ordemTXT"
          value="${valorInput(familia.ordemTXT)}"
          placeholder="Ex: 1"
          step="1"
          min="0"
        >
      </td>

      <td>
        <input
          type="number"
          data-campo="setupTrocaMin"
          value="${valorInput(familia.setupTrocaMin)}"
          placeholder="Min"
          step="1"
          min="0"
        >
      </td>

      <td class="familia-ativa-cell">
        <label>
          <input
            type="checkbox"
            data-campo="ativa"
            ${familia.ativa !== false ? "checked" : ""}
          >
          Ativa
        </label>
      </td>

    </tr>
  `;

}

function coletarFamiliasDaTela(
    container
) {

    const linhas =
        Array.from(
            container.querySelectorAll("[data-familia-chave]")
        );

    return linhas.map(linha => {

        const obterCampo = (campo) => {

            return linha.querySelector(
                `[data-campo="${campo}"]`
            );

        };

        const nomeFamilia =
            obterCampo("nomeFamilia")?.value.trim();

        const nomeTXTReferencia =
            obterCampo("nomeTXTReferencia")?.value.trim();

        const ordemTXT =
            normalizarNumeroOrdem(
                obterCampo("ordemTXT")?.value
            );

        const setupTrocaMin =
            normalizarNumeroOrdem(
                obterCampo("setupTrocaMin")?.value
            );

        const ativa =
            obterCampo("ativa")?.checked !== false;

        const familiaOriginal =
            linha.dataset.familiaOriginal;

        return {
            chave:
                linha.dataset.familiaChave,

            familiaOriginal,

            nomeFamilia:
                nomeFamilia ||
                familiaOriginal,

            nomeTXTReferencia:
                nomeTXTReferencia ||
                nomeFamilia ||
                familiaOriginal,

            ordemTXT,

            setupTrocaMin,

            ativa
        };

    });

}

function ativarEventos(
    container,
    opcoes
) {

    const salvarBtn =
        container.querySelector(
            "#salvarFamiliasSetupBtn"
        );

    const atualizarBtn =
        container.querySelector(
            "#atualizarFamiliasSetupBtn"
        );

    const status =
        container.querySelector(
            ".familias-setup-status"
        );

    if (salvarBtn) {

        salvarBtn.addEventListener("click", () => {

            const familias =
                coletarFamiliasDaTela(
                    container
                );

            salvarFamiliasSetup(
                familias
            );

            if (status) {

                status.textContent =
                    "Famílias salvas. O sequenciamento será recalculado.";

            }

            if (
                typeof opcoes?.onSalvar === "function"
            ) {

                opcoes.onSalvar();

            }

        });

    }

    if (atualizarBtn) {

        atualizarBtn.addEventListener("click", () => {

            renderFamiliasSetup(
                opcoes
            );

        });

    }

    const botoesTransferir =
        container.querySelectorAll(
            "[data-transferir-familia-btn]"
        );

    botoesTransferir.forEach(botao => {

        botao.addEventListener("click", () => {

            const linhaItem =
                botao.closest(
                    "[data-item-codigo]"
                );

            if (!linhaItem) {
                return;
            }

            const codigo =
                linhaItem.dataset.itemCodigo;

            const select =
                linhaItem.querySelector(
                    "[data-transferir-familia-select]"
                );

            const familiaSelecionada =
                select?.value;

            if (!codigo || !familiaSelecionada) {
                return;
            }

            if (familiaSelecionada === "__AUTO__") {

                removerFamiliaManualProduto(
                    codigo
                );

            } else {

                salvarFamiliaManualProduto(
                    codigo,
                    familiaSelecionada
                );

            }

            if (
                typeof opcoes?.onSalvar === "function"
            ) {

                opcoes.onSalvar();

            }

            renderFamiliasSetup(
                opcoes
            );

        });

    });

}

export function renderFamiliasSetup(
    opcoes = {}
) {

    const container =
        document.getElementById(
            "familiasSetupContainer"
        );

    if (!container) {

        console.warn(
            "Container familiasSetupContainer não encontrado."
        );

        return;

    }

    const produtosMestre =
        carregarProdutosMestre() || [];

    const itensPorFamilia =
        montarMapaItensPorFamilia(
            produtosMestre
        );

    const familias =
        sincronizarFamiliasComProdutos(
            produtosMestre
        );

    if (
        !familias ||
        familias.length === 0
    ) {

        container.innerHTML = `
      <section class="familias-setup-card">

        <div class="familias-setup-header">

          <div>
            <h2>Cadastro de Famílias</h2>

            <p>
              Importe ou cadastre produtos para visualizar as famílias de setup.
            </p>
          </div>

          <span class="familias-setup-badge">
            Famílias
          </span>

        </div>

        <div class="familias-setup-empty">
          Nenhuma família encontrada ainda.
        </div>

      </section>
    `;

        return;

    }

    container.innerHTML = `
    <section class="familias-setup-card">

      <div class="familias-setup-header">

        <div>
          <h2>Cadastro de Famílias</h2>

          <p>
            Edite o nome da família e a ordem de entrada conforme referência do TXT.
            Essa ordem será usada no Sequenciamento por Família.
          </p>
        </div>

        <span class="familias-setup-badge">
          ${familias.length} famílias
        </span>

      </div>

      <div class="familias-setup-alerta">
        <strong>Regra:</strong>
        a ordem manual do sequenciamento tem prioridade.
        Se não houver ordem manual, o sistema usa a ordem da família cadastrada aqui.
        Se não houver ordem da família, usa a ordem original do TXT.
      </div>

      <div class="familias-setup-actions">

        <button
          type="button"
          id="atualizarFamiliasSetupBtn"
          class="action-button secondary-action"
        >
          🔄 Atualizar famílias
        </button>

        <button
          type="button"
          id="salvarFamiliasSetupBtn"
          class="action-button"
        >
          💾 Salvar famílias
        </button>

        <span class="familias-setup-status"></span>

      </div>

      <div class="familias-setup-table-wrapper">

        <table class="familias-setup-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Família detectada</th>
              <th>Nome da família</th>
              <th>Nome referência TXT</th>
              <th>Ordem TXT</th>
              <th>Setup troca</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${familias.map((familia, indice) => {

        return renderLinhaFamilia(
            familia,
            indice,
            itensPorFamilia,
            familias
        );

    }).join("")}
          </tbody>

        </table>

      </div>

    </section>
  `;

    ativarEventos(
        container,
        opcoes
    );

}