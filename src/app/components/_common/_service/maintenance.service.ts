import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface MaintenanceCreateBody {
  mva: string;
  location: string;
  reason: string;
  addressId: number;
  repairType: string;
  checkOut?: string | null;
  checkIn?: string | null;
}

// Lightweight maintenance record for the history table (GET /maintenance)
export interface MaintenanceSearchResult {
  maintenanceId: string;
  mva: string;
  location: string;
  reason: string;
  repairType: string;
  address: string;
  checkOut: string;
  checkIn: string;
  days: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  constructor(private http: HttpClient) {}

  searchMaintenance(mva: string): Observable<MaintenanceSearchResult[]> {
    const params = new HttpParams().set('mva', mva);
    return this.http.get<MaintenanceSearchResult[]>(`${environment.apiUrl}/maintenance`, { params });
  }

  createMaintenance(body: MaintenanceCreateBody): Observable<MaintenanceSearchResult | null> {
    return this.http.post<MaintenanceSearchResult | null>(`${environment.apiUrl}/maintenance`, body);
  }
}
