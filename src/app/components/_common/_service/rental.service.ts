import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import {
  CheckoutPayload,
  CheckoutResponse,
  CheckoutPricingRecord,
  CustomerRecord,
  AdditionalDriverRecord,
  PaymentRecord,
  DriverRecord,
  PersonRecord,
  AddressRecord,
  DiscountRecord,
  AdditionalFeeRecord
} from './checkout.service';

// Search parameters for GET /checkout
export interface RentalSearchParams {
  rentalId?: string;
  firstName?: string;
  lastName?: string;
  mva?: string;
  carGroup?: string;
  status?: string;
  checkoutDateFrom?: string;
  checkoutDateTo?: string;
}

// Lightweight rental record for search results table
export interface RentalSearchResult {
  rentalId: string;
  firstName: string;
  lastName: string;
  carGroup: string;
  mva: string;
  checkoutDate: string;
  checkinDate: string;
  status: string;
  grossAmount: string;
}

// Full rental detail returned by GET /checkout/{id}
export interface RentalDetail {
  rentalId: string;
  checkoutPricingRecord: CheckoutPricingRecord;
  customerRecord: CustomerRecord;
  additionalDriverRecords: AdditionalDriverRecord[];
  mva: string;
  paymentRecord: PaymentRecord;
}

@Injectable({ providedIn: 'root' })
export class RentalService {
  constructor(private http: HttpClient) {}

  searchRentals(params: RentalSearchParams): Observable<RentalSearchResult[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        httpParams = httpParams.set(key, value);
      }
    }
    return this.http.get<RentalSearchResult[]>(`${environment.apiUrl}/checkout`, { params: httpParams });
  }

  getRentalById(id: string): Observable<RentalDetail> {
    return this.http.get<RentalDetail>(`${environment.apiUrl}/checkout/${encodeURIComponent(id)}`);
  }

  createRental(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${environment.apiUrl}/checkout`, payload);
  }

  updateRental(id: string, payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.http.put<CheckoutResponse>(`${environment.apiUrl}/checkout/${encodeURIComponent(id)}`, payload);
  }
}
