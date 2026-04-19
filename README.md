# 💧 CloroPrime — Gestão de Cloração

Sistema web progressivo (PWA) para monitoramento e gestão inteligente de cloração de água. Funciona **offline**, pode ser **instalado no celular e no PC** como um app nativo, e não depende de nenhum servidor backend.

---

## ✨ Funcionalidades

- 📊 **Dashboard** com gráficos de histórico de leituras e consumo
- 🧪 **Calculadora de dose** (mg/L, FCE, autonomia do tambor)
- 🛢️ **Gestão do tambor** com barras de nível e alertas automáticos
- 📋 **Histórico** de abastecimentos e leituras de fita
- ⚙️ **Configuração completa** de bomba, concentração, vazão e filtro
- 🔔 **Alertas inteligentes** de supercloração, tambor baixo e filtro vencido
- 🌙 Tema escuro, claro e midnight
- 🔤 31 opções de fonte (padrão: Merriweather)
- 📴 **Funciona 100% offline** após a primeira carga

---

## 🚀 Como usar

### Opção 1 — GitHub Pages (recomendado)

1. Faça fork deste repositório
2. Vá em **Settings → Pages**
3. Em *Source*, selecione **Deploy from a branch**
4. Escolha a branch `main` e a pasta `/ (root)`
5. Clique **Save**
6. Após alguns minutos, acesse `https://SEU_USUARIO.github.io/NOME_DO_REPO/CloroPrime.html`

> ⚠️ O HTTPS do GitHub Pages é obrigatório para o Service Worker funcionar (e o app ser instalável).

---

### Opção 2 — Servidor local com HTTPS

```bash
# Com Python (requer certificado — use mkcert ou similar)
python3 -m http.server 8443

# Com Node.js (http-server com SSL)
npx http-server -S -C cert.pem -K key.pem
```

> ⚠️ Service Workers **não funcionam em HTTP simples** (`http://localhost` é exceção — funciona só em localhost).

---

## 📱 Instalação no Celular (Android / iOS)

### Android (Chrome)
1. Acesse a URL do app no Chrome
2. Aguarde alguns segundos — aparecerá um banner **"Adicionar à tela inicial"** ou **"Instalar app"**
3. Toque em **Instalar**
4. O CloroPrime aparecerá na sua tela inicial como um app nativo

> Se o banner não aparecer: toque no menu `⋮` → **"Adicionar à tela inicial"**

### iOS (Safari)
1. Acesse a URL no **Safari** (obrigatório — Chrome no iOS não suporta instalação de PWA)
2. Toque no botão **Compartilhar** (ícone de seta para cima)
3. Selecione **"Adicionar à Tela de Início"**
4. Confirme tocando em **Adicionar**

---

## 💻 Instalação no PC (Windows / Mac / Linux)

### Chrome / Edge
1. Acesse a URL do app
2. Na barra de endereços, clique no ícone **⊕ Instalar** (canto direito)
3. Clique em **Instalar**
4. O app abrirá em janela própria, sem barra do navegador

> No **Edge**: menu `...` → **Aplicativos** → **Instalar este site como aplicativo**

### Verificar se está instalado
- Windows: procure "CloroPrime" no Menu Iniciar
- Mac: procure no Launchpad
- Linux: procure no launcher de aplicativos

---

## 📁 Estrutura de arquivos

```
/
├── CloroPrime.html          # App principal (toda a lógica está aqui)
├── manifest.json            # Configuração do PWA (ícones, nome, shortcuts)
├── service-worker.js        # Cache offline e estratégias de fetch
├── .nojekyll                # Necessário para GitHub Pages servir arquivos corretamente
├── README.md                # Este arquivo
└── icons/
    ├── favicon.ico          # Ícone do navegador
    ├── icon-16.png          # Favicon pequeno
    ├── icon-32.png          # Favicon médio
    ├── icon-192.png         # Ícone Android / PWA padrão
    ├── icon-512.png         # Ícone PWA alta resolução
    ├── icon-maskable-512.png # Ícone adaptável (Android 8+)
    └── apple-touch-icon.png  # Ícone iOS (180×180)
```

---

## 🔧 Dados e privacidade

Todos os dados são salvos **localmente no dispositivo** via `localStorage`. Nenhum dado é enviado para servidores externos. O app funciona completamente offline após a primeira carga.

Para fazer backup dos dados: vá em **Config → Backup → Exportar**.

---

## 🛠️ Tecnologias

- HTML5 + CSS3 + JavaScript puro (sem frameworks)
- [Chart.js](https://www.chartjs.org/) para gráficos
- [Google Fonts](https://fonts.google.com/) — Merriweather + JetBrains Mono
- PWA: Web App Manifest + Service Worker

---

## 📄 Licença

MIT — use livremente, inclusive em projetos comerciais.
