import { z } from "zod";

export const categoryEnum = z.enum([
  "alimentacao",
  "hospedagem",
  "combustivel",
  "outros",
]);

export const receiptSchema = z.object({
  amount: z
    .number({ required_error: "Valor obrigatório" })
    .positive("Valor deve ser positivo"),
  category: categoryEnum,
  date: z.string().min(1, "Data obrigatória"),
  fileName: z.string().optional(),
  fileBase64: z.string().optional(),
  fileMimeType: z.string().optional(),
});

export const syncBatchSchema = z.object({
  receipts: z.array(
    receiptSchema.extend({
      localId: z.string(),
    })
  ),
});

export type ReceiptInput = z.infer<typeof receiptSchema>;
export type SyncBatch = z.infer<typeof syncBatchSchema>;
