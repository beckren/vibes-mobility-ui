import { MatTableDataSource } from '@angular/material/table';

export interface VehicleMaintenanceHistoryItem {
  reason: string;
  checkOut: string;
  checkIn: string;
  days: string;
  repairType: string;
  address: string;
  status: string;
}

export class VehicleMaintenanceHistoryDataSource extends MatTableDataSource<VehicleMaintenanceHistoryItem> {
  constructor() {
    super([]);
  }
}
