// CloroPrime — state.js
// Generated from index.html


// ─── State & Storage ───────────────────────────────────────────────
const KEY = 'cloroprime_v1';
let state = {
  nivel: 50,
  hist: [],
  latestRead: { valor: '', ponto: 'ponta' },
  proximaVerif: null,
  custoTotal: 0,
  config: {
    reserv: 30000, reservSec: 9000, caixas: 8, volCaixa: 2000,
    unidades: 80, pessoas: 240, vazao: 1500,
    fce: 18, hipoct: 12, tambor: 100, bombaMax: 1.5,
    alvoDose: 1.0, alertaBaixo: 20, alertaCrit: 10,
    modeloBomba: '', filtroTroca: '', filtroIntervalo: 60,
    precoProduto: 0, volGalao: 20
  }
};

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if(d) state = d; } catch(e){}
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
load();