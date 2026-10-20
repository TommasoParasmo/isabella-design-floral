// Regras da loja. Ajustáveis por variável de ambiente sem mexer no código.
export const storeConfig = {
  timeZone: "America/Sao_Paulo",
  // Pedidos para entrega no mesmo dia são aceitos até este horário.
  sameDayCutoffHour: Number(process.env.NEXT_PUBLIC_SAME_DAY_CUTOFF_HOUR ?? 14),
  // Antecedência mínima entre o pedido e o início do período de entrega.
  minLeadHours: 2,
  // Quantos dias à frente o cliente pode agendar.
  bookingWindowDays: 45,
  maxInstallments: Number(process.env.NEXT_PUBLIC_MAX_INSTALLMENTS ?? 3),
  pickupAddress: process.env.NEXT_PUBLIC_PICKUP_ADDRESS ?? "Ateliê Isabella Parasmo, São Paulo",
};
