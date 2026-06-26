/**
 * ======================================================
 * JFC FLOW
 * Módulo: cadastroMestreRepository
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Guardar e consultar o Cadastro Mestre de Produtos.
 *
 * Por enquanto usa localStorage.
 * Futuramente pode ser substituído por:
 * - JSON físico
 * - backend
 * - banco de dados
 * ======================================================
 */

const STORAGE_PRODUTOS = "jfc_flow_cadastro_mestre_produtos";

const STORAGE_PENDENCIAS = "jfc_flow_cadastro_mestre_pendencias";

const STORAGE_SUGESTOES = "jfc_flow_cadastro_mestre_sugestoes";

function lerStorage(chave, valorPadrao) {

    try {

        const dados = localStorage.getItem(chave);

        if (!dados) {
            return valorPadrao;
        }

        return JSON.parse(dados);

    } catch (erro) {

        console.error(
            `Erro ao ler localStorage: ${chave}`,
            erro
        );

        return valorPadrao;

    }

}

function salvarStorage(chave, valor) {

    try {

        localStorage.setItem(
            chave,
            JSON.stringify(valor)
        );

    } catch (erro) {

        console.error(
            `Erro ao salvar localStorage: ${chave}`,
            erro
        );

    }

}

function normalizarCodigo(codigo) {

    return String(codigo || "").trim();

}

/**
 * Produtos mestres confirmados.
 */
export function carregarProdutosMestre() {

    return lerStorage(
        STORAGE_PRODUTOS,
        []
    );

}

export function salvarProdutosMestre(produtos) {

    salvarStorage(
        STORAGE_PRODUTOS,
        Array.isArray(produtos) ? produtos : []
    );

}

export function getProdutoMestrePorCodigo(codigo) {

    const codigoNormalizado = normalizarCodigo(codigo);

    return carregarProdutosMestre().find(
        produto => normalizarCodigo(produto.codigo) === codigoNormalizado
    );

}

export function adicionarOuAtualizarProdutoMestre(produtoNovo) {

    const produtos = carregarProdutosMestre();

    const codigoNovo = normalizarCodigo(produtoNovo.codigo);

    const indice = produtos.findIndex(
        produto => normalizarCodigo(produto.codigo) === codigoNovo
    );

    const produtoAtualizado = {

        ...produtoNovo,

        codigo: codigoNovo,

        atualizadoEm: new Date().toISOString()

    };

    if (indice >= 0) {

        produtos[indice] = {
            ...produtos[indice],
            ...produtoAtualizado
        };

    } else {

        produtos.push({
            ...produtoAtualizado,
            criadoEm: produtoAtualizado.criadoEm || new Date().toISOString()
        });

    }

    salvarProdutosMestre(produtos);

    return produtoAtualizado;

}

export function adicionarVariosProdutosMestre(listaProdutos) {

    if (!Array.isArray(listaProdutos)) {
        return carregarProdutosMestre();
    }

    listaProdutos.forEach(produto => {

        adicionarOuAtualizarProdutoMestre(produto);

    });

    return carregarProdutosMestre();

}

/**
 * Sugestões aguardando confirmação.
 */
export function carregarSugestoesVinculo() {

    return lerStorage(
        STORAGE_SUGESTOES,
        []
    );

}

export function salvarSugestoesVinculo(sugestoes) {

    salvarStorage(
        STORAGE_SUGESTOES,
        Array.isArray(sugestoes) ? sugestoes : []
    );

}

/**
 * Pendências sem correspondência segura.
 */
export function carregarPendenciasVinculo() {

    return lerStorage(
        STORAGE_PENDENCIAS,
        []
    );

}

export function salvarPendenciasVinculo(pendencias) {

    salvarStorage(
        STORAGE_PENDENCIAS,
        Array.isArray(pendencias) ? pendencias : []
    );

}

/**
 * Aplica o resultado gerado pelo sincronizador.
 */
export function aplicarResultadoSincronizacao(resultado) {

    const produtosAtuais = carregarProdutosMestre();

    const novosProdutos = [
        ...(resultado?.jaCadastrados || []),
        ...(resultado?.vinculadosAutomaticamente || [])
    ];

    const mapa = new Map();

    produtosAtuais.forEach(produto => {

        mapa.set(
            normalizarCodigo(produto.codigo),
            produto
        );

    });

    novosProdutos.forEach(produto => {

        mapa.set(
            normalizarCodigo(produto.codigo),
            {
                ...produto,
                atualizadoEm: new Date().toISOString()
            }
        );

    });

    const produtosFinal = Array.from(mapa.values());

    salvarProdutosMestre(produtosFinal);

    salvarSugestoesVinculo(
        resultado?.sugestoes || []
    );

    salvarPendenciasVinculo(
        resultado?.pendentes || []
    );

    return {

        produtosMestre: produtosFinal,

        sugestoes: carregarSugestoesVinculo(),

        pendencias: carregarPendenciasVinculo(),

        estatisticas: {

            produtosMestre: produtosFinal.length,

            sugestoes: carregarSugestoesVinculo().length,

            pendencias: carregarPendenciasVinculo().length

        }

    };

}

/**
 * Confirma manualmente uma sugestão.
 *
 * Usaremos isso depois na tela de revisão.
 */
export function confirmarSugestaoVinculo(sugestao) {

    if (!sugestao) {
        return null;
    }

    const produtoMestre = {

        id: sugestao.codigo,

        codigo: sugestao.codigo,

        nomeOficial: sugestao.nomeOficial,

        descricao: sugestao.nomeOficial,

        descricaoCSV: sugestao.descricaoCSV,

        descricaoTXT: sugestao.melhorSugestao?.descricaoTXT || sugestao.descricaoTXT,

        demandaReferencia: sugestao.demandaFinal || 0,

        rotasTecnicas: sugestao.melhorSugestao?.rotasTecnicas || [],

        vinculoConfirmado: true,

        vinculoTipo: "MANUAL_CONFIRMADO",

        scoreVinculo: sugestao.melhorSugestao?.score || sugestao.score || 0,

        ativo: true,

        origem: {
            csv: true,
            txt: true
        },

        criadoEm: new Date().toISOString(),

        atualizadoEm: new Date().toISOString()

    };

    adicionarOuAtualizarProdutoMestre(produtoMestre);

    const sugestoesAtualizadas = carregarSugestoesVinculo()
        .filter(item => normalizarCodigo(item.codigo) !== normalizarCodigo(sugestao.codigo));

    salvarSugestoesVinculo(sugestoesAtualizadas);

    return produtoMestre;

}

/**
 * Limpa tudo.
 * Usar apenas para testes.
 */
export function limparCadastroMestre() {

    localStorage.removeItem(STORAGE_PRODUTOS);

    localStorage.removeItem(STORAGE_PENDENCIAS);

    localStorage.removeItem(STORAGE_SUGESTOES);

}