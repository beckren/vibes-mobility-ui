import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

export interface VehicleRentalHistoryItem {
  name: string;
  lastName: string;
  carPlate: string;
  rentalId: string;
  checkOut: string;
  checkIn: string;
  status: string;
}

export class VehicleRentalHistoryDataSource extends MatTableDataSource<VehicleRentalHistoryItem> {
  constructor() {
    super([]);
  }
}
