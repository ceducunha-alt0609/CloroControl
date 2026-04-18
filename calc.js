// CloroPrime — calc.js
// Generated from index.html

// ─── Dashboard ─────────────────────────────────────────────────────
function fmtBR(n, d=1) {
  return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function getPumpFlowLH(fcePct, maxLH) {
  return (Number(fcePct || 0) / 100) * Number(maxLH || 0);
}
function calcMixLiters(targetMgL, waterLh, productPct, pumpLh) {
  if(!targetMgL || !waterLh || !productPct || !pumpLh) return 0;
  return (targetMgL * waterLh) / (100 * productPct * pumpLh);
}
function getOperationalTargets(point='ponta') {
  if(point === 'principal') return { min: 0.5, max: 1.0, alvo: '0,5 a 1,0 mg/L' };
  if(point === 'secundario') return { min: 0.3, max: 0.8, alvo: '0,3 a 0,8 mg/L' };
  return { min: 0.2, max: 0.5, alvo: '0,2 a 0,5 mg/L' };
}

function getMixPlan(fcePct, productPct) {
  const cfg = state.config;
  const bomba = parseFloat(cfg.bombaMax || 1.5);
  const waterLh = parseFloat(cfg.vazao || 1500);
  const alvo = parseFloat(cfg.alvoDose || 1.0);
  const pumpLh = getPumpFlowLH(fcePct, bomba);
  const product = Math.max(0, Math.min(cfg.tambor || 100, calcMixLiters(alvo, waterLh, productPct, Math.max(pumpLh, 0.001))));
  const water = Math.max(0, (cfg.tambor || 100) - product);
  const consumoDia = pumpLh * 24;
  const autonomia = consumoDia > 0 ? (Number(state.nivel || 0) / consumoDia) : 999;
  return { bomba, waterLh, alvo, pumpLh, product, water, consumoDia, autonomia };
}

function analyzeReading(valor, point, fcePct, productPct) {
  const faixa = getOperationalTargets(point);
  const mix = getMixPlan(fcePct, productPct);
  let cls='ok', badge='Sem leitura', resumo='Informe a leitura da fita para obter o diagnóstico automático.', acao='A sugestão prática aparecerá aqui.', fator=1.0, fceNovo=fcePct;
  if(!Number.isFinite(valor)) {
    return { faixa, mix, cls, badge, resumo, acao, fator, fceNovo, statusText:'Operação inicial' };
  }
  if(valor < faixa.min * 0.75) {
    cls='danger'; badge='Muito baixa'; fator=1.30; fceNovo=Math.min(100, Math.round(fcePct * 1.15));
    resumo='Residual insuficiente para este ponto da rede.';
    acao='Suba a mistura do tambor em cerca de 30% ou eleve levemente o FCE e confirme nova leitura após estabilizar.';
  } else if(valor < faixa.min) {
    cls='warn'; badge='Baixa'; fator=1.15; fceNovo=Math.min(100, Math.round(fcePct * 1.08));
    resumo='Está abaixo da faixa-alvo, mas perto do aceitável.';
    acao='Aumente levemente a mistura do tambor e refaça a leitura no mesmo ponto.';
  } else if(valor <= faixa.max) {
    cls='ok'; badge='Ideal'; fator=1.00; fceNovo=fcePct;
    resumo='Leitura boa para consumo e controle operacional.';
    acao='Mantenha a mistura e a regulagem atual. Só ajuste se a vazão ou a fonte de água mudarem.';
  } else if(valor <= Math.max(1.0, faixa.max * 1.8)) {
    cls='warn'; badge='Alta'; fator=0.85; fceNovo=Math.max(0, Math.round(fcePct * 0.92));
    resumo='Residual acima do necessário para este ponto.';
    acao='Reduza um pouco a mistura do tambor ou baixe levemente o FCE para evitar cheiro, gosto e desperdício.';
  } else {
    cls='danger'; badge='Muito alta'; fator=0.70; fceNovo=Math.max(0, Math.round(fcePct * 0.85));
    resumo='Dosagem forte demais para uso rotineiro.';
    acao='Reduza a mistura com prioridade e confirme leitura novamente após o sistema estabilizar.';
  }
  const cloro = Math.max(0, Math.min(state.config.tambor || 100, mix.product * fator));
  const agua = Math.max(0, (state.config.tambor || 100) - cloro);
  return { faixa, mix, cls, badge, resumo, acao, fator, fceNovo, cloro, agua, statusText: badge + (Number.isFinite(valor) ? ` · ${fmtBR(valor,1)} mg/L` : '') };
}

function syncOperacaoFromUI() {
  state.latestRead.valor = document.getElementById('ops-fita-valor')?.value ?? '';
  state.latestRead.ponto = document.getElementById('ops-fita-ponto')?.value || 'ponta';
  const opsFce = parseFloat(document.getElementById('ops-fce')?.value || state.config.fce || 0);
  const opsConc = parseFloat(document.getElementById('ops-conc')?.value || state.config.hipoct || 12);
  renderOperacao(opsFce, opsConc);
  save();
}

function renderOperacao(forceFce=null, forceConc=null) {
  const cfg = state.config;
  const fitaValorRaw = document.getElementById('ops-fita-valor')?.value;
  const fitaValor = parseFloat(fitaValorRaw);
  const ponto = document.getElementById('ops-fita-ponto')?.value || state.latestRead.ponto || 'ponta';
  const fce = Number.isFinite(forceFce) ? forceFce : parseFloat(document.getElementById('ops-fce')?.value || cfg.fce || 0);
  const conc = Number.isFinite(forceConc) ? forceConc : parseFloat(document.getElementById('ops-conc')?.value || cfg.hipoct || 12);

  const opsFceEl = document.getElementById('ops-fce');
  const opsConcEl = document.getElementById('ops-conc');
  const opsPontoEl = document.getElementById('ops-fita-ponto');
  if(opsFceEl && document.activeElement !== opsFceEl) opsFceEl.value = fce;
  if(opsConcEl && document.activeElement !== opsConcEl) opsConcEl.value = conc;
  if(opsPontoEl && document.activeElement !== opsPontoEl) opsPontoEl.value = ponto;
  const fitaInput = document.getElementById('ops-fita-valor');
  if(fitaInput && document.activeElement !== fitaInput && state.latestRead.valor !== '' && !fitaInput.value) fitaInput.value = state.latestRead.valor;

  const plan = getMixPlan(fce, conc);
  const analysis = analyzeReading(fitaValor, ponto, fce, conc);
  const today = new Date();
  const next = new Date(today.getTime() + (Math.min(plan.autonomia, 999) * 24*60*60*1000));
  const nivel = Number(state.nivel || 0);
  const pct = cfg.tambor > 0 ? Math.round((nivel / cfg.tambor) * 100) : 0;

  // ── Anel circular ──
  const ringFill = document.getElementById('ring-fill');
  const ringVal  = document.getElementById('ops-ring-val');
  const ringPct  = document.getElementById('ops-ring-pct');
  if(ringFill) {
    const circ = 2 * Math.PI * 55;
    const offset = circ * (1 - pct / 100);
    ringFill.style.strokeDasharray = circ;
    ringFill.style.strokeDashoffset = offset;
    ringFill.style.stroke = pct <= 10 ? 'var(--danger)' : pct <= 20 ? 'var(--warn)' : 'var(--accent)';
  }
  // Counter animation — só anima na primeira vez ou se o valor mudou significativamente
  if(ringVal) {
    const prevVal = parseFloat(ringVal.dataset.prev || 0);
    if(Math.abs(nivel - prevVal) > 0.5) {
      animateCounter(ringVal, prevVal, nivel, 700, 1);
      ringVal.dataset.prev = nivel;
    } else {
      ringVal.textContent = nivel.toFixed(1);
    }
  }
  if(ringPct) ringPct.textContent = pct + ' %';

  // ── Status line ──
  const slAut  = document.getElementById('ops-autonomia');
  const slFce  = document.getElementById('ops-fce-display');
  const slFitD = document.getElementById('ops-fita-display');
  const slFitS = document.getElementById('ops-fita-status-sub');
  const slSub  = document.getElementById('ops-consumo-sub');
  if(slAut) { slAut.textContent = plan.autonomia < 999 ? fmtBR(plan.autonomia,1) : '∞'; slAut.className = 'osl-v ' + (plan.autonomia < 2 ? 'v-danger' : plan.autonomia < 5 ? 'v-warn' : 'v-blue'); }
  if(slFce) slFce.textContent = fmtBR(fce,0) + '%';
  if(slSub) slSub.textContent = fmtBR(plan.consumoDia,2) + ' L/dia';
  if(slFitD) {
    if(Number.isFinite(fitaValor)) {
      slFitD.textContent = fmtBR(fitaValor,1) + ' mg/L';
      slFitD.className = 'osl-v ' + (analysis.cls === 'ok' ? 'v-ok' : analysis.cls === 'warn' ? 'v-warn' : 'v-danger');
    } else { slFitD.textContent = '--'; slFitD.className = 'osl-v'; }
  }
  if(slFitS) slFitS.textContent = Number.isFinite(fitaValor) ? analysis.badge.toLowerCase() : 'sem leitura';

  // ── Badge do sistema ──
  const sysBadge = document.getElementById('ops-sys-badge');
  const sysTxt   = document.getElementById('ops-sys-badge-txt');
  if(sysBadge) { sysBadge.className = 'ops-sys-badge ' + analysis.cls; }
  if(sysTxt) sysTxt.textContent = analysis.statusText || 'Operação inicial';

  // ── Health cards ──
  // Tambor
  const hcTambor = document.getElementById('hc-tambor');
  const elNivel = document.getElementById('ops-nivel');
  const elNivelSub = document.getElementById('ops-nivel-sub');
  if(elNivel) elNivel.textContent = fmtBR(nivel,1) + ' L';
  if(elNivelSub) elNivelSub.textContent = pct + '% da capacidade';
  if(hcTambor) hcTambor.className = 'hc ' + (pct <= 10 ? 'hc-danger' : pct <= 20 ? 'hc-warn' : 'hc-blue');

  // Próx abastecimento
  const elProxAbast = document.getElementById('ops-prox-abast');
  const elAutSub = document.getElementById('ops-autonomia-sub');
  if(elProxAbast) elProxAbast.textContent = plan.autonomia < 999 ? next.toLocaleDateString('pt-BR') : '∞';
  if(elAutSub) elAutSub.textContent = plan.autonomia < 999 ? 'em ' + fmtBR(plan.autonomia,1) + ' dias' : 'indeterminado';

  // Cloro residual
  const hcCloro = document.getElementById('hc-cloro');
  const elCloroD = document.getElementById('ops-cloro-display');
  const elCloroS = document.getElementById('ops-cloro-sub');
  if(elCloroD) elCloroD.textContent = Number.isFinite(fitaValor) ? fmtBR(fitaValor,2) + ' mg/L' : '--';
  if(elCloroS) elCloroS.textContent = Number.isFinite(fitaValor) ? analysis.faixa.alvo : 'sem leitura';
  if(hcCloro) hcCloro.className = 'hc ' + (Number.isFinite(fitaValor) ? (analysis.cls === 'ok' ? 'hc-ok' : analysis.cls === 'warn' ? 'hc-warn' : 'hc-danger') : 'hc-ok');

  // Filtro plissado
  const hcFiltro = document.getElementById('hc-filtro');
  const elFiltroV = document.getElementById('ops-filtro-val');
  const elFiltroS = document.getElementById('ops-filtro-status');
  if(cfg.filtroTroca && elFiltroV) {
    const proxima = new Date(cfg.filtroTroca);
    proxima.setDate(proxima.getDate() + (cfg.filtroIntervalo || 60));
    const diff = Math.ceil((proxima - new Date()) / (1000*60*60*24));
    elFiltroV.textContent = diff < 0 ? 'Vencido' : diff + ' dias';
    if(elFiltroS) elFiltroS.textContent = diff < 0 ? 'troca urgente!' : 'para próxima troca';
    if(hcFiltro) hcFiltro.className = 'hc ' + (diff < 0 ? 'hc-danger' : diff <= 7 ? 'hc-warn' : 'hc-ok');
  } else {
    if(elFiltroV) elFiltroV.textContent = '--';
    if(elFiltroS) elFiltroS.textContent = 'configure em Config';
  }

  // ── Campos restantes ──
  const badge = document.getElementById('ops-badge');
  if(badge) { badge.className = 'ops-badge ' + analysis.cls; badge.textContent = analysis.badge; }
  const metaEl = document.getElementById('ops-meta'); if(metaEl) metaEl.textContent = 'Meta neste ponto: ' + analysis.faixa.alvo;
  const resumoEl = document.getElementById('ops-resumo'); if(resumoEl) resumoEl.textContent = analysis.resumo;
  const acaoEl = document.getElementById('ops-acao'); if(acaoEl) acaoEl.textContent = analysis.acao;
  const cloro = Number.isFinite(analysis.cloro) ? analysis.cloro : plan.product;
  const agua = Number.isFinite(analysis.agua) ? analysis.agua : plan.water;
  const clEl = document.getElementById('ops-cloro-litros'); if(clEl) clEl.textContent = fmtBR(cloro,1);
  const agEl = document.getElementById('ops-agua-litros'); if(agEl) agEl.textContent = 'Complete com ' + fmtBR(agua,1) + ' L de água no tambor';
  const mxEl = document.getElementById('ops-mistura-texto'); if(mxEl) mxEl.textContent = fmtBR(cloro,1) + ' L cloro + ' + fmtBR(agua,1) + ' L água';
  const daEl = document.getElementById('ops-dose-alvo'); if(daEl) daEl.textContent = fmtBR(cfg.alvoDose,1) + ' mg/L';
  const paEl = document.getElementById('ops-prox-abast-calc'); if(paEl) paEl.textContent = plan.autonomia < 999 ? next.toLocaleDateString('pt-BR') : 'Sem previsão';
  const faEl = document.getElementById('ops-fce-ajuste'); if(faEl) faEl.textContent = Number.isFinite(fitaValor) ? (analysis.fceNovo + '% sugerido') : (fce + '% atual');
  const ceEl = document.getElementById('ops-copy-extra'); if(ceEl) ceEl.textContent = 'Com produto ' + String(conc).replace('.', ',') + '% e FCE em ' + fmtBR(fce,0) + '%, a mistura sugerida fica em ' + fmtBR(cloro,1) + ' L de hipoclorito no tambor de 100 L.';

  state.latestRead.valor = document.getElementById('ops-fita-valor')?.value ?? state.latestRead.valor;
  state.latestRead.ponto = ponto;
  renderSidebarSummary();
  renderTopbarAndCards(analysis, plan, cloro, agua, fce, conc);
  validarCruzado();
}

function aplicarSugestaoOperacao() {
  const val = parseFloat(document.getElementById('ops-fita-valor')?.value || '');
  const ponto = document.getElementById('ops-fita-ponto')?.value || 'ponta';
  const fce = parseFloat(document.getElementById('ops-fce')?.value || state.config.fce || 0);
  const conc = parseFloat(document.getElementById('ops-conc')?.value || state.config.hipoct || 12);
  const analysis = analyzeReading(val, ponto, fce, conc);
  state.config.fce = analysis.fceNovo;
  state.config.hipoct = conc;
  save();
  syncCalcFromConfig();
  calcular();
  renderOperacao();
  addHistorico('config', 'Sugestão operacional aplicada', `FCE ajustado para ${analysis.fceNovo}% após leitura de ${Number.isFinite(val) ? fmtBR(val,1) : '--'} mg/L`);
  toast('Sugestão aplicada ao cálculo e à regulagem base do app.','ok');
}

function registrarLeituraOperacao() {
  const val = parseFloat(document.getElementById('ops-fita-valor')?.value || '');
  const ponto = document.getElementById('ops-fita-ponto')?.value || 'ponta';
  if(!Number.isFinite(val)) { toast('Informe a leitura da fita antes de registrar.','warn'); return; }
  addHistorico('calc', `Leitura da fita: ${fmtBR(val,1)} mg/L`, `Ponto: ${ponto} · FCE ${state.config.fce}% · produto ${state.config.hipoct}%`);
  toast('Leitura registrada no histórico! ✅','ok');
}

function renderTopbarAndCards(analysis, plan, cloro, agua, fce, conc) {
  const topStatus = document.getElementById('top-status');
  const topTambor = document.getElementById('top-tambor');
  const topAut = document.getElementById('top-autonomia');
  const topChip = document.getElementById('top-status-chip');
  if(topStatus) topStatus.textContent = analysis.statusText || 'Operação inicial';
  if(topChip) topChip.className = 'top-status-chip ' + (analysis.cls === 'ok' ? 'ok' : analysis.cls === 'warn' ? 'warn' : analysis.cls === 'danger' ? 'danger' : '');
  if(topTambor) topTambor.textContent = fmtBR(state.nivel,1) + ' L';
  if(topAut) topAut.textContent = plan.autonomia < 999 ? fmtBR(plan.autonomia,1) + ' dias' : '∞';

  const cardStatus = document.getElementById('card-status');
  const cardStatusValue = document.getElementById('card-status-value');
  const cardStatusSub = document.getElementById('card-status-sub');
  const cardStatusPill = document.getElementById('card-status-pill');
  if(cardStatus) cardStatus.className = 'metric-card ' + analysis.cls;
  if(cardStatusValue) cardStatusValue.textContent = analysis.badge;
  if(cardStatusSub) cardStatusSub.textContent = analysis.resumo;
  if(cardStatusPill) { cardStatusPill.className = 'mini-pill ' + analysis.cls; cardStatusPill.textContent = analysis.statusText || 'Sem leitura'; }

  document.getElementById('card-tambor-value').textContent = fmtBR(state.nivel,1) + ' L';
  document.getElementById('card-tambor-sub').textContent = fmtBR((state.nivel / state.config.tambor) * 100,0) + '% do tambor · abastecer em ' + (plan.autonomia < 999 ? fmtBR(plan.autonomia,1) + ' dias' : 'sem previsão');
  document.getElementById('card-dosador-value').textContent = fmtBR(fce,0) + '%';
  document.getElementById('card-dosador-sub').textContent = fmtBR(plan.consumoDia,2) + ' L/dia na bomba ' + fmtBR(state.config.bombaMax,1) + ' L/h';
  document.getElementById('card-mistura-value').textContent = fmtBR(cloro,1) + ' L';
  document.getElementById('card-mistura-sub').textContent = 'Produto ' + String(conc).replace('.', ',') + '% + ' + fmtBR(agua,1) + ' L de água';
}

// ─── Skeleton loading ──────────────────────────────────────────────
function mostrarSkeletons() {
  ['chart-leituras','chart-custo','chart-semanal'].forEach(id => {
    const canvas = document.getElementById(id);
    if(!canvas) return;
    const wrap = canvas.closest('.chart-canvas-wrap');
    if(!wrap) return;
    if(!wrap.querySelector('.chart-skeleton')) {
      const sk = document.createElement('div');
      sk.className = 'chart-skeleton';
      wrap.appendChild(sk);
    }
  });
}

function removerSkeletons() {
  document.querySelectorAll('.chart-skeleton').forEach(sk => {
    sk.style.opacity = '0';
    sk.style.transition = 'opacity .3s';
    setTimeout(() => sk.remove(), 320);
  });
}

// ─── Counter animation ─────────────────────────────────────────────
function animateCounter(el, from, to, duration=600, decimals=1) {
  if(!el) return;
  const start = performance.now();
  const diff = to - from;
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = from + diff * ease;
    el.textContent = val.toFixed(decimals);
    if(progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── renderDashboard ───────────────────────────────────────────────
function renderDashboard() {
  const cfg = state.config;
  const n = state.nivel;
  const pct = Math.round((n / cfg.tambor) * 100);

  // Drum SVG
  const waterH = (pct / 100) * 80;
  const w = document.getElementById('drum-water');
  if(w) { w.setAttribute('y', 10 + (80 - waterH)); w.setAttribute('height', waterH); }
  const dvd = document.getElementById('drum-vol-display');
  if(dvd) {
    const prev = parseFloat(dvd.dataset.prev || 0);
    if(Math.abs(n - prev) > 0.5) { animateCounter(dvd, prev, n, 600, 1); dvd.dataset.prev = n; }
    else dvd.textContent = n.toFixed(1);
  }
  const dpl = document.getElementById('drum-pct-label');
  if(dpl) dpl.textContent = pct + '%';
  const fill = document.getElementById('drum-prog');
  if(fill) { fill.style.width = pct + '%'; fill.style.background = pct <= 10 ? '#ef4444' : pct <= 20 ? '#f59e0b' : '#1e8fff'; }

  // Pills
  const pills = document.getElementById('drum-pills');
  if(pills) {
    let pClass = 'pill-ok', pTxt = 'Nível OK';
    if(pct <= cfg.alertaCrit) { pClass = 'pill-danger'; pTxt = 'CRÍTICO'; }
    else if(pct <= cfg.alertaBaixo) { pClass = 'pill-warn'; pTxt = 'Baixo'; }
    pills.innerHTML = `<span class="pill ${pClass}">${pTxt} — ${pct}%</span>`;
  }

  const consumeH = getPumpFlowLH(cfg.fce, cfg.bombaMax || 1.5);
  const consumeD = consumeH * 24;
  const days = consumeD > 0 ? (n / consumeD) : 999;

  const dc = document.getElementById('dash-consume'); if(dc) dc.textContent = consumeD.toFixed(1) + ' L';
  const dd = document.getElementById('dash-days');
  if(dd) { dd.textContent = days < 999 ? days.toFixed(1) + ' dias' : '∞'; dd.className = 'value ' + (days < 3 ? 'danger' : days < 7 ? 'warn' : ''); }
  const df = document.getElementById('dash-fce'); if(df) df.textContent = cfg.fce + '%';
  const dn = document.getElementById('dash-conc'); if(dn) dn.textContent = cfg.hipoct + '%';
  const mr = document.getElementById('dash-reserv-main'); if(mr) mr.textContent = fmtBR(cfg.reserv, 0) + ' L';
  const sr = document.getElementById('dash-reserv-sec'); if(sr) sr.textContent = fmtBR(cfg.reservSec || 9000, 0) + ' L';

  // Alerts
  const az = document.getElementById('alert-zone');
  if(az) {
    az.innerHTML = '';
    if(pct <= cfg.alertaCrit) az.innerHTML += `<div class="alert alert-danger">🚨 Tambor CRÍTICO (${pct}%) — Abasteça imediatamente! Autonomia: ${days.toFixed(1)} dia(s).</div>`;
    else if(pct <= cfg.alertaBaixo) az.innerHTML += `<div class="alert alert-warn">⚠️ Nível baixo (${pct}%) — Autonomia: ${days.toFixed(1)} dias.</div>`;
    if(cfg.fce === 0) az.innerHTML += `<div class="alert alert-warn">⚠️ Dosador FCE em 0% — nenhum cloro sendo injetado.</div>`;
  }

  // Date chip
  const dc2 = document.getElementById('hdr-date-chip');
  if(dc2) dc2.textContent = new Date().toLocaleDateString('pt-BR');
  const hd = document.getElementById('hdr-date');
  if(hd) hd.textContent = new Date().toLocaleDateString('pt-BR');

  const latestVal = parseFloat(state.latestRead?.valor || '');
  const latestPoint = state.latestRead?.ponto || 'ponta';
  const analysis = analyzeReading(latestVal, latestPoint, cfg.fce, cfg.hipoct);
  renderTopbarAndCards(analysis, {autonomia: days, consumoDia: consumeD},
    Number.isFinite(analysis.cloro)?analysis.cloro:getMixPlan(cfg.fce,cfg.hipoct).product,
    Number.isFinite(analysis.agua)?analysis.agua:getMixPlan(cfg.fce,cfg.hipoct).water,
    cfg.fce, cfg.hipoct);

  renderSidebarSummary();
  renderResumoDia();

  // Charts — defer so canvas is visible, then remove skeletons
  setTimeout(() => {
    renderChartLeituras();
    renderChartCusto();
    renderChartSemanal();
    setTimeout(removerSkeletons, 120);
  }, 80);
}

// ─── Calcular dosagem ──────────────────────────────────────────────
function syncCalcFromConfig() {
  const cfg = state.config;
  const sl = document.getElementById('calc-fce');
  sl.value = cfg.fce;
  document.getElementById('calc-fce-val').textContent = cfg.fce + '%';
  document.getElementById('calc-vazao').value = cfg.vazao;
  document.getElementById('calc-conc').value = cfg.hipoct;
  const mixBomba = document.getElementById('mix-bomba');
  const mixAlvo = document.getElementById('mix-alvo');
  if(mixBomba) mixBomba.value = cfg.bombaMax || 1.5;
  if(mixAlvo) mixAlvo.value = cfg.alvoDose || 1.0;
}

function calcular() {
  const fce = parseFloat(document.getElementById('calc-fce').value) || 0;
  const conc = parseFloat(document.getElementById('calc-conc').value) || 10;
  const vazao = parseFloat(document.getElementById('calc-vazao').value) || 500;
  const meta = parseFloat(document.getElementById('calc-meta').value) || 0.5;

  document.getElementById('calc-fce-val').textContent = fce + '%';

  // Dosador peristáltico FCE: ~500 mL/h em 100%
  const maxFlowLH = parseFloat(document.getElementById('mix-bomba')?.value || state.config.bombaMax || 1.5);
  const flowLH = getPumpFlowLH(fce, maxFlowLH);
  const flowMLH = flowLH * 1000;

  // Cloro ativo injetado (g/h = L/h * conc%)
  const cAtivo_gH = flowLH * (conc / 100) * 1000; // g/h → mg/h com *1000
  // Concentração na água (mg/L)
  const cAtivo_mgL = vazao > 0 ? (cAtivo_gH * 1000) / vazao : 0;

  document.getElementById('dose-injecao').textContent = Math.round(flowMLH);
  document.getElementById('dose-details').style.display = 'block';
  document.getElementById('res-cativo').textContent = cAtivo_mgL.toFixed(3) + ' mg/L';

  const consumeH = flowLH;
  const consumeD = consumeH * 24;
  document.getElementById('res-consumo-h').textContent = consumeH.toFixed(3) + ' L/h';
  document.getElementById('res-consumo-d').textContent = consumeD.toFixed(2) + ' L/dia';

  const days = consumeD > 0 ? (state.nivel / consumeD) : 999;
  document.getElementById('res-autonomia').textContent = days < 999 ? days.toFixed(1) + ' dias' : '∞';

  const cfg = state.config;
  const consumoPessoa = vazao > 0 ? (cAtivo_mgL * (vazao * 24) / cfg.pessoas) : 0;
  document.getElementById('res-pessoa').textContent = consumoPessoa.toFixed(0) + ' mg';

  const note = `Com ${conc}% de concentração, vazão de ${vazao} L/h e bomba ${fmtBR(maxFlowLH,1)} L/h @100%`;
  document.getElementById('dose-note').textContent = note;

  // Alertas na calculadora
  const da = document.getElementById('dose-alerta');
  da.style.display = 'block';
  da.innerHTML = '';
  if(cAtivo_mgL < 0.2) {
    da.innerHTML = '<div class="alert alert-danger">🚨 Abaixo do mínimo ANVISA (0,2 mg/L). Aumente o percentual do FCE.</div>';
  } else if(cAtivo_mgL < meta) {
    da.innerHTML = `<div class="alert alert-warn">⚠️ Abaixo da meta de ${meta} mg/L. Considere aumentar para atingir o objetivo.</div>`;
  } else if(cAtivo_mgL > 5) {
    da.innerHTML = '<div class="alert alert-danger">🚨 Supercloramento! Acima de 5 mg/L é prejudicial à saúde. Reduza o FCE.</div>';
  } else {
    da.innerHTML = `<div class="alert alert-info">✅ Dosagem adequada (${cAtivo_mgL.toFixed(2)} mg/L). Confirme com medição real.</div>`;
  }
  calcularMisturaCenarios();
  avaliarFita();
}

function calcularMisturaCenarios() {
  const fce = parseFloat(document.getElementById('calc-fce')?.value || state.config.fce || 0);
  const vazao = parseFloat(document.getElementById('calc-vazao')?.value || state.config.vazao || 0);
  const bomba = parseFloat(document.getElementById('mix-bomba')?.value || state.config.bombaMax || 1.5);
  const alvo = parseFloat(document.getElementById('mix-alvo')?.value || state.config.alvoDose || 1.0);
  const tambor = parseFloat(state.config.tambor || 100);
  const injReal = getPumpFlowLH(fce, bomba);
  const autonomia = injReal > 0 ? (tambor / (injReal * 24)) : 999;

  const injEl = document.getElementById('mix-injecao-real');
  const autEl = document.getElementById('mix-autonomia');
  if(injEl) injEl.textContent = fmtBR(injReal, 2) + ' L/h';
  if(autEl) autEl.textContent = autonomia < 999 ? fmtBR(autonomia, 1) + ' dias' : '∞';

  const cenarios = [2.5, 5, 10, 12, 15, 20];
  const tbody = document.getElementById('mix-table-body');
  if(!tbody) return;
  tbody.innerHTML = cenarios.map(pct => {
    const litrosProduto = calcMixLiters(alvo, vazao, pct, injReal);
    const litrosAjustados = Math.max(0, Math.min(tambor, litrosProduto));
    const litrosAgua = Math.max(0, tambor - litrosAjustados);
    let leitura = 'ajustar pela fita';
    if(alvo <= 0.5) leitura = 'tende 0,2–0,4 mg/L';
    else if(alvo <= 1.0) leitura = 'tende 0,2–0,5 mg/L';
    else leitura = 'pode subir > 0,5 mg/L';
    const aviso = litrosProduto > tambor ? ' ⚠️ forte demais p/ 100 L' : '';
    return `<tr>
      <td><strong>${String(pct).replace('.', ',')}%</strong></td>
      <td>${fmtBR(litrosAjustados, 1)} L${aviso}</td>
      <td>${fmtBR(litrosAgua, 1)} L</td>
      <td>${leitura}</td>
    </tr>`;
  }).join('');
}

function getFitaBand(ponto) {
  if(ponto === 'principal') return { min: 0.3, max: 0.8, alvo: '0,3 a 0,8 mg/L' };
  if(ponto === 'secundario') return { min: 0.2, max: 0.6, alvo: '0,2 a 0,6 mg/L' };
  return { min: 0.2, max: 0.5, alvo: '0,2 a 0,5 mg/L' };
}

function avaliarFita() {
  const valor = parseFloat(document.getElementById('fita-valor')?.value || 0);
  const ponto = document.getElementById('fita-ponto')?.value || 'ponta';
  const faixa = getFitaBand(ponto);
  const produto = parseFloat(document.getElementById('calc-conc')?.value || state.config.hipoct || 12);
  const bomba = parseFloat(document.getElementById('mix-bomba')?.value || state.config.bombaMax || 1.5);
  const fce = parseFloat(document.getElementById('calc-fce')?.value || state.config.fce || 0);
  const vazao = parseFloat(document.getElementById('calc-vazao')?.value || state.config.vazao || 0);
  const tambor = parseFloat(state.config.tambor || 100);
  const alvo = parseFloat(document.getElementById('mix-alvo')?.value || state.config.alvoDose || 1.0);
  const injReal = getPumpFlowLH(fce, bomba);
  const misturaAtual = Math.max(0, Math.min(tambor, calcMixLiters(alvo, vazao, produto, injReal)));

  let classe = 'ok';
  let rotulo = 'IDEAL';
  let faixaTxt = 'Dentro da faixa';
  let fator = 1;
  let ajuste = 'Manter';
  let ajusteSub = 'Sem mudança na mistura agora';
  let resumo = 'Leitura adequada para o ponto medido.';
  let acao = 'Mantenha a mistura atual e repita a medição na mesma torneira para comparação consistente.';

  if(valor < faixa.min * 0.6) {
    classe = 'danger';
    rotulo = 'MUITO BAIXA';
    faixaTxt = 'Muito abaixo da meta';
    fator = 1.30;
    ajuste = '+30% na mistura';
    resumo = 'A água está chegando com residual fraco para esse ponto.';
    acao = 'Reforce a mistura do tambor em cerca de 30% ou suba um pouco o FCE, depois reavalie após o sistema girar.';
  } else if(valor < faixa.min) {
    classe = 'warn';
    rotulo = 'BAIXA';
    faixaTxt = 'Abaixo da faixa';
    fator = 1.15;
    ajuste = '+15% na mistura';
    resumo = 'Há cloro, mas ainda abaixo do ideal para segurança operacional.';
    acao = 'Aumente levemente a mistura do tambor ou a regulagem do dosador e meça novamente no mesmo ponto.';
  } else if(valor <= faixa.max) {
    classe = 'ok';
    rotulo = 'IDEAL';
    faixaTxt = 'Faixa correta';
    fator = 1.00;
    ajuste = 'Manter';
    resumo = 'Leitura boa para consumo e controle de campo.';
    acao = 'Mantenha a mistura atual. Só ajuste se houver mudança forte de vazão, chuva, limpeza de reservatório ou alteração na água da rua.';
  } else if(valor <= Math.max(1.0, faixa.max * 1.8)) {
    classe = 'warn';
    rotulo = 'ALTA';
    faixaTxt = 'Acima da faixa';
    fator = 0.85;
    ajuste = '-15% na mistura';
    resumo = 'O residual está acima do necessário para esse ponto.';
    acao = 'Reduza levemente a mistura do tambor ou a regulagem do FCE para evitar cheiro, gosto e desperdício.';
  } else {
    classe = 'danger';
    rotulo = 'MUITO ALTA';
    faixaTxt = 'Bem acima da faixa';
    fator = 0.70;
    ajuste = '-30% na mistura';
    resumo = 'A dosagem está forte demais para uso rotineiro.';
    acao = 'Baixe a mistura do tambor com prioridade e confirme nova leitura após estabilização do sistema.';
  }

  const misturaSugerida = Math.max(0, Math.min(tambor, misturaAtual * fator));
  const aguaSugerida = Math.max(0, tambor - misturaSugerida);

  const badge = document.getElementById('fita-badge');
  if(badge) { badge.className = 'fita-badge ' + classe; badge.textContent = rotulo; }
  const faixaEl = document.getElementById('fita-faixa');
  if(faixaEl) faixaEl.textContent = faixaTxt;
  const metaEl = document.getElementById('fita-meta');
  if(metaEl) metaEl.textContent = 'Meta neste ponto: ' + faixa.alvo;
  const ajusteEl = document.getElementById('fita-ajuste');
  if(ajusteEl) ajusteEl.textContent = ajuste;
  const ajusteSubEl = document.getElementById('fita-ajuste-sub');
  if(ajusteSubEl) ajusteSubEl.textContent = 'Produto ' + String(produto).replace('.', ',') + '% → ' + fmtBR(misturaSugerida, 1) + ' L de cloro + ' + fmtBR(aguaSugerida, 1) + ' L de água no tambor';
  const resumoEl = document.getElementById('fita-resumo');
  if(resumoEl) resumoEl.textContent = resumo;
  const acaoEl = document.getElementById('fita-acao');
  if(acaoEl) acaoEl.textContent = acao;
}

function salvarConfig() {
  state.config.fce = parseFloat(document.getElementById('calc-fce').value) || 0;
  state.config.hipoct = parseFloat(document.getElementById('calc-conc').value) || 10;
  state.config.vazao = parseFloat(document.getElementById('calc-vazao').value) || 1500;
  state.config.bombaMax = parseFloat(document.getElementById('mix-bomba')?.value || state.config.bombaMax || 1.5);
  state.config.alvoDose = parseFloat(document.getElementById('mix-alvo')?.value || state.config.alvoDose || 1.0);
  save();
  addHistorico('config', `FCE ${state.config.fce}% salvo`, `Conc. ${state.config.hipoct}% · Vazão ${state.config.vazao} L/h`);
  toast('Configuração salva!','ok');
}