import {
  linha1,
  linha2
} from "../core/state.js";

export function removerItem(id) {

  const itemL1 =
    linha1.findIndex(
      item => item.id === id
    );

  if (itemL1 >= 0) {

    linha1.splice(itemL1, 1);

  }

  const itemL2 =
    linha2.findIndex(
      item => item.id === id
    );

  if (itemL2 >= 0) {

    linha2.splice(itemL2, 1);

  }

}