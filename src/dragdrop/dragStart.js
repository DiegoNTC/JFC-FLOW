
import { products } from "../data/products.js";

import { setDraggedItem } from "../core/state.js";

const skuCards =
  document.querySelectorAll(".sku-card");


skuCards.forEach((card, index) => {

  card.addEventListener("dragstart", () => {

    setDraggedItem(products[index]);

  });

});