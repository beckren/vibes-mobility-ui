import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { NgFor, NgIf } from '@angular/common';
import { VehicleService, Vehicle } from '../_common/_service/vehicle.service';

export interface VehiclesTableItem {
  carId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  carGroup?: string;
  fuel?: string;
  mileage?: string;
  status?: string;
  transmission?: string;
}

@Component({
  selector: 'app-vehicles-table',
  templateUrl: './vehicles-table.component.html',
  styleUrl: './vehicles-table.component.scss',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    NgFor,
    NgIf,
  ],
})
export class VehiclesTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<VehiclesTableItem>;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<VehiclesTableItem>([]);
  displayedColumns = ['carId', 'plate', 'brand', 'model', 'color', 'year', 'actions'];
  
  isLoading = true;
  errorMessage = '';

  constructor(
    private router: Router,
    private vehicleService: VehicleService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  /**
   * Load all vehicles from the backend API.
   */
  loadVehicles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles: Vehicle[]) => {
        // Map backend Vehicle to VehiclesTableItem
        const tableData: VehiclesTableItem[] = vehicles.map(v => ({
          carId: v.mva,
          plate: v.licensePlate,
          brand: v.brand,
          model: v.model,
          color: v.color,
          year: v.year || new Date().getFullYear(),
          carGroup: v.carGroup,
          fuel: v.fuel,
          mileage: v.mileage,
          status: v.status,
          transmission: v.transmission
        }));
        this.dataSource.data = tableData;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load vehicles', err);
        this.errorMessage = 'Failed to load vehicles. Please try again.';
        this.isLoading = false;
      }
    });
  }

  editVehicle(vehicle: VehiclesTableItem): void {
    this.router.navigate(['/edit-vehicle', vehicle.carId]);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  gotoNewCar(): void {
    this.router.navigate(['/add-vehicle']);
  }

  gotoMaintenance(): void {
    this.router.navigate(['/new-maintenance-info']);
  }

  /**
   * Refresh the vehicle list from the backend.
   */
  refreshVehicles(): void {
    this.loadVehicles();
  }
}
