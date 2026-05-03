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

interface Vehicle {
  carId: string;
  model: string;
  color: string;
  fuel: string;
  millage: string;
  mva: string;
  transmission: string;
  tireType: string;
  fuelLevel: string;
  tuvInspection: string;
  licencePlate: string;
  brand: string;
  equipment: string;
  status: string;
}

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
    MatNativeDateModule
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
    private fb: FormBuilder
  ) { }
  ngOnInit(): void {
    this.NewVehicleForm = this.fb.group({
      carId: [{ value: '', disabled: true }],
      registrationDate: ['', Validators.required],
      turnbackdate: ['', Validators.required],
      transmission: [''],
      tireType: [''],
      status: [''],
      mva: [''],
      year: [''],
      fuel: [''],
      tireInformation: [''],
      licencePlate: [''],
      brand: [''],
      fuelLevel: [''],
      equipment: [''],
      model: [''],
      color: [''],
      millage: [''],
      tuvInspection: ['']
    });
  }
  addVehicle() {
    // Save the new vehicle
    this.router.navigate(['/vehicle-registration']);
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
