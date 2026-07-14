export type OtpChannel = "email" | "sms";

export interface SendOtpInput {
  target: string;
  code: string;
  purpose: string;
}

export interface OtpDeliveryProvider {
  channel: OtpChannel;
  isConfigured(): boolean;
  send(input: SendOtpInput): Promise<void>;
}
