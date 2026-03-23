import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { VehicleService, Vehicle } from './vehicle.service';
import { PriceService, PriceRequest } from './price.service';
import { FeeService, Fee } from './fee.service';

// Address record matching OpenAPI schema
export interface AddressRecord {
  companyName?: string;
  addressline1: string;
  addressline2?: string;
  postalCode: string;
  city: string;
  country: string;
}

// Driver record matching OpenAPI schema
export interface DriverRecord {
  licenseNumber: string;
  licenseCountry: string;
  licenseIssued: string; // ISO date
  licenseExpiry: string; // ISO date
  licenseImageBase64: string;
}

// Person record matching OpenAPI schema
export interface PersonRecord {
  academicTitle?: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date
  phone: string;
  email: string;
  addressRecord: AddressRecord;
  idType: string;
  idNumber: string;
  idExpiryDate: string; // ISO date
  idImageBase64: string;
}

// Discount record matching OpenAPI schema
export interface DiscountRecord {
  percentage: string;
  reason: string;
  user: string;
}

// Additional fee record matching OpenAPI schema
export interface AdditionalFeeRecord {
  name: string;
  amount: string;
  amountMax: string;
}

// Checkout pricing record matching OpenAPI schema
export interface CheckoutPricingRecord {
  checkoutDate: string; // ISO datetime
  expectedCheckinDate: string; // ISO datetime
  carGroupName: string;
  targetSalePrice?: string | null;
  grossListSalePrice?: string | null;
  additionalFees?: AdditionalFeeRecord[] | null;
  discount?: DiscountRecord | null;
}

// Customer record matching OpenAPI schema
export interface CustomerRecord {
  driverRecord: DriverRecord;
  personRecord: PersonRecord;
  billingAddressRecord: AddressRecord;
  customerNote: string;
  driverSameAsRenter: string;
}

// Additional driver record matching OpenAPI schema
export interface AdditionalDriverRecord {
  driverRecord: DriverRecord;
  personRecord: PersonRecord;
  customerNote: string;
}

// Payment record matching OpenAPI schema
export interface PaymentRecord {
  cardType: string;
  cardNumber: string;
  nameOnCard: string;
  expiryDate: string; // MM/YY
  cvv: string;
  amountOnHold: string;
  checkoutGrossAmount: string;
  paymentDate: string; // ISO datetime
  paymentStatus: string;
  authorizationCode: string;
}

// Main checkout payload matching OpenAPI CheckoutRecord schema
export interface CheckoutPayload {
  checkoutPricingRecord: CheckoutPricingRecord;
  customerRecord: CustomerRecord;
  additionalDriverRecords: AdditionalDriverRecord[];
  mva: string;
  paymentRecord: PaymentRecord;
}

// Response from checkout endpoint
export interface CheckoutResponse {
  message: string;
  checkout?: {
    firstname: string;
    lastname: string;
    checkoutDateTime: string;
    expectedCheckinDateTime: string;
    rentalStatus: string;
  };
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

  // Persist checkout - Bearer token is added automatically by AuthenticationInterceptor
  submitCheckout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${environment.apiUrl}/checkout`, payload);
  }
}
