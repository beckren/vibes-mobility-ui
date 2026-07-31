import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material imports
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RentalSearchResult,
  RentalService,
} from '../_common/_service/rental.service';
import { getManifestStatus } from '../_common/fleet-dashboard.util';

export interface Rental {
  rentalId: string;
  customer: string;
  carGroup: string;
  carModel: string;
  carLicense: string;
  phoneNumber: string;
  email: string;
  checkOutPrice: number;
  checkOut: Date;
  checkIn: Date;
  status: string;
}

@Component({
  selector: 'app-manifest-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './manifest-menu.component.html',
  styleUrls: ['./manifest-menu.component.scss'],
})
export class ManifestMenuComponent implements OnInit, AfterViewInit {
  rentalTypes = ['Upcoming', 'Returning', 'On Rent', 'Closed'];
  selectedType: string = 'Upcoming';

  displayedColumns: string[] = [
    'rentalId',
    'customer',
    'carGroup',
    'carModel',
    'carLicense',
    'checkOutPrice',
    'phoneNumber',
    'email',
    'checkOut',
    'checkIn',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<Rental>();
  allRentals: Rental[] = [];
  isLoading = true;
  errorMessage = '';

  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

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
      next: rentals => {
        this.allRentals = rentals.map(rental => this.toManifestRental(rental));
        this.updateTable();
        this.isLoading = false;
      },
      error: error => {
        console.error('Failed to load manifest rentals', error);
        this.errorMessage = 'Failed to load rentals. Please try again.';
        this.isLoading = false;
      },
    });
  }

  private toManifestRental(rental: RentalSearchResult): Rental {
    return {
      rentalId: rental.rentalId,
      customer: `${rental.firstName} ${rental.lastName}`.trim(),
      carGroup: rental.carGroup,
      carModel: rental.carModel,
      carLicense: rental.carLicense,
      phoneNumber: rental.phoneNumber,
      email: rental.email,
      checkOutPrice: Number(rental.grossAmount),
      checkOut: new Date(rental.checkoutDate),
      checkIn: new Date(rental.checkinDate),
      status: getManifestStatus(rental),
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Include all columns in filtering
    this.dataSource.filterPredicate = (data: Rental, filter: string) => {
      const normalized = filter.trim().toLowerCase();
      return (
        data.customer.toLowerCase().includes(normalized) ||
        data.carModel.toLowerCase().includes(normalized) ||
        data.carLicense.toLowerCase().includes(normalized) ||
        data.phoneNumber.toLowerCase().includes(normalized) ||
        data.email.toLowerCase().includes(normalized)
      );
    };
  }

  selectRentalType(type: string): void {
    this.selectedType = type;
    this.updateTable();
  }

  getActionButtons(): string[] {
    switch (this.selectedType.toLowerCase()) {
      case 'upcoming':
        return ['New Reservation'];
      case 'on rent':
        return [ 'Close Rental'];
      case 'returning':
        return ['Close Rental'];
      case 'closed':
        return [];
      default:
        return [];
    }
  }

  handleAction(action: string): void {
    switch (action) {
      case 'New Reservation':
        this.router.navigate(['/new-upcoming-rental']);
        break;
      case 'New Rental':
        this.router.navigate(['/check-out']);
        break;
      case 'Close Rental':
        this.router.navigate(['/check-in']);
        break;
      default:
        console.warn('Unhandled action:', action);
    }
  }

  updateTable(): void {
    let filtered = this.allRentals.filter(
      (r) => r.status.toLowerCase() === this.selectedType.toLowerCase()
    );

    if (this.filterStartDate || this.filterEndDate) {
      filtered = filtered.filter((rental) => {
        const outDate = new Date(rental.checkOut);
        if (this.filterStartDate && outDate < this.filterStartDate) return false;
        if (this.filterEndDate && outDate > this.filterEndDate) return false;
        return true;
      });
    }

    this.dataSource.data = filtered;
  }
applyTextFilter(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  this.dataSource.filter = value.trim().toLowerCase();
}

applyDateFilter(): void {
  const start = this.filterStartDate ? new Date(this.filterStartDate) : null;
  const end = this.filterEndDate ? new Date(this.filterEndDate) : null;

  this.dataSource.data = this.allRentals
    .filter((r) => r.status.toLowerCase() === this.selectedType.toLowerCase())
    .filter((r) => {
      const out = new Date(r.checkOut);
      if (start && out < start) return false;
      if (end && out > end) return false;
      return true;
    });
}


  clearDateFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.updateTable();
  }

  editRental(rental: Rental): void {
    this.router.navigate(['/rental-edit-exchange'], {
      queryParams: { rentalId: rental.rentalId },
    });
  }
printTable(): void {
  window.print();
}
  trackByType(index: number, type: string): string {
    return type;
  }
}
