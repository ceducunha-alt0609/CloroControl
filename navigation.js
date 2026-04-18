// CloroPrime — navigation.js
// Generated from index.html

// ─── Navigation ────────────────────────────────────────────────────
function activateView(id){ const trigger=document.querySelector(`[data-view="${id}"]`); showView(id, trigger); }

function showView(id, triggerEl=null) {
  // Scroll to top
  const mainPanel = document.querySelector('.main-panel');
  if(mainPanel) mainPanel.scrollTo({ top: 0, behavior: 'smooth' });

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById('view-' + id);
  if(targetView) targetView.classList.add('active');
  setActiveNav(id);

  if(triggerEl && window.innerWidth <= 780) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('drawer-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  if(id==='operacao')    renderOperacao();
  if(id==='dashboard')   { mostrarSkeletons(); renderDashboard(); }
  if(id==='historico')   renderHistorico();
  if(id==='calcular')    { syncCalcFromConfig(); calcular(); }
  if(id==='config')      loadConfig();
  if(id==='personalizar') carregarPersonalizacao();
  if(id==='faq') {}
}


// ─── Sidebar & Navigation ──────────────────────────────────────────
function toggleSidebar() {
  const isMobile = window.innerWidth <= 780;
  if(isMobile) {
    openSidebar();
  } else {
    const sb = document.getElementById('sidebar');
    const shell = document.querySelector('.shell');
    const collapsed = sb.classList.toggle('collapsed');
    shell.classList.toggle('collapsed', collapsed);
    state.sidebarCollapsed = collapsed;
    save();
  }
}

function openSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('drawer-overlay');
  sb.classList.add('open');
  if(overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('drawer-overlay');
  sb.classList.remove('open');
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleMoreMenu(e) {
  e.stopPropagation();
  const dd = document.getElementById('mnav-more-dropdown');
  dd.classList.toggle('open');
}

function closeMoreMenu() {
  const dd = document.getElementById('mnav-more-dropdown');
  if(dd) dd.classList.remove('open');
}

// Close more menu on outside click
document.addEventListener('click', function(e) {
  const wrap = e.target.closest('.mnav-more-wrap');
  if(!wrap) closeMoreMenu();
});

function setActiveNav(id) {
  // Sidebar
  document.querySelectorAll('.side-nav-btn[data-view]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-view') === id);
  });
  // Mobile main tabs
  document.querySelectorAll('.mnav-btn[data-view]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-view') === id);
  });
  // Mobile dropdown buttons
  document.querySelectorAll('.mnav-dd-btn[data-view]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-view') === id);
  });
  // Update "Mais" button highlight when a dropdown item is active
  const moreBtn = document.getElementById('mnav-more-btn');
  const moreViews = ['calcular','historico','config','personalizar','faq'];
  if(moreBtn) moreBtn.classList.toggle('active', moreViews.includes(id));
  // Legacy nav
  document.querySelectorAll('[data-view]').forEach(el => {
    if(!el.classList.contains('side-nav-btn') && !el.classList.contains('mnav-btn') && !el.classList.contains('mnav-dd-btn')) {
      el.classList.toggle('active', el.getAttribute('data-view') === id);
    }
  });
}

function renderSidebarSummary() {
  const cfg = state.config;
  const level = Number(state.nivel || 0);
  const pct = cfg.tambor > 0 ? Math.round((level / cfg.tambor) * 100) : 0;
  const bomba = parseFloat(cfg.bombaMax || 1.5);
  const fce = parseFloat(cfg.fce || 0);
  const dose = parseFloat(cfg.alvoDose || 1.0);
  const conc = parseFloat(cfg.hipoct || 12);
  const vazaoAgua = parseFloat(cfg.vazao || 1500);
  const vazaoDosador = bomba * (fce / 100);
  const autonomiaDias = vazaoDosador > 0 ? (cfg.tambor / (vazaoDosador * 24)) : 999;
  const produto = (dose * vazaoAgua) / (100 * conc * Math.max(vazaoDosador, 0.001));
  const produtoSeguro = Math.max(0, Math.min(cfg.tambor, produto));
  const agua = Math.max(0, cfg.tambor - produtoSeguro);

  const sideLevel = document.getElementById('side-level');
  const sideLevelSub = document.getElementById('side-level-sub');
  const sideDays = document.getElementById('side-days');
  const sideDose = document.getElementById('side-dose');
  const sideDoseSub = document.getElementById('side-dose-sub');
  const sideScenario = document.getElementById('side-scenario');
  if(sideLevel) sideLevel.textContent = level.toFixed(1) + ' L';
  if(sideLevelSub) sideLevelSub.textContent = pct + '% do tambor disponível';
  if(sideDays) sideDays.textContent = autonomiaDias < 999 ? autonomiaDias.toFixed(1) : '∞';
  if(sideDose) sideDose.textContent = produtoSeguro.toFixed(1) + ' L';
  if(sideDoseSub) sideDoseSub.textContent = 'Produto ' + conc + '% + ' + agua.toFixed(1) + ' L de água';
  if(sideScenario) sideScenario.textContent = `Poço 100 m → filtro → dosador FCE ${fce}% → reservatório principal ${cfg.reserv.toLocaleString('pt-BR')} L → secundário ${cfg.reservSec.toLocaleString('pt-BR')} L → ${cfg.unidades} apt / ~${cfg.pessoas} pessoas.`;

  const leitura = parseFloat(document.getElementById('ops-fita-valor')?.value || state.latestRead?.valor || document.getElementById('fita-valor')?.value || '');
  const pill = document.getElementById('side-fita-pill');
  const sub = document.getElementById('side-fita-sub');
  if(!pill || !sub) return;
  if(Number.isNaN(leitura)) {
    pill.className = 'mini-pill ok';
    pill.textContent = 'Sem leitura';
    sub.textContent = 'Informe a leitura para diagnóstico automático.';
    return;
  }
  let cls='ok', txt='Ideal', desc='Faixa operacional equilibrada.';
  if(leitura < 0.2) { cls='danger'; txt='Muito baixa'; desc='Residual insuficiente, subir dose ou FCE.'; }
  else if(leitura < 0.5) { cls='warn'; txt='Baixa'; desc='Aceitável em alguns pontos, mas ainda pede ajuste fino.'; }
  else if(leitura <= 1.0) { cls='ok'; txt='Ideal'; desc='Boa margem operacional sem excesso aparente.'; }
  else { cls='warn'; txt='Alta'; desc='Acima da meta usual, observar sabor e reduzir se necessário.'; }
  pill.className = 'mini-pill ' + cls;
  pill.textContent = txt + ' · ' + leitura.toFixed(2) + ' mg/L';
  sub.textContent = desc;
}