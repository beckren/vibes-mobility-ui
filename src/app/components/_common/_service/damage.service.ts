import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface DamageMarker {
  x: number;
  y: number;
}

export interface DamageRecord {
  id?: string;
  vehicleId: string;
  rentalId?: string;
  reportedAt?: string;
  part: string;
  direction?: string;
  damageType: string;
  severity?: string;
  state?: string;
  licensePlate?: string;
  markerX?: number;
  markerY?: number;
  imageUrls?: string[];
}

@Injectable({ providedIn: 'root' })
export class DamageService {
  constructor(private http: HttpClient) {}

  createDamage(body: DamageRecord): Observable<DamageRecord> {
    return this.http.post<DamageRecord>(`${environment.apiUrl}/damage`, body);
  }

  getDamagesByVehicle(vehicleId: string): Observable<DamageRecord[]> {
    return this.http.get<DamageRecord[]>(
      `${environment.apiUrl}/damage?vehicleId=${encodeURIComponent(vehicleId)}`
    );
  }

  uploadImages(damageId: string, files: File[]): Observable<DamageRecord> {
    const formData = new FormData();
    files.forEach(f => formData.append('files[]', f));
    return this.http.post<DamageRecord>(
      `${environment.apiUrl}/damage/${encodeURIComponent(damageId)}/images`,
      formData
    );
  }
}
