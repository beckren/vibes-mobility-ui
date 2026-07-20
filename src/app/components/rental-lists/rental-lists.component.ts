import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { RentalListsItem } from './rental-lists-datasource';
import { Router, RouterModule } from '@angular/router';
import { RentalSearchResult, RentalService } from '../_common/_service/rental.service';

@Component({
  selector: 'app-rental-lists',
  templateUrl: './rental-lists.component.html',
  styleUrls: ['./rental-lists.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    //MatPaginator,
    MatSort
  ]
})
export class RentalListsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'rentalId',
    'customer',
    'car',
    'employee',
    'checkOutPrice',
    'checkOut',
    'checkIn',
    'status',
    'actions'
  ];

  dataSource = new MatTableDataSource<RentalListsItem>([]);

  isLoading = true;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private rentalService: RentalService
  ) {}

  ngOnInit(): void {
    this.loadRentals();
  }


  loadRentals(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rentalService.searchRentals({}).subscribe({
      next: (rentals: RentalSearchResult[]) => {
        this.dataSource.data = rentals.map(rental => ({
          rentalId: rental.rentalId,
          customer: `${rental.firstName || ''} ${rental.lastName || ''}`.trim(),
          car: rental.mva ? `${rental.carGroup} (${rental.mva})` : rental.carGroup,
          employee: '',
          checkOutPrice: Number(rental.grossAmount) || 0,
          checkOut: rental.checkoutDate ? new Date(rental.checkoutDate) : null,
          checkIn: rental.checkinDate ? new Date(rental.checkinDate) : null,
          status: rental.status || ''
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load rentals', err);
        this.errorMessage = 'Failed to load rentals. Please try again.';
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  refreshRentals(): void {
    this.loadRentals();
  }

  gotoCheckOut() {
    this.router.navigate(['/check-out']);
  }
}
