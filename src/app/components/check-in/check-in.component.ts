import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
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
import { DamageMarkerComponent } from '../damage-marker/damage-marker.component';
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
    MatSnackBarModule
  ],
})
export class CheckInComponent implements OnInit {
  checkInForm!: FormGroup;
  showAdditionalFees = false;
  actualCheckOutDateControl = new FormControl();
  actualCheckOutTimeControl = new FormControl();

  actualCheckInDateControl = new FormControl();
  actualCheckInTimeControl = new FormControl();

  checkoutDatetime = new FormControl();
  checkinDatetime = new FormControl();
  summary = {
    rentalId: '0000001',
    netAmount: 0,
    extras: 0,
    grossAmount: 0,
  };
  feeTypePriceMap: { [key: string]: number } = {
    tax: 50,
    cleaning: 30,
    carTank: 40,
    damage: 25,
    aiport: 25,
    delayed: 10,
  };
  carInformationFormGroup!: FormGroup;


  constructor(private fb: FormBuilder, private dialog: MatDialog, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.checkInForm = this.fb.group({
      rentalNumber: [''],
      rentalnr: [''],
      mva: [''],
      checkOutPrice: new FormControl({ value: '', disabled: true }),
      checkInPrice: [''],

      actualCheckOutDate: new FormControl({ value: null, disabled: true }),
      actualCheckOutTime: new FormControl({ value: null, disabled: true }),
      expectedCheckInDate: [null],
      expectedCheckInTime: [''],
      actualCheckInDate: [null],
      actualCheckInTime: [''],
      kmOut: new FormControl({ value: ' ', disabled: true }),
      kmIn: [''],
      fuelOut: new FormControl({ value: '', disabled: true }),
      fuelIn: [''],
      netAmount: new FormControl({ value: '', disabled: true }),
      tax: [''],
      carTank: [''],
      cleaning: [''],
      damage: [''],
      grossAmount: new FormControl({ value: '', disabled: true }),
      mileageExtra: [''],
      amountOnHold: [''],
      paymentStatus: [''],
      additionalFees: this.fb.array([]),
      fuelExtra: [''],

    });

    this.carInformationFormGroup = this.fb.group({
      rentalnr: [''],
      mva: [''],
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

  }

  get additionalFees(): FormArray {
    return this.checkInForm.get('additionalFees') as FormArray;
  }
  updateActualCheckOut() {
    const date = this.actualCheckOutDateControl.value;
    const time = this.actualCheckOutTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours);
      combined.setMinutes(+minutes);
      this.checkoutDatetime.setValue(combined);
    }
  }

  updateActualCheckIn() {
    const date = this.actualCheckInDateControl.value;
    const time = this.actualCheckInTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours);
      combined.setMinutes(+minutes);
      this.checkinDatetime.setValue(combined);
    }
  }
  toggleAdditionalFees() {
    this.showAdditionalFees = !this.showAdditionalFees;
    if (this.showAdditionalFees && this.additionalFees.length === 0) {
      this.addAdditionalFees();
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

  addAdditionalFees() {
    const feeGroup = this.fb.group<{ feeType: FormControl<string | null>, price: FormControl<number | null> }>({
      feeType: this.fb.control(null),
      price: this.fb.control(null),
    });

    const feeTypeControl = feeGroup.get('feeType');
    const priceControl = feeGroup.get('price');

    feeTypeControl?.valueChanges.subscribe((selectedType) => {
      if (selectedType && selectedType in this.feeTypePriceMap && !priceControl?.dirty) {
        priceControl?.setValue(this.feeTypePriceMap[selectedType]);
      } else {
        priceControl?.setValue(null);
      }
    });

    this.additionalFees.push(feeGroup);
  }



  removeAdditionalFee(index: number) {
    this.additionalFees.removeAt(index);
  }

  addDamage() {
    const dialogRef = this.dialog.open(DamageMarkerComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Damage coordinates:', result);
        // Save to database later
      }
    });
  }
  save() {
    // TODO: add  save logic

    this.snackBar.open('Check-in saved successfully!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
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
