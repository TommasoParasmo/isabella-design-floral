import type { Metadata } from "next";
import { SectionTitle } from "@/components/section-title";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Eventos",
  description:
    "Decoração floral para eventos corporativos, casamentos e celebrações em São Paulo. Fale com a Isa pelo WhatsApp e peça seu orçamento.",
};

const eventTypes = [
  {
    id: "corporativo",
    eyebrow: "para empresas",
    title: "Eventos corporativos",
    text: "Flores que traduzem a identidade da sua marca, do coffee break ao lançamento de produto. Atendemos empresas com contrato recorrente ou pontual, com nota e prazos combinados.",
    image: "/fotos/arranjo-lirios.jpg",
    alt: "Arranjo de lírios brancos em vaso",
    services: [
      "Recepções, lobbies e escritórios com flores semanais",
      "Lançamentos, convenções e feiras",
      "Jantares e confraternizações de fim de ano",
      "Presentes corporativos para clientes e equipe",
    ],
    message: "Olá, Isa! Vim pelo site e gostaria de um orçamento de flores para um evento corporativo.",
  },
  {
    id: "casamentos",
    eyebrow: "o grande dia",
    title: "Casamentos",
    text: "Um projeto floral pensado junto com os noivos, da cerimônia à festa. A Isa acompanha cada detalhe para que as flores contem a história de vocês.",
    image: "/fotos/casamento-arco-lago.jpg",
    alt: "Cerimônia de casamento à beira do lago com arco de flores brancas",
    services: [
      "Buquê da noiva, lapelas e arranjos de cabelo",
      "Decoração de cerimônia, altar e corredor",
      "Centros de mesa e mesa do bolo",
      "Mini wedding, elopement e casamento civil",
    ],
    message: "Olá, Isa! Vim pelo site e gostaria de um orçamento de flores para o meu casamento.",
  },
  {
    id: "celebracoes",
    eyebrow: "toda data merece",
    title: "Aniversários e celebrações",
    text: "Aniversários, chás, batizados, bodas ou um jantar especial em casa. Arranjos sob medida para deixar qualquer encontro mais bonito.",
    image: "/fotos/arranjo-campo.jpg",
    alt: "Arranjo de flores do campo coloridas",
    services: [
      "Aniversários e festas infantis",
      "Chá de bebê, chá de panela e batizados",
      "Bodas, noivados e jantares íntimos",
      "Mesas postas e decoração para fotos",
    ],
    message: "Olá, Isa! Vim pelo site e gostaria de um orçamento de flores para uma celebração.",
  },
];

// Textos do PDF "Flower Bar" da Isa.
const flowerBarIdeal = [
  "Aniversários, Dia das Mães, Dia dos Namorados e outras comemorações",
  "Eventos corporativos, confraternizações, open house e lançamentos",
  "Aulas de yoga, meditação e bem-estar",
  "Workshops, brunchs e tardes de meninas",
  "Casamentos, despedidas de solteira e chá de bebê",
  "Feiras, bazares e ações de marketing",
];

const flowerBarOptions = [
  {
    title: "Opção 1",
    subtitle: "Monte o seu próprio buquê",
    image: "/fotos/flower-bar-opcao-1.jpg",
    alt: "Flower bar com baldes de flores e quadro com as instruções para montar o buquê",
    items: [
      "Você escolhe suas flores e folhagens",
      "Monte do jeito que quiser",
      "Escolha o tamanho do buquê (quantidade de flores)",
      "Ideal para quem gosta de criar",
      "Flores frescas da estação",
      "Opção de embalagem + cartão",
    ],
  },
  {
    title: "Opção 2",
    subtitle: "Montagem ao vivo por florista profissional",
    image: "/fotos/flower-bar-opcao-2.jpg",
    alt: "Estante de flower bar com baldes de rosas, hortênsias e flores coloridas",
    items: [
      "Escolha o estilo do buquê",
      "Escolha o tamanho do buquê (quantidade de flores)",
      "Perfeito para presentes e surpresas",
      "Flores frescas da estação",
      "Opção de embalagem + cartão",
    ],
  },
];

const weddingGallery = [
  ["/fotos/casamento-arco-jardim.jpg", "Arco de rosas e corredor de flores em cerimônia ao ar livre"],
  ["/fotos/casamento-hortensias-mar.jpg", "Arranjos altos de hortênsias brancas em altar com vista para o mar"],
  ["/fotos/casamento-arco-lago.jpg", "Arco de flores brancas e corredor branco à beira do lago"],
  ["/fotos/casamento-colorido.jpg", "Arco e arranjos coloridos em tons de pink, laranja e roxo"],
] as const;

const steps = [
  ["Conversa", "Você conta pelo WhatsApp a data, o local, o número de convidados e o estilo que imagina."],
  ["Proposta", "A Isa monta um projeto floral com referências, paleta de cores e orçamento detalhado."],
  ["Montagem", "No dia, a equipe leva, monta e retira tudo no local do evento, em São Paulo e região."],
];

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

export default function EventosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="stripes absolute inset-y-0 right-0 hidden w-1/3 opacity-25 md:block" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="font-script text-4xl text-rose sm:text-5xl">flores para grandes momentos</p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">Eventos</h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-rose/90">
              Decoração floral para empresas, casamentos e celebrações em São Paulo. Cada projeto é criado sob medida
              pela Isa, do primeiro esboço à montagem no local.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappLink("Olá, Isa! Vim pelo site e gostaria de um orçamento de flores para um evento.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-rose px-7 py-3 text-sm font-medium text-wine-deep transition-colors hover:bg-cream"
              >
                <WhatsAppIcon />
                Pedir orçamento
              </a>
              <a
                href="#tipos"
                className="rounded-full border border-rose/60 px-7 py-3 text-sm text-cream transition-colors hover:bg-cream/10"
              >
                Ver tipos de evento
              </a>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl border-[10px] border-rose/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/arranjo-rubi.jpg" alt="Arranjo floral em tons de bordô" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Atalhos */}
      <nav id="tipos" aria-label="Tipos de evento" className="scroll-mt-20 border-b border-rose-soft bg-blush">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-4 py-6 sm:px-6">
          {eventTypes.map((e) => (
            <li key={e.id}>
              <a href={`#${e.id}`} className="block rounded-full border border-wine/30 bg-cream px-5 py-2 text-sm text-wine hover:border-wine">
                {e.title}
              </a>
            </li>
          ))}
          <li>
            <a href="#flower-bar" className="block rounded-full border border-wine bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep">
              Flower Bar
            </a>
          </li>
        </ul>
      </nav>

      {/* Tipos de evento */}
      <section className="mx-auto max-w-6xl space-y-20 px-4 py-20 sm:px-6">
        {eventTypes.map((e, i) => (
          <article
            key={e.id}
            id={e.id}
            className="grid scroll-mt-24 items-center gap-10 md:grid-cols-2"
          >
            <div className={`mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-[999px] rounded-b-3xl ${i % 2 ? "md:order-2" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.image} alt={e.alt} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-script text-3xl text-wine/80">{e.eyebrow}</p>
              <h2 className="mt-1 font-serif text-4xl sm:text-5xl">{e.title}</h2>
              <p className="mt-5 leading-relaxed text-muted">{e.text}</p>
              <ul className="mt-6 space-y-3">
                {e.services.map((s) => (
                  <li key={s} className="flex gap-3 text-sm text-ink/90">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-wine" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
              <a
                href={whatsappLink(e.message)}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep"
              >
                <WhatsAppIcon />
                Falar no WhatsApp
              </a>
            </div>
          </article>
        ))}
      </section>

      {/* Flower Bar */}
      <section id="flower-bar" className="scroll-mt-24 bg-blush py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-[999px] rounded-b-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/flower-bar.jpg" alt="Flower bar ao ar livre com baldes de flores coloridas e mesa com fitas e papéis" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-script text-3xl text-wine/80">uma floricultura no seu evento</p>
              <h2 className="mt-1 font-serif text-4xl sm:text-5xl">Flower Bar</h2>
              <p className="mt-5 leading-relaxed text-muted">
                Uma experiência inspirada na Europa, onde os convidados vivem uma floricultura de forma interativa e
                personalizada. Cada um monta o seu próprio buquê ou conta com a curadoria da nossa equipe.
              </p>
              <h3 className="mt-6 text-sm font-medium tracking-wider text-wine uppercase">Ideal para</h3>
              <ul className="mt-3 space-y-2">
                {flowerBarIdeal.map((s) => (
                  <li key={s} className="flex gap-3 text-sm text-ink/90">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-wine" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {flowerBarOptions.map((o) => (
              <article key={o.title} className="grid gap-5 rounded-3xl border border-rose-soft bg-cream p-6 sm:grid-cols-[160px_1fr]">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.image} alt={o.alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] text-muted uppercase">{o.title}</p>
                  <h3 className="mt-1 font-serif text-2xl">{o.subtitle}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink/90">
                    {o.items.map((item) => <li key={item}>✿ {item}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-muted">
              Para o orçamento, conte o número estimado de participantes, a data, o horário, o local e qual opção você
              prefere. Referências, tema e duração também ajudam a montar uma proposta sob medida.
            </p>
            <a
              href={whatsappLink("Olá, Isa! Vim pelo site e gostaria de um orçamento de Flower Bar para o meu evento.")}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep"
            >
              <WhatsAppIcon />
              Pedir orçamento do Flower Bar
            </a>
          </div>
        </div>
      </section>

      {/* Casamentos assinados pela Isa */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="alguns projetos" title="Casamentos assinados pela Isa" />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {weddingGallery.map(([src, alt]) => (
            <div key={src} className="aspect-[3/4] overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-blush py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="passo a passo" title="Como funciona" />
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map(([title, text], i) => (
              <li key={title} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wine font-serif text-2xl text-cream">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-serif text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-wine-deep py-20 text-cream">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="font-script text-3xl text-rose">vamos criar juntos?</p>
          <h2 className="mt-1 font-serif text-4xl sm:text-5xl">Conte sobre o seu evento</h2>
          <p className="mt-4 text-rose/85">
            Quanto antes a gente conversar, melhor: para casamentos e grandes eventos, recomendamos reservar a data com
            pelo menos 1 mês de antecedência.
          </p>
          <a
            href={whatsappLink("Olá, Isa! Vim pelo site e gostaria de um orçamento de flores para um evento.")}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose px-7 py-3 text-sm font-medium text-wine-deep hover:bg-cream"
          >
            <WhatsAppIcon />
            Pedir orçamento no WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
