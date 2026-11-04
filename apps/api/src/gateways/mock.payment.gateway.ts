import { IPaymentGateway, InitializePaymentInput, InitializePaymentResult, VerifyPaymentResult } from './payment.interface.js';

export class MockPaymentGateway implements IPaymentGateway {
  readonly gatewayName = 'mock_bach';

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const gatewayRef = `bach_mock_${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      gatewayReference: gatewayRef,
      checkoutUrl: `https://checkout.bach.mock/pay/${gatewayRef}`,
      dynamicAccountDetails: {
        bankName: 'Wema Bank / BACH Pay',
        accountNumber: '0198423910',
        accountName: `Ojalogs · ${input.customerEmail.split('@')[0]}`,
        amountNgn: input.amountNgn,
        expiresInMinutes: 30
      }
    };
  }

  async verifyPayment(gatewayReference: string): Promise<VerifyPaymentResult> {
    return {
      status: 'successful',
      amountNgn: 25000,
      gatewayReference,
      paidAt: new Date().toISOString(),
      rawPayload: {
        status: 'PAID',
        gateway_reference: gatewayReference,
        simulated: true
      }
    };
  }

  async handleWebhook(rawBody: string | Buffer, signatureHeader: string) {
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
    return {
      eventId: body.event_id || `evt_${Date.now()}`,
      eventType: body.event_type || 'payment.successful',
      reference: body.reference || 'ref_oj_mock',
      amountNgn: Number(body.amount || 25000),
      status: 'successful' as const,
      rawPayload: body
    };
  }
}

export const mockPaymentGateway = new MockPaymentGateway();

