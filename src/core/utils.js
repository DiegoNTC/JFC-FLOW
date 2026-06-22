

export function formatarHora(minutos) {

  const horas =
    Math.floor(minutos / 60);

  const mins =
    minutos % 60;

  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

}