import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import {
  RentalSearchResult,
  RentalService,
} from '../_common/_service/rental.service';
import { Vehicle, VehicleService } from '../_common/_service/vehicle.service';
import {
  FleetCategory,
  getVehiclesForCategory,
  toDateKey,
} from '../_common/fleet-dashboard.util';

interface CarStatusItem {
  ran: string;
  mva: string;
  plate: string;
  model: string;
  color: string;
  status: string;
}

@Component({
  selector: 'app-car-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './car-status.component.html',
  styleUrls: ['./car-status.component.scss']
})
export class CarStatusComponent implements OnInit {
  category: FleetCategory = 'On Hand';
  date: string | null = null;

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<CarStatusItem>([]);
  isLoading = true;
  errorMessage = '';

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private rentalService: RentalService,
    private vehicleService: VehicleService
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.category = this.parseCategory(params.get('category'));
      this.date = params.get('date');
      this.loadCars();
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

 loadCars(): void {
   if (!this.date) {
     this.errorMessage = 'No date was selected.';
     this.isLoading = false;
     return;
   }

   this.isLoading = true;
   this.errorMessage = '';

   forkJoin({
     rentals: this.rentalService.searchRentals({}),
     vehicles: this.vehicleService.getAllVehicles(),
   }).subscribe({
     next: ({ rentals, vehicles }) => {
       const matchingVehicles = getVehiclesForCategory(
         this.category,
         this.date!,
         rentals,
         vehicles
       );
       this.displayedColumns = this.showsRentalNumber
         ? ['ran', 'mva', 'plate', 'model', 'color', 'status']
         : ['mva', 'plate', 'model', 'color', 'status'];
       this.dataSource.data = matchingVehicles.map(vehicle =>
         this.toTableItem(vehicle, rentals)
       );
       this.dataSource.sort = this.sort;
       this.isLoading = false;
     },
     error: error => {
       console.error('Failed to load car status data', error);
       this.errorMessage = 'Failed to load vehicles. Please try again.';
       this.isLoading = false;
     },
   });
 }

 get title(): string {
   return `${this.category} Vehicles`;
 }

 get showsRentalNumber(): boolean {
   return ['Due In', 'Res D/I', 'Veh-Rsvd'].includes(this.category);
 }

 private toTableItem(
   vehicle: Vehicle,
   rentals: RentalSearchResult[]
 ): CarStatusItem {
   const rental = rentals.find(item =>
     item.mva === vehicle.mva &&
     item.status === 'Active' &&
     toDateKey(item.checkoutDate) <= this.date! &&
     toDateKey(item.checkinDate) >= this.date!
   );

   return {
     ran: rental?.rentalId ?? '',
     mva: vehicle.mva,
     plate: vehicle.licensePlate,
     model: vehicle.model || vehicle.carModel || vehicle.carGroup,
     color: vehicle.color,
     status: vehicle.status,
   };
 }

 private parseCategory(value: string | null): FleetCategory {
   const categories: FleetCategory[] = [
     'On Hand',
     'Due In',
     'Res D/I',
     'Stn-Inv',
     'Veh-Rsvd',
     'Available',
   ];
   return categories.find(category => category === value) ?? 'On Hand';
 }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = value;
  }
}
