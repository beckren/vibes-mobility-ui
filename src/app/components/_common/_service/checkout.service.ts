import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { VehicleService, Vehicle } from './vehicle.service';
import { PriceService, PriceRequest } from './price.service';
import { FeeService, Fee } from './fee.service';

export interface AddressRecord {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface DiscountRecord {
  code: string;
  amount: number;
}

export interface CheckoutPricingRecord {
  basePrice: number;
  currency: string; // e.g., 'EUR'
  tax: number;
  total: number;
  discounts?: DiscountRecord[];
}

export interface CustomerRecord {
  customerId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address: AddressRecord;
}

export interface AdditionalDriverRecord {
  driverId?: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  dateOfBirth: string; // ISO date string
}

export interface PaymentRecord {
  method: 'credit_card' | 'cash' | 'bank_transfer' | string;
  status: 'authorized' | 'captured' | 'failed' | 'pending' | string;
  amount: number;
  currency: string; // e.g., 'EUR'
  transactionId?: string;
  authorizedAt?: string; // ISO datetime
}

export interface CheckoutPayload {
  checkoutPricingRecord: CheckoutPricingRecord;
  customerRecord: CustomerRecord;
  additionalDriverRecords?: AdditionalDriverRecord[];
  mva: string;
  paymentRecord: PaymentRecord;
}

export interface CheckoutResult {
  success: boolean;
  reservationId?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  constructor(
    private http: HttpClient,
    private vehicleService: VehicleService,
    private priceService: PriceService,
    private feeService: FeeService
  ) {}

  // Delegates to VehicleService
  fetchVehiclesByGroup(carGroup: string): Observable<Vehicle[]> {
    return this.vehicleService.getVehiclesByGroup(carGroup);
  }

  // Delegates to PriceService
  calculatePrice(request: PriceRequest) {
    return this.priceService.calculatePrice(request);
  }

  // Delegates to FeeService
/*   getAdditionalFees(checkoutDateISO: string, checkinDateISO: string): Observable<Fee[]> {
    return this.feeService.getAllAdditionalFeesByInterval(checkoutDateISO, checkinDateISO);
  } */

  // Persist checkout (example endpoint; adjust to your API)
  submitCheckout(payload: CheckoutPayload): Observable<CheckoutResult> {
    return this.http.post<CheckoutResult>(`${environment.apiUrl}/checkout`, payload);
  }
}
