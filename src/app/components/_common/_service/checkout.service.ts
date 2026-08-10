import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { VehicleService, Vehicle } from './vehicle.service';
import { PriceService, PriceRequest } from './price.service';
import { FeeService, Fee } from './fee.service';

export type {
  AddressRecord,
  DriverRecord,
  PersonRecord,
  DiscountRecord,
  AdditionalFeeRecord,
  CheckoutPricingRecord,
  CustomerRecord,
  AdditionalDriverRecord,
  PaymentRecord,
  CheckoutPayload,
  CheckoutResponse,
} from '../_model/checkout.model';
import type { CheckoutPayload, CheckoutResponse } from '../_model/checkout.model';

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

  // Persist checkout - Bearer-Token wird automatisch vom keycloak-angular Interceptor angehaengt
  submitCheckout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${environment.apiUrl}/checkout`, payload);
  }
}
