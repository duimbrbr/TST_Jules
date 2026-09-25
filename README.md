# MercadoLista 🛒 - App de Lista de Mercado & Controle de Gastos (PWA)

O **MercadoLista** é uma aplicação web progressiva (PWA) moderna, responsiva e completa para gerenciamento de listas de compras, leitor de código de barras de produtos, captura de notas fiscais (NFC-e), cadastro de lojas e redes, e relatórios analíticos de comparação de preços e gastos.

---

## 🚀 Funcionalidades Principais

- 📋 **Listas de Compras Colaborativas**:
  - Criação de listas com controle de orçamento limite (R$) e cálculo automático de valores estimados vs. valor real no carrinho.
  - Progresso visual de itens marcados/comprados.
  - Compartilhamento de listas em tempo real via **Link direto** ou botão de envio instantâneo pelo **WhatsApp**.

- 📷 **Leitor de Código de Barras & Integração com Base Pública**:
  - Leitura de códigos de barras de produtos através da câmera do navegador (WebCam API).
  - Consulta e preenchimento automático de dados do produto via API pública **Open Food Facts**.

- 🏷️ **Cadastro de Produtos & Lojas**:
  - **Produtos**: Cadastro com categoria, marca, unidade de medida, código de barras e **URL direta de foto** (evitando alto consumo de armazenamento em nuvem).
  - **Lojas e Redes de Lojas**: Estrutura hierárquica conectando Lojas (*Zaffari Ipiranga, Carrefour Passo D'Areia, Panvel Moinhos*) a Redes de Lojas (*Rede Zaffari, Carrefour, Panvel*) com endereço, cidade, UF e tipo (*Supermercado, Farmácia, Padaria, etc.*).

- 🧾 **Leitor de Notas Fiscais (NFC-e RS / SEFAZ)**:
  - Leitura de QR Code de notas fiscais de consumidor da SEFAZ-RS.
  - Extrator de produtos, quantidades e preços unitários contidos na nota fiscal.
  - Formulário para lançamento manual de notas fiscais com suporte a digitação por linha.

- 📊 **Controle de Gastos e Comparação de Preços**:
  - **Comparação de Preços por Loja**: Tabela comparativa do valor do mesmo produto em lojas distintas (*indica onde o produto está mais barato*).
  - **Gasto por Rede de Lojas**: Gráfico comparativo de despesas por rede.
  - **Gasto por Loja Específica**: Gráfico de barras com despesas acumuladas por estabelecimento.
  - **Gasto por Categoria**: Gráfico de rosca (*Laticínios, Mercearia, Padaria, Higiene, etc.*).
  - **Histórico de Preços**: Gráfico de linha mostrando a evolução de preço de um produto ao longo do tempo.

- 🔒 **Supabase & Fallback Local Storage**:
  - Estrutura de banco de dados PostgreSQL com script SQL completo e políticas de segurança por linha (RLS - *Row Level Security*).
  - Autenticação configurável com **Google SSO** e e-mail.
  - **Fallback automático para LocalStorage**: permite testar e utilizar todas as funções localmente no navegador mesmo sem credenciais ativas do Supabase.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS.
- **PWA**: `vite-plugin-pwa` (Workbox, Service Workers, Web App Manifest).
- **Leitor de Câmera**: `html5-qrcode`.
- **Gráficos & Visualizações**: `recharts`.
- **Ícones**: `lucide-react`.
- **Backend / DB**: Supabase (PostgreSQL, Supabase Auth, Row Level Security) + LocalStorage Fallback.

---

## ⚙️ Instruções para Execução Local

### Pré-requisitos
- **Node.js**: Versão 18.x ou superior.
- **npm**: Versão 9.x ou superior.

### Passo 1: Clonar o repositório e instalar dependências
```bash
git clone https://github.com/duimbrbr/TST_Jules.git
cd TST_Jules
npm install
```

### Passo 2: Configurar Variáveis de Ambiente (Opcional para Supabase)
Crie um arquivo `.env.local` na raiz do projeto caso queira conectar ao seu projeto Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
# Também é aceito: VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```
> **Nota**: Se você não criar o arquivo `.env.local`, a aplicação rodará normalmente no modo **Local Storage Fallback**, permitindo testar 100% das telas e dados localmente sem nenhuma configuração adicional!

### Passo 3: Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse o endereço exibido no terminal (geralmente `http://localhost:5173` ou `http://localhost:3000`).

### Passo 4: Gerar a Build de Produção
Para compilar a aplicação e verificar os arquivos PWA:
```bash
npm run build
npm run preview
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase / PostgreSQL)

O arquivo `schema.sql` na raiz do repositório contém o script completo de criação das tabelas e políticas RLS:

- `profiles`: Perfis de usuários vinculados ao `auth.users`.
- `store_networks`: Redes de lojas (*ex: Rede Zaffari*).
- `stores`: Lojas específicas vinculadas a uma rede (*ex: Zaffari Ipiranga*).
- `products`: Catálogo de produtos (*código de barras, nome, marca, categoria, URL da imagem*).
- `shopping_lists`: Listas de compras com orçamento e token de compartilhamento.
- `shopping_list_shares`: Permissões de compartilhamento de listas entre usuários.
- `shopping_list_items`: Itens pertencentes às listas de compras.
- `receipts`: Notas fiscais importadas (NFC-e).
- `receipt_items`: Itens das notas fiscais importadas.

---

## 📱 PWA (Progressive Web App) e Uso Mobile

O app foi projetado com interface responsiva e componentes otimizados para dispositivos móveis:
- Navegação por abas inferiores (*Bottom Navigation*) em telas pequenas.
- Ao acessar a aplicação via navegador mobile (*Google Chrome no Android ou Safari no iOS*), selecione **"Adicionar à Tela Inicial"** ou **"Instalar Aplicativo"** para usar como um app nativo na tela do celular.
