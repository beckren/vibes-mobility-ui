import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material modules
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VehicleService, Vehicle as ApiVehicle } from '../_common/_service/vehicle.service';

// ✅ define interface OUTSIDE component
interface Vehicle {
  carId: string;
  plate: string;
  model: string;
  color: string;
  status: string;
}

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export class DashComponent implements OnInit {
  constructor(
    private router: Router,
    private vehicleService: VehicleService
  ) {}

  // Table setup
  dataSource = new MatTableDataSource<Vehicle>();
  displayedColumns = ['carId', 'plate', 'model', 'color', 'status'];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles: ApiVehicle[]) => {
        this.dataSource.data = vehicles.map(vehicle => ({
          carId: vehicle.mva,
          plate: vehicle.licensePlate,
          model: vehicle.model || vehicle.carModel || '',
          color: vehicle.color,
          status: vehicle.status || 'Unknown',
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard vehicles', err);
        this.errorMessage = 'Failed to load vehicles. Please try again.';
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  navigateTo(title: string): void {
    if (title === 'Recent Rentals') this.router.navigate(['/rental-lists']);
    if (title === 'Total Cars Available') this.router.navigate(['/available-vehicles']);
    if (title === 'Total Revenue') this.router.navigate(['/revenue']);
  }

  onFilterChange(value: string) {
    console.log('Filter selected:', value);
  }

  goToSmDashboard() {
    this.router.navigate(['/sm-dashboard']);
  }

  toggleDashboard(isSm: boolean) {
    if (isSm) {
      this.router.navigate(['/sm-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
