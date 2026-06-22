
function moverProduto(
  origem,
  destino,
  linhaDestino
) {

  for (
    let i = origem.length - 1;
    i >= 0;
    i--
  ) {

    const produto =
      origem[i];

    if (
      produto.linhaPermitida ===
      linhaDestino
    ) {

      destino.push(produto);

      origem.splice(i, 1);

      break;

    }

  }

}