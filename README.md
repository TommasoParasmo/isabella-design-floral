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
- **Balcão**: venda presencial que baixa o estoque e fica registrada para a NFC-e
- **Estoque**: saldo atual, alerta de estoque baixo, entradas, perdas e ajustes
- **Produtos**: cadastro com foto, preço, destaque e "entrega no mesmo dia"

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
