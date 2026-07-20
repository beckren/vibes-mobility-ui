import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { VehicleMaintenanceHistoryDataSource, VehicleMaintenanceHistoryItem } from './vehicle-maintenance-history-datasource';
import { MaintenanceService, MaintenanceSearchResult } from '../_common/_service/maintenance.service';

@Component({
  selector: 'app-vehicle-maintenance-history',
  templateUrl: './vehicle-maintenance-history.component.html',
  styleUrls: ['./vehicle-maintenance-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
})
export class VehicleMaintenanceHistoryComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<VehicleMaintenanceHistoryItem>;

  dataSource = new VehicleMaintenanceHistoryDataSource();
  displayedColumns = ['reason', 'checkOut', 'checkIn', 'days', 'repairType', 'address', 'status'];

  constructor(
    private route: ActivatedRoute,
    private maintenanceService: MaintenanceService
  ) { }

  ngOnInit(): void {
    const mva = this.route.snapshot.paramMap.get('id');
    if (mva) {
      this.loadMaintenance(mva);
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  private loadMaintenance(mva: string): void {
    this.maintenanceService.searchMaintenance(mva).subscribe({
      next: (records) => {
        this.dataSource.data = records.map((r) => this.toItem(r));
      },
      error: (err) => console.error('Failed to load maintenance history', err)
    });
  }

  private toItem(r: MaintenanceSearchResult): VehicleMaintenanceHistoryItem {
    return {
      reason: r.reason,
      checkOut: this.formatDate(r.checkOut),
      checkIn: this.formatDate(r.checkIn),
      days: r.days,
      repairType: r.repairType,
      address: r.address,
      status: r.status
    };
  }

  private formatDate(value: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
