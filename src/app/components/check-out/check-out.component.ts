import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, FormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatSelect } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MatNativeDateModule,
  MatOption,
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS
} from '@angular/material/core';
import { default as _rollupMoment, Moment } from 'moment';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { combineLatest, Subject, merge } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { UploadOptionsComponent } from '../upload-options.component';
import { PriceService, PriceRequest, AdditionalFee, Discount } from '../_common/_service/price.service';
import { FeeService, Fee } from '../_common/_service/fee.service';
import { VehicleService, Vehicle } from '../_common/_service/vehicle.service';
import {
  CheckoutService,
  CheckoutPayload,
  CheckoutPricingRecord,
  CustomerRecord,
  AdditionalDriverRecord,
  PaymentRecord,
  DriverRecord,
  PersonRecord,
  AddressRecord,
  DiscountRecord,
  AdditionalFeeRecord
} from '../_common/_service/checkout.service';
import { InvoiceService, VehicleInfo } from '../../services/invoice.service';
import { COUNTRIES } from '../../shared/constants/countries';

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
  selector: 'app-check-out',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    NgxMaterialTimepickerModule,
    MatCardModule,
    MatDivider,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelect,
    MatOption,
    FormsModule,
    MatRadioModule,
    MatIcon,
    MatButtonToggleModule,
    UploadOptionsComponent,
    MatSnackBarModule
  ],
  templateUrl: './check-out.component.html',
  styleUrls: ['./check-out.component.scss'],
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
  ]


})
export class CheckOutComponent implements OnInit, OnDestroy {
  driverStepVisible = false;
  isMobile = false;
  canCalculate = false;
  private destroy$ = new Subject<void>();
  pricingFormGroup!: FormGroup;
  driverFormGroup!: FormGroup;
  customerFormGroup!: FormGroup;
  feeGroup: FormGroup = new FormGroup({});
  carInformationFormGroup!: FormGroup;
  paymentFormGroup!: FormGroup;
  carGroup = new FormControl();
  CheckOutTimeControl = new FormControl();
  CheckInTimeControl = new FormControl();
  CheckOutDateControl = new FormControl();
  CheckInDateControl = new FormControl();
  checkoutDatetime = new FormControl();
  checkinDatetime = new FormControl();
  selectedFile: File | null = null;
  additionalDriverForms: FormGroup[] = [];

  showAdditionalFees = false;
  showDiscount = false;

  fees: Fee[] = [];
  vehicles: Vehicle[] = [];

  // List of countries for dropdowns (imported from shared constants)
  countries = COUNTRIES;

  // Holds all uploaded files by key (e.g. 'customer-id', 'driver-license', 'additional-driver-1', etc.)
  fileMap: { [key: string]: File } = {};

  get additionalFeesOnly(): Fee[] {
    return (this.fees || []).filter(f => f.feeCategory === 'Additional');
  }

  get carGroupFeesOnly(): Fee[] {
    return (this.fees || []).filter(f => f.feeCategory === 'CarGroup');
  }

  constructor(
    private fb: FormBuilder,
    private priceService: PriceService,
    private snackBar: MatSnackBar,
    private feeService: FeeService,
    private vehicleService: VehicleService,
    private checkoutService: CheckoutService,
    private invoiceService: InvoiceService
  ) { }

  ngOnInit() {
    this.pricingFormGroup = this.fb.group({
      carGroup: [''],
      priceType: [''],
      fixedPrice: [''],
      duration: [''],
      checkOutDate: [''],
      checkInDate: [''],
      tax: new FormControl({ value: '', disabled: true }),
      netAmount: new FormControl({ value: '', disabled: true }),
      grossAmount: new FormControl({ value: '', disabled: true }),
      additionalFees: this.fb.array([]),
      discountPercentage: [''],
      discountReason: [''],
      discountAppliedBy: [''],
    });
    this.feeGroup = this.fb.group({
      feeType: [''],
      price: [''],
    });

    this.customerFormGroup = this.fb.group({
      academicTitle: [''],
      firstName: [''],
      lastName: [''],
      dob: [''],
      phone: [''],
      email: ['', [Validators.email]],
      addressline1: [''],  // Combined street + house number
      addressline2: [''],
      postalCode: [''],
      country: [''],
      city: [''],
      sameBillingAddress: ['yes'],
      // Billing Address fields (separate from home address)
      billingCompanyName: [''],
      billingAddressline1: [''],
      billingPostalCode: [''],
      billingCountry: [''],
      billingCity: [''],
      companyName: [''],
      idType: [''],
      idNumber: [''],
      idExpiry: [''],
      licenseNumber: [''],
      licenseCountry: [''],
      licenseIssued: [''],
      licenseExpiry: [''],
      customerNote: [''],
      driverSameAsRenter: ['yes'],
      driverDetails: this.fb.group({
        academicTitle: [''],
        firstName: [''],
        lastName: [''],
        dob: [''],
        phone: [''],
        email: [''],
        addressline1: [''],
        postalCode: [''],
        city: [''],
        country: [''],
        licenseNumber: [''],
        licenseCountry: [''],
        licenseExpiry: [''],
      })
    });
    this.customerFormGroup.get('driverSameAsRenter')?.valueChanges.subscribe(value => {
      if (value === 'no') {
        this.driverStepVisible = true;
        this.driverFormGroup.reset(); // clear previous values
      } else {
        this.driverStepVisible = false;
        this.driverFormGroup.reset(); // optional: clear when hidden
      }
    });


    this.carInformationFormGroup = this.fb.group({
      mva: [''],
      carGroup: [{ value: '', disabled: true }],
      licensePlate: [{ value: '', disabled: true }],
      fuel: [{ value: '', disabled: true }],
      carModel: [{ value: '', disabled: true }],
      mileage: [{ value: '', disabled: true }],
      color: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      transmission: [{ value: '', disabled: true }],
    });

    this.paymentFormGroup = this.fb.group({
      cardType: [''],
      cardNumber: [''],
      nameOnCard: [''],
      expiryDate: new FormControl(null), // Full date: 2025-08-01
      cvv: ['', [Validators.maxLength(4), Validators.pattern(/^\d{0,4}$/)]],
      amountOnHold: [300],
      checkoutGrossAmount: [''],
      paymentDate: [''],
      paymentStatus: [''],
      authorizationCode: [''],
    });
    this.driverFormGroup = this.fb.group({
      isSameAsRenter: ['yes'],
      academicTitle: [''],
      firstName: [''],
      lastName: [''],
      dob: [''],
      phone: [''],
      email: [''],
      addressline1: [''],
      addressline2: [''],
      postalCode: [''],
      city: [''],
      country: ['']
    });

    this.detectDevice();
    window.addEventListener('resize', this.detectDevice.bind(this));

    // Remove previous valueChanges subscriptions and helper method
    // Use combineLatest for all four controls
    combineLatest([
      this.CheckOutDateControl.valueChanges,
      this.CheckOutTimeControl.valueChanges,
      this.CheckInDateControl.valueChanges,
      this.CheckInTimeControl.valueChanges
    ])
      .pipe(
        filter(([coDate, coTime, ciDate, ciTime]) => !!coDate && !!coTime && !!ciDate && !!ciTime)
      )
      .subscribe(([coDate, coTime, ciDate, ciTime]) => {
        // Build ISO datetime strings
        const checkoutDateTime = new Date(coDate);
        const [coHour, coMin] = coTime.split(':');
        checkoutDateTime.setHours(+coHour);
        checkoutDateTime.setMinutes(+coMin);
        const checkinDateTime = new Date(ciDate);
        const [ciHour, ciMin] = ciTime.split(':');
        checkinDateTime.setHours(+ciHour);
        checkinDateTime.setMinutes(+ciMin);
        const checkoutISO = checkoutDateTime.toISOString();
        const checkinISO = checkinDateTime.toISOString();

        this.fees = [];
        this.feeService.getAllFeesByInterval(checkoutISO, checkinISO).subscribe({
          next: (fees) => {
            this.fees.push(...fees);
          },
          error: (err) => {
            console.error('Failed to fetch fees', err);
            this.fees = [];
          }
        });
      });

    this.pricingFormGroup.get('carGroup')?.valueChanges.subscribe(value => {
      if (value) {
        this.carInformationFormGroup.get('carGroup')?.setValue(value, { emitEvent: false });
      }
    });

    // Fetch vehicles for initial car group (if any)
    const initialCarGroup = this.pricingFormGroup.get('carGroup')?.value;
    if (initialCarGroup) {
      this.fetchVehiclesByGroup(initialCarGroup);
    }

    // Subscribe to carGroup changes to fetch vehicles
    this.pricingFormGroup.get('carGroup')?.valueChanges.subscribe(value => {
      if (value) {
        this.fetchVehiclesByGroup(value);
        this.carInformationFormGroup.get('carGroup')?.setValue(value, { emitEvent: false });
      }
    });

    // Subscribe to mva changes to fill car details
    this.carInformationFormGroup.get('mva')?.valueChanges.subscribe(mva => {
      const selectedVehicle = this.vehicles.find(v => v.mva === mva);
      if (selectedVehicle) {
        this.carInformationFormGroup.patchValue({
          licensePlate: selectedVehicle.licensePlate,
          fuel: selectedVehicle.fuel,
          carModel: selectedVehicle.model,
          mileage: selectedVehicle.mileage,
          color: selectedVehicle.color,
          status: selectedVehicle.status,
          transmission: selectedVehicle.transmission
        });
      } else {
        this.carInformationFormGroup.patchValue({
          licensePlate: '',
          fuel: '',
          carModel: '',
          mileage: '',
          color: '',
          status: '',
          transmission: ''
        });
      }
    });

    merge(
      this.CheckOutDateControl.valueChanges,
      this.CheckOutTimeControl.valueChanges,
      this.CheckInDateControl.valueChanges,
      this.CheckInTimeControl.valueChanges,
      this.pricingFormGroup.get('carGroup')!.valueChanges,
      this.pricingFormGroup.get('discountPercentage')!.valueChanges,
      this.pricingFormGroup.get('discountReason')!.valueChanges,
      this.pricingFormGroup.get('discountAppliedBy')!.valueChanges,
      this.additionalFees.valueChanges
    ).pipe(takeUntil(this.destroy$)).subscribe(() => this.canCalculate = true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toLocalISOStringNoMs(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  updateActualCheckOut() {
    const date = this.CheckOutDateControl.value;

    const time = this.CheckOutTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours);
      combined.setMinutes(+minutes);
      this.checkoutDatetime.setValue(combined);
    }
  }

  updateActualCheckIn() {
    const date = this.CheckInDateControl.value;
    const time = this.CheckInTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours);
      combined.setMinutes(+minutes);
      this.checkinDatetime.setValue(combined);
    }
  }
  detectDevice() {
    this.isMobile = window.innerWidth <= 768;
  }
  focusNext(event: Event) {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(el => !el.hasAttribute('disabled'));

    const index = inputs.indexOf(target);
    if (index > -1 && index + 1 < inputs.length) {
      (inputs[index + 1] as HTMLElement).focus();
    }
  }
  updateDriverDetails() {
    if (this.customerFormGroup.get('driverSameAsRenter')?.value === 'yes') {
      const renterDetails = this.customerFormGroup.value;
      this.customerFormGroup.patchValue({
        driverDetails: {
          academicTitle: renterDetails.academicTitle,
          firstName: renterDetails.firstName,
          lastName: renterDetails.lastName,
          dob: renterDetails.dob,
          phone: renterDetails.phone,
          email: renterDetails.email,
          addressline1: renterDetails.addressline1,
          addressline2: renterDetails.addressline2,
          postalCode: renterDetails.postalCode,
          country: renterDetails.country,
          city: renterDetails.city,
          licenseNumber: renterDetails.licenseNumber,
          licenseCountry: renterDetails.licenseCountry,
          licenseExpiry: renterDetails.licenseExpiry,
        }
      });
    } else {
      this.customerFormGroup.get('driverDetails')?.reset();
    }
  }

  get additionalFees(): FormArray {
    return this.pricingFormGroup.get('additionalFees') as FormArray;
  }


  addAdditionalDriverForm() {
    const form = this.fb.group({
      academicTitle: [''],
      firstName: [''],
      lastName: [''],
      dob: [''],
      phone: [''],
      email: [''],
      addressline1: [''],
      postalCode: [''],
      country: [''],
      city: [''],
      idType: [''],
      idNumber: [''],
      idExpiry: [''],
      licenseNumber: [''],
      licenseCountry: [''],
      licenseExpiry: [''],
    });

    this.additionalDriverForms.push(form);
  }

  addAdditionalFee() {
    const feeGroup: FormGroup = this.fb.group({
      feeType: [''],
      price: new FormControl({ value: '', disabled: true }),
      kmCount: [''],
      airportName: [''],
      feeDuration: [''],     // New field
      maxAmount: new FormControl({ value: '', disabled: true }),        // New field
    });


    feeGroup.get('feeType')?.valueChanges.subscribe((value: string) => {
      const normalized = (value || '').replace(/\s+/g, '').toLowerCase();
      if (normalized === 'additionaldriver') {
        if (this.additionalDriverForms.length < 3) {
          this.addAdditionalDriverForm();
        } else {
          alert('Maximum of 3 additional drivers allowed.');
          feeGroup.get('feeType')?.reset();
        }
      } else {
        feeGroup.get('kmCount')?.reset();
        feeGroup.get('airportName')?.reset();
      }
    });

    this.additionalFees.push(feeGroup);
  }

  calculateAge(dob: string | Date | null): number | '' {
    if (!dob) return '';

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
  isIdExpired(): boolean {
    const expiry = this.customerFormGroup.get('idExpiry')?.value;
    if (!expiry) return false;

    const today = new Date();
    return new Date(expiry) < today;
  }

  isLicenseRecent(): 'warning' | 'ok' | '' {
    const issued = this.customerFormGroup.get('licenseIssued')?.value;

    if (!issued) return '';

    const issuedDate = new Date(issued);
    const today = new Date();

    const diffInMonths =
      (today.getFullYear() - issuedDate.getFullYear()) * 12 +
      today.getMonth() - issuedDate.getMonth();

    if (diffInMonths < 3) {
      return 'warning';  // License too recent
    }

    if (diffInMonths >= 6) {
      return 'ok';       // License older than 6 months
    }

    return ''; // Between 3 and 6 months: no icon
  }


  removeAdditionalFee(index: number) {
    this.additionalFees.removeAt(index);
  }

  onFileSelected(event: any, key: string) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileMap[key] = file;
      // Optionally: trigger change detection or further logic
    }
  }

  toggleAdditionalFees() {
    this.showAdditionalFees = !this.showAdditionalFees;
    if (this.showAdditionalFees && this.additionalFees.length === 0) {
      this.addAdditionalFee();
    }
    this.canCalculate = true;
  }

  toggleDiscount() {
    this.showDiscount = !this.showDiscount;
    this.canCalculate = true;
  }
  get expiryDateControl(): FormControl {
    return this.paymentFormGroup.get('expiryDate') as FormControl;
  }

  get initialExpiryMoment(): Moment {
    const val = this.expiryDateControl.value;
    return val ? moment(val) : moment();
  }

  selectExpiryMonth(month: Moment, datepicker: MatDatepicker<Moment>) {
    const date = month.startOf('month').toDate(); // e.g. 2025-08-01
    this.expiryDateControl.setValue(date);
    datepicker.close();
  }

  preventTyping(event: Event) {
    event.preventDefault();
  }



  showYoungDriverNotice(): boolean {
    const dob = this.customerFormGroup.get('dob')?.value;
    if (!dob) return false;

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age >= 18 && age <= 21;
  }

  calculatePrice() {
    const checkOutDate = this.CheckOutDateControl.value;
    const checkOutTime = this.CheckOutTimeControl.value;
    const checkInDate = this.CheckInDateControl.value;
    const checkInTime = this.CheckInTimeControl.value;
    const carGroup = this.pricingFormGroup.get('carGroup')?.value;

    if (!checkOutDate || !checkOutTime || !checkInDate || !checkInTime || !carGroup) {
      alert('Please fill out all date and car group fields before calculating price.');
      return;
    }

    const checkOutDateTime = new Date(checkOutDate);
    const [coHour, coMin] = checkOutTime.split(':');
    checkOutDateTime.setHours(+coHour);
    checkOutDateTime.setMinutes(+coMin);

    const checkInDateTime = new Date(checkInDate);
    const [ciHour, ciMin] = checkInTime.split(':');
    checkInDateTime.setHours(+ciHour);
    checkInDateTime.setMinutes(+ciMin);

    // Build additionalFees array from pricingFormGroup
    // replace the placeholder with a call to the new helper:
    const additionalFees: AdditionalFee[] = this.buildAdditionalFees();

    let discount: Discount | undefined = undefined;
    if (this.showDiscount) {
      discount = {
        percentage: this.pricingFormGroup.get('discountPercentage')?.value || '',
        reason: this.pricingFormGroup.get('discountReason')?.value || '',
        user: this.pricingFormGroup.get('discountAppliedBy')?.value || ''
      };
      console.log('Discount:', JSON.stringify(discount));
    }

    const payload: PriceRequest = {
      carGroupName: carGroup,
      checkOutDate: checkOutDateTime.toISOString(),
      expectedCheckInDate: checkInDateTime.toISOString(),
      additionalFees: additionalFees.length > 0 ? additionalFees : undefined,
      discount: discount
    };

    console.log('Price Request:', JSON.stringify(payload));
    this.priceService.calculatePrice(payload).subscribe({
      next: (data) => {
        this.pricingFormGroup.patchValue({
          netAmount: data.netPrice,
          grossAmount: data.grossPrice,
          tax: data.taxRate * 100
        });
        this.canCalculate = false;
      },
      error: (error) => {
        alert('Error calculating price: ' + error.message);
        this.snackBar.open('Error calculating price: ' + error.message, 'Close', {
          duration: 3000,       // auto close after 3s
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        this.canCalculate = false;
      }
    });
  }

  /**
   * Builds the checkout payload from all form groups and submits it to the backend.
   */
  save() {
    const payload = this.buildCheckoutPayload();
    
    if (!payload) {
      this.snackBar.open('Please fill in all required fields.', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.checkoutService.submitCheckout(payload).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Checkout saved successfully!', 'Close', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['success-snackbar']
        });
        // Generate and print invoice
        this.printInvoice(payload);
      },
      error: (err) => {
        console.error('Checkout submission failed', err);
        this.snackBar.open('Failed to save checkout: ' + (err.error?.message || err.message), 'Close', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Builds the complete CheckoutPayload from all form groups.
   */
  buildCheckoutPayload(): CheckoutPayload | null {
    // Build checkout and checkin datetime
    const checkOutDate = this.CheckOutDateControl.value;
    const checkOutTime = this.CheckOutTimeControl.value;
    const checkInDate = this.CheckInDateControl.value;
    const checkInTime = this.CheckInTimeControl.value;

    if (!checkOutDate || !checkOutTime || !checkInDate || !checkInTime) {
      return null;
    }

    const checkOutDateTime = new Date(checkOutDate);
    const [coHour, coMin] = checkOutTime.split(':');
    checkOutDateTime.setHours(+coHour, +coMin);

    const checkInDateTime = new Date(checkInDate);
    const [ciHour, ciMin] = checkInTime.split(':');
    checkInDateTime.setHours(+ciHour, +ciMin);

    // Build pricing record
    const pricingRecord: CheckoutPricingRecord = {
      checkoutDate: checkOutDateTime.toISOString(),
      expectedCheckinDate: checkInDateTime.toISOString(),
      carGroupName: this.pricingFormGroup.get('carGroup')?.value || '',
      targetSalePrice: this.pricingFormGroup.get('netAmount')?.value?.toString() || null,
      grossListSalePrice: this.pricingFormGroup.get('grossAmount')?.value?.toString() || null,
      additionalFees: this.buildAdditionalFeesForCheckout(),
      discount: this.buildDiscountRecord()
    };

    // Build customer record
    const customerRecord = this.buildCustomerRecord();

    // Build additional driver records
    const additionalDriverRecords = this.buildAdditionalDriverRecords();

    // Build payment record
    const paymentRecord = this.buildPaymentRecord();

    // Get MVA
    const mva = this.carInformationFormGroup.get('mva')?.value || '';

    return {
      checkoutPricingRecord: pricingRecord,
      customerRecord: customerRecord,
      additionalDriverRecords: additionalDriverRecords,
      mva: mva,
      paymentRecord: paymentRecord
    };
  }

  /**
   * Builds the additional fees array for the checkout payload.
   */
  buildAdditionalFeesForCheckout(): AdditionalFeeRecord[] | null {
    const fees = this.additionalFees.controls.map(fee => ({
      name: fee.get('feeType')?.value || '',
      amount: fee.get('price')?.value?.toString() || '',
      amountMax: fee.get('maxAmount')?.value?.toString() || ''
    }));
    return fees.length > 0 ? fees : null;
  }

  /**
   * Builds the discount record for the checkout payload.
   */
  buildDiscountRecord(): DiscountRecord | null {
    if (!this.showDiscount) return null;
    const percentage = this.pricingFormGroup.get('discountPercentage')?.value;
    const reason = this.pricingFormGroup.get('discountReason')?.value;
    const user = this.pricingFormGroup.get('discountAppliedBy')?.value;
    if (!percentage && !reason && !user) return null;
    return {
      percentage: percentage?.toString() || '',
      reason: reason || '',
      user: user || ''
    };
  }

  /**
   * Builds the customer record from the customer form group.
   */
  buildCustomerRecord(): CustomerRecord {
    const c = this.customerFormGroup.value;
    
    const addressRecord: AddressRecord = {
      companyName: c.companyName || '',
      addressline1: c.addressline1 || '',
      postalCode: c.postalCode || '',
      city: c.city || '',
      country: c.country || ''
    };

    // Build person record
    const personRecord: PersonRecord = {
      academicTitle: c.academicTitle || '',
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      dob: c.dob ? this.formatDate(c.dob) : '',
      phone: c.phone || '',
      email: c.email || '',
      addressRecord: addressRecord,
      idType: c.idType || '',
      idNumber: c.idNumber || '',
      idExpiryDate: c.idExpiry ? this.formatDate(c.idExpiry) : '',
      idImageBase64: this.fileMap['customer-id'] ? '' : '' // TODO: convert file to base64
    };

    // Build driver record
    const driverRecord: DriverRecord = {
      licenseNumber: c.licenseNumber || '',
      licenseCountry: c.licenseCountry || '',
      licenseIssued: c.licenseIssued ? this.formatDate(c.licenseIssued) : '',
      licenseExpiry: c.licenseExpiry ? this.formatDate(c.licenseExpiry) : '',
      licenseImageBase64: this.fileMap['driver-license'] ? '' : '' // TODO: convert file to base64
    };

    // Billing address (same as home address if sameBillingAddress is 'yes')
    const billingAddressRecord: AddressRecord = c.sameBillingAddress === 'yes' 
      ? { ...addressRecord }
      : {
          companyName: c.billingCompanyName || '',
          addressline1: c.billingAddressline1 || '',
          addressline2: '',
          postalCode: c.billingPostalCode || '',
          country: c.billingCountry || '',
          city: c.billingCity || ''
        };

    return {
      driverRecord: driverRecord,
      personRecord: personRecord,
      billingAddressRecord: billingAddressRecord,
      customerNote: c.customerNote || '',
      driverSameAsRenter: c.driverSameAsRenter || 'yes'
    };
  }

  /**
   * Builds additional driver records from the additional driver forms.
   */
  buildAdditionalDriverRecords(): AdditionalDriverRecord[] {
    return this.additionalDriverForms.map((form, index) => {
      const d = form.value;
      
      const addressRecord: AddressRecord = {
        addressline1: d.addressline1 || '',
        postalCode: d.postalCode || '',
        country: d.country || '',
        city: d.city || ''
      };

      const personRecord: PersonRecord = {
        academicTitle: d.academicTitle || '',
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        dob: d.dob ? this.formatDate(d.dob) : '',
        phone: d.phone || '',
        email: d.email || '',
        addressRecord: addressRecord,
        idType: d.idType || '',
        idNumber: d.idNumber || '',
        idExpiryDate: d.idExpiry ? this.formatDate(d.idExpiry) : '',
        idImageBase64: this.fileMap[`additional-driver-${index + 1}-id`] ? '' : ''
      };

      const driverRecord: DriverRecord = {
        licenseNumber: d.licenseNumber || '',
        licenseCountry: d.licenseCountry || '',
        licenseIssued: '', // Not in current form
        licenseExpiry: d.licenseExpiry ? this.formatDate(d.licenseExpiry) : '',
        licenseImageBase64: this.fileMap[`additional-driver-${index + 1}-license`] ? '' : ''
      };

      return {
        driverRecord: driverRecord,
        personRecord: personRecord,
        customerNote: ''
      };
    });
  }

  /**
   * Builds the payment record from the payment form group.
   */
  buildPaymentRecord(): PaymentRecord {
    const p = this.paymentFormGroup.value;
    
    // Format expiry date as MM/YY
    let expiryDateFormatted = '';
    if (p.expiryDate) {
      const expDate = new Date(p.expiryDate);
      const month = (expDate.getMonth() + 1).toString().padStart(2, '0');
      const year = expDate.getFullYear().toString().slice(-2);
      expiryDateFormatted = `${month}/${year}`;
    }

    return {
      cardType: p.cardType || '',
      cardNumber: p.cardNumber || '',
      nameOnCard: p.nameOnCard || '',
      expiryDate: expiryDateFormatted,
      cvv: p.cvv || '',
      amountOnHold: p.amountOnHold?.toString() || '',
      checkoutGrossAmount: p.checkoutGrossAmount?.toString() || this.pricingFormGroup.get('grossAmount')?.value?.toString() || '',
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : new Date().toISOString(),
      paymentStatus: p.paymentStatus || 'Pending',
      authorizationCode: p.authorizationCode || ''
    };
  }

  /**
   * Formats a date to ISO date string (YYYY-MM-DD).
   */
  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Generates and prints an invoice using the InvoiceService.
   */
  printInvoice(payload: CheckoutPayload) {
    const vehicleInfo: VehicleInfo = {
      licensePlate: this.carInformationFormGroup.get('licensePlate')?.value,
      carModel: this.carInformationFormGroup.get('carModel')?.value,
      fuel: this.carInformationFormGroup.get('fuel')?.value,
      mileage: this.carInformationFormGroup.get('mileage')?.value,
      transmission: this.carInformationFormGroup.get('transmission')?.value
    };
    const taxRate = this.pricingFormGroup.get('tax')?.value || 19;
    this.invoiceService.printInvoice(payload, vehicleInfo, taxRate);
  }

  onFeeTypeChange(selectedName: string, index: number) {
    const fee = this.getFeeByName(selectedName);
    if (fee) {
      const group = this.additionalFees.at(index);
      group.patchValue({
        price: fee.amountAtCheckout,
        maxAmount: fee.maxAmount
      });
    }
  }

  // add this helper method to the class (e.g. near other utility methods)
  buildAdditionalFees(): AdditionalFee[] {
    return this.additionalFees.controls.map(fee => ({
      name: fee.get('feeType')?.value || '',
      amount: fee.get('price')?.value || '',
      amountMax: fee.get('maxAmount')?.value || ''
    })) as AdditionalFee[];
  }

  getFeeByName(name: string) {
    console.log('Available fees:', this.fees);
    return this.fees.find(fee => fee.feeName === name);
  }

  /**
   * Formats a camelCase or PascalCase string by inserting spaces before uppercase letters.
   * Example: "AdditionalDrivers" => "Additional Drivers"
   */
  formatFeeName(name: string): string {
    if (!name) return '';
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  getExtrasTotal(): number {
    try {
      const additionalFees = this.buildAdditionalFees();
      if (!additionalFees || additionalFees.length === 0) return 0;
      return additionalFees.reduce((sum, fee) => {
        const n = Number(fee.amount);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);
    } catch (e) {
      return 0;
    }
  }


  fetchVehiclesByGroup(carGroup: string) {
    this.vehicleService.getVehiclesByGroup(carGroup).subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        // Optionally reset mva if not in new list
        const mvaControl = this.carInformationFormGroup.get('mva');
        if (mvaControl && !vehicles.some(v => v.mva === mvaControl.value)) {
          mvaControl.setValue('');
        }
      },
      error: (err) => {
        console.error('Failed to fetch vehicles by group', err);
        this.snackBar.open('Failed to fetch vehicles for ' + carGroup + '.', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        // Fallback: clear current vehicles to avoid stale data
        this.vehicles = [];
      }
    });
  }
}
