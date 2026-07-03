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

let filtrosCadastro = {

    termo: "",

    linha: "",

    familia: "",

    somentePendentes: false

};

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

function booleano(valor) {

    return valor === true ||
        valor === "true" ||
        valor === "SIM" ||
        valor === "S" ||
        valor === 1 ||
        valor === "1";

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
    selecionada = "",
    incluirVazio = false
) {

    const linhaSelecionada =
        texto(selecionada);

    const optionVazio = incluirVazio
        ? `
      <option value="" ${!linhaSelecionada ? "selected" : ""}>
        Todas
      </option>
    `
        : "";

    const optionsLinhas = LINHAS_DISPONIVEIS
        .map(linha => `
      <option
        value="${escaparHTML(linha)}"
        ${linha === linhaSelecionada ? "selected" : ""}
      >
        ${escaparHTML(linha)}
      </option>
    `)
        .join("");

    return optionVazio + optionsLinhas;

}


function criarCheckboxLinhas(
    nomeCampo,
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
          name="${escaparHTML(nomeCampo)}"
          value="${escaparHTML(linha)}"
          ${listaSelecionadas.includes(linha) ? "checked" : ""}
        >
        ${escaparHTML(linha)}
      </label>
    `)
        .join("");

}

function criarCheckboxLinhasPermitidas(
    selecionadas = []
) {

    return criarCheckboxLinhas(
        "linhasPermitidas",
        selecionadas
    );

}

function criarCheckboxLinhasAlternativas(
    selecionadas = []
) {

    return criarCheckboxLinhas(
        "linhasAlternativas",
        selecionadas
    );

}


function valoresProdutoFormulario(
    produto = null
) {

    const rotaPrincipal =
        produto?.rotasTecnicas?.[0] || {};

    const familiaSetup =
        produto?.familiaSetup ||
        produto?.classeSetup ||
        rotaPrincipal.familiaSetup ||
        rotaPrincipal.classeSetup ||
        "";

    const linhaPrincipal =
        produto?.linhaPrincipal ||
        rotaPrincipal.linha ||
        "L1";

    const familiaSequenciamento =
        produto?.familiaSequenciamento ||
        produto?.familiaOperacional ||
        familiaSetup ||
        "";

    const linhaSequenciamento =
        produto?.linhaSequenciamento ||
        produto?.linhaPlanejada ||
        produto?.linhaCadastro ||
        linhaPrincipal ||
        "L1";

    const linhasPermitidas =
        produto?.linhasPermitidas ||
        produto?.linhasAlternativas ||
        [];

    return {

        codigo:
            produto?.codigo || "",

        nomeOficial:
            produto?.nomeOficial || "",

        descricaoTXT:
            produto?.descricaoTXT ||
            rotaPrincipal.descricaoTXT ||
            "",

        familiaSetup,

        familiaSequenciamento,

        setupTrocaMin:
            produto?.setupTrocaMin ??
            rotaPrincipal.setupTrocaMin ??
            rotaPrincipal.setupMin ??
            0,

        linhaPrincipal,

        linhaSequenciamento,

        usarLinhaCadastro:
            booleano(produto?.usarLinhaCadastro),

        linhasPermitidas,

        linhasAlternativas:
            produto?.linhasAlternativas || linhasPermitidas,

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

        familiaSequenciamento:
            familiaSugerida,

        classeSetup:
            familiaSugerida,

        setupTrocaMin:
            0,

        linhaPrincipal:
            "L1",

        linhaSequenciamento:
            "L1",

        usarLinhaCadastro:
            true,

        linhasPermitidas:
            ["L1"],

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
          <small>Família técnica usada para setup.</small>
        </label>

        <label>
          Família de sequenciamento
          <input
            type="text"
            name="familiaSequenciamento"
            value="${escaparHTML(valores.familiaSequenciamento)}"
            placeholder="Ex: RUCULA"
          >
          <small>Agrupa produtos no bloco operacional da linha.</small>
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
          Linha técnica / principal TXT
          <select name="linhaPrincipal">
            ${criarOptionsLinhas(valores.linhaPrincipal)}
          </select>
          <small>Linha técnica de referência da base TXT.</small>
        </label>

        <label>
          Linha de sequenciamento
          <select name="linhaSequenciamento">
            ${criarOptionsLinhas(valores.linhaSequenciamento)}
          </select>
          <small>Linha onde o item deve aparecer no sequenciamento.</small>
        </label>

        <label class="cadastro-ativo">
          <input
            type="checkbox"
            name="usarLinhaCadastro"
            ${valores.usarLinhaCadastro ? "checked" : ""}
          >
          Usar linha do Cadastro Mestre
          <small>Se desmarcado, o sistema usa a linha técnica do TXT.</small>
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

        <strong>Linhas permitidas para sequenciamento</strong>
        <small>Usado para validar balanceamento e evitar que o produto vá para uma linha não permitida.</small>

        <div class="cadastro-checks">
          ${criarCheckboxLinhasPermitidas(valores.linhasPermitidas)}
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

function filtrarProdutosCadastro(produtos) {

    const termo =
        texto(filtrosCadastro.termo)
            .toUpperCase();

    const linha =
        texto(filtrosCadastro.linha);

    const familia =
        texto(filtrosCadastro.familia)
            .toUpperCase();

    return (produtos || [])
        .filter(produto => {

            const rota =
                produto.rotasTecnicas?.[0] || {};

            const familiaSetup =
                texto(produto.familiaSetup || produto.classeSetup || rota.familiaSetup);

            const familiaSequenciamento =
                texto(produto.familiaSequenciamento || produto.familiaOperacional || familiaSetup);

            const linhaPrincipal =
                texto(produto.linhaPrincipal || rota.linha);

            const linhaSequenciamento =
                texto(produto.linhaSequenciamento || produto.linhaPlanejada || linhaPrincipal);

            const linhasPermitidas =
                Array.isArray(produto.linhasPermitidas)
                    ? produto.linhasPermitidas
                    : Array.isArray(produto.linhasAlternativas)
                        ? produto.linhasAlternativas
                        : [];

            if (termo) {

                const baseBusca = [
                    produto.codigo,
                    produto.nomeOficial,
                    produto.descricaoCSV,
                    produto.descricaoTXT
                ]
                    .map(item => texto(item).toUpperCase())
                    .join(" ");

                if (!baseBusca.includes(termo)) {
                    return false;
                }

            }

            if (linha) {

                const linhasProduto = [
                    linhaPrincipal,
                    linhaSequenciamento,
                    ...linhasPermitidas
                ].map(texto);

                if (!linhasProduto.includes(linha)) {
                    return false;
                }

            }

            if (familia) {

                const familiasProduto = [
                    familiaSetup,
                    familiaSequenciamento
                ]
                    .map(item => texto(item).toUpperCase())
                    .join(" ");

                if (!familiasProduto.includes(familia)) {
                    return false;
                }

            }

            if (filtrosCadastro.somentePendentes) {

                const semFamilia =
                    !familiaSetup && !familiaSequenciamento;

                const semLinha =
                    !linhaPrincipal && !linhaSequenciamento;

                if (!semFamilia && !semLinha) {
                    return false;
                }

            }

            return true;

        });

}

function renderFiltrosCadastro(produtos, produtosFiltrados) {

    return `
    <div class="cadastro-filtros">

      <label>
        Buscar produto/código
        <input
          type="text"
          id="cadastroFiltroTermo"
          value="${escaparHTML(filtrosCadastro.termo)}"
          placeholder="Digite código ou produto"
        >
      </label>

      <label>
        Linha
        <select id="cadastroFiltroLinha">
          ${criarOptionsLinhas(filtrosCadastro.linha, true)}
        </select>
      </label>

      <label>
        Família
        <input
          type="text"
          id="cadastroFiltroFamilia"
          value="${escaparHTML(filtrosCadastro.familia)}"
          placeholder="Ex: RUCULA"
        >
      </label>

      <label class="cadastro-filtro-check">
        <input
          type="checkbox"
          id="cadastroFiltroPendentes"
          ${filtrosCadastro.somentePendentes ? "checked" : ""}
        >
        Mostrar sem família/linha
      </label>

      <span class="cadastro-filtros-total">
        ${formatarNumero(produtosFiltrados.length)} de ${formatarNumero(produtos.length)} itens
      </span>

    </div>
  `;

}

function renderTabelaProdutos(
    produtos
) {

    if (!produtos || produtos.length === 0) {

        return `
      <div class="cadastro-empty">
        Nenhum produto encontrado com os filtros atuais.
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

                const familiaSetup =
                    produto.familiaSetup || produto.classeSetup || rota.familiaSetup || "-";

                const familiaSequenciamento =
                    produto.familiaSequenciamento || produto.familiaOperacional || familiaSetup || "-";

                const linhaPrincipal =
                    produto.linhaPrincipal || rota.linha || "-";

                const linhaSequenciamento =
                    produto.linhaSequenciamento || produto.linhaPlanejada || linhaPrincipal || "-";

                const linhasPermitidas =
                    Array.isArray(produto.linhasPermitidas)
                        ? produto.linhasPermitidas
                        : Array.isArray(produto.linhasAlternativas)
                            ? produto.linhasAlternativas
                            : [];

                return `
          <tr>
            <td>${escaparHTML(produto.codigo || "-")}</td>

            <td class="cadastro-produto-nome">
              ${escaparHTML(produto.nomeOficial || "-")}
            </td>

            <td>${escaparHTML(familiaSetup)}</td>

            <td>${escaparHTML(familiaSequenciamento)}</td>

            <td>${escaparHTML(linhaPrincipal)}</td>

            <td>${escaparHTML(linhaSequenciamento)}</td>

            <td>${booleano(produto.usarLinhaCadastro) ? "Sim" : "Não"}</td>

            <td>${escaparHTML(linhasPermitidas.join(", ") || "-")}</td>

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
            <th>Família setup</th>
            <th>Família seq.</th>
            <th>Linha TXT</th>
            <th>Linha seq.</th>
            <th>Usa cadastro</th>
            <th>Permitidas</th>
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

    const linhasPermitidas =
        Array.from(
            form.querySelectorAll(
                "input[name='linhasPermitidas']:checked"
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

        familiaSequenciamento:
            formData.get("familiaSequenciamento"),

        setupTrocaMin:
            formData.get("setupTrocaMin"),

        linhaPrincipal:
            formData.get("linhaPrincipal"),

        linhaSequenciamento:
            formData.get("linhaSequenciamento"),

        usarLinhaCadastro:
            formData.get("usarLinhaCadastro") === "on",

        linhasPermitidas,

        linhasAlternativas:
            linhasPermitidas,

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

    const filtroTermo =
        container.querySelector("#cadastroFiltroTermo");

    const filtroLinha =
        container.querySelector("#cadastroFiltroLinha");

    const filtroFamilia =
        container.querySelector("#cadastroFiltroFamilia");

    const filtroPendentes =
        container.querySelector("#cadastroFiltroPendentes");

    const atualizarFiltros = () => {

        filtrosCadastro = {
            termo:
                filtroTermo?.value || "",

            linha:
                filtroLinha?.value || "",

            familia:
                filtroFamilia?.value || "",

            somentePendentes:
                Boolean(filtroPendentes?.checked)
        };

        renderCadastroProduto(
            opcoes
        );

    };

    filtroTermo?.addEventListener(
        "change",
        atualizarFiltros
    );

    filtroLinha?.addEventListener(
        "change",
        atualizarFiltros
    );

    filtroFamilia?.addEventListener(
        "change",
        atualizarFiltros
    );

    filtroPendentes?.addEventListener(
        "change",
        atualizarFiltros
    );

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

    const produtosFiltrados =
        filtrarProdutosCadastro(
            produtos
        );

    const detailsAberto =
        produtoEmEdicao ? "open" : "";

    container.innerHTML = `
    <section class="cadastro-produto-card">

      <details ${detailsAberto}>

        <summary class="cadastro-produto-summary">

          <div>
            <h2>Cadastro Mestre de Itens</h2>

            <p>
              Cadastre ou edite as regras oficiais do PCP: linha de sequenciamento, família operacional e linhas permitidas.
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

          <div class="cadastro-lista">
            <h3>Produtos cadastrados</h3>

            ${renderFiltrosCadastro(produtos, produtosFiltrados)}

            ${renderTabelaProdutos(produtosFiltrados)}
          </div>

        </div>

      </details>

    </section>
  `;

    ativarEventosCadastro(
        container,
        opcoes
    );

}