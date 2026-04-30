// src/app/services/fee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

export interface FeeRecord {
  name: string;
  category: 'Additional' | 'Car Group' | 'Insurance';
  interval: 'Daily' | 'Weekly' | 'Weekend' | 'One Time';
  amount: number;
  capAmount: number;
  isRequired: boolean;
}


@Injectable({ providedIn: 'root' })
export class FeeService {
  constructor(private http: HttpClient) { }

  getAllFees(): Observable<FeeRecord[]> {
    const headers = this.authHeaders();
    return this.http.get<FeeRecord[]>(`${environment.apiUrl}/fee`, { headers });
  }

  updateFee(body: FeeRecord): Observable<FeeRecord> {
    const headers = this.authHeaders();
    return this.http.post<FeeRecord>(`${environment.apiUrl}/fee/update`, body, { headers });
  }

  private authHeaders() {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
