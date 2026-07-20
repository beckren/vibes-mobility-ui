import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleRentalHistoryDataSource, VehicleRentalHistoryItem } from './vehicle-rental-history-datasource';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RentalService, RentalSearchResult } from '../_common/_service/rental.service';


@Component({
  selector: 'app-vehicle-rental-history',
  templateUrl: './vehicle-rental-history.component.html',
  styleUrl: './vehicle-rental-history.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatFormField,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
})
export class VehicleRentalHistoryComponent implements OnInit, AfterViewInit {
  form!: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private rentalService: RentalService
  ) { }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<VehicleRentalHistoryItem>;

  dataSource = new VehicleRentalHistoryDataSource();

  displayedColumns = ['name', 'lastName', 'carPlate', 'rentalId', 'checkOut', 'checkIn', 'status', 'actions'];
  ngOnInit(): void {
    this.form = this.fb.group({
      totalRevenue: [{ value: '€0.00', disabled: true }]
    });
    this.loadRentals();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  private loadRentals(): void {
    const mva = this.route.snapshot.paramMap.get('id');
    if (!mva) {
      return;
    }
    this.rentalService.searchRentals({ mva }).subscribe({
      next: (rentals) => {
        this.dataSource.data = rentals.map((r) => this.toItem(r));
        const total = rentals.reduce((sum, r) => sum + (parseFloat(r.grossAmount) || 0), 0);
        this.form.get('totalRevenue')?.setValue(`€${total.toFixed(2)}`);
      },
      error: (err) => console.error('Failed to load rental history', err)
    });
  }

  private toItem(r: RentalSearchResult): VehicleRentalHistoryItem {
    return {
      name: r.firstName,
      lastName: r.lastName,
      carPlate: r.mva,
      rentalId: r.rentalId,
      checkOut: this.formatDate(r.checkoutDate),
      checkIn: this.formatDate(r.checkinDate),
      status: r.status
    };
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  getTotalRevenue() {
    console.log('Total Revenue Clicked!')

  }

  checkIn(rentalId: string): void {
    this.router.navigate(['/check-in', rentalId]);
  }
}
