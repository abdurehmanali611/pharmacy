export const APEX_SOLUTION_CBE_ACCOUNT = "1000418779358";

export const PAYMENT_CHANNELS = [
  "Telebirr",
  "Commercial Bank of Ethiopia",
] as const;

export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

export const PAYMENT_CHANNEL_META: Record<
  PaymentChannel,
  {
    shortLabel: string;
    transactionFieldLabel: string;
    transactionPlaceholder: string;
    hint: string;
  }
> = {
  Telebirr: {
    shortLabel: "Telebirr",
    transactionFieldLabel: "Telebirr transaction number",
    transactionPlaceholder: "e.g. CGK8X2… from your Telebirr receipt",
    hint: `Transfer via Telebirr to Apex Solution CBE account ${APEX_SOLUTION_CBE_ACCOUNT}, then enter the Telebirr transaction number.`,
  },
  "Commercial Bank of Ethiopia": {
    shortLabel: "Commercial Bank of Ethiopia (CBE)",
    transactionFieldLabel: "CBE transaction ID",
    transactionPlaceholder: "e.g. FT25234… from your bank slip or app",
    hint: `Deposit to Apex Solution CBE account ${APEX_SOLUTION_CBE_ACCOUNT}, then enter the CBE transaction ID.`,
  },
};
