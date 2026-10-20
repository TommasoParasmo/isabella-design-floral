-- O saldo em products.stock só é ajustado por inserções em stock_movements,
-- então o histórico precisa ser somente inserção. Correções entram como
-- novos movimentos do tipo 'ajuste'.
create policy "movimentos não são editados" on public.stock_movements
  as restrictive for update using (false);
create policy "movimentos não são apagados" on public.stock_movements
  as restrictive for delete using (false);
