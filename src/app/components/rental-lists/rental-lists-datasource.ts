import { DataSource } from '@angular/cdk/collections';
import { Observable, of } from 'rxjs';

export interface RentalListsItem {
  rentalId: string;
  customer: string;
  car: string;
  employee: string;
  checkOutPrice: number;
  checkOut: Date | null;
  checkIn: Date | null;
  status: string;
}

export class RentalListsDataSource extends DataSource<RentalListsItem> {
  data: RentalListsItem[] = [];

  connect(): Observable<RentalListsItem[]> {
    return of(this.data);
  }

  disconnect(): void { }
}
