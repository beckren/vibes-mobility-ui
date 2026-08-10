// price.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export type {
  AdditionalFee,
  Discount,
  PriceRequest,
  PriceResponse,
} from '../_model/price.model';
import type { PriceRequest, PriceResponse } from '../_model/price.model';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  constructor(private http: HttpClient) {}

  calculatePrice(payload: PriceRequest): Observable<PriceResponse> {
    return this.http.post<PriceResponse>(`${environment.apiUrl}/price`, payload);
  }
}
