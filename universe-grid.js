const STORAGE_KEY = "dmx_power_calc_rig";

let rig = [];
let universeGridContainer;
let gridUniverseInput;
let gridUniverseForm;
let gridUniverseHint;

document.addEventListener("DOMContentLoaded", () => {
  universeGridContainer = document.getElementById("universeGrid");
  gridUniverseInput = document.getElementById("gridUniverseInput");
  gridUniverseForm = document.getElementById("gridUniverseForm");
  gridUniverseHint = document.getElementById("gridUniverseHint");

  loadRigFromStorage();