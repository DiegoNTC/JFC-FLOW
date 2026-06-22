import {
  PIXEL_POR_MINUTO
} from "../core/constants.js";

export function renderScale(scale) {

  scale.innerHTML = "";

  const inicioTurno = 8;
  const fimTurno = 22;

  for (
    let h = inicioTurno;
    h <= fimTurno;
    h++
  ) {

    const hour =
      document.createElement("div");

    hour.className =
      "scale-hour";

    hour.style.width =
      `${60 * PIXEL_POR_MINUTO}px`;

    hour.innerText =
      `${String(h).padStart(2, "0")}:00`;

    scale.appendChild(hour);

  }

}