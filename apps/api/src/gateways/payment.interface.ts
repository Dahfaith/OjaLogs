export interface InitializePaymentInput {
  userId: string;
  amountNgn: number;
  customerEmail: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface InitializePaymentResult {
  gatewayReference: string;
  checkoutUrl?: string;
  dynamicAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    amountNgn: number;
    expiresInMinutes: number;
  };
}

export interface VerifyPaymentResult {
  status: 'successful' | 'pending' | 'failed';
  amountNgn: number;
  gatewayReference: string;
  paidAt?: string;
  rawPayload: Record<string, any>;
}

export interface IPaymentGateway {
  readonly gatewayName: string;
  initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verifyPayment(gatewayReference: string): Promise<VerifyPaymentResult>;
  handleWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<{
    eventId: string;
    eventType: string;
    reference: string;
    amountNgn: number;
    status: 'successful' | 'failed';
    rawPayload: Record<string, any>;
  }>;
}

