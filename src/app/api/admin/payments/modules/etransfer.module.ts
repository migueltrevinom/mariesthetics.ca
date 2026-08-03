import { EtransferRepository } from "../repositories/etransfer.repository";

export async function fetchEtransferSettings() {
  return await EtransferRepository.getOrCreateSettings();
}

export async function saveEtransferSettings(
  data: {
    accountName: string;
    email: string;
    phone: string;
    autoDepositEnabled: boolean;
    instructions?: string;
  },
  managerEmail: string,
) {
  return await EtransferRepository.updateSettings(data, managerEmail);
}

export async function recordEtransferPayment(
  data: {
    amountCad: number;
    referenceNumber?: string;
    bookingId?: string;
    kind: "deposit" | "balance" | "tip" | "adjustment";
    note?: string;
    clientEmail?: string;
    clientName?: string;
  },
  managerEmail: string,
  managerSub?: string,
) {
  return await EtransferRepository.recordManualPayment(data, managerEmail, managerSub);
}
