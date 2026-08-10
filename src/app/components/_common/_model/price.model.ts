// Preis-/Pricing-Modelle (OpenAPI-Schema-Spiegel). Kanonischer Ort statt inline im Service.

export interface AdditionalFee {
  name: string;
  amount: string;
  amountMax: string;
}

export interface Discount {
  percentage: string;
  reason?: string;
  user: string;
}

export interface PriceRequest {
  checkoutDate: string;
  expectedCheckinDate: string;
  carGroupName: string;
  targetSalePrice?: string;
  grossListSalePrice?: string;
  additionalFees?: AdditionalFee[];
  discount?: Discount;
}

export interface PriceResponse {
  netPrice: number;
  grossPrice: number;
  taxRate: number;
}
