// price.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

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

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  constructor(private http: HttpClient) {}

  calculatePrice(payload: PriceRequest): Observable<PriceResponse> {
    return this.http.post<PriceResponse>(`${environment.apiUrl}/price`, payload);
  }
}
