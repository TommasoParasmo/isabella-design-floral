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

Para dar acesso de administradora à Isa, depois que ela criar a conta:

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'EMAIL_DA_ISA');
```

As funções `is_admin()` e `workshop_availability()` são públicas de propósito: a primeira só responde sobre
o próprio usuário logado e a segunda só expõe a quantidade de vagas.
