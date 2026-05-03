import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormGroupName, FormsModule
} from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { DamageMarkerComponent } from '../damage-marker/damage-marker.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../_common/_service/vehicle.service';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface DamageHistoryItem {
  part: string;
  damage: string;
}

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

@Component({
  selector: 'app-edit-vehicle',
  templateUrl: './edit-vehicle.component.html',
  styleUrl: './edit-vehicle.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,

  ]
})
export class EditVehicleComponent implements OnInit {
  vehicle: Vehicle = {} as Vehicle;
  damageHistory: DamageHistoryItem[] = [];
  vehicleForm!: FormGroup;
  isEditing = false;


  constructor(private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private fb: FormBuilder, private vehicleService: VehicleService) { }
  displayedColumns = ['CarPart', 'Damage'];


  ngOnInit(): void {
    this.vehicleForm = this.fb.group({
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

    const mva = this.route.snapshot.paramMap.get('id');
    console.log('Edit vehicle - route param id:', mva);
    if (mva) {
      this.vehicleService.getVehicleByMva(mva).subscribe({
        next: (response: any) => {
          console.log('Vehicle loaded from API:', response);
          const vehicle = response.data || response;
          this.vehicleForm.patchValue({
            carId: vehicle.mva,
            mva: vehicle.mva,
            transmission: vehicle.transmission,
            status: vehicle.status,
            year: vehicle.year,
            fuel: vehicle.fuel,
            licencePlate: vehicle.licensePlate,
            brand: vehicle.brand || '',
            model: vehicle.model || vehicle.carModel || '',
            color: vehicle.color,
            millage: vehicle.mileage
          });
        },
        error: (err) => {
          console.error('Failed to load vehicle', err);
        }
      });
    } else {
      console.warn('No MVA route param found');
    }

    this.vehicleForm.disable();
  }

  enableEdit() {
    this.isEditing = true;
    this.vehicleForm.enable();
    this.vehicleForm.get('carId')?.disable();
  }

  cancelEdit() {
    this.isEditing = false;
    this.vehicleForm.disable();
  }

  cancelBtn() {
    this.router.navigate(['/vehicles'])
  }

  addDamage() {
    const dialogRef = this.dialog.open(DamageMarkerComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Damage coordinates:', result);
        //Save to database later
      }
    });
  }

  viewMaintenanceHistory() {
    console.log("View Maintenance History clicked!");
    this.router.navigate(['/vehicle-maintenance-history'])
  }

  removeDamage(item: DamageHistoryItem) {
    this.damageHistory = this.damageHistory.filter(d => d !== item);
  }
  gotoHistory() {
    this.router.navigate(['/vehicle-rental-history']);
  }
}
