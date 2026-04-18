# 💧 CloroPrime — Gestão de Cloração

> Sistema completo de monitoramento e gestão de cloração para tratamento de água potável. Funciona 100% no navegador, com suporte a PWA para instalação em desktop e mobile.

[![Deploy Status](https://github.com/SEU_USUARIO/cloroprime/actions/workflows/deploy.yml/badge.svg)](https://github.com/SEU_USUARIO/cloroprime/actions)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-1e8fff?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-e8a020.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-Suporte-22c55e)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Operação** | Painel principal com FCE, nível do tambor, dose atual e alertas em tempo real |
| **Calculadora** | Cálculo de dosagem de hipoclorito por vazão, concentração e FCE |
| **Dashboard** | Métricas de autonomia, consumo diário e gráficos históricos |
| **Histórico** | Registro de verificações com fita, abastecimentos e eventos |
| **Configuração** | Parâmetros da instalação, filtro plissado, custo e backup |
| **Validação Cruzada** | Alertas automáticos de supercloração, tambor vazio e fora do padrão ANVISA |
| **Temas** | Dark, Light, Midnight e modo automático (sistema) |
| **Tipografia** | 50+ fontes Google, ajuste de tamanho, peso, tracking e line-height |
| **Offline** | Service Worker com cache total — funciona sem internet |
| **PWA** | Instalável como app nativo em Android, iOS, Windows, macOS e Linux |

---

## 🚀 Deploy Rápido (GitHub Pages)

### 1. Fork / Clone
```bash
git clone https://github.com/SEU_USUARIO/cloroprime.git
cd cloroprime
```

### 2. Gere os ícones PNG
```bash
pip install cairosvg Pillow
python3 generate-icons.py
```
> O script lê `icons/icon.svg` e gera todos os tamanhos necessários automaticamente.

### 3. Commit e push
```bash
git add .
git commit -m "chore: initial deploy"
git push origin main
```

### 4. Ative o GitHub Pages
1. Acesse **Settings → Pages** no seu repositório
2. Em **Source**, selecione **GitHub Actions**
3. O workflow `.github/workflows/deploy.yml` cuida do deploy automaticamente

### 5. Acesse o app
```
https://SEU_USUARIO.github.io/cloroprime/
```

---

## 📱 Instalar como App (PWA)

### Android (Chrome / Edge)
1. Abra a URL no Chrome ou Edge
2. Toque no banner **"Instalar aplicativo"** ou acesse o menu `⋮ → Adicionar à tela inicial`
3. Confirme e o ícone aparece na sua tela inicial

### iOS (Safari)
1. Abra a URL no **Safari**
2. Toque no botão de **Compartilhar** (retângulo com seta ↑)
3. Selecione **"Adicionar à Tela de Início"**
4. Confirme — o app abre em tela cheia sem barra do Safari

### Windows (Chrome / Edge)
1. Acesse a URL no Chrome ou Edge
2. Clique no ícone de **instalar** na barra de endereço (🖥️ ou ➕)
3. Clique em **Instalar** — aparece como app no Menu Iniciar e na barra de tarefas

### macOS (Chrome / Edge / Safari)
- **Chrome/Edge:** mesmo processo do Windows — ícone na barra de endereço
- **Safari:** Arquivo → Adicionar ao Dock (macOS Sonoma+)

### Linux (Chrome / Chromium)
1. Acesse a URL
2. Clique no ícone de instalar na barra de endereço
3. O app é instalado em `~/.local/share/applications/`

---

## 🗂️ Estrutura do Projeto

```
cloroprime/
├── index.html            # App completo (SPA — tudo em um arquivo)
├── manifest.json         # Manifesto PWA (ícones, nome, shortcuts)
├── service-worker.js     # Cache offline e estratégias de fetch
├── generate-icons.py     # Script para gerar PNGs a partir do SVG
├── .gitignore
├── README.md
├── icons/
│   ├── icon.svg          # Ícone fonte (vetorial)
│   ├── icon-72.png       # → gerado por generate-icons.py
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png      # Ícone principal Android/maskable
│   ├── icon-384.png
│   ├── icon-512.png      # Ícone splash / maskable
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── apple-touch-icon.png  # iOS (180×180)
│   ├── favicon.ico           # Browser tab
│   ├── screenshot-mobile.png # (opcional) App Store screenshots
│   └── screenshot-desktop.png
└── .github/
    └── workflows/
        └── deploy.yml    # CI/CD — deploy automático no push para main
```

---

## ⚙️ Configuração do Service Worker

O arquivo `service-worker.js` usa duas estratégias:

| Tipo de recurso | Estratégia | Cache |
|----------------|------------|-------|
| App shell (HTML, manifest, ícones) | **Cache-First** | `cloroprime-static-*` |
| Chart.js (CDN) | **Cache-First** | `cloroprime-dynamic-*` |
| Fontes Google | **Cache-First** | `cloroprime-fonts-*` |
| Outros recursos | **Network-First** | `cloroprime-dynamic-*` |

Para forçar atualização de cache em um novo deploy, incremente `CACHE_VERSION` no início do arquivo:
```js
const CACHE_VERSION = 'v1.2.0'; // → 'v1.3.0'
```

---

## 🔄 Atualizar o App

O Service Worker verifica atualizações automaticamente quando o usuário abre o app. Para publicar uma nova versão:

```bash
# 1. Edite os arquivos necessários

# 2. Incremente CACHE_VERSION em service-worker.js
# const CACHE_VERSION = 'v1.3.0';

# 3. Commit e push — o GitHub Actions faz o deploy
git add .
git commit -m "feat: nova versão v1.3.0"
git push origin main
```

---

## 🛡️ Privacidade e Dados

- **100% local** — nenhum dado é enviado a servidores externos
- Todos os registros ficam no `localStorage` do dispositivo
- Backup e restauração via exportação JSON (na aba Configuração)
- Nenhum cookie, nenhum rastreamento, nenhuma analytics

---

## 📐 Tecnologias

- **HTML5 / CSS3 / JavaScript** — sem frameworks, sem build step
- **Chart.js 4.4.1** — gráficos históricos
- **Google Fonts** — tipografia customizável
- **Web Storage API** — persistência de dados
- **Service Worker API** — cache offline
- **Web App Manifest** — instalação PWA

---

## 📝 Licença

MIT © 2025 — Veja [LICENSE](LICENSE) para detalhes.

---

## 🤝 Contribuição

Pull requests são bem-vindos! Para mudanças grandes, abra uma issue primeiro para discutir o que você gostaria de mudar.

1. Fork o projeto
2. Crie sua branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

<p align="center">
  Feito com 💧 para operadores de sistemas de tratamento de água
</p>
