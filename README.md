# Sistema de Eventos HTraining

Este repositório contém um sistema básico para **registro, gestão e check‑in de participantes** de eventos de palestras. O projeto foi construído usando HTML, CSS e JavaScript puro, sem dependências externas, e armazena dados no `localStorage` por padrão. A solução inclui um logotipo vetorial próprio e está preparada para evoluir tanto para um backend com Supabase quanto para integrações de pagamento.

## Estrutura do projeto

```
event_system/
├── admin.html          # Painel administrativo para gerenciar lotes e inscritos
├── checkin.html        # Página de check‑in para validar presença
├── index.html          # Formulário público de inscrição de participantes
├── payment.html        # Placeholder para futura integração de pagamento
├── assets/
│   ├── logo.svg        # Logotipo vetorial utilizado na interface
│   ├── script.js       # Lógica da aplicação (carregamento e salvamento de dados)
│   └── style.css       # Estilos globais do sistema
└── README.md           # Este documento
```

### Funcionalidades principais

* **Formulário de inscrição (index.html)** – Coleta nome, e‑mail, telefone, tipo de ingresso e lote. Após o envio, persiste o participante no armazenamento local e exibe mensagem de sucesso com um link para a página de pagamento.
* **Painel Administrativo (admin.html)** – Permite ao organizador:
  - Criar, editar e excluir lotes; definir preço, limite de vagas e status (aberto/fechado);
  - Visualizar a lista de participantes, filtrar por status (pendente ou presente), editar informações, realizar check‑in e remover inscritos.
* **Página de Check‑in (checkin.html)** – Exibe uma lista pesquisável de participantes e um botão de check‑in para marcar presença no evento.
* **Página de Pagamento (payment.html)** – Apenas um placeholder informativo para a futura integração com um gateway de pagamento (como Stripe, PayPal ou Mercado Pago).
* **Logotipo vetorial (logo.svg)** – Versão vetorial estilizada do logotipo fornecido pelo usuário, garantindo melhor qualidade visual.

## Como rodar localmente

1. Acesse o diretório `event_system` no terminal:
   ```bash
   cd event_system
   ```
2. Inicie um servidor HTTP simples (por exemplo, utilizando o Python):
   ```bash
   python3 -m http.server 8000
   ```
3. Abra o navegador e acesse as seguintes páginas:
   - `http://localhost:8000/index.html` para o formulário de inscrição;
   - `http://localhost:8000/admin.html` para o painel administrativo;
   - `http://localhost:8000/checkin.html` para o check‑in de participantes.

Os dados de lotes e participantes são armazenados no `localStorage` do navegador. Para reiniciar o sistema, limpe o armazenamento local nas ferramentas de desenvolvedor.

## Migração para Supabase

Para persistir os dados na nuvem em vez de usar o `localStorage`, você pode integrar o Supabase. Siga os passos abaixo:

1. **Criar conta e projeto** – Crie uma conta gratuita em [Supabase](https://supabase.com/) e, dentro do painel, crie um novo projeto.
2. **Definir tabelas** – No _Table Editor_, crie duas tabelas:
   - **lots**
     - `id` (integer, PK, auto increment)
     - `name` (text)
     - `price` (numeric)
     - `limit` (integer)
     - `status` (text)
   - **participants**
     - `id` (integer, PK, auto increment)
     - `name` (text)
     - `email` (text)
     - `phone` (text)
     - `ticket_type` (text)
     - `lot_id` (integer, FK para lots.id)
     - `status` (text)
3. **Obter credenciais** – No painel, anote a **URL** e a **Anon API Key** do seu projeto.
4. **Incluir biblioteca Supabase** – Cada página que precisa ler ou gravar dados (index.html, admin.html e checkin.html) já inclui o cliente Supabase a partir da CDN. Basta substituir as constantes `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `assets/script.js` pelos valores do seu projeto.

5. **Substituir funções de armazenamento** – O arquivo `assets/script.js` já está preparado para detectar automaticamente a presença das credenciais e, se configurado, usar o Supabase em vez do `localStorage`. Basta informar as chaves na seção “Integração com Supabase” do próprio script e publicar as páginas. Todas as operações de leitura, escrita, edição e exclusão passarão a usar a API da Supabase via `upsert`, `select` e `delete`.
6. **Segurança e regras** – Ative [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) e crie políticas adequadas para proteger seus dados, especialmente ao permitir acessos diretamente do navegador.

## Integração com gateways de pagamento

O código atual apenas redireciona para `payment.html`. Para integrar com um provedor de pagamento (Mercado Pago, Stripe, PayPal, etc.), recomenda‑se:

1. **Criar conta e obter credenciais** – Registre‑se no provedor escolhido e gere as credenciais de API.
2. **Criar um endpoint de backend** – Implemente um serviço (pode ser uma função no Supabase, um servidor Node.js, etc.) que crie uma ordem de pagamento por meio da API do provedor e retorne um link de checkout.
3. **Chamar o endpoint no front‑end** – No momento do envio do formulário de inscrição, faça uma chamada ao seu backend para gerar o pagamento e redirecione o usuário para o link retornado.
4. **Atualizar status após pagamento** – Após o pagamento, configure o provedor para redirecionar de volta ao seu site e marque o participante como “confirmado” ou “pago” na sua base de dados.

Consulte a documentação do provedor escolhido para detalhes específicos e exemplos de código.

## Licença

Este projeto é fornecido com finalidades educativas e pode ser utilizado e adaptado livremente conforme a necessidade.
