import "server-only";
import { onlyDigits } from "./validation";

// Emissão de notas pela Focus NFe (https://doc.focusnfe.com.br).
// A Isa é MEI: NF-e para venda de flores quando o cliente pede a nota e
// NFS-e Nacional para os workshops. Os códigos tributários padrão abaixo
// devem ser conferidos com a contadora antes de ligar a produção.

export type FiscalKind = "nfe" | "nfse";
export type FiscalStatus = "processando" | "autorizado" | "rejeitado" | "cancelado" | "erro";

export type Recipient = {
  name: string;
  document: string; // CPF ou CNPJ, só dígitos
  email?: string;
  stateRegistration?: string;
  address?: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
};

const SAO_PAULO_IBGE = "3550308";

function env(name: string, fallback?: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function fiscalEnvironment(): "homologacao" | "producao" {
  return env("FOCUSNFE_ENV") === "producao" ? "producao" : "homologacao";
}

function baseUrl() {
  return fiscalEnvironment() === "producao" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
}

// Lista o que falta para emitir; vazio quando está tudo configurado.
export function missingFiscalSettings(kind: FiscalKind): string[] {
  const required = ["FOCUSNFE_TOKEN", "FISCAL_CNPJ"];
  if (kind === "nfe") {
    required.push("FISCAL_INSCRICAO_ESTADUAL", "FISCAL_LOGRADOURO", "FISCAL_NUMERO", "FISCAL_BAIRRO", "FISCAL_CEP");
  }
  return required.filter((name) => !env(name));
}

async function focus(method: "GET" | "POST" | "DELETE", path: string, body?: unknown) {
  const token = env("FOCUSNFE_TOKEN");
  if (!token) throw new Error("FOCUSNFE_TOKEN não configurado");
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, httpStatus: res.status, data };
}

const money = (cents: number) => (cents / 100).toFixed(2);

// ---------------------------------------------------------------------------
// NF-e (venda de produto)
// ---------------------------------------------------------------------------

export type InvoiceItem = {
  code: string;
  description: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitPriceCents: number;
};

export function buildNfe(input: {
  items: InvoiceItem[];
  freightCents: number;
  discountCents: number;
  recipient: Recipient;
  inPerson: boolean;
}) {
  const { recipient } = input;
  const address = recipient.address;
  if (!address) throw new Error("A NF-e precisa do endereço de quem compra.");
  const isCompany = recipient.document.length === 14;
  const productsCents = input.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  // O desconto é rateado entre os itens, como a SEFAZ exige. Cada item
  // recebe a parte arredondada para baixo e os centavos que sobram vão um a
  // um para os primeiros itens, então a soma bate exatamente com o total.
  const grosses = input.items.map((item) => item.unitPriceCents * item.quantity);
  const shares = grosses.map((gross) => (productsCents ? Math.floor((input.discountCents * gross) / productsCents) : 0));
  let remainder = input.discountCents - shares.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0 && i < shares.length; i++) {
    if (shares[i] < grosses[i]) {
      shares[i] += 1;
      remainder -= 1;
    }
  }
  const items = input.items.map((item, index) => {
    const gross = grosses[index];
    const discount = shares[index];
    return {
      numero_item: index + 1,
      codigo_produto: item.code,
      descricao: item.description,
      codigo_ncm: item.ncm,
      cfop: address.state.toUpperCase() === "SP" ? item.cfop : item.cfop.replace(/^5/, "6"),
      unidade_comercial: "UN",
      quantidade_comercial: item.quantity,
      valor_unitario_comercial: money(item.unitPriceCents),
      unidade_tributavel: "UN",
      quantidade_tributavel: item.quantity,
      valor_unitario_tributavel: money(item.unitPriceCents),
      valor_bruto: money(gross),
      valor_desconto: discount > 0 ? money(discount) : undefined,
      inclui_no_total: 1,
      icms_origem: 0,
      icms_situacao_tributaria: env("FISCAL_NFE_CSOSN", "102"),
      pis_situacao_tributaria: env("FISCAL_NFE_CST_PIS_COFINS", "49"),
      cofins_situacao_tributaria: env("FISCAL_NFE_CST_PIS_COFINS", "49"),
    };
  });

  return {
    natureza_operacao: "Venda de mercadoria",
    data_emissao: new Date().toISOString(),
    tipo_documento: 1,
    finalidade_emissao: 1,
    local_destino: address.state.toUpperCase() === "SP" ? 1 : 2,
    consumidor_final: 1,
    presenca_comprador: input.inPerson ? 1 : 2,
    modalidade_frete: input.freightCents > 0 ? 0 : 9,
    cnpj_emitente: onlyDigits(env("FISCAL_CNPJ")!),
    inscricao_estadual_emitente: onlyDigits(env("FISCAL_INSCRICAO_ESTADUAL")!),
    logradouro_emitente: env("FISCAL_LOGRADOURO"),
    numero_emitente: env("FISCAL_NUMERO"),
    bairro_emitente: env("FISCAL_BAIRRO"),
    municipio_emitente: "São Paulo",
    uf_emitente: "SP",
    cep_emitente: onlyDigits(env("FISCAL_CEP")!),
    telefone_emitente: env("FISCAL_TELEFONE"),
    // 4 = Simples Nacional, Microempreendedor Individual
    regime_tributario_emitente: Number(env("FISCAL_NFE_CRT", "4")),
    ...(isCompany ? { cnpj_destinatario: recipient.document } : { cpf_destinatario: recipient.document }),
    nome_destinatario: recipient.name,
    email_destinatario: recipient.email,
    logradouro_destinatario: address.street,
    numero_destinatario: address.number,
    complemento_destinatario: address.complement || undefined,
    bairro_destinatario: address.neighborhood,
    municipio_destinatario: address.city,
    uf_destinatario: address.state.toUpperCase(),
    cep_destinatario: onlyDigits(address.cep),
    // 1 = contribuinte com IE, 9 = não contribuinte
    indicador_inscricao_estadual_destinatario: recipient.stateRegistration ? 1 : 9,
    inscricao_estadual_destinatario: recipient.stateRegistration || undefined,
    valor_produtos: money(productsCents),
    valor_frete: money(input.freightCents),
    valor_desconto: money(input.discountCents),
    valor_total: money(productsCents + input.freightCents - input.discountCents),
    items,
  };
}

// ---------------------------------------------------------------------------
// NFS-e Nacional (workshops)
// ---------------------------------------------------------------------------

export function buildNfse(input: { dpsNumber: number; description: string; amountCents: number; recipient: Recipient }) {
  const { recipient } = input;
  const isCompany = recipient.document.length === 14;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return {
    data_emissao: new Date().toISOString(),
    data_competencia: today,
    serie_dps: Number(env("FISCAL_NFSE_SERIE", "1")),
    numero_dps: input.dpsNumber,
    emitente_dps: 1,
    codigo_municipio_emissora: Number(SAO_PAULO_IBGE),
    cnpj_prestador: onlyDigits(env("FISCAL_CNPJ")!),
    // 2 = optante pelo Simples Nacional como MEI
    codigo_opcao_simples_nacional: "2",
    regime_especial_tributacao: "0",
    ...(isCompany ? { cnpj_tomador: recipient.document } : { cpf_tomador: recipient.document }),
    razao_social_tomador: recipient.name,
    email_tomador: recipient.email,
    codigo_municipio_prestacao: SAO_PAULO_IBGE,
    // 08.02.01: instrução, treinamento e cursos livres
    codigo_tributacao_nacional_iss: env("FISCAL_NFSE_CODIGO_SERVICO", "080201"),
    descricao_servico: input.description,
    valor_servico: Number(money(input.amountCents)),
    tributacao_iss: 1,
    tipo_retencao_iss: 1,
    finalidade_emissao: 0,
    consumidor_final: 1,
    indicador_destinatario: 0,
    ibs_cbs_situacao_tributaria: env("FISCAL_NFSE_IBS_CBS_CST", "000"),
    ibs_cbs_classificacao_tributaria: env("FISCAL_NFSE_IBS_CBS_CLASSIFICACAO", "000001"),
  };
}

// ---------------------------------------------------------------------------
// Envio e consulta
// ---------------------------------------------------------------------------

export type FiscalResult = {
  status: FiscalStatus;
  number?: string;
  series?: string;
  accessKey?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  error?: string;
  httpStatus?: number;
  raw: Record<string, unknown>;
};

const endpoint = (kind: FiscalKind) => (kind === "nfe" ? "/v2/nfe" : "/v2/nfsen");

function absolute(path: unknown) {
  if (typeof path !== "string" || !path) return undefined;
  return path.startsWith("http") ? path : `${baseUrl()}${path}`;
}

function errorText(data: Record<string, unknown>) {
  const erros = data.erros as { mensagem?: string }[] | undefined;
  if (Array.isArray(erros) && erros.length) return erros.map((e) => e.mensagem).filter(Boolean).join("; ");
  return (data.mensagem_sefaz ?? data.mensagem) as string | undefined;
}

function normalize(httpStatus: number, data: Record<string, unknown>): FiscalResult {
  const httpOk = httpStatus >= 200 && httpStatus < 300;
  const providerStatus = String(data.status ?? "");
  const status: FiscalStatus = !httpOk
    ? "erro"
    : providerStatus === "autorizado"
      ? "autorizado"
      : providerStatus === "cancelado"
        ? "cancelado"
        : providerStatus.startsWith("erro") || providerStatus === "denegado"
          ? "rejeitado"
          : "processando";
  return {
    status,
    number: data.numero != null ? String(data.numero) : undefined,
    series: data.serie != null ? String(data.serie) : undefined,
    accessKey: (data.chave_nfe ?? data.codigo_verificacao ?? data.chave_nfse) as string | undefined,
    pdfUrl: absolute(data.caminho_danfe ?? data.url_danfse ?? data.caminho_pdf_nota_fiscal ?? data.url),
    xmlUrl: absolute(data.caminho_xml_nota_fiscal),
    error: status === "erro" || status === "rejeitado" ? errorText(data) : undefined,
    httpStatus,
    raw: data,
  };
}

export async function sendDocument(kind: FiscalKind, ref: string, payload: unknown) {
  const res = await focus("POST", `${endpoint(kind)}?ref=${encodeURIComponent(ref)}`, payload);
  return normalize(res.httpStatus, res.data);
}

export async function consultDocument(kind: FiscalKind, ref: string) {
  const res = await focus("GET", `${endpoint(kind)}/${encodeURIComponent(ref)}`);
  return normalize(res.httpStatus, res.data);
}

export async function cancelDocument(kind: FiscalKind, ref: string, reason: string) {
  const res = await focus("DELETE", `${endpoint(kind)}/${encodeURIComponent(ref)}`, { justificativa: reason });
  return normalize(res.httpStatus, res.data);
}
