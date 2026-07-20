import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AvailVehiclesTableItem } from './available-vehicles-datasource';
import { Vehicle, VehicleService } from '../_common/_service/vehicle.service';


@Component({
  selector: 'app-available-vehicles',
  templateUrl: './available-vehicles.component.html',
  styleUrls: ['./available-vehicles.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ]
})

export class AvailableVehiclesComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<AvailVehiclesTableItem>();
  displayedColumns: string[] = ['carId', 'plate', 'model', 'color', 'status'];
  isLoading = true;
  errorMessage = '';

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private vehicleService: VehicleService) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles: Vehicle[]) => {
        this.dataSource.data = vehicles.map(vehicle => ({
          carId: vehicle.mva,
          plate: vehicle.licensePlate,
          model: vehicle.model || vehicle.carModel || vehicle.carGroup,
          color: vehicle.color,
          status: vehicle.status
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load available vehicles', err);
        this.errorMessage = 'Failed to load available vehicles. Please try again.';
        this.isLoading = false;
      }
    });
  }

  refreshVehicles(): void {
    this.loadVehicles();
  }
}
