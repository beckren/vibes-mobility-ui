import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MaintenanceCreateBody, MaintenanceService } from '../_common/_service/maintenance.service';

@Component({
  selector: 'app-new-maintenance-info',
  templateUrl: './new-maintenance-info.component.html',
  styleUrls: ['./new-maintenance-info.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule
  ]
})
export class NewMaintenanceInfoComponent {

  NewVehicleForm!: FormGroup;  
  days: number = 0;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private maintenanceService: MaintenanceService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.NewVehicleForm = this.fb.group({
      carId: [{ value: 'ABC123', disabled: true }],
      mva: ['XYZ987', Validators.required],
      licencePlate: ['ABC-1234', Validators.required],
      placeOfLeave: ['memmingen', Validators.required],
      checkoutDate: [null, Validators.required],
      checkinDate: [null, Validators.required],
      addressId: [null, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      repairType: ['', Validators.required],
      model: ['Corolla', Validators.required],
      color: ['Blue', Validators.required],
      brand: ['Toyota', Validators.required],
      year: ['2020', Validators.required],
      fuel: ['Gasoline', Validators.required],
      tireInformation: ['Michelin R-17', Validators.required],
      fuelLevel: ['Full', Validators.required],
      equipment: ['Standard', Validators.required],
      millage: ['15000', Validators.required],
      tuvInspection: ['2024-05-10', Validators.required]
    });

    this.NewVehicleForm.get('checkoutDate')?.valueChanges.subscribe(() => this.calculateDays());
    this.NewVehicleForm.get('checkinDate')?.valueChanges.subscribe(() => this.calculateDays());
  }

  calculateDays() {
    const checkoutDate = this.NewVehicleForm.get('checkoutDate')?.value;
    const checkinDate = this.NewVehicleForm.get('checkinDate')?.value;

    if (checkoutDate && checkinDate) {
      const diffTime = new Date(checkinDate).getTime() - new Date(checkoutDate).getTime();
      this.days = Math.ceil(diffTime / (1000 * 3600 * 24)); // Calculate the number of days
    }
  }

  addVehicle() {
    this.errorMessage = '';

    if (this.NewVehicleForm.invalid) {
      this.NewVehicleForm.markAllAsTouched();
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    const value = this.NewVehicleForm.getRawValue();
    const body: MaintenanceCreateBody = {
      mva: value.mva,
      location: value.placeOfLeave,
      reason: value.reason,
      addressId: Number(value.addressId),
      repairType: value.repairType,
      checkOut: this.toIsoString(value.checkoutDate),
      checkIn: this.toIsoString(value.checkinDate)
    };

    this.maintenanceService.createMaintenance(body).subscribe({
      next: () => {
        this.NewVehicleForm.reset();
        this.snackBar.open('Maintenance saved successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/vehicle-registration']);
      },
      error: () => {
        this.errorMessage = 'Failed to save maintenance. Please try again.';
      }
    });
  }

  private toIsoString(value: Date | string | null): string | null {
    return value ? new Date(value).toISOString() : null;
  }

  cancelBtn() {
    this.router.navigate(['/vehicles']);
  }
  
}
