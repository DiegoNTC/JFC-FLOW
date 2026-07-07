import {
    carregarProdutosMestre
} from "../repositories/cadastroMestreRepository.js";

import {
    salvarFamiliasSetup,
    normalizarChaveFamilia,
    carregarChavesFamiliasOcultas,
    familiaSetupEstaOculta,
    ocultarFamiliaSetup,
    restaurarTodasFamiliasOcultas
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
    removerFamiliaManualProduto,
    salvarFamiliasManuaisProdutos,
    removerFamiliasManuaisProdutos
} from "../repositories/produtoFamiliaManualRepository.js";

let filtroFamiliasSetup = "";

function normalizarBuscaFamilia(
    valor
) {

    return String(valor ?? "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}

function ordenarFamiliasAlfabeticamente(
    familiaA,
    familiaB
) {

    const nomeA =
        normalizarBuscaFamilia(
            familiaA.nomeFamilia ||
            familiaA.familiaOriginal ||
            familiaA.nomeTXTReferencia ||
            familiaA.chave
        );

    const nomeB =
        normalizarBuscaFamilia(
            familiaB.nomeFamilia ||
            familiaB.familiaOriginal ||
            familiaB.nomeTXTReferencia ||
            familiaB.chave
        );

    return nomeA.localeCompare(
        nomeB,
        "pt-BR"
    );

}

function filtrarFamiliasPorPesquisa(
    familias = []
) {

    const termo =
        normalizarBuscaFamilia(
            filtroFamiliasSetup
        );

    const familiasOrdenadas =
        familias
            .slice()
            .sort(
                ordenarFamiliasAlfabeticamente
            );

    if (!termo) {
        return familiasOrdenadas;
    }

    return familiasOrdenadas.filter(familia => {

        const baseBusca =
            [
                familia.familiaOriginal,
                familia.nomeFamilia,
                familia.nomeTXTReferencia,
                familia.chave
            ]
                .map(normalizarBuscaFamilia)
                .join(" ");

        return baseBusca.includes(
            termo
        );

    });

}

function renderPesquisaFamiliasSetup(
    totalVisiveis,
    totalFiltrado
) {

    return `
        <div class="familias-setup-filtros">

            <div class="familias-setup-filtro-campo">
                <label for="filtroFamiliasSetup">
                    Pesquisar família
                </label>

                <input
                    type="text"
                    id="filtroFamiliasSetup"
                    value="${escaparHTML(filtroFamiliasSetup)}"
                    placeholder="Digite o nome da família. Ex: ALFACE, RUCULA, CENOURA..."
                    autocomplete="off"
                >
            </div>

            <button
                type="button"
                id="limparFiltroFamiliasSetupBtn"
                class="familias-setup-limpar-filtro"
                ${filtroFamiliasSetup ? "" : "disabled"}
            >
                Limpar
            </button>

            <span class="familias-setup-filtro-total">
                ${totalFiltrado} de ${totalVisiveis} famílias visíveis
            </span>

        </div>
    `;

}

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

function montarOpcoesFamilia(
    familias = [],
    selecionada = ""
) {

    const familiaSelecionada =
        String(selecionada ?? "").trim();

    const valoresAdicionados =
        new Set();

    const opcoes =
        familias
            .filter(familia => !familiaSetupEstaOculta(familia))
            .map(familia => {

                const nomeOpcao =
                    familia.nomeFamilia ||
                    familia.familiaOriginal;

                const valorOpcao =
                    String(
                        familia.familiaOriginal ||
                        familia.nomeFamilia ||
                        ""
                    ).trim();

                if (!valorOpcao) {
                    return "";
                }

                valoresAdicionados.add(
                    valorOpcao
                );

                const selecionado =
                    valorOpcao === familiaSelecionada
                        ? "selected"
                        : "";

                return `
                    <option value="${escaparHTML(valorOpcao)}" ${selecionado}>
                        ${escaparHTML(nomeOpcao)}
                    </option>
                `;

            }).join("");

    if (
        familiaSelecionada &&
        familiaSelecionada !== "__AUTO__" &&
        !valoresAdicionados.has(familiaSelecionada)
    ) {

        return `
            <option value="${escaparHTML(familiaSelecionada)}" selected>
                ${escaparHTML(familiaSelecionada)}
            </option>
        ` + opcoes;

    }

    return opcoes;

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
            mapa.set(
                chaveFamilia,
                []
            );
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

    return `
        <details class="familia-itens-details">

            <summary>
                Ver itens (${itens.length})
            </summary>

            <div class="familia-itens-bulk-actions">

                <label class="familia-selecionar-todos-label">
                    <input
                        type="checkbox"
                        data-selecionar-todos-itens
                    >
                    Selecionar todos os itens visíveis
                </label>

                <select data-transferir-familia-lote-select>
                    <option value="">
                        Escolha a família
                    </option>

                    <option value="__AUTO__">
                        Voltar para automático
                    </option>

                    ${montarOpcoesFamilia(familias)}
                </select>

                <button
                    type="button"
                    class="familia-transferir-btn"
                    data-transferir-familia-lote-btn
                >
                    Transferir selecionados
                </button>

                <span
                    class="familia-itens-bulk-status"
                    data-transferir-familia-lote-status
                ></span>

            </div>

            <div class="familia-itens-wrapper">

                <table class="familia-itens-table">

                    <thead>
                        <tr>
                            <th class="familia-item-check-col"></th>
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

        const codigoValido =
            item.codigo &&
            item.codigo !== "-";

        return `
                                <tr data-item-codigo="${escaparHTML(item.codigo)}">

                                    <td class="familia-item-check-col">
                                        <input
                                            type="checkbox"
                                            data-transferir-familia-checkbox
                                            ${codigoValido ? "" : "disabled"}
                                        >
                                    </td>

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
                                            <option value="__AUTO__" ${item.familiaManual ? "" : "selected"}>
                                                Automático
                                            </option>

                                            ${montarOpcoesFamilia(familias, item.familiaManual)}
                                        </select>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            class="familia-transferir-btn"
                                            data-transferir-familia-btn
                                            ${codigoValido ? "" : "disabled"}
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
            data-total-itens="${itens.length}"
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

            <td class="familia-apagar-cell">
                <button
                    type="button"
                    class="familia-apagar-btn"
                    data-ocultar-familia-btn
                    title="Ocultar família manualmente"
                >
                    Apagar/Ocultar
                </button>
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

    const filtroFamiliasInput =
        container.querySelector(
            "#filtroFamiliasSetup"
        );

    if (filtroFamiliasInput) {

        filtroFamiliasInput.addEventListener("input", (event) => {

            filtroFamiliasSetup =
                event.target.value || "";

            renderFamiliasSetup(
                opcoes
            );

            setTimeout(() => {

                const inputAtualizado =
                    document.getElementById(
                        "filtroFamiliasSetup"
                    );

                if (inputAtualizado) {

                    inputAtualizado.focus();

                    const posicao =
                        inputAtualizado.value.length;

                    inputAtualizado.setSelectionRange(
                        posicao,
                        posicao
                    );

                }

            }, 0);

        });

    }

    const limparFiltroFamiliasBtn =
        container.querySelector(
            "#limparFiltroFamiliasSetupBtn"
        );

    if (limparFiltroFamiliasBtn) {

        limparFiltroFamiliasBtn.addEventListener("click", () => {

            filtroFamiliasSetup =
                "";

            renderFamiliasSetup(
                opcoes
            );

        });

    }

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

    const restaurarOcultasBtn =
        container.querySelector(
            "#restaurarFamiliasOcultasBtn"
        );

    if (restaurarOcultasBtn) {

        restaurarOcultasBtn.addEventListener("click", () => {

            const confirmar =
                window.confirm(
                    "Restaurar todas as famílias ocultas manualmente?"
                );

            if (!confirmar) {
                return;
            }

            restaurarTodasFamiliasOcultas();

            if (status) {
                status.textContent =
                    "Famílias ocultas restauradas.";
            }

            renderFamiliasSetup(
                opcoes
            );

        });

    }

    const botoesOcultarFamilia =
        container.querySelectorAll(
            "[data-ocultar-familia-btn]"
        );

    botoesOcultarFamilia.forEach(botao => {

        botao.addEventListener("click", () => {

            const linhaFamilia =
                botao.closest(
                    "[data-familia-chave]"
                );

            if (!linhaFamilia) {
                return;
            }

            const totalItens =
                Number(
                    linhaFamilia.dataset.totalItens || 0
                );

            const nomeFamilia =
                linhaFamilia.dataset.familiaOriginal ||
                linhaFamilia.dataset.familiaChave;

            const mensagem =
                totalItens > 0
                    ? `A família "${nomeFamilia}" possui ${totalItens} item(ns).\n\n` +
                    "Mesmo assim ela será ocultada da lista e das opções de transferência.\n\n" +
                    "Os produtos não serão apagados.\n" +
                    "A família só voltará se você clicar em Restaurar ocultas.\n\n" +
                    "Deseja continuar?"
                    : `Apagar/ocultar a família "${nomeFamilia}"?\n\n` +
                    "Ela não aparecerá mais na lista nem nas opções de transferência.\n\n" +
                    "Deseja continuar?";

            const confirmar =
                window.confirm(
                    mensagem
                );

            if (!confirmar) {
                return;
            }

            ocultarFamiliaSetup(
                linhaFamilia.dataset.familiaChave
            );

            if (status) {
                status.textContent =
                    `Família ${nomeFamilia} ocultada manualmente.`;
            }

            renderFamiliasSetup(
                opcoes
            );

        });

    });

    const checkboxesSelecionarTodos =
        container.querySelectorAll(
            "[data-selecionar-todos-itens]"
        );

    checkboxesSelecionarTodos.forEach(checkboxTodos => {

        checkboxTodos.addEventListener("change", () => {

            const detalhes =
                checkboxTodos.closest(
                    ".familia-itens-details"
                );

            if (!detalhes) {
                return;
            }

            const checkboxesItens =
                detalhes.querySelectorAll(
                    "[data-transferir-familia-checkbox]:not(:disabled)"
                );

            checkboxesItens.forEach(checkboxItem => {

                checkboxItem.checked =
                    checkboxTodos.checked;

            });

        });

    });

    const botoesTransferirLote =
        container.querySelectorAll(
            "[data-transferir-familia-lote-btn]"
        );

    botoesTransferirLote.forEach(botao => {

        botao.addEventListener("click", () => {

            const detalhes =
                botao.closest(
                    ".familia-itens-details"
                );

            if (!detalhes) {
                return;
            }

            const statusLote =
                detalhes.querySelector(
                    "[data-transferir-familia-lote-status]"
                );

            const selectFamilia =
                detalhes.querySelector(
                    "[data-transferir-familia-lote-select]"
                );

            const familiaSelecionada =
                selectFamilia?.value;

            const codigosSelecionados =
                Array.from(
                    detalhes.querySelectorAll(
                        "[data-transferir-familia-checkbox]:checked"
                    )
                )
                    .map(checkbox => {

                        return checkbox.closest(
                            "[data-item-codigo]"
                        )?.dataset.itemCodigo;

                    })
                    .map(codigo => String(codigo ?? "").trim())
                    .filter(codigo => codigo && codigo !== "-");

            if (codigosSelecionados.length === 0) {

                if (statusLote) {
                    statusLote.textContent =
                        "Selecione pelo menos 1 item.";
                }

                return;

            }

            if (!familiaSelecionada) {

                if (statusLote) {
                    statusLote.textContent =
                        "Escolha a família de destino.";
                }

                return;

            }

            if (familiaSelecionada === "__AUTO__") {

                removerFamiliasManuaisProdutos(
                    codigosSelecionados
                );

            } else {

                salvarFamiliasManuaisProdutos(
                    codigosSelecionados,
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

    const familiasOcultas =
        carregarChavesFamiliasOcultas();

    const produtosMestre =
        carregarProdutosMestre() || [];

    const itensPorFamilia =
        montarMapaItensPorFamilia(
            produtosMestre
        );

    const familiasSincronizadas =
        sincronizarFamiliasComProdutos(
            produtosMestre
        );

    const familiasVisiveis =
        familiasSincronizadas
            .filter(familia => {

                return !familiaSetupEstaOculta(
                    familia
                );

            })
            .sort(
                ordenarFamiliasAlfabeticamente
            );

    const familias =
        filtrarFamiliasPorPesquisa(
            familiasVisiveis
        );

    if (
        (!familias || familias.length === 0) &&
        familiasOcultas.length === 0
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

    if (
        (!familias || familias.length === 0) &&
        familiasOcultas.length > 0
    ) {

        container.innerHTML = `
            <section class="familias-setup-card">

                <div class="familias-setup-header">

                    <div>
                        <h2>Cadastro de Famílias</h2>

                        <p>
                            Todas as famílias estão ocultas manualmente.
                        </p>
                    </div>

                    <span class="familias-setup-badge">
                        0 famílias / ${familiasOcultas.length} ocultas
                    </span>

                </div>

                <div class="familias-setup-actions">

                    <button
                        type="button"
                        id="restaurarFamiliasOcultasBtn"
                        class="action-button secondary-action"
                    >
                        ↩ Restaurar ocultas (${familiasOcultas.length})
                    </button>

                    <span class="familias-setup-status"></span>

                </div>

                <div class="familias-setup-empty">
                    Nenhuma família visível. Clique em Restaurar ocultas para exibir novamente.
                </div>

            </section>
        `;

        ativarEventos(
            container,
            opcoes
        );

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
                    ${familiasVisiveis.length} famílias${familiasOcultas.length > 0 ? ` / ${familiasOcultas.length} ocultas` : ""}
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

                ${familiasOcultas.length > 0 ? `
                    <button
                        type="button"
                        id="restaurarFamiliasOcultasBtn"
                        class="action-button secondary-action"
                    >
                        ↩ Restaurar ocultas (${familiasOcultas.length})
                    </button>
                ` : ""}

                <button
                    type="button"
                    id="salvarFamiliasSetupBtn"
                    class="action-button"
                >
                    💾 Salvar famílias
                </button>

                <span class="familias-setup-status"></span>

            </div>
            ${renderPesquisaFamiliasSetup(
        familiasVisiveis.length,
        familias.length
    )}

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
                            <th>Apagar</th>
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