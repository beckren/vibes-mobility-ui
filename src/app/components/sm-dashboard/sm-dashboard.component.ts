import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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

interface Stat { label: string; value: number; route?: string; }
interface Row { category: FleetCategory; [key: string]: string | number; }

@Component({
  selector: 'app-sm-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sm-dashboard.component.html',
  styleUrls: ['./sm-dashboard.component.scss']
})
export class SmDashboardComponent implements OnInit {
  constructor(
    private router: Router,
    private rentalService: RentalService,
    private vehicleService: VehicleService
  ) { }

  stats: Stat[] = [
    { label: 'Owned', value: 0 },
    { label: 'Unavailable', value: 0 },
    { label: 'On Rent', value: 0, route: '/rental-lists' },
    { label: 'Closed Rentals', value: 0 },
    { label: 'Overdue', value: 0 },
    { label: 'Idle', value: 0 },
    { label: 'Out of Service', value: 0 }
  ];

  viewModes: ('week')[] = ['week'];
  viewMode: 'week' = 'week';

  selectedDate = new Date();

  categories: FleetCategory[] = [
    'On Hand',
    'Due In',
    'Res D/I',
    'Stn-Inv',
    'Veh-Rsvd',
    'Available',
  ];
  tableData: Row[] = [];
  rentals: RentalSearchResult[] = [];
  vehicles: Vehicle[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      rentals: this.rentalService.searchRentals({}),
      vehicles: this.vehicleService.getAllVehicles(),
    }).subscribe({
      next: ({ rentals, vehicles }) => {
        this.rentals = rentals;
        this.vehicles = vehicles;
        this.updateStats();
        this.generateTableData();
        this.isLoading = false;
      },
      error: error => {
        console.error('Failed to load station manager dashboard', error);
        this.errorMessage = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
      },
    });
  }

  onStatClick(stat: Stat): void {
    if (stat.route) {
      this.router.navigate([stat.route]);
    }
  }

  setViewMode(mode: 'week'): void {
    this.viewMode = mode;
    this.generateTableData();
  }

  onDateSelect(date: Date | null): void {
    if (!date) return;
    this.selectedDate = date;
    this.generateTableData();
  }

  private updateStats(): void {
    const todayKey = toDateKey(new Date());
    const values: Record<string, number> = {
      Owned: this.vehicles.length,
      Unavailable: this.vehicles.filter(vehicle => vehicle.status !== 'Available').length,
      'On Rent': this.vehicles.filter(vehicle => vehicle.status === 'On Rent').length,
      'Closed Rentals': this.rentals.filter(rental => rental.status === 'Completed').length,
      Overdue: this.rentals.filter(rental =>
        rental.status === 'Active' && toDateKey(rental.checkinDate) < todayKey
      ).length,
      Idle: this.vehicles.filter(vehicle => vehicle.status === 'Available').length,
      'Out of Service': this.vehicles.filter(
        vehicle => vehicle.status === 'Out Of Service'
      ).length,
    };

    this.stats = this.stats.map(stat => ({ ...stat, value: values[stat.label] }));
  }

  private generateTableData(): void {
    const days = this.displayedDays;
    this.tableData = this.categories.map(cat => {
      const row: Row = { category: cat };
      days.forEach(dateKey => {
        row[dateKey] = getVehiclesForCategory(
          cat,
          dateKey,
          this.rentals,
          this.vehicles
        ).length;
      });
      return row;
    });
  }

  get displayedDays(): string[] {
    const start = this.selectedDate;
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return toDateKey(date);
    });
  }

  formatDay(dateKey: string): string {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  get displayedColumns(): string[] {
    return ['category', ...this.displayedDays];
  }
  onCellClick(category: FleetCategory, dateKey: string): void {
    this.router.navigate(['/car-status'], {
      queryParams: { category, date: dateKey },
    });
  }

  isClickable(): boolean {
    return true;
  }
}
