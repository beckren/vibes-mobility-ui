import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface CheckinFeeInput {
  feeType: string;
  quantity: number;
  unitPrice: number;
}

export interface CheckinRequest {
  rentalId: number;
  checkinDate?: string;
  kmIn: number;
  fuelIn: number;
  creationUser?: string;
  fees: CheckinFeeInput[];
}

export interface CheckinFeeResult {
  feeType: string;
  quantity: number;
  unitPrice: number;
  feeAmount: number;
}

export interface CheckinResult {
  checkinId: string;
  rentalId: string;
  checkinDate: string;
  status: string;
  totalFees: number;
  fees: CheckinFeeResult[];
}

@Injectable({ providedIn: 'root' })
export class CheckinService {
  constructor(private http: HttpClient) {}

  checkIn(request: CheckinRequest): Observable<CheckinResult> {
    return this.http.post<CheckinResult>(`${environment.apiUrl}/checkin`, request);
  }
}
