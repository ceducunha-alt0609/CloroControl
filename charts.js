// CloroPrime — charts.js
// Generated from index.html

// ─── Charts ────────────────────────────────────────────────────────
let chartLeituras = null;
let chartCusto = null;
let chartSemanal = null;
let periodoLeituras = 7;

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#13161d',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      titleColor: '#8891a8',
      bodyColor: '#f0f2f8',
      titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
      bodyFont:  { family: "'JetBrains Mono', monospace", size: 13, weight: '700' },
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      border: { display: false },
      ticks: { color: '#4a5470', font: { family: "'JetBrains Mono', monospace", size: 10 }, maxRotation: 0 }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      border: { display: false },
      ticks: { color: '#4a5470', font: { family: "'JetBrains Mono', monospace", size: 10 } }
    }
  }
};

function getLeiturasDoPeriodo(dias) {
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  return state.hist
    .filter(h => h.tipo === 'calc' && h.titulo.includes('Leitura da fita') && new Date(h.ts) >= limite)
    .map(h => {
      const match = h.titulo.match(/([\d,.]+)\s*mg\/L/);
      const val = match ? parseFloat(match[1].replace(',','.')) : null;
      return { ts: new Date(h.ts), val };
    })
    .filter(h => h.val !== null)
    .reverse();
}

function renderChartLeituras() {
  const dados = getLeiturasDoPeriodo(periodoLeituras);
  const ultima = dados.length ? dados[dados.length-1].val : null;
  const elUltima = document.getElementById('ch-leitura-ultima');
  if(elUltima) elUltima.innerHTML = ultima !== null ? `${ultima.toFixed(2)} <span class="unit">mg/L</span>` : `-- <span class="unit">mg/L</span>`;

  const ctx = document.getElementById('chart-leituras');
  if(!ctx) return;
  if(chartLeituras) { chartLeituras.destroy(); chartLeituras = null; }

  if(!dados.length) {
    const c2d = ctx.getContext('2d');
    c2d.clearRect(0, 0, ctx.width, ctx.height);
    c2d.font = "12px 'JetBrains Mono', monospace";
    c2d.fillStyle = '#4a5470';
    c2d.textAlign = 'center';
    c2d.fillText('Nenhuma leitura registrada ainda', ctx.width/2, ctx.height/2);
    return;
  }

  const labels = dados.map(d => d.ts.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
  const values = dados.map(d => d.val);
  const pointColors = values.map(v => v < 0.2 ? '#ef4444' : v > 2 ? '#f59e0b' : '#22c55e');
  const pointBorders = values.map(v => v < 0.2 ? 'rgba(239,68,68,0.4)' : v > 2 ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.3)');

  chartLeituras = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#1e8fff',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx: c, chartArea} = chart;
          if(!chartArea) return 'rgba(30,143,255,0.06)';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(30,143,255,0.18)');
          gradient.addColorStop(1, 'rgba(30,143,255,0.01)');
          return gradient;
        },
        borderWidth: 2,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointBorders,
        pointBorderWidth: 6,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        ...CHART_DEFAULTS.scales,
        y: {
          ...CHART_DEFAULTS.scales.y, min: 0, suggestedMax: 2,
          ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v.toFixed(1) + ' mg/L' }
        }
      },
      plugins: { ...CHART_DEFAULTS.plugins }
    }
  });
}

function renderChartCusto() {
  const cfg = state.config;
  const preco = parseFloat(cfg.precoProduto) || 0;
  const vol = parseFloat(cfg.volGalao) || 20;
  const bomba = parseFloat(cfg.bombaMax || 1.5);
  const consumoDia = getPumpFlowLH(cfg.fce, bomba) * 24;
  const custoPorL = preco > 0 && vol > 0 ? preco / vol : 0;
  const custoDia = consumoDia * custoPorL;
  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
  const diaAtual = hoje.getDate();

  const elMes = document.getElementById('ch-custo-mes');
  const elSub = document.getElementById('ch-custo-sub');
  const custoMes = custoDia * diasNoMes;
  if(elMes) elMes.innerHTML = custoPorL > 0 ? `R$ ${custoMes.toFixed(2)} <span class="unit">/ mês est.</span>` : `R$ -- <span class="unit">configure o preço</span>`;
  if(elSub) elSub.textContent = custoPorL > 0 ? `R$ ${custoPorL.toFixed(2)}/L · ${consumoDia.toFixed(2)} L/dia` : 'Configure preço em Config';

  const ctx = document.getElementById('chart-custo');
  if(!ctx) return;
  if(chartCusto) { chartCusto.destroy(); chartCusto = null; }

  const labels = Array.from({length: diaAtual}, (_,i) => (i+1).toString());
  const dataAcum = labels.map((_,i) => parseFloat(((i+1) * custoDia).toFixed(2)));
  const dataProj = Array.from({length: diasNoMes}, (_,i) => parseFloat(((i+1) * custoDia).toFixed(2)));
  const labelsAll = Array.from({length: diasNoMes}, (_,i) => (i+1).toString());

  chartCusto = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labelsAll,
      datasets: [
        {
          label: 'Projetado',
          data: dataProj,
          backgroundColor: 'rgba(30,143,255,0.10)',
          borderColor: 'rgba(30,143,255,0.25)',
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: 'Acumulado',
          data: [...dataAcum, ...new Array(diasNoMes - diaAtual).fill(null)],
          backgroundColor: 'rgba(232,160,32,0.65)',
          borderColor: '#e8a020',
          borderWidth: 0,
          borderRadius: 4,
        },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          display: true,
          labels: {
            color: '#8891a8',
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            boxWidth: 10, boxHeight: 10,
            borderRadius: 3, useBorderRadius: true,
          }
        }
      },
      scales: {
        x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxTicksLimit: 10 } },
        y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => 'R$' + v.toFixed(0) } }
      }
    }
  });
}

function renderChartSemanal() {
  // Pega leituras dos últimos 8 semanas e calcula médias
  const semanas = [];
  for(let i = 7; i >= 0; i--) {
    const fim = new Date(); fim.setDate(fim.getDate() - i*7);
    const ini = new Date(fim); ini.setDate(ini.getDate() - 6);
    const leituras = state.hist
      .filter(h => {
        if(h.tipo !== 'calc' || !h.titulo.includes('Leitura da fita')) return false;
        const d = new Date(h.ts);
        return d >= ini && d <= fim;
      })
      .map(h => { const m = h.titulo.match(/([\d,.]+)\s*mg\/L/); return m ? parseFloat(m[1].replace(',','.')) : null; })
      .filter(v => v !== null);
    const media = leituras.length ? leituras.reduce((a,b)=>a+b,0)/leituras.length : null;
    const label = `S${8-i}`;
    semanas.push({ label, media, count: leituras.length });
  }

  const ctx = document.getElementById('chart-semanal');
  if(!ctx) return;
  if(chartSemanal) { chartSemanal.destroy(); chartSemanal = null; }

  chartSemanal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: semanas.map(s => s.label),
      datasets: [{
        label: 'Média mg/L',
        data: semanas.map(s => s.media !== null ? parseFloat(s.media.toFixed(3)) : 0),
        backgroundColor: semanas.map(s => {
          if(s.media === null || s.count === 0) return 'rgba(255,255,255,0.04)';
          if(s.media < 0.2)  return 'rgba(239,68,68,0.65)';
          if(s.media > 2)    return 'rgba(245,158,11,0.65)';
          return 'rgba(34,197,94,0.55)';
        }),
        borderColor: semanas.map(s => {
          if(s.media === null || s.count === 0) return 'rgba(255,255,255,0.06)';
          if(s.media < 0.2)  return 'rgba(239,68,68,0.4)';
          if(s.media > 2)    return 'rgba(245,158,11,0.4)';
          return 'rgba(34,197,94,0.35)';
        }),
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { ...CHART_DEFAULTS.scales.x },
        y: {
          ...CHART_DEFAULTS.scales.y, min: 0, suggestedMax: 1.5,
          ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v.toFixed(1) + ' mg/L' }
        }
      }
    }
  });
}

function mudarPeriodoLeituras(dias, btn) {
  periodoLeituras = dias;
  document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderChartLeituras();
}

function renderResumoDia() {
  const cfg = state.config;
  const nivel = Number(state.nivel || 0);
  const pct = cfg.tambor > 0 ? Math.round((nivel / cfg.tambor) * 100) : 0;
  const bomba = parseFloat(cfg.bombaMax || 1.5);
  const consumoDia = getPumpFlowLH(cfg.fce, bomba) * 24;
  const autonomia = consumoDia > 0 ? nivel / consumoDia : 999;
  const preco = parseFloat(cfg.precoProduto) || 0;
  const vol = parseFloat(cfg.volGalao) || 20;
  const custoPorL = preco > 0 && vol > 0 ? preco / vol : 0;
  const custoDia = consumoDia * custoPorL;
  const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();

  const hoje = new Date();
  const el = id => document.getElementById(id);

  if(el('dash-hoje-data')) el('dash-hoje-data').textContent = hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

  if(el('ds-tambor')) { el('ds-tambor').textContent = nivel.toFixed(1) + ' L'; el('ds-tambor').className = 'dc-v ' + (pct <= 10 ? 'danger' : pct <= 20 ? 'warn' : 'blue'); }
  if(el('ds-tambor-s')) el('ds-tambor-s').textContent = `${pct}% · ${autonomia < 999 ? autonomia.toFixed(1) + ' dias' : '∞'}`;

  // última leitura
  const ultima = state.hist.find(h => h.tipo === 'calc' && h.titulo.includes('Leitura da fita'));
  if(ultima) {
    const match = ultima.titulo.match(/([\d,.]+)\s*mg\/L/);
    const val = match ? parseFloat(match[1].replace(',','.')) : null;
    if(val !== null && el('ds-leitura')) {
      el('ds-leitura').textContent = val.toFixed(2) + ' mg/L';
      el('ds-leitura').className = 'dc-v ' + (val < 0.2 ? 'danger' : val > 2 ? 'warn' : 'ok');
      const d = new Date(ultima.ts);
      if(el('ds-leitura-s')) el('ds-leitura-s').textContent = d.toLocaleDateString('pt-BR') + ' · ' + (ultima.sub?.split('·')[0]?.trim() || '');
    }
  } else {
    if(el('ds-leitura')) el('ds-leitura').textContent = '-- mg/L';
  }

  if(el('ds-fce')) { el('ds-fce').textContent = cfg.fce + '%'; }
  if(el('ds-fce-s')) el('ds-fce-s').textContent = consumoDia.toFixed(2) + ' L/dia';

  if(el('ds-custo')) el('ds-custo').textContent = custoPorL > 0 ? 'R$ ' + (custoDia * diasNoMes).toFixed(2) : 'R$ --';
  if(el('ds-custo-s')) el('ds-custo-s').textContent = custoPorL > 0 ? `${consumoDia.toFixed(2)} L/dia × R$ ${custoPorL.toFixed(2)}/L` : 'configure o preço em Config';

  if(el('ds-prox-abast')) {
    if(autonomia < 999 && consumoDia > 0) {
      const prox = new Date(); prox.setDate(prox.getDate() + Math.floor(autonomia));
      el('ds-prox-abast').textContent = prox.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
      el('ds-prox-abast').className = 'dc-v ' + (autonomia < 2 ? 'danger' : autonomia < 5 ? 'warn' : 'ok');
    } else { if(el('ds-prox-abast')) el('ds-prox-abast').textContent = '∞'; }
  }

  if(cfg.filtroTroca && el('ds-filtro')) {
    const proxima = new Date(cfg.filtroTroca);
    proxima.setDate(proxima.getDate() + (cfg.filtroIntervalo || 60));
    const diff = Math.ceil((proxima - hoje) / (1000*60*60*24));
    el('ds-filtro').textContent = diff < 0 ? 'Vencido' : diff + 'd';
    el('ds-filtro').className = 'dc-v ' + (diff < 0 ? 'danger' : diff <= 7 ? 'warn' : 'ok');
    if(el('ds-filtro-s')) el('ds-filtro-s').textContent = diff < 0 ? 'Troca urgente!' : `troca em ${proxima.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}`;
  } else if(el('ds-filtro')) { el('ds-filtro').textContent = '--'; }
}


const TEMAS = {
  dark:     { label:'Escuro',   bg:'#0c0e12',bg2:'#13161d',bg3:'#1a1e28',border:'rgba(255,255,255,0.07)',border2:'rgba(255,255,255,0.13)',accent:'#1e8fff',accent2:'#1270cc',text:'#f0f2f8',text2:'#8891a8',text3:'#4a5470' },
  midnight: { label:'Midnight', bg:'#020304',bg2:'#08090c',bg3:'#0e1015',border:'rgba(255,255,255,0.05)',border2:'rgba(255,255,255,0.09)',accent:'#1e8fff',accent2:'#1270cc',text:'#e8eaf2',text2:'#6a7080',text3:'#3a3f50' },
  light:    { label:'Claro',    bg:'#f4f6fa',bg2:'#eaedf4',bg3:'#e0e5ef',border:'rgba(0,0,0,0.08)',border2:'rgba(0,0,0,0.13)',accent:'#1060bb',accent2:'#0a4a99',text:'#0c0e12',text2:'#404660',text3:'#7080a0' },
};

function aplicarTema(tema, el) {
  // sistema = segue prefers-color-scheme
  if(tema === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    aplicarTemaVars(dark ? 'dark' : 'light');
    document.documentElement.removeAttribute('data-theme');
  } else {
    aplicarTemaVars(tema);
    document.documentElement.setAttribute('data-theme', tema);
  }
  state.config.tema = tema;
  save();
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
  if(el) el.classList.add('selected');
  else { const found = document.querySelector(`.theme-card[data-theme="${tema}"]`); if(found) found.classList.add('selected'); }
  toast(`Tema "${TEMAS[tema]?.label || tema}" aplicado`, 'ok', 2000);
}

function aplicarTemaVars(tema) {
  const t = TEMAS[tema];
  if(!t) return;
  const styleEl = document.getElementById('theme-vars');
  styleEl.textContent = `:root {
    --bg:${t.bg};--bg2:${t.bg2};--bg3:${t.bg3};
    --border:${t.border};--border2:${t.border2};
    --accent:${t.accent};--accent2:${t.accent2};
    --text:${t.text};--text2:${t.text2};--text3:${t.text3};
  }`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
}