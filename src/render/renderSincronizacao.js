/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderSincronizacao
 * Versão: 1.1.0
 *
 * Responsabilidade:
 * Exibir o resultado da sincronização CSV + TXT.
 *
 * Regra:
 * Nome oficial sempre vem do CSV.
 * TXT serve apenas como base técnica.
 * ======================================================
 */

function criarLinhaTabela(celulas) {

    return `
        <tr>
            ${celulas.map(celula => `<td>${celula ?? ""}</td>`).join("")}
        </tr>
    `;

}

function traduzirTipoVinculo(tipo) {

    const mapa = {

        EXATO: "Nome igual",

        NORMALIZADO: "Nome ajustado",

        NORMALIZADO_FORTE: "Abreviações reconhecidas",

        MANUAL_CONFIRMADO: "Confirmado manualmente",

        ALTA_SIMILARIDADE: "Alta semelhança",

        MEDIA_SIMILARIDADE: "Semelhança média"

    };

    return mapa[tipo] || tipo || "";

}

function formatarConfianca(score) {

    if (
        score === null ||
        score === undefined ||
        score === ""
    ) {
        return "";
    }

    return `${score}%`;

}

function criarTabela(titulo, colunas, linhas) {

    if (!linhas || linhas.length === 0) {

        return `
            <div class="sync-card">
                <h3>${titulo}</h3>
                <p>Nenhum registro encontrado.</p>
            </div>
        `;

    }

    return `
        <div class="sync-card">
            <h3>${titulo}</h3>

            <div class="sync-table-wrapper">
                <table class="sync-table">
                    <thead>
                        <tr>
                            ${colunas.map(coluna => `<th>${coluna}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas.join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

}

function criarLinhaSugestao(item, index) {

    return `
        <tr>
            <td>${item.codigo}</td>
            <td>${item.nomeOficial}</td>
            <td>${item.melhorSugestao?.descricaoTXT || ""}</td>
            <td>${formatarConfianca(item.melhorSugestao?.score)}</td>
            <td>${item.melhorSugestao?.rotasTecnicas?.length || 0}</td>
            <td>${traduzirTipoVinculo(item.melhorSugestao?.tipo)}</td>
            <td>
                <button 
                    class="sync-confirm-btn" 
                    data-sugestao-index="${index}"
                >
                    Confirmar
                </button>
            </td>
        </tr>
    `;

}

export function renderSincronizacao(
    resultado,
    persistencia = null,
    opcoes = {}
) {

    const container = document.getElementById("sincronizacaoContainer");

    if (!container) {
        console.warn("Container sincronizacaoContainer não encontrado.");
        return;
    }

    if (!resultado) {
        container.innerHTML = "";
        return;
    }

    const stats = resultado.estatisticas || {};

    const vinculados = resultado.vinculadosAutomaticamente || [];

    const sugestoes = resultado.sugestoes || [];

    const pendentes = resultado.pendentes || [];

    const produtosMestre = persistencia?.produtosMestre || [];

    const linhasVinculados = vinculados.map(item => criarLinhaTabela([
        item.codigo,
        item.nomeOficial,
        item.descricaoTXT,
        formatarConfianca(item.scoreVinculo),
        item.rotasTecnicas?.length || 0,
        traduzirTipoVinculo(item.vinculoTipo)
    ]));

    const linhasSugestoes = sugestoes.map((item, index) => criarLinhaSugestao(
        item,
        index
    ));

    const linhasPendentes = pendentes.map(item => criarLinhaTabela([
        item.codigo,
        item.nomeOficial,
        item.motivo,
        item.sugestoes?.length || 0
    ]));

    const linhasCadastro = produtosMestre.map(item => criarLinhaTabela([
        item.codigo,
        item.nomeOficial,
        item.descricaoTXT,
        item.rotasTecnicas?.length || 0,
        traduzirTipoVinculo(item.vinculoTipo)
    ]));

    container.innerHTML = `
        <div class="sync-dashboard">

            <h2>Sincronização CSV + TXT</h2>

            <div class="sync-kpis">
                <div class="sync-kpi">
                    <span>Total CSV</span>
                    <strong>${stats.totalCSV || 0}</strong>
                </div>

                <div class="sync-kpi">
                    <span>Total TXT</span>
                    <strong>${stats.totalTXT || 0}</strong>
                </div>

                <div class="sync-kpi">
                    <span>Vinculados</span>
                    <strong>${stats.vinculadosAutomaticamente || 0}</strong>
                </div>

                <div class="sync-kpi">
                    <span>Sugestões</span>
                    <strong>${stats.sugestoes || 0}</strong>
                </div>

                <div class="sync-kpi">
                    <span>Pendências</span>
                    <strong>${stats.pendentes || 0}</strong>
                </div>
            </div>

            ${criarTabela(
                "Produtos vinculados automaticamente",
                [
                    "Código",
                    "Nome oficial",
                    "Produto técnico localizado",
                    "Confiança",
                    "Etapas técnicas",
                    "Forma de vínculo"
                ],
                linhasVinculados
            )}

            ${criarTabela(
                "Sugestões aguardando confirmação",
                [
                    "Código",
                    "Nome oficial",
                    "Sugestão técnica",
                    "Confiança",
                    "Etapas técnicas",
                    "Forma de vínculo",
                    "Ação"
                ],
                linhasSugestoes
            )}

            ${criarTabela(
                "Pendências manuais",
                [
                    "Código",
                    "Nome oficial",
                    "Motivo",
                    "Sugestões encontradas"
                ],
                linhasPendentes
            )}

            ${criarTabela(
                "Cadastro Mestre salvo",
                [
                    "Código",
                    "Nome oficial",
                    "Produto técnico vinculado",
                    "Etapas técnicas",
                    "Forma de vínculo"
                ],
                linhasCadastro
            )}

        </div>
    `;

    if (typeof opcoes.onConfirmarSugestao === "function") {

        const botoesConfirmar = container.querySelectorAll(
            ".sync-confirm-btn"
        );

        botoesConfirmar.forEach(botao => {

            botao.addEventListener("click", () => {

                const index = Number(
                    botao.dataset.sugestaoIndex
                );

                const sugestao = sugestoes[index];

                opcoes.onConfirmarSugestao(
                    sugestao,
                    index
                );

            });

        });

    }

}