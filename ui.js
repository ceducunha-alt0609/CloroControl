// CloroPrime — ui.js
// Generated from index.html

// ─── Toast ─────────────────────────────────────────────────────────
function toast(msg, tipo='info', dur=3200) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(8px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(), 320); }, dur);
}

// ─── IA Foto da fita ───────────────────────────────────────────────
function abrirCameraFita() {
  document.getElementById('fita-camera-input').click();
}

document.getElementById('fita-camera-input').addEventListener('change', async function() {
  const file = this.files[0];
  if(!file) return;
  const loading = document.getElementById('ai-loading');
  const resultBox = document.getElementById('ai-result-box');
  loading.classList.add('visible');
  resultBox.classList.remove('visible');
  try {
    const base64 = await fileToBase64(file);
    const result = await interpretarFitaComIA(base64, file.type || 'image/jpeg');
    loading.classList.remove('visible');
    if(result && result.valor !== null) {
      document.getElementById('ai-result-val').textContent = fmtBR(result.valor, 1) + ' mg/L';
      document.getElementById('ai-result-desc').textContent = result.descricao + (result.confianca ? ' · Confiança: ' + result.confianca : '');
      resultBox.classList.add('visible');
      document.getElementById('ops-fita-valor').value = result.valor;
      syncOperacaoFromUI();
      toast('📷 Fita interpretada pela IA! Confira o valor e registre.', 'ok', 4000);
    } else {
      toast('Não consegui identificar a cor da fita. Tente iluminar melhor e refotografar.', 'warn', 4500);
    }
  } catch(err) {
    loading.classList.remove('visible');
    console.error('Erro IA fita:', err);
    toast('Erro ao analisar a foto. Verifique a conexão e tente novamente.', 'err');
  }
  this.value = '';
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function interpretarFitaComIA(base64, mediaType) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'Você é um especialista em análise de fitas de teste de cloro para água. Sua tarefa é interpretar a cor de uma fita de teste e estimar a concentração de cloro residual livre em mg/L. Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, sem markdown. Formato: {"valor": 0.5, "confianca": "alta", "descricao": "Cor levemente amarelada, indica baixa concentração"}. Se não conseguir identificar, retorne {"valor": null, "confianca": "nenhuma", "descricao": "Não foi possível identificar"}.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Analise a cor desta fita de teste de cloro. A fita geralmente tem uma escala de cores do branco/amarelo claro (baixo cloro ~0,2 mg/L) ao roxo/violeta escuro (cloro alto ~5 mg/L). Identifique a cor do bloco indicador de cloro livre e estime o valor em mg/L.' }
        ]
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── Agendar próxima verificação ───────────────────────────────────
function agendarProximaVerificacao() {
  const diasOpcoes = ['1 dia', '2 dias', '3 dias', '7 dias'];
  const escolha = prompt('Daqui a quantos dias verificar novamente?\n1 = 1 dia\n2 = 2 dias\n3 = 3 dias\n7 = 7 dias\n\nDigite o número:');
  const dias = parseInt(escolha);
  if(isNaN(dias) || dias < 1) { toast('Número inválido.','warn'); return; }
  const data = new Date();
  data.setDate(data.getDate() + dias);
  state.proximaVerif = data.toISOString();
  save();
  renderProximaVerif();
  addHistorico('config', `Próxima verificação agendada`, `Em ${dias} dia(s) — ${data.toLocaleDateString('pt-BR')}`);
  toast(`📅 Verificação agendada para ${data.toLocaleDateString('pt-BR')}`, 'ok');
}

function renderProximaVerif() {
  const el = document.getElementById('ops-proxima-verif');
  if(!el) return;
  if(!state.proximaVerif) { el.textContent = '—'; el.style.color = 'var(--text3)'; return; }
  const d = new Date(state.proximaVerif);
  const hoje = new Date();
  const diff = Math.ceil((d - hoje) / (1000*60*60*24));
  el.textContent = d.toLocaleDateString('pt-BR');
  if(diff < 0) { el.style.color = 'var(--danger)'; el.textContent += ' ⚠ vencida'; }
  else if(diff === 0) { el.style.color = 'var(--warn)'; el.textContent += ' — hoje!'; }
  else { el.style.color = 'var(--accent)'; }
  // alert no dashboard se vencida
  const az = document.getElementById('alert-zone');
  if(az && diff <= 0) {
    const alreadyHas = az.querySelector('.verif-alert');
    if(!alreadyHas) {
      const div = document.createElement('div');
      div.className = 'alert alert-warn verif-alert';
      div.textContent = `📅 Verificação da fita estava agendada para ${d.toLocaleDateString('pt-BR')} — faça a leitura hoje!`;
      az.prepend(div);
    }
  }
}

// ─── Filtro plissado ───────────────────────────────────────────────
function renderFiltroStatus() {
  const el = document.getElementById('ops-filtro-status');
  const infoEl = document.getElementById('cfg-filtro-info');
  const troca = state.config.filtroTroca;
  const intervalo = parseInt(state.config.filtroIntervalo) || 60;
  if(!troca) {
    if(el) { el.className = 'filter-badge warn'; el.textContent = 'Data não informada'; }
    if(infoEl) infoEl.textContent = 'Informe a data da última troca para monitorar.';
    return;
  }
  const ultima = new Date(troca);
  const proxima = new Date(ultima);
  proxima.setDate(proxima.getDate() + intervalo);
  const hoje = new Date();
  const diasRestantes = Math.ceil((proxima - hoje) / (1000*60*60*24));
  const proxFmt = proxima.toLocaleDateString('pt-BR');
  if(diasRestantes < 0) {
    if(el) { el.className = 'filter-badge danger'; el.textContent = `Vencido há ${Math.abs(diasRestantes)}d`; }
    if(infoEl) infoEl.textContent = `⚠️ Troca vencida! Próxima deveria ter sido em ${proxFmt}. Troque o filtro.`;
  } else if(diasRestantes <= 14) {
    if(el) { el.className = 'filter-badge warn'; el.textContent = `Trocar em ${diasRestantes}d`; }
    if(infoEl) infoEl.textContent = `⚠️ Filtro próximo do vencimento. Troca em ${proxFmt}.`;
  } else {
    if(el) { el.className = 'filter-badge ok'; el.textContent = `OK — ${diasRestantes}d restantes`; }
    if(infoEl) infoEl.textContent = `✅ Filtro OK. Próxima troca em ${proxFmt} (${diasRestantes} dias).`;
  }
}

// ─── Custo do produto ──────────────────────────────────────────────
function renderCustoInfo() {
  const infoEl = document.getElementById('cfg-custo-info');
  if(!infoEl) return;
  const preco = parseFloat(state.config.precoProduto) || 0;
  const vol = parseFloat(state.config.volGalao) || 0;
  if(!preco || !vol) { infoEl.textContent = 'Preencha preço e volume para calcular o custo por litro.'; return; }
  const custoPorL = preco / vol;
  const cfg = state.config;
  const bomba = parseFloat(cfg.bombaMax || 1.5);
  const consumoDia = getPumpFlowLH(cfg.fce, bomba) * 24;
  const custoDia = consumoDia * custoPorL;
  const custoMes = custoDia * 30;
  infoEl.textContent = `R$ ${custoPorL.toFixed(2)}/L · ~R$ ${custoDia.toFixed(2)}/dia · ~R$ ${custoMes.toFixed(2)}/mês`;
}