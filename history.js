// CloroPrime — history.js
// Generated from index.html

// ─── Abastecer ─────────────────────────────────────────────────────
function previewAbast() {
  const atual = parseFloat(document.getElementById('ab-atual').value) || 0;
  const add = parseFloat(document.getElementById('ab-add').value) || 0;
  const total = Math.min(atual + add, state.config.tambor);
  const pct = Math.round((total / state.config.tambor) * 100);
  document.getElementById('ab-preview').style.display = 'block';
  document.getElementById('ab-prev-total').textContent = total.toFixed(1) + ' L';
  document.getElementById('ab-prev-pct').textContent = pct + '%';
}

function registrarAbast() {
  const atual = parseFloat(document.getElementById('ab-atual').value);
  const add = parseFloat(document.getElementById('ab-add').value);
  if(isNaN(atual) || isNaN(add) || add <= 0) { toast('Preencha o nível atual e o volume adicionado.','warn'); return; }
  const total = Math.min(atual + add, state.config.tambor);
  const conc = document.getElementById('ab-conc').value;
  const marca = document.getElementById('ab-marca').value;
  const obs = document.getElementById('ab-obs').value;
  const preco = parseFloat(document.getElementById('ab-preco').value) || 0;
  const volComprado = parseFloat(document.getElementById('ab-vol-comprado').value) || 0;

  state.nivel = total;
  state.config.hipoct = parseFloat(conc);
  if(preco > 0 && volComprado > 0) {
    state.config.precoProduto = preco;
    state.config.volGalao = volComprado;
    state.custoTotal = (state.custoTotal || 0) + preco;
  }
  addHistorico('abast', `Abastecimento +${add}L`, `Nível: ${total.toFixed(1)}L · ${conc}% · ${marca || 'sem marca'} ${obs ? '· '+obs : ''} ${preco > 0 ? '· R$'+preco.toFixed(2) : ''}`);
  save();

  document.getElementById('ab-atual').value = '';
  document.getElementById('ab-add').value = '';
  document.getElementById('ab-marca').value = '';
  document.getElementById('ab-obs').value = '';
  document.getElementById('ab-preco').value = '';
  document.getElementById('ab-vol-comprado').value = '';
  document.getElementById('ab-preview').style.display = 'none';
  toast(`✅ Abastecimento registrado! Nível: ${total.toFixed(1)} L`,'ok');
}

function atualizarNivel() {
  const v = parseFloat(document.getElementById('nivel-manual').value);
  if(isNaN(v) || v < 0 || v > state.config.tambor) { toast('Valor inválido.','warn'); return; }
  state.nivel = v;
  addHistorico('nivel', `Nível atualizado: ${v.toFixed(1)}L`, `Atualização manual`);
  save();
  document.getElementById('nivel-manual').value = '';
  toast(`Nível atualizado para ${v.toFixed(1)} L`,'ok');
}

// ─── Histórico ─────────────────────────────────────────────────────
function addHistorico(tipo, titulo, sub) {
  const icons = { abast: '🛢️', nivel: '📏', config: '⚙️', calc: '🧮' };
  state.hist.unshift({
    tipo, titulo, sub, ts: new Date().toISOString()
  });
  if(state.hist.length > 100) state.hist = state.hist.slice(0, 100);
  save();
}

function renderHistorico() {
  const el = document.getElementById('hist-list');
  if(state.hist.length === 0) {
    el.innerHTML = `<div class="empty">
      <svg class="empty-svg" width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="18" fill="rgba(30,143,255,0.07)"/>
        <rect x="20" y="22" width="32" height="4" rx="2" fill="rgba(30,143,255,0.25)"/>
        <rect x="20" y="32" width="24" height="4" rx="2" fill="rgba(30,143,255,0.15)"/>
        <rect x="20" y="42" width="28" height="4" rx="2" fill="rgba(30,143,255,0.15)"/>
        <circle cx="52" cy="50" r="10" fill="rgba(232,160,32,0.15)" stroke="#e8a020" stroke-width="1.5"/>
        <path d="M52 46v4l2.5 2.5" stroke="#e8a020" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <div class="empty-title">Nenhum registro ainda</div>
      <div class="empty-sub">Faça seu primeiro abastecimento ou registre uma leitura de fita para começar o histórico.</div>
    </div>`;
    return;
  }
  const icons = { abast: '🛢️', nivel: '📏', config: '⚙️', calc: '🧮' };
  el.innerHTML = state.hist.map(h => {
    const d = new Date(h.ts);
    const fmt = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
    return `<div class="hist-item">
      <span class="hist-icon">${icons[h.tipo] || '📌'}</span>
      <div class="hist-info">
        <div class="hist-title">${h.titulo}</div>
        <div class="hist-sub">${h.sub}</div>
      </div>
      <div class="hist-val">${fmt}</div>
    </div>`;
  }).join('');
}

function limparHistorico() {
  if(confirm('Limpar todo o histórico?')) { state.hist = []; save(); renderHistorico(); }
}

// ─── Config ────────────────────────────────────────────────────────
function loadConfig() {
  const c = state.config;
  document.getElementById('cfg-reserv').value = c.reserv;
  document.getElementById('cfg-reserv-sec').value = c.reservSec || 9000;
  document.getElementById('cfg-caixas').value = c.caixas;
  document.getElementById('cfg-vol-caixa').value = c.volCaixa;
  document.getElementById('cfg-unidades').value = c.unidades;
  document.getElementById('cfg-pessoas').value = c.pessoas;
  document.getElementById('cfg-vazao').value = c.vazao;
  document.getElementById('cfg-torres').value = c.torres || 4;
  document.getElementById('cfg-fce').value = c.fce;
  document.getElementById('cfg-hipoct').value = c.hipoct;
  document.getElementById('cfg-tambor').value = c.tambor;
  document.getElementById('cfg-bomba-max').value = c.bombaMax || 1.5;
  document.getElementById('cfg-alvo-dose').value = c.alvoDose || 1.0;
  document.getElementById('cfg-alerta-baixo').value = c.alertaBaixo;
  document.getElementById('cfg-alerta-crit').value = c.alertaCrit;
  const mb = document.getElementById('cfg-modelo-bomba'); if(mb) mb.value = c.modeloBomba || '';
  const ft = document.getElementById('cfg-filtro-troca'); if(ft) ft.value = c.filtroTroca || '';
  const fi = document.getElementById('cfg-filtro-intervalo'); if(fi) fi.value = c.filtroIntervalo || 60;
  const pp = document.getElementById('cfg-preco-produto'); if(pp) pp.value = c.precoProduto || '';
  const vg = document.getElementById('cfg-vol-galao'); if(vg) vg.value = c.volGalao || '';
  const total = ((c.caixas * c.volCaixa) + c.reserv + (c.reservSec || 0)) / 1000;
  document.getElementById('cfg-info').textContent = `${c.unidades} apt · ${c.pessoas} pessoas · ${fmtBR(total,0)}k L`;
  renderFiltroStatus();
  renderCustoInfo();
}

function saveConfig() {
  const c = state.config;
  c.reserv = parseFloat(document.getElementById('cfg-reserv').value) || 30000;
  c.reservSec = parseFloat(document.getElementById('cfg-reserv-sec').value) || 9000;
  c.caixas = parseInt(document.getElementById('cfg-caixas').value) || 8;
  c.volCaixa = parseFloat(document.getElementById('cfg-vol-caixa').value) || 2000;
  c.unidades = parseInt(document.getElementById('cfg-unidades').value) || 80;
  c.pessoas = parseInt(document.getElementById('cfg-pessoas').value) || 240;
  c.vazao = parseFloat(document.getElementById('cfg-vazao').value) || 1500;
  c.torres = parseInt(document.getElementById('cfg-torres').value) || 4;
  c.fce = parseFloat(document.getElementById('cfg-fce').value) || 18;
  c.hipoct = parseFloat(document.getElementById('cfg-hipoct').value) || 12;
  c.tambor = parseFloat(document.getElementById('cfg-tambor').value) || 100;
  c.bombaMax = parseFloat(document.getElementById('cfg-bomba-max').value) || 1.5;
  c.alvoDose = parseFloat(document.getElementById('cfg-alvo-dose').value) || 1.0;
  c.alertaBaixo = parseInt(document.getElementById('cfg-alerta-baixo').value) || 20;
  c.alertaCrit = parseInt(document.getElementById('cfg-alerta-crit').value) || 10;
  const mb = document.getElementById('cfg-modelo-bomba'); if(mb) c.modeloBomba = mb.value;
  const ft = document.getElementById('cfg-filtro-troca'); if(ft) c.filtroTroca = ft.value;
  const fi = document.getElementById('cfg-filtro-intervalo'); if(fi) c.filtroIntervalo = parseInt(fi.value) || 60;
  const pp = document.getElementById('cfg-preco-produto'); if(pp && pp.value) c.precoProduto = parseFloat(pp.value);
  const vg = document.getElementById('cfg-vol-galao'); if(vg && vg.value) c.volGalao = parseFloat(vg.value);
  save();
  renderOperacao();
  renderFiltroStatus();
  renderCustoInfo();
}

function resetApp() {
  if(confirm('Isso apagará TODOS os dados. Confirma?')) {
    localStorage.removeItem(KEY);
    location.reload();
  }
}
