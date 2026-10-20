import { z } from "zod";

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const customerSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  email: z.string().trim().email("E-mail inválido."),
  phone: z.string().transform(onlyDigits).pipe(z.string().min(10, "Telefone inválido.")),
  cpf: z.string().transform(onlyDigits).pipe(z.string().length(11, "CPF deve ter 11 dígitos.")),
});

export const addressSchema = z.object({
  cep: z.string().transform(onlyDigits).pipe(z.string().length(8, "CEP inválido.")),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2),
  state: z.string().refine((v) => v.toUpperCase() === "SP", "Entregamos apenas no estado de São Paulo."),
});
