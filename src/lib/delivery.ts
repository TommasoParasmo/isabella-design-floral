import { storeConfig } from "./config";

export type DeliverySlot = {
  id: string;
  label: string;
  starts_at: string; // "09:00:00"
  ends_at: string;
  fee_cents: number;
};

// Data e hora atuais no fuso de São Paulo.
export function nowInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: storeConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function slotStartMinutes(slot: DeliverySlot) {
  const [h, m] = slot.starts_at.split(":").map(Number);
  return h * 60 + m;
}

export function isSameDayOpen(now = new Date()) {
  return nowInSaoPaulo(now).minutes < storeConfig.sameDayCutoffHour * 60;
}

// Períodos de entrega disponíveis para uma data. Para hoje, só os que ainda
// respeitam o horário de corte e a antecedência mínima.
export function slotsForDate(date: string, slots: DeliverySlot[], allowSameDay: boolean, now = new Date()) {
  const today = nowInSaoPaulo(now);
  if (date < today.date) return [];
  if (date > addDays(today.date, storeConfig.bookingWindowDays)) return [];
  if (date === today.date) {
    if (!allowSameDay || !isSameDayOpen(now)) return [];
    const earliest = today.minutes + storeConfig.minLeadHours * 60;
    return slots.filter((s) => slotStartMinutes(s) >= earliest);
  }
  return slots;
}

export function firstBookableDate(slots: DeliverySlot[], allowSameDay: boolean, now = new Date()) {
  const today = nowInSaoPaulo(now).date;
  return slotsForDate(today, slots, allowSameDay, now).length > 0 ? today : addDays(today, 1);
}

export function formatDateLabel(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}
