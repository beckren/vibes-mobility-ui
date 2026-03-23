import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface Vehicle {
  mva: string;
  carGroup: string;
  licensePlate: string;
  fuel: string;
  brand: string;
  model: string;
  mileage: string;
  color: string;
  status: string;
  transmission: string;
  year?: number;
  // Add other fields as needed
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private http: HttpClient) {}

  /**
   * Get all vehicles from the backend.
   */
  getAllVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${environment.apiUrl}/vehicle`);
  }

  /**
   * Get vehicles filtered by car group.
   */
  getVehiclesByGroup(carGroup: string): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${environment.apiUrl}/vehicle?carGroup=${encodeURIComponent(carGroup)}`);
  }

  /**
   * Get a single vehicle by MVA.
   */
  getVehicleByMva(mva: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${environment.apiUrl}/vehicle/${encodeURIComponent(mva)}`);
  }
}
