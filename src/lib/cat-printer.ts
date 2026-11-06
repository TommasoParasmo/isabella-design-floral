// Impressão direta na mini impressora térmica (PD01 e outras "cat printers")
// pelo Bluetooth do navegador (Chrome ou Edge, no computador ou no Android).
// Protocolo baseado no projeto Cat-Printer (NaitLee, CC0).

import type { ReceiptData } from "@/lib/receipt";

const SERVICES = [0xae30, 0xaf30, 0xff00, 0xfee7];
const TX = "0000ae01-0000-1000-8000-00805f9b34fb";
const RX = "0000ae02-0000-1000-8000-00805f9b34fb";
const NAME_PREFIXES = ["PD01", "GB0", "GT01", "MX0", "MX1", "YT01", "SC03", "MXTP", "_ZZ00"];
export const PAPER_WIDTH = 384; // pixels (58 mm)

// Tipos mínimos do Web Bluetooth (não vêm no lib "dom" do TypeScript).
type Characteristic = {
  uuid: string;
  writeValueWithoutResponse?: (data: BufferSource) => Promise<void>;
  writeValue: (data: BufferSource) => Promise<void>;
  startNotifications: () => Promise<Characteristic>;
  addEventListener: (type: string, fn: (e: Event) => void) => void;
  value?: DataView;
};
type Service = { getCharacteristics: () => Promise<Characteristic[]> };
type Server = { connected: boolean; connect: () => Promise<Server>; getPrimaryServices: () => Promise<Service[]>; disconnect: () => void };
type Device = { name?: string; gatt?: Server; addEventListener: (type: string, fn: () => void) => void };
type Bluetooth = {
  requestDevice: (o: unknown) => Promise<Device>;
  getDevices?: () => Promise<Device[]>;
};

function bluetooth(): Bluetooth | null {
  return typeof navigator !== "undefined" && "bluetooth" in navigator ? (navigator as unknown as { bluetooth: Bluetooth }).bluetooth : null;
}

export function isPrinterSupported() {
  return bluetooth() !== null;
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff;
  return c;
});

function crc8(data: ArrayLike<number>) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff];
  return crc;
}

function command(cmd: number, payload: number[] | Uint8Array) {
  const p = Array.from(payload);
  return [0x51, 0x78, cmd, 0x00, p.length, 0x00, ...p, crc8(p), 0xff];
}

const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];

function reverseBits(b: number) {
  b = ((b & 0xaa) >> 1) | ((b & 0x55) << 1);
  b = ((b & 0xcc) >> 2) | ((b & 0x33) << 2);
  return ((b & 0xf0) >> 4) | ((b & 0x0f) << 4);
}

/** Linhas de 384 pixels (1 = preto) viram a sequência de bytes da impressão. */
export function encodeBitmap(rows: Uint8Array[], { energy = 0x6000, speed = 32 } = {}) {
  const out: number[] = [
    ...command(0xa3, [0x00]), // get_device_state
    0x51, 0x78, 0xa3, 0x00, 0x01, 0x00, 0x00, 0x00, 0xff, // start_printing
    ...command(0xa4, [50]), // dpi 200
    ...command(0xbd, [speed]),
    ...command(0xaf, le16(energy)),
    ...command(0xbe, [0x01]), // apply_energy
    ...command(0xa9, [0x00]), // update_device
    ...command(0xa6, [0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c]), // start_lattice
  ];
  for (const row of rows) out.push(...command(0xa2, Array.from(row, reverseBits)));
  out.push(
    ...command(0xa6, [0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17]), // end_lattice
    ...command(0xbd, [8]),
    ...command(0xa1, le16(128)), // avança o papel
    ...command(0xa3, [0x00]),
  );
  return new Uint8Array(out);
}

/** Canvas de 384 px de largura vira linhas de 1 bit (cinza escuro = preto). */
export function canvasToRows(canvas: HTMLCanvasElement, threshold = 160) {
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, PAPER_WIDTH, canvas.height);
  const rows: Uint8Array[] = [];
  for (let y = 0; y < canvas.height; y++) {
    const row = new Uint8Array(PAPER_WIDTH / 8);
    for (let x = 0; x < PAPER_WIDTH; x++) {
      const i = (y * PAPER_WIDTH + x) * 4;
      const lum = data[i + 3] < 128 ? 255 : 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < threshold) row[x >> 3] |= 0x80 >> (x & 7);
    }
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Conexão (fica guardada enquanto a aba do painel estiver aberta)
// ---------------------------------------------------------------------------

type Connection = { device: Device; tx: Characteristic; paused: boolean };
let current: Connection | null = null;

async function open(device: Device): Promise<Connection> {
  const server = device.gatt!.connected ? device.gatt! : await device.gatt!.connect();
  let tx: Characteristic | undefined;
  let rx: Characteristic | undefined;
  for (const service of await server.getPrimaryServices()) {
    const chars = await service.getCharacteristics().catch(() => []);
    tx ??= chars.find((c) => c.uuid === TX);
    rx ??= chars.find((c) => c.uuid === RX);
  }
  if (!tx) throw new Error("Essa impressora não foi reconhecida. Confira se é a mini impressora (PD01).");
  const conn: Connection = { device, tx, paused: false };
  if (rx) {
    await rx.startNotifications().catch(() => undefined);
    rx.addEventListener("characteristicvaluechanged", () => {
      const v = rx!.value;
      if (v && v.byteLength >= 7 && v.getUint8(2) === 0xae) conn.paused = v.getUint8(6) === 0x10;
    });
  }
  device.addEventListener("gattserverdisconnected", () => {
    if (current?.device === device) current = null;
  });
  return conn;
}

export function printerName() {
  return current?.device.name ?? null;
}

/**
 * Conecta à impressora. Na primeira vez o navegador mostra a lista de
 * aparelhos; precisa ser chamado direto no clique de um botão.
 */
export async function connectPrinter({ pick = false } = {}) {
  const bt = bluetooth();
  if (!bt) throw new Error("Use o Chrome ou o Edge para imprimir na mini impressora.");
  if (current && !pick && current.device.gatt?.connected) return current;
  if (!pick && current) {
    current = await open(current.device);
    return current;
  }
  if (!pick && bt.getDevices) {
    const known = (await bt.getDevices().catch(() => [])).filter((d) => NAME_PREFIXES.some((p) => d.name?.startsWith(p)));
    for (const d of known) {
      try {
        current = await open(d);
        return current;
      } catch {
        /* fora de alcance: tenta o próximo ou pede para escolher */
      }
    }
  }
  const device = await bt.requestDevice({
    filters: NAME_PREFIXES.map((namePrefix) => ({ namePrefix })),
    optionalServices: SERVICES,
  });
  current = await open(device);
  return current;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function send(conn: Connection, bytes: Uint8Array) {
  let size = 180;
  for (let i = 0; i < bytes.length; ) {
    while (conn.paused) await wait(100);
    const chunk = bytes.slice(i, i + size);
    try {
      if (conn.tx.writeValueWithoutResponse) await conn.tx.writeValueWithoutResponse(chunk);
      else await conn.tx.writeValue(chunk);
    } catch (err) {
      // Alguns computadores só aceitam pacotes pequenos.
      if (size > 20) {
        size = 20;
        continue;
      }
      throw err;
    }
    i += chunk.length;
    await wait(size > 20 ? 20 : 8);
  }
}

export async function printCanvas(canvas: HTMLCanvasElement) {
  const conn = await connectPrinter();
  await send(conn, encodeBitmap(canvasToRows(canvas)));
}

// ---------------------------------------------------------------------------
// Desenho do comprovante (58 mm)
// ---------------------------------------------------------------------------

export function drawReceipt(r: ReceiptData) {
  const W = PAPER_WIDTH;
  const pad = 8;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = 3000;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  ctx.textBaseline = "top";
  let y = 12;

  const font = (size: number, weight = 400, family = "Arial, Helvetica, sans-serif") => {
    ctx.font = `${weight} ${size}px ${family}`;
  };
  const wrap = (text: string, max: number) => {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > max && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  const center = (text: string, size: number, weight = 400, family?: string) => {
    font(size, weight, family);
    for (const l of wrap(text, W - pad * 2)) {
      ctx.textAlign = "center";
      ctx.fillText(l, W / 2, y);
      y += size + 6;
    }
    ctx.textAlign = "left";
  };
  const row = (left: string, right: string, size = 22, weight = 400) => {
    font(size, weight);
    const rw = ctx.measureText(right).width;
    const lines = wrap(left, W - pad * 2 - rw - 12);
    lines.forEach((l, i) => {
      ctx.fillText(l, pad, y);
      if (i === 0) {
        ctx.textAlign = "right";
        ctx.fillText(right, W - pad, y);
        ctx.textAlign = "left";
      }
      y += size + 6;
    });
  };
  const small = (text: string) => {
    font(18);
    for (const l of wrap(text, W - pad * 2 - 16)) {
      ctx.fillText(l, pad + 16, y);
      y += 24;
    }
  };
  const dashed = () => {
    y += 6;
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 14;
  };

  center(r.shop, 40, 400, "'Brush Script MT', 'Segoe Script', cursive");
  center(r.tagline.toUpperCase(), 17, 700);
  if (r.cnpj) center(`CNPJ ${r.cnpj}`, 17);
  dashed();
  center("Comprovante de compra", 24, 700);
  center(`Pedido #${r.code} · ${r.date}`, 19);
  dashed();
  row("Cliente", r.customer, 20);
  if (r.cpf) row("CPF", r.cpf, 20);
  if (r.payment) row("Pagamento", r.payment, 20);
  dashed();
  for (const i of r.items) {
    row(i.label, i.amount);
    if (i.detail) small(i.detail);
  }
  for (const e of r.extras) row(e.label, e.amount);
  dashed();
  row("TOTAL", r.total, 30, 700);
  dashed();
  center("Obrigada pela compra!", 22, 700);
  center(r.instagram, 19);
  center("Documento sem valor fiscal", 17);
  y += 12;

  const out = document.createElement("canvas");
  out.width = W;
  out.height = y;
  out.getContext("2d")!.drawImage(canvas, 0, 0);
  return out;
}

export async function printReceipt(r: ReceiptData) {
  await printCanvas(drawReceipt(r));
}
