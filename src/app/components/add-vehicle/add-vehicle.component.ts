import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material Modules
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { DamageMarkerComponent } from '../damage-marker/damage-marker.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Vehicle, VehicleService } from '../_common/_service/vehicle.service';

interface DamageHistoryItem {
  part: string;
  damage: string;
}

@Component({
  selector: 'app-add-vehicle',
  templateUrl: './add-vehicle.component.html',
  styleUrl: './add-vehicle.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ]
})
export class AddVehicleComponent {
  vehicle: Vehicle = {} as Vehicle;
  damageHistory: DamageHistoryItem[] = [];
  displayedColumns = ['CarPart', 'Damage'];
  NewVehicleForm!: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private vehicleService: VehicleService
  ) { }
  ngOnInit(): void {
    this.NewVehicleForm = this.fb.group({
      carId: [{ value: '', disabled: true }],
      registrationDate: ['', Validators.required],
      turnbackdate: ['', Validators.required],
      carGroup: ['IDMR', Validators.required],
      transmission: ['Automatic', Validators.required],
      tireType: [''],
      status: ['Available', Validators.required],
      mva: ['', Validators.required],
      year: [''],
      fuel: ['Gasoline', Validators.required],
      tireInformation: [''],
      licencePlate: ['', Validators.required],
      brand: ['', Validators.required],
      fuelLevel: [''],
      equipment: [''],
      model: ['', Validators.required],
      color: ['', Validators.required],
      millage: [''],
      pmMileage: [''],
      tuvInspection: [''],
      turnbackMileage: ['']
    });
  }
  addVehicle() {
    if (this.NewVehicleForm.invalid) {
      this.NewVehicleForm.markAllAsTouched();
      this.snackBar.open('Please fill all required vehicle fields.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    const value = this.NewVehicleForm.getRawValue();
    const vehicle: Vehicle = {
      mva: value.mva,
      carGroup: value.carGroup,
      licensePlate: value.licencePlate,
      fuel: value.fuel,
      brand: value.brand,
      model: value.model,
      mileage: value.millage == null ? '' : String(value.millage),
      color: value.color,
      status: value.status,
      transmission: value.transmission,
      year: value.year ? Number(value.year) : undefined
    };

    this.vehicleService.createVehicle(vehicle).subscribe({
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

  cancelBtn() {
    this.router.navigate(['/vehicles']);
  }

  addDamage() {
    const dialogRef = this.dialog.open(DamageMarkerComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Damage coordinates:', result);
        // Save to database later
      }
    });
  }

  removeDamage(index: number) {
    this.damageHistory.splice(index, 1);
  }
}
