/**
 * ======================================================
 * Product Repository
 * ======================================================
 */

const produtos = [];

export function carregarProdutos(lista) {

    produtos.length = 0;

    lista.forEach(p => produtos.push(p));

}

export function getProdutos() {

    return produtos;

}

export function getProdutoPorCodigo(codigo) {

    return produtos.find(

        p => p.codigo === codigo

    );

}

export function atualizarProduto(codigo, novosDados) {

    const produto = getProdutoPorCodigo(codigo);

    if (!produto)
        return;

    Object.assign(

        produto,

        novosDados

    );

}