export const turnos = [

  {
    nome: "T1",
    inicio: 480,
    fim: 1020
  },

  {
    nome: "T2",
    inicio: 1020,
    fim: 1320
  }

];

export const capacidadeMaxima =
  turnos[1].fim - turnos[0].inicio;