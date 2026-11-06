export const site = {
  name: "Isabella Parasmo",
  tagline: "Designer Floral",
  description:
    "Buquês, arranjos, assinaturas florais e workshops em São Paulo, com entrega agendada.",
  city: "São Paulo, SP",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5511950596714",
  phone: "(11) 95059-6714",
  email: "isabellaparasmodesignerfloral@outlook.com",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "isabellaparasmodesignerfloral",
};

export function whatsappLink(message = "Olá, Isa! Vim pelo site e gostaria de fazer um pedido.") {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
