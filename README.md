# Isabella Parasmo · Designer Floral

Site e sistema da floricultura: vitrine, estoque, pedidos agendados, assinaturas florais, workshops e emissão fiscal.

## Tecnologia

- **Next.js 15** (App Router) + **Tailwind CSS 4**
- **Supabase**: banco Postgres, login e fotos (projeto `isabella-design-floral`, região São Paulo)
- **Mercado Pago**: Pix, cartão e cobrança recorrente (etapa 2)
- **Emissor fiscal via API** (Focus NFe ou NFE.io) para NFC-e, NF-e e NFS-e (etapa 4)
- Hospedagem na **Vercel**

## Rodando localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

Sem as variáveis do Supabase o site usa os dados de exemplo de `src/lib/seed-data.ts`.

## Banco de dados

- `supabase/migrations/`: esquema (tabelas, RLS, gatilho de estoque, bucket de fotos)
- `supabase/seed.sql`: produtos, planos e workshops de exemplo

O estoque é controlado pela tabela `stock_movements`: cada entrada ou saída (venda online, balcão, perda, ajuste)
é registrada e atualiza `products.stock` automaticamente.

## Painel da Isa (`/admin`)

- **Agenda**: pedidos pagos do dia, por período, com botões para avançar o status (em preparo → saiu para entrega → entregue)
- **Balcão**: venda presencial que baixa o estoque e entra na agenda como pedido retirado
- **Estoque**: saldo atual, alerta de estoque baixo, entradas, perdas e ajustes
- **Produtos**: cadastro com foto, preço, destaque e "entrega no mesmo dia"
- **Assinaturas** e **Workshops**: assinantes, presentes e inscrições confirmadas
- **Notas**: todas as notas emitidas, com PDF, XML e cancelamento

Login em `/entrar`. Para criar a conta da Isa: Supabase → Authentication → Add user (e-mail e senha) e depois:

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'EMAIL_DA_ISA');
```

As funções `is_admin()` e `workshop_availability()` são públicas de propósito: a primeira só responde sobre
o próprio usuário logado e a segunda só expõe a quantidade de vagas.

## Pagamentos (Mercado Pago)

O checkout cria o pedido no banco e redireciona para o Checkout Pro (Pix e cartão em até 3x).
O Mercado Pago avisa o site em `/api/mercadopago/webhook`; o site consulta o pagamento na API,
confere o valor e só então marca o pedido como pago e baixa o estoque (`confirm_order_payment`).

Variáveis necessárias na Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
e `NEXT_PUBLIC_SITE_URL`. Veja `.env.example`.

## Notas fiscais (Focus NFe)

A Isa é MEI, então:

- **NF-e** (venda de flores): obrigatória quando quem compra é empresa; para pessoa física, só se o cliente pedir.
  Emitida na página do pedido, com os dados do cliente já preenchidos.
- **NFS-e Nacional** (workshops): emitida na aba Workshops, por inscrição confirmada.
- **NFC-e** não é usada: o MEI está dispensado de emitir nota para consumidor final pessoa física.

Para ligar:

1. Comprar o certificado digital e-CNPJ A1 e criar a conta na Focus NFe, cadastrando a empresa e o certificado lá.
2. Preencher `FOCUSNFE_TOKEN` e os campos `FISCAL_*` na Vercel (veja `.env.example`).
3. Testar com `FOCUSNFE_ENV=homologacao` (as notas saem sem valor fiscal) e só depois trocar para `producao`.

Os códigos tributários padrão (CRT 4, CSOSN 102, serviço 08.02.01) servem para MEI, mas a contadora deve confirmar.
