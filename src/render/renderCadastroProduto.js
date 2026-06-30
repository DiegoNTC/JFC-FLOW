/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderCadastroProduto
 * Versão: 1.0.1
 *
 * Responsabilidade:
 * Renderizar cadastro e edição manual de produtos.
 * Permite cadastrar pendências vindas da sincronização.
 * ======================================================
 */

import {
    carregarProdutosMestre,
    adicionarOuAtualizarProdutoMestre
} from "../repositories/cadastroMestreRepository.js";

import {
    montarProdutoMestreCadastro
} from "../services/cadastroProdutoService.js";

import {
    atualizarFamiliasCadastroMestre
} from "../services/familiaSetupService.js";

const LINHAS_DISPONIVEIS = [
    "L1",
    "L2",
    "L3",
    "L4",
    "L5",
    "L6",
    "L7",
    "TOMATE"
];

let produtoEmEdicaoCodigo =
    null;

let produtoRascunhoCadastro =
    null;

let eventoCadastroPendenteConfigurado =
    false;

let opcoesAtuaisCadastro =
    {};

function texto(valor) {

    return String(valor ?? "")
        .trim();

}

function numero(valor) {

    return Number(
        String(valor ?? "")
            .replace(",", ".")
    ) || 0;

}

function formatarNumero(valor) {

    return numero(valor)
        .toLocaleString("pt-BR");

}

function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function getProdutoPorCodigo(codigo) {

    const codigoNormalizado =
        texto(codigo);

    const produtos =
        carregarProdutosMestre();

    return produtos.find(produto => {

        return texto(produto.codigo) === codigoNormalizado;

    }) || null;

}

function criarOptionsLinhas(
    selecionada = ""
) {

    const linhaSelecionada =
        texto(selecionada);

    return LINHAS_DISPONIVEIS
        .map(linha => `
      <option
        value="${escaparHTML(linha)}"
        ${linha === linhaSelecionada ? "selected" : ""}
      >
        ${escaparHTML(linha)}
      </option>
    `)
        .join("");

}

function criarCheckboxLinhasAlternativas(
    selecionadas = []
) {

    const listaSelecionadas =
        Array.isArray(selecionadas)
            ? selecionadas.map(texto)
            : [];

    return LINHAS_DISPONIVEIS
        .map(linha => `
      <label class="cadastro-check">
        <input
          type="checkbox"
          name="linhasAlternativas"
          value="${escaparHTML(linha)}"
          ${listaSelecionadas.includes(linha) ? "checked" : ""}
        >
        ${escaparHTML(linha)}
      </label>
    `)
        .join("");

}

function valoresProdutoFormulario(
    produto = null
) {

    const rotaPrincipal =
        produto?.rotasTecnicas?.[0] || {};

    return {

        codigo:
            produto?.codigo || "",

        nomeOficial:
            produto?.nomeOficial || "",

        descricaoTXT:
            produto?.descricaoTXT ||
            rotaPrincipal.descricaoTXT ||
            "",

        familiaSetup:
            produto?.familiaSetup ||
            produto?.classeSetup ||
            "",

        setupTrocaMin:
            produto?.setupTrocaMin ??
            rotaPrincipal.setupTrocaMin ??
            rotaPrincipal.setupMin ??
            0,

        linhaPrincipal:
            produto?.linhaPrincipal ||
            rotaPrincipal.linha ||
            "L1",

        linhasAlternativas:
            produto?.linhasAlternativas || [],

        sequenciaTXT:
            produto?.sequenciaTXT ??
            rotaPrincipal.sequencia ??
            rotaPrincipal.sequenciaPrincipal ??
            0,

        zona:
            produto?.zona ||
            rotaPrincipal.zona ||
            "",

        unidadeDia:
            produto?.unidadeDia ??
            rotaPrincipal.unidadeDia ??
            0,

        kgDia:
            produto?.kgDia ??
            rotaPrincipal.kgDia ??
            0,

        produtividadeKgHora:
            produto?.produtividadeKgHora ??
            rotaPrincipal.produtividadeKgHora ??
            0,

        ativo:
            produto?.ativo !== false

    };

}

function sugerirFamiliaSetupPorNome(
    nome
) {

    const textoNome =
        texto(nome)
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const palavrasIgnoradas = [
        "PICADA",
        "PICADO",
        "CUBOS",
        "CUBO",
        "RALADA",
        "RALADO",
        "FATIADA",
        "FATIADO",
        "TIRAS",
        "KG",
        "G",
        "UN",
        "CX",
        "BAND",
        "BANDEJA",
        "HIGIENIZADA",
        "HIGIENIZADO",
        "PROCESSADA",
        "PROCESSADO",
        "DESCASCADA",
        "DESCASCADO"
    ];

    const partes =
        textoNome
            .split(/\s+/)
            .filter(parte => {

                if (!parte) {
                    return false;
                }

                if (/^\d/.test(parte)) {
                    return false;
                }

                return !palavrasIgnoradas.includes(parte);

            });

    if (partes.length === 0) {
        return textoNome;
    }

    if (
        partes[0] === "ALFACE" &&
        partes[1]
    ) {

        return `${partes[0]} ${partes[1]}`;

    }

    return partes[0];

}

function criarRascunhoProdutoPendente(
    dados = {}
) {

    const nome =
        dados.nomeOficial ||
        dados.produto ||
        dados.descricaoCSV ||
        dados.descricao ||
        "";

    const familiaSugerida =
        sugerirFamiliaSetupPorNome(
            nome
        );

    return {

        _rascunhoCadastro:
            true,

        codigo:
            dados.codigo || "",

        nomeOficial:
            nome,

        descricaoTXT:
            dados.descricaoTXT || "",

        familiaSetup:
            familiaSugerida,

        classeSetup:
            familiaSugerida,

        setupTrocaMin:
            0,

        linhaPrincipal:
            "L1",

        linhasAlternativas:
            [],

        sequenciaTXT:
            0,

        zona:
            "",

        unidadeDia:
            0,

        kgDia:
            0,

        produtividadeKgHora:
            0,

        ativo:
            true,

        rotasTecnicas:
            [],

        origem: {
            csv: true,
            pendencia: true,
            manual: true
        }

    };

}

function configurarEventoCadastroPendente() {

    if (eventoCadastroPendenteConfigurado) {
        return;
    }

    eventoCadastroPendenteConfigurado = true;

    window.addEventListener(
        "jfc:cadastrar-produto-pendente",
        (event) => {

            produtoEmEdicaoCodigo =
                null;

            produtoRascunhoCadastro =
                criarRascunhoProdutoPendente(
                    event.detail || {}
                );

            renderCadastroProduto(
                opcoesAtuaisCadastro
            );

            setTimeout(() => {

                const container =
                    document.getElementById("cadastroProdutoContainer");

                container?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }, 100);

        }
    );

}

function renderFormulario(
    produto = null
) {

    const valores =
        valoresProdutoFormulario(
            produto
        );

    const titulo =
        produto?._rascunhoCadastro
            ? `Cadastrar pendência: ${produto.codigo || ""} - ${produto.nomeOficial || ""}`
            : produto
                ? `Editando: ${produto.codigo} - ${produto.nomeOficial}`
                : "Cadastrar novo item";

    return `
    <form id="cadastroProdutoForm" class="cadastro-form">

      <div class="cadastro-form-header">
        <h3>${escaparHTML(titulo)}</h3>

        <span class="cadastro-form-badge">
          Cadastro Mestre
        </span>
      </div>

      <div class="cadastro-grid">

        <label>
          Código do produto
          <input
            type="text"
            name="codigo"
            value="${escaparHTML(valores.codigo)}"
            required
            placeholder="Ex: 000168"
          >
        </label>

        <label>
          Nome oficial
          <input
            type="text"
            name="nomeOficial"
            value="${escaparHTML(valores.nomeOficial)}"
            required
            placeholder="Ex: CEBOLA PICADA 12X0,5KG"
          >
        </label>

        <label>
          Descrição TXT
          <input
            type="text"
            name="descricaoTXT"
            value="${escaparHTML(valores.descricaoTXT)}"
            placeholder="Descrição técnica, se houver"
          >
        </label>

        <label>
          Família / classe de setup
          <input
            type="text"
            name="familiaSetup"
            value="${escaparHTML(valores.familiaSetup)}"
            required
            placeholder="Ex: CEBOLA"
          >
          <small>Produtos da mesma família não geram setup entre si.</small>
        </label>

        <label>
          Setup de troca para esta família/min
          <input
            type="number"
            name="setupTrocaMin"
            value="${escaparHTML(valores.setupTrocaMin)}"
            min="0"
            step="1"
          >
        </label>

        <label>
          Linha principal
          <select name="linhaPrincipal">
            ${criarOptionsLinhas(valores.linhaPrincipal)}
          </select>
        </label>

        <label>
          Sequência TXT
          <input
            type="number"
            name="sequenciaTXT"
            value="${escaparHTML(valores.sequenciaTXT)}"
            min="0"
            step="1"
          >
        </label>

        <label>
          Zona
          <input
            type="text"
            name="zona"
            value="${escaparHTML(valores.zona)}"
            placeholder="Ex: Zona Negra"
          >
        </label>

        <label>
          Unidade/dia base
          <input
            type="number"
            name="unidadeDia"
            value="${escaparHTML(valores.unidadeDia)}"
            min="0"
            step="0.01"
          >
        </label>

        <label>
          Kg/dia base
          <input
            type="number"
            name="kgDia"
            value="${escaparHTML(valores.kgDia)}"
            min="0"
            step="0.01"
          >
        </label>

        <label>
          Produtividade kg/h
          <input
            type="number"
            name="produtividadeKgHora"
            value="${escaparHTML(valores.produtividadeKgHora)}"
            min="0"
            step="0.01"
          >
        </label>

        <label class="cadastro-ativo">
          <input
            type="checkbox"
            name="ativo"
            ${valores.ativo ? "checked" : ""}
          >
          Produto ativo
        </label>

      </div>

      <div class="cadastro-alternativas">

        <strong>Linhas alternativas permitidas</strong>

        <div class="cadastro-checks">
          ${criarCheckboxLinhasAlternativas(valores.linhasAlternativas)}
        </div>

      </div>

      <div class="cadastro-actions">

        <button
          type="submit"
          class="action-button"
        >
          💾 Salvar item
        </button>

        <button
          type="button"
          id="limparFormularioProdutoBtn"
          class="action-button secondary-action"
        >
          Novo item
        </button>

        <button
          type="button"
          id="cancelarEdicaoProdutoBtn"
          class="action-button secondary-action"
        >
          Cancelar
        </button>

      </div>

    </form>
  `;

}

function renderTabelaProdutos(
    produtos
) {

    if (!produtos || produtos.length === 0) {

        return `
      <div class="cadastro-empty">
        Nenhum produto cadastrado ainda.
      </div>
    `;

    }

    const linhas =
        produtos
            .slice()
            .sort((a, b) => {

                return texto(a.nomeOficial)
                    .localeCompare(
                        texto(b.nomeOficial),
                        "pt-BR"
                    );

            })
            .map(produto => {

                const rota =
                    produto.rotasTecnicas?.[0] || {};

                return `
          <tr>
            <td>${escaparHTML(produto.codigo || "-")}</td>

            <td class="cadastro-produto-nome">
              ${escaparHTML(produto.nomeOficial || "-")}
            </td>

            <td>${escaparHTML(produto.familiaSetup || produto.classeSetup || "-")}</td>

            <td>${escaparHTML(produto.linhaPrincipal || rota.linha || "-")}</td>

            <td>${formatarNumero(produto.setupTrocaMin ?? rota.setupMin)}</td>

            <td>${formatarNumero(produto.unidadeDia ?? rota.unidadeDia)}</td>

            <td>${formatarNumero(produto.kgDia ?? rota.kgDia)}</td>

            <td>
              ${produto.ativo === false ? "Inativo" : "Ativo"}
            </td>

            <td>
              <button
                type="button"
                class="cadastro-edit-btn"
                data-editar-produto="${escaparHTML(produto.codigo)}"
              >
                Editar
              </button>
            </td>
          </tr>
        `;

            })
            .join("");

    return `
    <div class="cadastro-table-wrapper">

      <table class="cadastro-table">

        <thead>
          <tr>
            <th>Código</th>
            <th>Produto</th>
            <th>Família</th>
            <th>Linha</th>
            <th>Setup</th>
            <th>Unid/dia</th>
            <th>Kg/dia</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>

        <tbody>
          ${linhas}
        </tbody>

      </table>

    </div>
  `;

}

function lerDadosFormulario(form) {

    const formData =
        new FormData(form);

    const linhasAlternativas =
        Array.from(
            form.querySelectorAll(
                "input[name='linhasAlternativas']:checked"
            )
        ).map(input => input.value);

    return {

        codigo:
            formData.get("codigo"),

        nomeOficial:
            formData.get("nomeOficial"),

        descricaoTXT:
            formData.get("descricaoTXT"),

        familiaSetup:
            formData.get("familiaSetup"),

        setupTrocaMin:
            formData.get("setupTrocaMin"),

        linhaPrincipal:
            formData.get("linhaPrincipal"),

        linhasAlternativas,

        sequenciaTXT:
            formData.get("sequenciaTXT"),

        zona:
            formData.get("zona"),

        unidadeDia:
            formData.get("unidadeDia"),

        kgDia:
            formData.get("kgDia"),

        produtividadeKgHora:
            formData.get("produtividadeKgHora"),

        ativo:
            formData.get("ativo") === "on"

    };

}

function limparEdicaoAtual() {

    produtoEmEdicaoCodigo =
        null;

    produtoRascunhoCadastro =
        null;

}

function ativarEventosCadastro(
    container,
    opcoes
) {

    const form =
        container.querySelector("#cadastroProdutoForm");

    const cancelarBtn =
        container.querySelector("#cancelarEdicaoProdutoBtn");

    const limparFormularioBtn =
        container.querySelector("#limparFormularioProdutoBtn");

    const gerarFamiliasAutoBtn =
        container.querySelector("#gerarFamiliasAutoBtn");

    if (form) {

        form.addEventListener("submit", (event) => {

            event.preventDefault();

            const dados =
                lerDadosFormulario(form);

            const produtoAtual =
                produtoEmEdicaoCodigo
                    ? getProdutoPorCodigo(produtoEmEdicaoCodigo)
                    : getProdutoPorCodigo(dados.codigo);

            const produtoMestre =
                montarProdutoMestreCadastro(
                    dados,
                    produtoAtual
                );

            adicionarOuAtualizarProdutoMestre(
                produtoMestre
            );

            limparEdicaoAtual();

            alert(
                "Produto salvo no Cadastro Mestre."
            );

            if (typeof opcoes?.onSalvar === "function") {

                opcoes.onSalvar(
                    produtoMestre
                );

            }

            renderCadastroProduto(
                opcoes
            );

        });

    }

    if (cancelarBtn) {

        cancelarBtn.addEventListener("click", () => {

            limparEdicaoAtual();

            renderCadastroProduto(
                opcoes
            );

        });

    }

    if (limparFormularioBtn) {

        limparFormularioBtn.addEventListener("click", () => {

            limparEdicaoAtual();

            renderCadastroProduto(
                opcoes
            );

        });

    }

    container
        .querySelectorAll("[data-editar-produto]")
        .forEach(botao => {

            botao.addEventListener("click", () => {

                produtoRascunhoCadastro =
                    null;

                produtoEmEdicaoCodigo =
                    botao.dataset.editarProduto;

                renderCadastroProduto(
                    opcoes
                );

            });

        });
        
    if (gerarFamiliasAutoBtn) {

        gerarFamiliasAutoBtn.addEventListener("click", () => {

            const resultado =
                atualizarFamiliasCadastroMestre({
                    sobrescrever: false
                });

            alert(
                `Famílias geradas automaticamente.\n\n` +
                `Total de produtos: ${resultado.total}\n` +
                `Produtos atualizados: ${resultado.alterados}\n` +
                `Produtos mantidos: ${resultado.mantidos}`
            );

            if (typeof opcoes?.onSalvar === "function") {

                opcoes.onSalvar();

            }

            renderCadastroProduto(
                opcoes
            );

        });

    }
}


export function renderCadastroProduto(
    opcoes = {}
) {

    const container =
        document.getElementById("cadastroProdutoContainer");

    if (!container) {

        console.warn(
            "Container cadastroProdutoContainer não encontrado."
        );

        return;

    }

    opcoesAtuaisCadastro =
        opcoes;

    configurarEventoCadastroPendente();

    const produtos =
        carregarProdutosMestre();

    const produtoEmEdicao =
        produtoEmEdicaoCodigo
            ? getProdutoPorCodigo(produtoEmEdicaoCodigo)
            : produtoRascunhoCadastro;

    const detailsAberto =
        produtoEmEdicao ? "open" : "";

    container.innerHTML = `
    <section class="cadastro-produto-card">

      <details ${detailsAberto}>

        <summary class="cadastro-produto-summary">

          <div>
            <h2>Cadastro Mestre de Itens</h2>

            <p>
              Cadastre ou edite produtos, família de setup, linhas e dados técnicos.
            </p>
          </div>

          <span class="cadastro-produto-badge">
            ${formatarNumero(produtos.length)} itens
          </span>

        </summary>

        <div class="cadastro-produto-content">

            <div class="cadastro-tools">

                <div>
                <strong>Famílias de setup</strong>
                <p>
                    Preenche automaticamente a família dos produtos que ainda estão sem cadastro.
                </p>
                </div>

                <button
                type="button"
                id="gerarFamiliasAutoBtn"
                class="action-button secondary-action"
                >
                🧩 Gerar famílias automaticamente
                </button>

            </div>

  ${renderFormulario(produtoEmEdicao)}

      </details>

    </section>
  `;

    ativarEventosCadastro(
        container,
        opcoes
    );

}