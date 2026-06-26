/**
 * ======================================================
 * JFC FLOW
 * Módulo: normalizadorTexto
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Normalizar descrições de produtos para comparação
 * entre CSV, TXT e Cadastro Mestre.
 * ======================================================
 */

/**
 * Remove acentos.
 */
export function removerAcentos(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}

/**
 * Remove pontuações que atrapalham a comparação.
 */
export function removerPontuacao(texto) {

    return String(texto || "")
        .replace(/[.,;:()[\]{}]/g, " ")
        .replace(/[\/\\]/g, " ")
        .replace(/[-_]/g, " ");

}

/**
 * Padroniza espaços.
 */
export function limparEspacos(texto) {

    return String(texto || "")
        .replace(/\s+/g, " ")
        .trim();

}

/**
 * Expande algumas abreviações comuns.
 *
 * Importante:
 * Não exagerar aqui.
 * Só colocamos regras seguras.
 */
export function expandirAbreviacoes(texto) {

    let resultado = ` ${String(texto || "").toUpperCase()} `;

    const regras = [

        [" ALF ", " ALFACE "],
        [" RUC ", " RUCULA "],
        [" RÚC ", " RUCULA "],
        [" CX ", " CAIXA "],
        [" PCT ", " PACOTE "],
        [" PCTS ", " PACOTES "],
        [" HIG ", " HIGIENIZADA "],
        [" FAT ", " FATIADA "],
        [" INT ", " INTEIRA "],
        [" NS ", " NATURAL SALADS "],
        [" QA ", " QUALIDADE ASSEGURADA "],
        [" BCA ", " BRANCA "],
        [" BCO ", " BRANCO "],
        [" BC ", " BRANCO "],
        [" ROX ", " ROXA "],
        [" CEN ", " CENOURA "],
        [" BET ", " BETERRABA "],
        [" REP ", " REPOLHO "]

    ];

    regras.forEach(([de, para]) => {

        resultado = resultado.replaceAll(de, para);

    });

    return limparEspacos(resultado);

}

/**
 * Normalização básica.
 *
 * Usada para comparação exata normalizada.
 */
export function normalizarTexto(texto) {

    let resultado = String(texto || "");

    resultado = removerAcentos(resultado);

    resultado = resultado.toUpperCase();

    resultado = removerPontuacao(resultado);

    resultado = limparEspacos(resultado);

    return resultado;

}

/**
 * Normalização mais forte.
 *
 * Usada para comparação por similaridade.
 */
export function normalizarTextoForte(texto) {

    let resultado = normalizarTexto(texto);

    resultado = expandirAbreviacoes(resultado);

    resultado = normalizarTexto(resultado);

    return resultado;

}

/**
 * Quebra o texto em palavras úteis.
 */
export function extrairTokens(texto) {

    const normalizado = normalizarTextoForte(texto);

    return normalizado
        .split(" ")
        .filter(token => token.length > 1);

}

/**
 * Cria uma chave textual para uso em mapeamentos.
 */
export function criarChaveTexto(texto) {

    return normalizarTextoForte(texto);

}