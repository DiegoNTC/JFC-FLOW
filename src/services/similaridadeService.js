/**
 * ======================================================
 * JFC FLOW
 * Módulo: similaridadeService
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Comparar nomes de produtos entre CSV e TXT.
 *
 * Usa:
 * - igualdade exata
 * - igualdade normalizada
 * - similaridade por caracteres
 * - similaridade por palavras
 * ======================================================
 */

import {
    normalizarTexto,
    normalizarTextoForte,
    extrairTokens
} from "./normalizadorTexto.js";

/**
 * Calcula distância de Levenshtein.
 * Quanto menor a distância, mais parecidas são as strings.
 */
function calcularDistanciaLevenshtein(a, b) {

    const textoA = String(a || "");
    const textoB = String(b || "");

    const matriz = [];

    for (let i = 0; i <= textoB.length; i++) {
        matriz[i] = [i];
    }

    for (let j = 0; j <= textoA.length; j++) {
        matriz[0][j] = j;
    }

    for (let i = 1; i <= textoB.length; i++) {

        for (let j = 1; j <= textoA.length; j++) {

            if (textoB.charAt(i - 1) === textoA.charAt(j - 1)) {

                matriz[i][j] = matriz[i - 1][j - 1];

            } else {

                matriz[i][j] = Math.min(
                    matriz[i - 1][j - 1] + 1,
                    matriz[i][j - 1] + 1,
                    matriz[i - 1][j] + 1
                );

            }

        }

    }

    return matriz[textoB.length][textoA.length];

}

/**
 * Similaridade baseada em caracteres.
 * Retorna valor entre 0 e 100.
 */
function calcularSimilaridadeCaracteres(a, b) {

    const textoA = normalizarTextoForte(a);
    const textoB = normalizarTextoForte(b);

    if (!textoA && !textoB) {
        return 100;
    }

    if (!textoA || !textoB) {
        return 0;
    }

    if (textoA === textoB) {
        return 100;
    }

    const maiorTamanho = Math.max(
        textoA.length,
        textoB.length
    );

    const distancia = calcularDistanciaLevenshtein(
        textoA,
        textoB
    );

    const similaridade = (
        (maiorTamanho - distancia) / maiorTamanho
    ) * 100;

    return Math.max(
        0,
        Math.round(similaridade)
    );

}

/**
 * Similaridade baseada em palavras.
 * Retorna valor entre 0 e 100.
 */
function calcularSimilaridadeTokens(a, b) {

    const tokensA = extrairTokens(a);
    const tokensB = extrairTokens(b);

    if (
        tokensA.length === 0 &&
        tokensB.length === 0
    ) {
        return 100;
    }

    if (
        tokensA.length === 0 ||
        tokensB.length === 0
    ) {
        return 0;
    }

    const conjuntoA = new Set(tokensA);
    const conjuntoB = new Set(tokensB);

    let intersecao = 0;

    conjuntoA.forEach(token => {

        if (conjuntoB.has(token)) {
            intersecao++;
        }

    });

    const uniao = new Set([
        ...conjuntoA,
        ...conjuntoB
    ]).size;

    return Math.round(
        (intersecao / uniao) * 100
    );

}

/**
 * Verifica se um nome contém o outro após normalização.
 */
function calcularSimilaridadeContem(a, b) {

    const textoA = normalizarTextoForte(a);
    const textoB = normalizarTextoForte(b);

    if (!textoA || !textoB) {
        return 0;
    }

    if (
        textoA.includes(textoB) ||
        textoB.includes(textoA)
    ) {
        return 100;
    }

    return 0;

}

/**
 * Compara dois nomes de produto.
 */
export function compararNomesProduto(nomeCSV, nomeTXT) {

    const csvOriginal = String(nomeCSV || "").trim();
    const txtOriginal = String(nomeTXT || "").trim();

    const csvNormalizado = normalizarTexto(csvOriginal);
    const txtNormalizado = normalizarTexto(txtOriginal);

    const csvForte = normalizarTextoForte(csvOriginal);
    const txtForte = normalizarTextoForte(txtOriginal);

    if (
        csvOriginal &&
        txtOriginal &&
        csvOriginal.toUpperCase() === txtOriginal.toUpperCase()
    ) {

        return {
            score: 100,
            tipo: "EXATO",
            status: "VINCULAR_AUTOMATICO",
            podeVincularAutomaticamente: true
        };

    }

    if (
        csvNormalizado &&
        txtNormalizado &&
        csvNormalizado === txtNormalizado
    ) {

        return {
            score: 100,
            tipo: "NORMALIZADO",
            status: "VINCULAR_AUTOMATICO",
            podeVincularAutomaticamente: true
        };

    }

    if (
        csvForte &&
        txtForte &&
        csvForte === txtForte
    ) {

        return {
            score: 98,
            tipo: "NORMALIZADO_FORTE",
            status: "VINCULAR_AUTOMATICO",
            podeVincularAutomaticamente: true
        };

    }

    const scoreCaracteres = calcularSimilaridadeCaracteres(
        csvOriginal,
        txtOriginal
    );

    const scoreTokens = calcularSimilaridadeTokens(
        csvOriginal,
        txtOriginal
    );

    const scoreContem = calcularSimilaridadeContem(
        csvOriginal,
        txtOriginal
    );

    const scoreFinal = Math.round(
        (scoreCaracteres * 0.45) +
        (scoreTokens * 0.45) +
        (scoreContem * 0.10)
    );

    let status = "PENDENTE_REVISAO";
    let tipo = "BAIXA_SIMILARIDADE";

    if (scoreFinal >= 92) {

        status = "SUGESTAO_FORTE";
        tipo = "ALTA_SIMILARIDADE";

    } else if (scoreFinal >= 80) {

        status = "SUGESTAO";
        tipo = "MEDIA_SIMILARIDADE";

    }

    return {

        score: scoreFinal,

        tipo,

        status,

        podeVincularAutomaticamente: false,

        detalhes: {
            scoreCaracteres,
            scoreTokens,
            scoreContem,
            csvNormalizado,
            txtNormalizado,
            csvForte,
            txtForte
        }

    };

}

/**
 * Pega a descrição de um registro CSV ou TXT,
 * independentemente do nome do campo.
 */
function pegarDescricao(item) {

    return (
        item?.descricaoTXT ||
        item?.descricaoCSV ||
        item?.produto ||
        item?.descricao ||
        ""
    );

}

/**
 * Encontra o melhor produto TXT para um produto CSV.
 */
export function encontrarMelhorCorrespondencia(
    produtoCSV,
    produtosTXT,
    limiteMinimo = 70
) {

    const descricaoCSV = pegarDescricao(produtoCSV);

    let melhor = null;

    for (const produtoTXT of produtosTXT) {

        const descricaoTXT = pegarDescricao(produtoTXT);

        const comparacao = compararNomesProduto(
            descricaoCSV,
            descricaoTXT
        );

        if (
            !melhor ||
            comparacao.score > melhor.score
        ) {

            melhor = {
                produtoCSV,
                produtoTXT,
                descricaoCSV,
                descricaoTXT,
                ...comparacao
            };

        }

    }

    if (
        !melhor ||
        melhor.score < limiteMinimo
    ) {

        return {
            produtoCSV,
            produtoTXT: null,
            descricaoCSV,
            descricaoTXT: null,
            score: 0,
            tipo: "NAO_ENCONTRADO",
            status: "PENDENTE_REVISAO",
            podeVincularAutomaticamente: false
        };

    }

    return melhor;

}

/**
 * Retorna as melhores sugestões de TXT para um produto CSV.
 */
export function listarSugestoesCorrespondencia(
    produtoCSV,
    produtosTXT,
    limiteMinimo = 60,
    quantidade = 5
) {

    const descricaoCSV = pegarDescricao(produtoCSV);

    return produtosTXT
        .map(produtoTXT => {

            const descricaoTXT = pegarDescricao(produtoTXT);

            const comparacao = compararNomesProduto(
                descricaoCSV,
                descricaoTXT
            );

            return {
                produtoCSV,
                produtoTXT,
                descricaoCSV,
                descricaoTXT,
                ...comparacao
            };

        })
        .filter(item => item.score >= limiteMinimo)
        .sort((a, b) => b.score - a.score)
        .slice(0, quantidade);

}