/**
 * ======================================================
 * JFC FLOW
 * Módulo: txtImporter
 * Versão: 0.6.0
 *
 * Responsabilidade:
 * Importar a Base Técnica (.txt)
 * e converter em objetos JavaScript.
 * ======================================================
 */

export function importarTXT(conteudoTXT) {

    const linhas = conteudoTXT
        .split("\n")
        .filter(linha => linha.trim() !== "");

    return linhas.map(linha => {

        const campos = linha.split(";");

        return {

            codigo: campos[0]?.trim(),

            descricao: campos[1]?.trim(),

            linha: campos[2]?.trim(),

            categoria: campos[3]?.trim(),

            tempoCaixa: Number(campos[4]),

            ativo: true

        };

    });

}