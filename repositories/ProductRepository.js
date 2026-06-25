/**
 * ======================================================
 * JFC FLOW
 * Product Repository
 * ======================================================
 */

const produtos = new Map();

export function carregarProdutos(
    listaProdutos
) {

    produtos.clear();

    listaProdutos.forEach(produto => {

        produtos.set(

            produto.codigo,

            produto

        );

    });

}

export function getByCodigo(
    codigo
) {

    return produtos.get(
        codigo
    );

}

export function getAllProdutos() {

    return Array.from(
        produtos.values()
    );

}