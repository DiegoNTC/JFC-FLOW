import {
  linha1,
  linha2
} from "./core/state.js";

import {
  atualizarTodasLinhas
} from "./render/renderLinha.js";

import {
  configurarDropzone
} from "./dragdrop/dropzone.js";

import {
  optimizeLinha
} from "./actions/optimize.js";

import {
  balanceLinha
} from "./actions/balance.js";

import "./dragdrop/dragStart.js";

import "./actions/removerItem.js";

import {
  removerItem
} from "./actions/removerItem.js";

import {
    configurarImportacaoCSV
} from "./importers/csvImportHandler.js";

// =========================
// ELEMENTOS
// =========================

const dropzoneL1 =
  document.getElementById("dropzone-l1");

const dropzoneL2 =
  document.getElementById("dropzone-l2");

const ganttL1 =
  document.getElementById("gantt-l1");

const ganttL2 =
  document.getElementById("gantt-l2");

const kpiL1 =
  document.getElementById("kpi-l1");

const kpiL2 =
  document.getElementById("kpi-l2");

const clockL1 =
  document.getElementById("clock-l1");

const clockL2 =
  document.getElementById("clock-l2");

const capacityL1 =
  document.getElementById("capacity-l1");

const capacityL2 =
  document.getElementById("capacity-l2");

const statusL1 =
  document.getElementById("status-l1");

const statusL2 =
  document.getElementById("status-l2");

const oeeL1 =
  document.getElementById("oee-l1");

const oeeL2 =
  document.getElementById("oee-l2");

const optimizeBtn =
  document.getElementById("optimizeBtn");

const balanceBtn =
  document.getElementById("balanceBtn");

const scaleL1 =
  document.getElementById("scale-l1");

const scaleL2 =
  document.getElementById("scale-l2");

// =========================
// CONFIG RENDER
// =========================

const renderConfigL1 = {

  dropzone: dropzoneL1,
  gantt: ganttL1,
  scale: scaleL1,
  kpi: kpiL1,
  clock: clockL1,
  capacity: capacityL1,
  status: statusL1,
  oee: oeeL1

};

const renderConfigL2 = {

  dropzone: dropzoneL2,
  gantt: ganttL2,
  scale: scaleL2,
  kpi: kpiL2,
  clock: clockL2,
  capacity: capacityL2,
  status: statusL2,
  oee: oeeL2

};

// =========================
// REMOVER ITEM GLOBAL
// =========================

window.removerItem = (id) => {

  removerItem(id);

  atualizarTodasLinhas(
    renderConfigL1,
    renderConfigL2,
    linha1,
    linha2
  );

};

// =========================
// BOTÕES
// =========================

optimizeLinha(
  optimizeBtn,
  linha1,
  linha2,
  renderConfigL1,
  renderConfigL2
);

balanceLinha(
  balanceBtn,
  linha1,
  linha2,
  renderConfigL1,
  renderConfigL2
);

// =========================
// DROPZONES
// =========================

configurarDropzone(
  "L1",
  dropzoneL1,
  linha1,
  ganttL1,
  scaleL1,
  kpiL1,
  clockL1,
  capacityL1,
  statusL1,
  oeeL1
);

configurarDropzone(
  "L2",
  dropzoneL2,
  linha2,
  ganttL2,
  scaleL2,
  kpiL2,
  clockL2,
  capacityL2,
  statusL2,
  oeeL2
);

configurarImportacaoCSV();