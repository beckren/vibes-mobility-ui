import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDivider } from '@angular/material/divider';
import { MatDatepicker, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Vehicle, VehicleService } from '../_common/_service/vehicle.service';

@Component({
  selector: 'app-vehicle-registration',
  templateUrl: './vehicle-registration.component.html',
  styleUrls: ['./vehicle-registration.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatToolbarModule,
    MatDivider,
    MatDatepicker,
    MatDatepickerToggle,
    MatSnackBarModule
  ]
})
export class VehicleRegistrationComponent {
  vehicle: Vehicle = {
    mva: '',
    carGroup: 'IDMR',
    licensePlate: '',
    fuel: 'Gasoline',
    brand: '',
    model: '',
    mileage: '',
    color: '',
    status: 'Available',
    transmission: 'Automatic'
  };

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private vehicleService: VehicleService
  ) { }

save() {
  if (!this.vehicle.mva || !this.vehicle.licensePlate) {
    this.snackBar.open('MVA and license plate are required.', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    return;
  }

  this.vehicleService.createVehicle(this.vehicle).subscribe({
    next: () => {
      this.snackBar.open('Vehicle saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });
      this.router.navigate(['/vehicles']);
    },
    error: () => {
      this.snackBar.open('Failed to save vehicle. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  });
}


  download() {
    console.log("Download button clicked");
    // Add download functionality here
  }
}
