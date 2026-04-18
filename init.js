// CloroPrime — init.js
// Generated from index.html

// ─── Init complementar ────────────────────────────────────────────
function initExtras() {
  carregarPersonalizacao();
  // Restore sidebar collapsed state (desktop only)
  if(state.sidebarCollapsed && window.innerWidth > 780) {
    const sb = document.getElementById('sidebar');
    const shell = document.querySelector('.shell');
    if(sb) sb.classList.add('collapsed');
    if(shell) shell.classList.add('collapsed');
  }
  renderProximaVerif();
  renderFiltroStatus();
  renderCustoInfo();
  validarCruzado();
  // Wizard no primeiro uso
  if(!state.wizardConcluido) {
    setTimeout(abrirWizard, 400);
  }
  // Alerta de verificação vencida no load
  if(state.proximaVerif) {
    const d = new Date(state.proximaVerif);
    const diff = Math.ceil((d - new Date()) / (1000*60*60*24));
    if(diff <= 0) toast(`📅 Verificação agendada para ${d.toLocaleDateString('pt-BR')} está pendente!`,'warn',5000);
    else if(diff === 1) toast(`📅 Lembrete: verificar a fita amanhã.`,'info',4000);
  }
  if(state.config.filtroTroca) {
    const ultima = new Date(state.config.filtroTroca);
    const proxima = new Date(ultima);
    proxima.setDate(proxima.getDate() + (state.config.filtroIntervalo || 60));
    const diff = Math.ceil((proxima - new Date()) / (1000*60*60*24));
    if(diff <= 0) toast(`🔧 Filtro plissado: troca vencida! Verifique.`,'err',5000);
    else if(diff <= 7) toast(`🔧 Filtro plissado: troca em ${diff} dias.`,'warn',4000);
  }
}


syncCalcFromConfig();
const opsFita = document.getElementById('ops-fita-valor'); if(opsFita && state.latestRead?.valor) opsFita.value = state.latestRead.valor;
const opsPonto = document.getElementById('ops-fita-ponto'); if(opsPonto && state.latestRead?.ponto) opsPonto.value = state.latestRead.ponto;
const opsFce = document.getElementById('ops-fce'); if(opsFce) opsFce.value = state.config.fce;
const opsConc = document.getElementById('ops-conc'); if(opsConc) opsConc.value = state.config.hipoct;
renderOperacao();
renderDashboard();
showView('operacao');
initExtras();

['fita-valor','fita-ponto'].forEach(id => { const el=document.getElementById(id); if(el) el.addEventListener('input', renderSidebarSummary); if(el) el.addEventListener('change', renderSidebarSummary); });
calcularMisturaCenarios();

// Slider sync
document.getElementById('calc-fce').addEventListener('input', function() {
  document.getElementById('calc-fce-val').textContent = this.value + '%';
  calcular();
});

// ── Splash screen ──────────────────────────────────────────────────
(function() {
  const splash = document.getElementById('splash');
  if(!splash) return;
  // Hide after 3s
  setTimeout(() => {
    splash.classList.add('hiding');
    setTimeout(() => splash.classList.add('hidden'), 650);
  }, 3000);
  // Also hide on tap/click (impatient users)
  splash.addEventListener('click', () => {
    splash.classList.add('hiding');
    setTimeout(() => splash.classList.add('hidden'), 650);
  });
})();

// ── Deep-link shortcuts (PWA shortcuts) ───────────────────────────
(function() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if(view) setTimeout(() => showView(view), 200);
})();

// ── Service Worker registration ────────────────────────────────────
if('serviceWorker' in navigator) {
  const isLocalPreview = location.hostname.includes('claudeusercontent.com')
    || location.protocol === 'blob:'
    || location.hostname === '';
  if(!isLocalPreview) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('CloroPrime SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    });
  }
}
