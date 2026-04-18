// CloroPrime — features.js
// Generated from index.html

// ─── Fontes ────────────────────────────────────────────────────────
function aplicarFonteSans(fonte, el) {
  document.documentElement.style.setProperty('--sans', `'${fonte}', sans-serif`);
  state.config.fonteSans = fonte;
  save();
  document.querySelectorAll('[data-font-sans]').forEach(c => c.classList.remove('selected'));
  if(el) el.classList.add('selected');
  toast(`Fonte principal: ${fonte}`, 'ok', 2000);
}

function aplicarFonteMono(fonte, el) {
  document.documentElement.style.setProperty('--mono', `'${fonte}', monospace`);
  state.config.fonteMono = fonte;
  save();
  document.querySelectorAll('[data-font-mono]').forEach(c => c.classList.remove('selected'));
  if(el) el.classList.add('selected');
  toast(`Fonte de dados: ${fonte}`, 'ok', 2000);
}

function carregarPersonalizacao() {
  const c = state.config;
  // tema
  const tema = c.tema || 'dark';
  if(tema === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    aplicarTemaVars(dark ? 'dark' : 'light');
  } else {
    aplicarTemaVars(tema);
    document.documentElement.setAttribute('data-theme', tema);
  }
  const tCard = document.querySelector(`.theme-card[data-theme="${tema}"]`);
  if(tCard) tCard.classList.add('selected');
  // fonte sans
  if(c.fonteSans) {
    document.documentElement.style.setProperty('--sans', `'${c.fonteSans}', sans-serif`);
    const fc = document.querySelector(`[data-font-sans="${c.fonteSans}"]`);
    if(fc) fc.classList.add('selected');
  } else {
    const fc = document.querySelector('[data-font-sans="Syne"]');
    if(fc) fc.classList.add('selected');
  }
  // fonte mono
  if(c.fonteMono) {
    document.documentElement.style.setProperty('--mono', `'${c.fonteMono}', monospace`);
    const fc = document.querySelector(`[data-font-mono="${c.fonteMono}"]`);
    if(fc) fc.classList.add('selected');
  } else {
    const fc = document.querySelector('[data-font-mono="Space Mono"]');
    if(fc) fc.classList.add('selected');
  }
  // backup info
  const ultimoEl = document.getElementById('backup-ultima-data');
  if(ultimoEl && state.ultimoBackup) {
    ultimoEl.textContent = new Date(state.ultimoBackup).toLocaleString('pt-BR');
  }
}

// ─── Backup ────────────────────────────────────────────────────────
function exportarBackup() {
  state.ultimoBackup = new Date().toISOString();
  save();
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const data = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  a.href = url;
  a.download = `CloroPrime_backup_${data}.json`;
  a.click();
  URL.revokeObjectURL(url);
  const ultimoEl = document.getElementById('backup-ultima-data');
  if(ultimoEl) ultimoEl.textContent = new Date().toLocaleString('pt-BR');
  toast('📤 Backup exportado com sucesso!', 'ok');
}

function importarBackup(input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const dados = JSON.parse(e.target.result);
      if(!dados.config || !Array.isArray(dados.hist)) {
        toast('Arquivo inválido. Selecione um backup gerado pelo CloroPrime.', 'err', 5000);
        return;
      }
      if(!confirm(`Importar backup de ${dados.ultimoBackup ? new Date(dados.ultimoBackup).toLocaleString('pt-BR') : 'data desconhecida'}?\n\nISTO VAI SUBSTITUIR todos os dados atuais.`)) return;
      state = dados;
      save();
      carregarPersonalizacao();
      renderOperacao();
      renderDashboard();
      toast('📥 Backup importado com sucesso! ✅', 'ok', 4000);
    } catch(err) {
      toast('Erro ao ler o arquivo. Certifique-se que é um JSON válido.', 'err', 5000);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ─── Wizard ────────────────────────────────────────────────────────
let wzPasso = 0;
let wzFonte = 'misto';
const WZ_TOTAL = 6;

function wzRenderProgress() {
  const bar = document.getElementById('wizard-progress');
  if(!bar) return;
  bar.innerHTML = Array.from({length: WZ_TOTAL}, (_,i) =>
    `<div class="wp ${i <= wzPasso ? 'done' : ''}"></div>`).join('');
}

function wzMostrarPasso(n) {
  document.querySelectorAll('.wizard-step').forEach((el,i) => {
    el.classList.toggle('active', i === n);
  });
  wzPasso = n;
  wzRenderProgress();
}

function wzAvancar() { wzMostrarPasso(wzPasso + 1); }
function wzVoltar()  { wzMostrarPasso(Math.max(0, wzPasso - 1)); }

function wzSelecionarFonte(fonte, el) {
  wzFonte = fonte;
  document.querySelectorAll('#wz-1 .wz-choice').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function wzFinalizar() {
  const c = state.config;
  c.reserv = parseFloat(document.getElementById('wz-reserv').value) || 30000;
  c.reservSec = parseFloat(document.getElementById('wz-reserv-sec').value) || 0;
  c.unidades = parseInt(document.getElementById('wz-unidades').value) || 80;
  c.pessoas = Math.round(c.unidades * 3);
  c.bombaMax = parseFloat(document.getElementById('wz-bomba').value) || 1.5;
  c.modeloBomba = document.getElementById('wz-modelo').value || '';
  c.fce = parseFloat(document.getElementById('wz-fce').value) || 15;
  c.hipoct = parseFloat(document.getElementById('wz-conc').value) || 12;
  c.vazao = parseFloat(document.getElementById('wz-vazao').value) || 1500;
  c.tambor = parseFloat(document.getElementById('wz-tambor-cap').value) || 100;
  state.nivel = parseFloat(document.getElementById('wz-nivel').value) || 80;
  state.wizardConcluido = true;
  save();
  fecharWizard(false);
  syncCalcFromConfig();
  renderOperacao();
  renderDashboard();
  addHistorico('config', 'Configuração inicial pelo wizard', `${c.unidades} apt · bomba ${c.bombaMax}L/h · FCE ${c.fce}% · hipoct ${c.hipoct}%`);
  toast('✅ Configuração salva! O app já está calculando com seus dados.', 'ok', 5000);
}

function fecharWizard(pular) {
  document.getElementById('wizard-overlay').classList.add('hidden');
  if(pular) { state.wizardConcluido = true; save(); toast('Configuração pulada. Ajuste em Config quando quiser.', 'info'); }
}

function abrirWizard() {
  wzPasso = 0;
  wzMostrarPasso(0);
  document.getElementById('wizard-overlay').classList.remove('hidden');
}

// ─── Validação cruzada ─────────────────────────────────────────────
function validarCruzado() {
  const zona = document.getElementById('valida-zone');
  if(!zona) return;
  const cfg = state.config;
  const nivel = Number(state.nivel || 0);
  const fce = parseFloat(cfg.fce || 0);
  const bomba = parseFloat(cfg.bombaMax || 1.5);
  const conc = parseFloat(cfg.hipoct || 12);
  const vazao = parseFloat(cfg.vazao || 1500);
  const tambor = parseFloat(cfg.tambor || 100);
  const pumpLh = getPumpFlowLH(fce, bomba);
  const consumoDia = pumpLh * 24;
  const autonomiaH = (consumoDia > 0 && nivel > 0) ? (nivel / pumpLh) : 9999;
  const autonomiaDias = consumoDia > 0 ? (nivel / consumoDia) : 999;
  const cAtivoMgL = (vazao > 0 && pumpLh > 0) ? (pumpLh * (conc/100) * 1000 * 1000) / vazao : 0;
  const alertas = [];

  if(fce === 0) {
    alertas.push({ tipo:'danger', icon:'🔴', msg:'Dosador em 0% — nenhum cloro está sendo injetado.' });
  }
  if(nivel <= 0 && fce > 0) {
    alertas.push({ tipo:'danger', icon:'🚨', msg:'Tambor vazio com dosador ligado! Abasteça imediatamente.' });
  } else if(autonomiaH < 4 && fce > 0 && nivel > 0) {
    alertas.push({ tipo:'danger', icon:'⏱️', msg:`Tambor zera em menos de ${autonomiaH.toFixed(1)}h. Abasteça hoje!` });
  } else if(autonomiaDias < 2 && fce > 0 && nivel > 0) {
    alertas.push({ tipo:'warn', icon:'⚠️', msg:`Autonomia crítica: apenas ${autonomiaDias.toFixed(1)} dia(s) no tambor. Planeje o abastecimento.` });
  }

  if(cAtivoMgL > 5 && fce > 0) {
    alertas.push({ tipo:'danger', icon:'☣️', msg:`Supercloração! Dose de ${cAtivoMgL.toFixed(2)} mg/L excede o limite de 5 mg/L (ANVISA). Reduza o FCE.` });
  } else if(cAtivoMgL > 2 && fce > 0) {
    alertas.push({ tipo:'warn', icon:'⚠️', msg:`Dose de ${cAtivoMgL.toFixed(2)} mg/L está alta — pode gerar gosto e odor. Considere reduzir o FCE.` });
  } else if(cAtivoMgL < 0.2 && fce > 0 && nivel > 0) {
    alertas.push({ tipo:'warn', icon:'⚠️', msg:`Dose de ${cAtivoMgL.toFixed(3)} mg/L está abaixo do mínimo ANVISA (0,2 mg/L). Verifique FCE, concentração e vazão.` });
  }

  if(conc <= 2.5 && fce > 0) {
    alertas.push({ tipo:'info', icon:'💡', msg:'Produto 2,5% (água sanitária doméstica): volume necessário é muito maior. Considere hipoclorito 10-12%.' });
  }

  if(cfg.filtroTroca) {
    const proxima = new Date(cfg.filtroTroca);
    proxima.setDate(proxima.getDate() + (cfg.filtroIntervalo || 60));
    const diffDias = Math.ceil((proxima - new Date()) / (1000*60*60*24));
    if(diffDias < 0) alertas.push({ tipo:'warn', icon:'🔧', msg:`Filtro plissado com troca vencida há ${Math.abs(diffDias)} dia(s).` });
    else if(diffDias <= 7) alertas.push({ tipo:'info', icon:'🔧', msg:`Filtro plissado: troca em ${diffDias} dia(s).` });
  }

  if(state.proximaVerif) {
    const diff = Math.ceil((new Date(state.proximaVerif) - new Date()) / (1000*60*60*24));
    if(diff < 0) alertas.push({ tipo:'warn', icon:'📅', msg:`Verificação da fita pendente desde ${new Date(state.proximaVerif).toLocaleDateString('pt-BR')}.` });
  }

  zona.innerHTML = alertas.map(a =>
    `<div class="valida-item ${a.tipo}"><span class="vi-icon">${a.icon}</span><span>${a.msg}</span></div>`
  ).join('');
}

// ─── FAQ toggle ────────────────────────────────────────────────────
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer.open').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question.open').forEach(b => b.classList.remove('open'));
  if(!isOpen) { answer.classList.add('open'); btn.classList.add('open'); }
}

function exportarHistorico() {
  if(!state.hist.length) { toast('Histórico vazio, nada para exportar.','warn'); return; }
  const linhas = [['Data','Tipo','Título','Detalhe']];
  state.hist.forEach(h => {
    const d = new Date(h.ts).toLocaleString('pt-BR');
    linhas.push([d, h.tipo, h.titulo, h.sub]);
  });
  const csv = linhas.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `CloroPrime_historico_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📥 Histórico exportado como CSV!','ok');
}