import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { DamageMarkerComponent } from '../damage-marker/damage-marker.component';
import { DamageDiagramDialogComponent } from '../damage-diagram-dialog/damage-diagram-dialog.component';
import { DamageService, DamageRecord } from '../_common/_service/damage.service';
import { CheckinService, CheckinFeeInput } from '../_common/_service/checkin.service';
import { RentalService } from '../_common/_service/rental.service';
import { VehicleService } from '../_common/_service/vehicle.service';
import { ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import {
  MatNativeDateModule,
  MatOption,
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS
} from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { default as _rollupMoment, Moment } from 'moment';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

const moment = _rollupMoment || _moment;
const FULL_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-check-in',
  templateUrl: './check-in.component.html',
  styleUrls: ['./check-in.component.scss'],
  standalone: true,
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: FULL_DATE_FORMATS // This is for full-date pickers
    }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
    NgxMaterialTimepickerModule,
    MatStepperModule,
    MatSnackBarModule,
    MatTableModule
  ],
})
export class CheckInComponent implements OnInit {
  checkInForm!: FormGroup;
  damages: DamageRecord[] = [];
  damageColumns = ['part', 'direction', 'damageType', 'severity', 'state', 'reportedAt', 'markers'];
  actualCheckoutDateControl = new FormControl();
  actualCheckoutTimeControl = new FormControl();

  actualCheckinDateControl = new FormControl();
  actualCheckinTimeControl = new FormControl();

  checkoutDatetime = new FormControl();
  checkinDatetime = new FormControl();
  summary = {
    rentalId: '0000001',
    netAmount: 0,
    extras: 0,
    grossAmount: 0,
  };
  carInformationFormGroup!: FormGroup;


  constructor(private fb: FormBuilder, private dialog: MatDialog, private snackBar: MatSnackBar, private damageService: DamageService, private checkinService: CheckinService, private rentalService: RentalService, private vehicleService: VehicleService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.checkInForm = this.fb.group({
      rentalNumber: [''],
      rentalnr: [''],
      mva: new FormControl({ value: '', disabled: true }),
      checkOutPrice: new FormControl({ value: '', disabled: true }),
      checkInPrice: [''],

      actualCheckOutDate: new FormControl({ value: null, disabled: true }),
      actualCheckOutTime: new FormControl({ value: null, disabled: true }),
      expectedCheckInDate: new FormControl({ value: null, disabled: true }),
      expectedCheckInTime: new FormControl({ value: '', disabled: true }),
      actualCheckInDate: [null],
      actualCheckInTime: [''],
      kmOut: new FormControl({ value: ' ', disabled: true }),
      kmIn: [''],
      fuelOut: new FormControl({ value: '', disabled: true }),
      fuelIn: [''],
      netAmount: new FormControl({ value: '', disabled: true }),
      grossAmount: new FormControl({ value: '', disabled: true }),
      mileageExtra: [''],
      amountOnHold: [''],
      paymentStatus: [''],
      fuelExtra: [''],

    });

    this.carInformationFormGroup = this.fb.group({
      rentalnr: [''],
      mva: new FormControl({ value: '', disabled: true }),
      carGroup: new FormControl({ value: '', disabled: true }),
      licensePlate: new FormControl({ value: '', disabled: true }),
      fuel: new FormControl({ value: '', disabled: true }),
      carModel: new FormControl({ value: '', disabled: true }),
      millage: new FormControl({ value: '', disabled: true }),
      color: new FormControl({ value: '', disabled: true }),
      status: new FormControl({ value: '', disabled: true }),
      transmission: new FormControl({ value: '', disabled: true }),
      customername: new FormControl({ value: '', disabled: true }),
      customerlname: new FormControl({ value: '', disabled: true }),
    });

    const rentalId = this.route.snapshot.paramMap.get('rentalId');
    if (rentalId) {
      this.carInformationFormGroup.get('rentalnr')?.disable();
      this.checkInForm.get('rentalnr')?.disable();
      this.loadRental(rentalId);
    }
  }

  // Loads the rental (incl. customer + pricing) and its vehicle into the
  // check-in forms so the agreement number and context are not free-typed.
  loadRental(rentalId: string) {
    if (!rentalId) {
      return;
    }

    this.rentalService.getRentalById(rentalId).subscribe({
      next: (rental) => {
        const person = rental.customerRecord?.personRecord;
        const pricing = rental.checkoutPricingRecord;
        const payment = rental.paymentRecord;

        this.checkInForm.patchValue({
          rentalnr: rental.rentalId,
          rentalNumber: rental.rentalId,
          mva: rental.mva,
          actualCheckOutDate: pricing?.checkoutDate ? moment(pricing.checkoutDate) : null,
          expectedCheckInDate: pricing?.expectedCheckinDate ? moment(pricing.expectedCheckinDate) : null,
          kmOut: pricing?.kmOut ?? '',
          fuelOut: pricing?.fuelOut ?? '',
          checkOutPrice: pricing?.targetSalePrice ?? '',
          netAmount: pricing?.targetSalePrice ?? '',
          grossAmount: pricing?.grossListSalePrice ?? '',
          amountOnHold: payment?.amountOnHold ?? '',
          paymentStatus: payment?.paymentStatus ?? '',
        });

        this.carInformationFormGroup.patchValue({
          rentalnr: rental.rentalId,
          mva: rental.mva,
          carGroup: pricing?.carGroupName ?? '',
          customername: person?.firstName ?? '',
          customerlname: person?.lastName ?? '',
        });

        if (rental.mva) {
          this.loadVehicle(rental.mva);
          this.loadDamages(rental.mva);
        }
      },
      error: () => {
        this.snackBar.open(`Rental '${rentalId}' could not be loaded.`, 'Close', {
          duration: 5000, horizontalPosition: 'center', verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private loadVehicle(mva: string) {
    this.vehicleService.getVehicleByMva(mva).subscribe({
      next: (response: any) => {
        const vehicle = response?.data || response;
        this.carInformationFormGroup.patchValue({
          carGroup: vehicle.carGroup,
          licensePlate: vehicle.licensePlate,
          fuel: vehicle.fuel,
          carModel: vehicle.model || vehicle.carModel || '',
          millage: vehicle.mileage,
          color: vehicle.color,
          status: vehicle.status,
          transmission: vehicle.transmission,
        });
      },
      error: () => {
        this.snackBar.open(`Vehicle '${mva}' could not be loaded.`, 'Close', {
          duration: 5000, horizontalPosition: 'center', verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  loadRentalManually() {
    const id = this.carInformationFormGroup.get('rentalnr')?.value;
    if (id) {
      this.loadRental(String(id));
    }
  }

  updateActualCheckOut() {
    const date = this.actualCheckoutDateControl.value;
    const time = this.actualCheckoutTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours);
      combined.setMinutes(+minutes);
      this.checkoutDatetime.setValue(combined);
    }
  }

  updateActualCheckIn() {
    const date = this.actualCheckinDateControl.value;
    const time = this.actualCheckinTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours);
      combined.setMinutes(+minutes);
      this.checkinDatetime.setValue(combined);
    }
  }
  parseDate(day: string, month: string, year: string): Date | null {
    const dd = parseInt(day, 10);
    const mm = parseInt(month, 10) - 1;
    const yyyy = parseInt(year, 10);

    const date = new Date(yyyy, mm, dd);
    return date && date.getDate() === dd && date.getMonth() === mm && date.getFullYear() === yyyy
      ? date
      : null;
  }

  onFlexibleDateInput(event: any, controlName: string): void {
    const raw = event.target.value.replace(/\D/g, '');
    if (raw.length === 8) {
      const day = raw.substring(0, 2);
      const month = raw.substring(2, 4);
      const year = raw.substring(4, 8);

      const parsedDate = this.parseDate(day, month, year);
      if (parsedDate) {
        this.checkInForm.get(controlName)?.setValue(parsedDate);
      }
    }
  }




  focusNext(event: Event) {
    event.preventDefault();

    const keyboardEvent = event as KeyboardEvent;
    const form = keyboardEvent.currentTarget as HTMLElement;

    const inputs = Array.from(
      form.querySelectorAll('input, select, textarea, button')
    ) as HTMLElement[];

    const index = inputs.indexOf(keyboardEvent.target as HTMLElement);
    if (index > -1 && index + 1 < inputs.length) {
      inputs[index + 1].focus();
    }
  }

  onNextStep() {
    const mva = this.carInformationFormGroup.get('mva')?.value;
    if (mva) {
      this.loadDamages(mva);
    }
  }

  loadDamages(mva: string) {
    this.damageService.getDamagesByVehicle(mva).subscribe({
      next: (damages) => { this.damages = damages; },
      error: (err) => console.error('Failed to load damages', err)
    });
  }

  openDiagram(damage: DamageRecord) {
    this.dialog.open(DamageDiagramDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        markerX: damage.markerX,
        markerY: damage.markerY,
        imageUrls: damage.imageUrls,
        part: damage.part,
        damageType: damage.damageType,
      },
    });
  }

  addDamage() {
    const vehicleId = this.carInformationFormGroup.getRawValue().mva;
    if (!vehicleId) {
      this.snackBar.open('Please load a rental first so the damage can be linked to a vehicle.', 'Close', { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(DamageMarkerComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const rentalId = this.checkInForm.get('rentalNumber')?.value
        || this.checkInForm.get('rentalnr')?.value
        || undefined;

      const payload: DamageRecord = {
        vehicleId,
        rentalId,
        part: result.part,
        direction: result.direction,
        damageType: result.damageType,
        severity: result.severity,
        state: result.state,
        licensePlate: result.licensePlate,
        markerX: result.markerX,
        markerY: result.markerY
      };

      this.damageService.createDamage(payload).subscribe({
        next: (created) => {
          this.damages = [created, ...this.damages];
          if (result.files?.length > 0 && created.id) {
            this.damageService.uploadImages(created.id, result.files).subscribe();
          }
          this.snackBar.open('Damage added.', 'Close', { duration: 2500 });
        },
        error: (err) => {
          console.error('Failed to save damage', err);
          this.snackBar.open('Failed to save damage. Please try again.', 'Close', { duration: 4000 });
        }
      });
    });
  }
  save() {
    const rentalIdRaw = this.checkInForm.get('rentalnr')?.value
      ?? this.checkInForm.get('rentalNumber')?.value;
    const rentalId = Number(rentalIdRaw);
    if (!rentalIdRaw || Number.isNaN(rentalId)) {
      this.snackBar.open('A valid rental number is required to check in.', 'Close', {
        duration: 4000, horizontalPosition: 'center', verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Only the fee inputs actually bound in the template are submitted.
    // Each maps to a seeded check-in FeeType (category "Checkin") by name.
    const feeControlMap: { [controlName: string]: string } = {
      mileageExtra: 'MileageExtra',
      fuelExtra: 'FuelExtra'
    };
    const fees: CheckinFeeInput[] = Object.entries(feeControlMap)
      .map(([controlName, feeType]) => ({
        feeType,
        quantity: 1,
        unitPrice: Number(this.checkInForm.get(controlName)?.value)
      }))
      .filter(fee => !Number.isNaN(fee.unitPrice) && fee.unitPrice > 0);

    this.checkinService.checkIn({
      rentalId,
      kmIn: Number(this.checkInForm.get('kmIn')?.value) || 0,
      fuelIn: Number(this.checkInForm.get('fuelIn')?.value) || 0,
      fees
    }).subscribe({
      next: (result) => {
        this.snackBar.open(
          `Check-in saved successfully! Total fees: ${result.totalFees}`, 'Close', {
          duration: 3000, horizontalPosition: 'center', verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        const detail = err?.error?.detail || 'Check-in failed. Please try again.';
        this.snackBar.open(detail, 'Close', {
          duration: 5000, horizontalPosition: 'center', verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }
generateInvoice() {
  const rentalId = this.summary.rentalId || '0000001';
  const fileName = `invoice_${rentalId}.pdf`;

  const pdfUrl = `https://vibes-mobility.com/invoices/${fileName}`;

  // Open the PDF link in a new tab
  window.open(pdfUrl, '_blank');

  // Show notification
  this.snackBar.open('Invoice generated successfully!', 'Open', {
    duration: 4000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: ['snackbar-success']
  });
}

}
