import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, FormsModule, Validators } from '@angular/forms';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UploadOptionsComponent } from '../upload-options.component';
import { PriceService, PriceRequest, AdditionalFee, Discount } from '../_common/_service/price.service';
import { FeeService, Fee } from '../_common/_service/fee.service';
import { VehicleService, Vehicle } from '../_common/_service/vehicle.service';
import { RentalService, RentalSearchParams, RentalSearchResult, RentalDetail } from '../_common/_service/rental.service';
import {
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
  selector: 'app-rental-edit-exchange',
  standalone: true,
  templateUrl: './rental-edit-exchange.component.html',
  styleUrls: ['./rental-edit-exchange.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatSnackBarModule,
    UploadOptionsComponent
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: FULL_DATE_FORMATS
    }
  ]
})
export class RentalEditExchangeComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private resizeHandler = this.detectDevice.bind(this);

  // State flags
  rentalLoaded = false;
  loadedRentalId = '';
  driverStepVisible = false;
  isMobile = false;
  canCalculate = false;
  showAdditionalFees = false;
  showDiscount = false;
  noVehiclesForGroup = false;

  // Search
  searchForm!: FormGroup;
  searchResultColumns: string[] = ['rentalId', 'firstName', 'lastName', 'carGroup', 'mva', 'checkoutDate', 'checkinDate', 'status', 'grossAmount'];
  searchDataSource = new MatTableDataSource<RentalSearchResult>();

  // Forms
  pricingFormGroup!: FormGroup;
  customerFormGroup!: FormGroup;
  driverFormGroup!: FormGroup;
  carInformationFormGroup!: FormGroup;
  paymentFormGroup!: FormGroup;
  additionalDriverForms: FormGroup[] = [];

  // Date/time controls (standalone)
  checkoutDateControl = new FormControl();
  checkoutTimeControl = new FormControl();
  checkinDateControl = new FormControl();
  checkinTimeControl = new FormControl();
  checkoutDatetime = new FormControl();
  checkinDatetime = new FormControl();

  // Exchange
  carLeftLot: 'yes' | 'no' | null = null;
  currentCarForm!: FormGroup;
  newCarForm!: FormGroup;
  inspectionForm!: FormGroup;

  // Dynamic data
  fees: Fee[] = [];
  vehicles: Vehicle[] = [];
  countries = COUNTRIES;

  // Dropdown options derived from search results
  carGroupOptions: string[] = [];
  statusOptions: string[] = [];

  // File uploads
  fileMap: { [key: string]: File } = {};

  get additionalFeesOnly(): Fee[] {
    return (this.fees || []).filter(f => f.feeCategory === 'Additional');
  }

  get carGroupFeesOnly(): Fee[] {
    return (this.fees || []).filter(f => f.feeCategory === 'Car Group');
  }

  get insuranceFeesOnly(): Fee[] {
    return (this.fees || []).filter(f => f.feeCategory === 'Insurance');
  }

  get additionalFees(): FormArray {
    return this.pricingFormGroup.get('additionalFees') as FormArray;
  }

  get expiryDateControl(): FormControl {
    return this.paymentFormGroup.get('expiryDate') as FormControl;
  }

  get initialExpiryMoment(): Moment {
    const val = this.expiryDateControl.value;
    return val ? moment(val) : moment();
  }

  constructor(
    private fb: FormBuilder,
    private priceService: PriceService,
    private snackBar: MatSnackBar,
    private feeService: FeeService,
    private vehicleService: VehicleService,
    private rentalService: RentalService
  ) {}

  ngOnInit() {
    this.initSearchForm();
    this.initPricingForm();
    this.initCustomerForm();
    this.initDriverForm();
    this.initCarInformationForm();
    this.initPaymentForm();
    this.initExchangeForms();

    this.detectDevice();
    window.addEventListener('resize', this.resizeHandler);

    // Driver same as renter toggle
    this.customerFormGroup.get('driverSameAsRenter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.driverStepVisible = value === 'no';
        this.driverFormGroup.reset();
      });

    // Sync carGroup to car information step
    this.pricingFormGroup.get('carGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value) {
          this.carInformationFormGroup.get('carGroup')?.setValue(value, { emitEvent: false });
          this.fetchVehiclesByGroup(value);
        }
      });

    // Fill car details when MVA selected
    this.carInformationFormGroup.get('mva')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(mva => {
        const v = this.vehicles.find(v => v.mva === mva);
        if (v) {
          this.carInformationFormGroup.patchValue({
            licensePlate: v.licensePlate,
            fuel: v.fuel,
            carModel: v.model,
            mileage: v.mileage,
            color: v.color,
            status: v.status,
            transmission: v.transmission
          });
        }
      });

    // Enable calculate button on relevant changes
    merge(
      this.checkoutDateControl.valueChanges,
      this.checkoutTimeControl.valueChanges,
      this.checkinDateControl.valueChanges,
      this.checkinTimeControl.valueChanges,
      this.pricingFormGroup.get('carGroup')!.valueChanges,
      this.pricingFormGroup.get('discountPercentage')!.valueChanges,
      this.pricingFormGroup.get('discountReason')!.valueChanges,
      this.pricingFormGroup.get('discountAppliedBy')!.valueChanges,
      this.additionalFees.valueChanges
    ).pipe(takeUntil(this.destroy$)).subscribe(() => this.canCalculate = true);

    // Auto-calculate checkoutGrossAmount
    merge(
      this.pricingFormGroup.get('grossAmount')!.valueChanges,
      this.paymentFormGroup.get('amountOnHold')!.valueChanges
    ).pipe(takeUntil(this.destroy$)).subscribe(() => this.updateCheckoutGrossAmount());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeHandler);
  }

  // ─── Form Initialization ───────────────────────────────────────────

  private initSearchForm() {
    this.searchForm = this.fb.group({
      rentalId: [''],
      firstName: [''],
      lastName: [''],
      mva: [''],
      carGroup: [''],
      status: [''],
      checkoutDateFrom: [''],
      checkoutDateTo: ['']
    });
  }

  private initPricingForm() {
    this.pricingFormGroup = this.fb.group({
      carGroup: [''],
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
  }

  private initCustomerForm() {
    this.customerFormGroup = this.fb.group({
      academicTitle: [''],
      firstName: [''],
      lastName: [''],
      dob: [''],
      phone: [''],
      email: ['', [Validators.email]],
      addressline1: [''],
      addressline2: [''],
      postalCode: [''],
      country: [''],
      city: [''],
      sameBillingAddress: ['yes'],
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
  }

  private initDriverForm() {
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
      country: [''],
      city: ['']
    });
  }

  private initCarInformationForm() {
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
  }

  private initPaymentForm() {
    this.paymentFormGroup = this.fb.group({
      cardType: [''],
      cardNumber: [''],
      nameOnCard: [''],
      expiryDate: new FormControl(null),
      cvv: ['', [Validators.maxLength(4), Validators.pattern(/^\d{0,4}$/)]],
      amountOnHold: [300],
      checkoutGrossAmount: new FormControl({ value: '', disabled: true }),
      paymentDate: [''],
      paymentStatus: [''],
      authorizationCode: [''],
    });
  }

  private initExchangeForms() {
    this.currentCarForm = this.fb.group({
      mva: [''],
      plate: [''],
      model: [''],
      status: [''],
      mileage: [''],
      checkOut: ['']
    });
    this.newCarForm = this.fb.group({
      mva: [''],
      year: [''],
      model: [''],
      color: [''],
      mileage: [''],
      fuel: [''],
      plate: [''],
      status: ['']
    });
    this.inspectionForm = this.fb.group({
      kmIn: [''],
      purchaseFuel: [''],
      fuelIn: [''],
      adjustments: [''],
      damages: [''],
      accident: [''],
      other: [''],
      reason: [''],
      amount: [''],
      oneWay: ['no'],
      misc: [''],
      miscFee: ['']
    });
  }

  // ─── Search ────────────────────────────────────────────────────────

  searchRentals() {
    const formVal = this.searchForm.value;
    const params: RentalSearchParams = {};
    if (formVal.rentalId) params.rentalId = formVal.rentalId;
    if (formVal.firstName) params.firstName = formVal.firstName;
    if (formVal.lastName) params.lastName = formVal.lastName;
    if (formVal.mva) params.mva = formVal.mva;
    if (formVal.carGroup) params.carGroup = formVal.carGroup;
    if (formVal.status) params.status = formVal.status;
    if (formVal.checkoutDateFrom) {
      params.checkoutDateFrom = new Date(formVal.checkoutDateFrom).toISOString();
    }
    if (formVal.checkoutDateTo) {
      params.checkoutDateTo = new Date(formVal.checkoutDateTo).toISOString();
    }

    this.rentalService.searchRentals(params).subscribe({
      next: (results) => {
        this.searchDataSource.data = results;
        this.searchDataSource.paginator = this.paginator;
        this.searchDataSource.sort = this.sort;
        this.carGroupOptions = [...new Set(results.map(r => r.carGroup).filter(Boolean))].sort();
        this.statusOptions = [...new Set(results.map(r => r.status).filter(Boolean))].sort();
        if (results.length === 0) {
          this.snackBar.open('No rentals found.', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open('Search failed: ' + (err.error?.message || err.message), 'Close', { duration: 5000 });
      }
    });
  }

  selectRental(row: RentalSearchResult) {
    this.rentalService.getRentalById(row.rentalId).subscribe({
      next: (detail) => {
        this.populateFromRentalDetail(detail);
        this.rentalLoaded = true;
        this.loadedRentalId = detail.rentalId;
        this.snackBar.open('Rental loaded successfully!', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        // Move to next step
        this.stepper.next();
      },
      error: (err) => {
        this.snackBar.open('Failed to load rental: ' + (err.error?.message || err.message), 'Close', { duration: 5000 });
      }
    });
  }

  // ─── Populate Forms from Rental Detail ─────────────────────────────

  private populateFromRentalDetail(detail: RentalDetail) {
    const pricing = detail.checkoutPricingRecord;
    const customer = detail.customerRecord;
    const payment = detail.paymentRecord;

    // Dates
    if (pricing.checkoutDate) {
      const coDate = new Date(pricing.checkoutDate);
      this.checkoutDateControl.setValue(coDate);
      this.checkoutTimeControl.setValue(
        coDate.getHours().toString().padStart(2, '0') + ':' + coDate.getMinutes().toString().padStart(2, '0')
      );
    }
    if (pricing.expectedCheckinDate) {
      const ciDate = new Date(pricing.expectedCheckinDate);
      this.checkinDateControl.setValue(ciDate);
      this.checkinTimeControl.setValue(
        ciDate.getHours().toString().padStart(2, '0') + ':' + ciDate.getMinutes().toString().padStart(2, '0')
      );
    }

    // Pricing
    this.pricingFormGroup.patchValue({
      carGroup: pricing.carGroupName,
      netAmount: pricing.targetSalePrice || '',
      grossAmount: pricing.grossListSalePrice || ''
    });

    // Load fees for the dates
    if (pricing.checkoutDate && pricing.expectedCheckinDate) {
      this.feeService.getAllFeesByInterval(pricing.checkoutDate, pricing.expectedCheckinDate).subscribe({
        next: (fees) => { this.fees = fees; },
        error: () => { this.fees = []; }
      });
    }

    // Load vehicles for the car group
    if (pricing.carGroupName) {
      this.fetchVehiclesByGroup(pricing.carGroupName);
    }

    // Additional fees
    this.additionalFees.clear();
    if (pricing.additionalFees) {
      this.showAdditionalFees = pricing.additionalFees.length > 0;
      for (const fee of pricing.additionalFees) {
        const feeGroup = this.fb.group({
          feeType: [fee.name],
          price: new FormControl({ value: fee.amount, disabled: true }),
          kmCount: [''],
          airportName: [''],
          feeDuration: [''],
          maxAmount: new FormControl({ value: fee.amountMax, disabled: true }),
        });
        this.additionalFees.push(feeGroup);
      }
    }

    // Discount
    if (pricing.discount) {
      this.showDiscount = true;
      this.pricingFormGroup.patchValue({
        discountPercentage: pricing.discount.percentage,
        discountReason: pricing.discount.reason,
        discountAppliedBy: pricing.discount.user
      });
    }

    // Customer
    const person = customer.personRecord;
    const addr = person.addressRecord;
    this.customerFormGroup.patchValue({
      academicTitle: person.academicTitle || '',
      firstName: person.firstName,
      lastName: person.lastName,
      dob: person.dob ? new Date(person.dob) : '',
      phone: person.phone,
      email: person.email,
      addressline1: addr.addressline1 || (addr as any).street || '',
      addressline2: addr.addressline2 || '',
      postalCode: addr.postalCode || (addr as any).zip || '',
      country: addr.country || '',
      city: addr.city || '',
      idType: person.idType,
      idNumber: person.idNumber,
      idExpiry: person.idExpiryDate ? new Date(person.idExpiryDate) : '',
      licenseNumber: customer.driverRecord.licenseNumber,
      licenseCountry: customer.driverRecord.licenseCountry,
      licenseIssued: customer.driverRecord.licenseIssued ? new Date(customer.driverRecord.licenseIssued) : '',
      licenseExpiry: customer.driverRecord.licenseExpiry ? new Date(customer.driverRecord.licenseExpiry) : '',
      customerNote: customer.customerNote,
      driverSameAsRenter: customer.driverSameAsRenter || 'yes'
    });

    // Billing address
    if (customer.billingAddressRecord) {
      const billing = customer.billingAddressRecord;
      const isSame = JSON.stringify(addr) === JSON.stringify(billing);
      this.customerFormGroup.patchValue({
        sameBillingAddress: isSame ? 'yes' : 'no',
        billingCompanyName: billing.companyName || '',
        billingAddressline1: billing.addressline1 || (billing as any).street || '',
        billingPostalCode: billing.postalCode || (billing as any).zip || '',
        billingCountry: billing.country || '',
        billingCity: billing.city || ''
      });
    }

    // Additional drivers
    this.additionalDriverForms = [];
    for (const ad of detail.additionalDriverRecords) {
      const form = this.fb.group({
        academicTitle: [ad.personRecord.academicTitle || ''],
        firstName: [ad.personRecord.firstName],
        lastName: [ad.personRecord.lastName],
        dob: [ad.personRecord.dob ? new Date(ad.personRecord.dob) : ''],
        phone: [ad.personRecord.phone],
        email: [ad.personRecord.email || ''],
        addressline1: [ad.personRecord.addressRecord?.addressline1 || ''],
        postalCode: [ad.personRecord.addressRecord?.postalCode || ''],
        city: [ad.personRecord.addressRecord?.city || ''],
        country: [ad.personRecord.addressRecord?.country || ''],
        idType: [ad.personRecord.idType || ''],
        idNumber: [ad.personRecord.idNumber || ''],
        licenseNumber: [ad.driverRecord.licenseNumber || ''],
        licenseCountry: [ad.driverRecord.licenseCountry || ''],
        licenseExpiry: [ad.driverRecord.licenseExpiry ? new Date(ad.driverRecord.licenseExpiry) : ''],
      });
      this.additionalDriverForms.push(form);
    }

    // Car information
    this.carInformationFormGroup.patchValue({ mva: detail.mva });

    // Current car form (for exchange)
    this.currentCarForm.patchValue({
      mva: detail.mva,
      plate: this.carInformationFormGroup.get('licensePlate')?.value || '',
      model: this.carInformationFormGroup.get('carModel')?.value || '',
      status: this.carInformationFormGroup.get('status')?.value || '',
      mileage: this.carInformationFormGroup.get('mileage')?.value || ''
    });

    // Payment
    this.paymentFormGroup.patchValue({
      cardType: payment.cardType,
      cardNumber: payment.cardNumber,
      nameOnCard: payment.nameOnCard,
      cvv: payment.cvv,
      amountOnHold: payment.amountOnHold,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : '',
      paymentStatus: payment.paymentStatus,
      authorizationCode: payment.authorizationCode
    });
    if (payment.expiryDate) {
      const [mm, yy] = payment.expiryDate.split('/');
      if (mm && yy) {
        this.expiryDateControl.setValue(new Date(2000 + +yy, +mm - 1, 1));
      }
    }

    this.updateCheckoutGrossAmount();
    this.canCalculate = false;
  }

  // ─── Price Calculation ─────────────────────────────────────────────

  calculatePrice() {
    const checkOutDate = this.checkoutDateControl.value;
    const checkOutTime = this.checkoutTimeControl.value;
    const checkInDate = this.checkinDateControl.value;
    const checkInTime = this.checkinTimeControl.value;
    const carGroup = this.pricingFormGroup.get('carGroup')?.value;

    if (!checkOutDate || !checkOutTime || !checkInDate || !checkInTime || !carGroup) {
      this.snackBar.open('Please fill out all date and car group fields before calculating price.', 'Close', { duration: 3000 });
      return;
    }

    const checkOutDateTime = new Date(checkOutDate);
    const [coHour, coMin] = checkOutTime.split(':');
    checkOutDateTime.setHours(+coHour, +coMin);

    const checkInDateTime = new Date(checkInDate);
    const [ciHour, ciMin] = checkInTime.split(':');
    checkInDateTime.setHours(+ciHour, +ciMin);

    const additionalFees: AdditionalFee[] = this.buildAdditionalFees();

    let discount: Discount | undefined = undefined;
    if (this.showDiscount) {
      discount = {
        percentage: this.pricingFormGroup.get('discountPercentage')?.value || '',
        reason: this.pricingFormGroup.get('discountReason')?.value || '',
        user: this.pricingFormGroup.get('discountAppliedBy')?.value || ''
      };
    }

    const payload: PriceRequest = {
      carGroupName: carGroup,
      checkoutDate: checkOutDateTime.toISOString(),
      expectedCheckinDate: checkInDateTime.toISOString(),
      additionalFees: additionalFees.length > 0 ? additionalFees : undefined,
      discount: discount
    };

    this.priceService.calculatePrice(payload).subscribe({
      next: (data) => {
        this.pricingFormGroup.patchValue({
          netAmount: data.netPrice,
          grossAmount: data.grossPrice,
          tax: data.taxRate * 100
        });
        this.updateCheckoutGrossAmount();
        this.canCalculate = false;
      },
      error: (error) => {
        this.snackBar.open('Error calculating price: ' + error.message, 'Close', { duration: 3000 });
        this.canCalculate = false;
      }
    });
  }

  private updateCheckoutGrossAmount(): void {
    const gross = parseFloat(this.pricingFormGroup.get('grossAmount')?.value) || 0;
    const hold = parseFloat(this.paymentFormGroup.get('amountOnHold')?.value) || 0;
    this.paymentFormGroup.get('checkoutGrossAmount')?.setValue((gross + hold).toFixed(2));
  }

  buildAdditionalFees(): AdditionalFee[] {
    return this.additionalFees.controls.map(fee => ({
      name: fee.get('feeType')?.value || '',
      amount: fee.get('price')?.value || '',
      amountMax: fee.get('maxAmount')?.value || ''
    }));
  }

  // ─── Save (Update Rental) ─────────────────────────────────────────

  async save() {
    const payload = await this.buildCheckoutPayload();

    if (!payload) {
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.rentalService.updateRental(this.loadedRentalId, payload).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Rental updated successfully!', 'Close', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      },
      error: (err) => {
        this.snackBar.open('Failed to update rental: ' + (err.error?.message || err.message), 'Close', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      }
    });
  }

  async buildCheckoutPayload(): Promise<CheckoutPayload | null> {
    const checkOutDate = this.checkoutDateControl.value;
    const checkOutTime = this.checkoutTimeControl.value;
    const checkInDate = this.checkinDateControl.value;
    const checkInTime = this.checkinTimeControl.value;

    if (!checkOutDate || !checkOutTime || !checkInDate || !checkInTime) {
      return null;
    }

    const checkOutDateTime = new Date(checkOutDate);
    const [coHour, coMin] = checkOutTime.split(':');
    checkOutDateTime.setHours(+coHour, +coMin);

    const checkInDateTime = new Date(checkInDate);
    const [ciHour, ciMin] = checkInTime.split(':');
    checkInDateTime.setHours(+ciHour, +ciMin);

    const pricingRecord: CheckoutPricingRecord = {
      checkoutDate: checkOutDateTime.toISOString(),
      expectedCheckinDate: checkInDateTime.toISOString(),
      carGroupName: this.pricingFormGroup.get('carGroup')?.value || '',
      targetSalePrice: this.pricingFormGroup.get('netAmount')?.value?.toString() || null,
      grossListSalePrice: this.pricingFormGroup.get('grossAmount')?.value?.toString() || null,
      additionalFees: this.buildAdditionalFeesForPayload(),
      discount: this.buildDiscountRecord()
    };

    const customerRecord = await this.buildCustomerRecord();
    const additionalDriverRecords = await this.buildAdditionalDriverRecords();
    const paymentRecord = this.buildPaymentRecord();
    const mva = this.carInformationFormGroup.get('mva')?.value || '';

    return {
      checkoutPricingRecord: pricingRecord,
      customerRecord,
      additionalDriverRecords,
      mva,
      paymentRecord
    };
  }

  buildAdditionalFeesForPayload(): AdditionalFeeRecord[] | null {
    const fees = this.additionalFees.controls.map(fee => ({
      name: fee.get('feeType')?.value || '',
      amount: fee.get('price')?.value?.toString() || '',
      amountMax: fee.get('maxAmount')?.value?.toString() || ''
    }));
    return fees.length > 0 ? fees : null;
  }

  buildDiscountRecord(): DiscountRecord | null {
    if (!this.showDiscount) return null;
    const percentage = this.pricingFormGroup.get('discountPercentage')?.value;
    const reason = this.pricingFormGroup.get('discountReason')?.value;
    const user = this.pricingFormGroup.get('discountAppliedBy')?.value;
    if (!percentage && !reason && !user) return null;
    return { percentage: percentage?.toString() || '', reason: reason || '', user: user || '' };
  }

  async buildCustomerRecord(): Promise<CustomerRecord> {
    const c = this.customerFormGroup.value;

    const addressRecord: AddressRecord = {
      companyName: c.companyName || '',
      addressline1: c.addressline1 || '',
      postalCode: c.postalCode || '',
      city: c.city || '',
      country: c.country || ''
    };

    const personRecord: PersonRecord = {
      academicTitle: c.academicTitle || '',
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      dob: c.dob ? this.formatDate(c.dob) : '',
      phone: c.phone || '',
      email: c.email || '',
      addressRecord,
      idType: c.idType || '',
      idNumber: c.idNumber || '',
      idExpiryDate: c.idExpiry ? this.formatDate(c.idExpiry) : '',
      idImageBase64: this.fileMap['customer-id'] ? await this.fileToBase64(this.fileMap['customer-id']) : ''
    };

    const driverRecord: DriverRecord = {
      licenseNumber: c.licenseNumber || '',
      licenseCountry: c.licenseCountry || '',
      licenseIssued: c.licenseIssued ? this.formatDate(c.licenseIssued) : '',
      licenseExpiry: c.licenseExpiry ? this.formatDate(c.licenseExpiry) : '',
      licenseImageBase64: this.fileMap['driver-license'] ? await this.fileToBase64(this.fileMap['driver-license']) : ''
    };

    const billingAddressRecord: AddressRecord = c.sameBillingAddress === 'yes'
      ? { ...addressRecord }
      : {
          companyName: c.billingCompanyName || '',
          addressline1: c.billingAddressline1 || '',
          postalCode: c.billingPostalCode || '',
          country: c.billingCountry || '',
          city: c.billingCity || ''
        };

    return {
      driverRecord,
      personRecord,
      billingAddressRecord,
      customerNote: c.customerNote || '',
      driverSameAsRenter: c.driverSameAsRenter || 'yes'
    };
  }

  async buildAdditionalDriverRecords(): Promise<AdditionalDriverRecord[]> {
    return Promise.all(this.additionalDriverForms.map(async (form, index) => {
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
        addressRecord,
        idType: d.idType || '',
        idNumber: d.idNumber || '',
        idExpiryDate: '',
        idImageBase64: this.fileMap[`additional-driver-${index + 1}-id`] ? await this.fileToBase64(this.fileMap[`additional-driver-${index + 1}-id`]) : ''
      };
      const driverRecord: DriverRecord = {
        licenseNumber: d.licenseNumber || '',
        licenseCountry: d.licenseCountry || '',
        licenseIssued: '',
        licenseExpiry: d.licenseExpiry ? this.formatDate(d.licenseExpiry) : '',
        licenseImageBase64: this.fileMap[`additional-driver-${index + 1}-license`] ? await this.fileToBase64(this.fileMap[`additional-driver-${index + 1}-license`]) : ''
      };
      return { driverRecord, personRecord, customerNote: '' };
    }));
  }

  buildPaymentRecord(): PaymentRecord {
    const p = this.paymentFormGroup.value;
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

  // ─── Fees & Drivers ────────────────────────────────────────────────

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
      city: [''],
      country: [''],
      idType: [''],
      idNumber: [''],
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
      feeDuration: [''],
      maxAmount: new FormControl({ value: '', disabled: true }),
    });

    feeGroup.get('feeType')?.valueChanges.subscribe((value: string) => {
      const normalized = (value || '').replace(/\s+/g, '').toLowerCase();
      if (normalized === 'additionaldriver') {
        if (this.additionalDriverForms.length < 3) {
          this.addAdditionalDriverForm();
        } else {
          this.snackBar.open('Maximum of 3 additional drivers allowed.', 'Close', { duration: 3000 });
          feeGroup.get('feeType')?.reset();
        }
      } else {
        feeGroup.get('kmCount')?.reset();
        feeGroup.get('airportName')?.reset();
      }
    });

    this.additionalFees.push(feeGroup);
  }

  removeAdditionalFee(index: number) {
    this.additionalFees.removeAt(index);
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

  onFeeTypeChange(selectedName: string, index: number) {
    const fee = this.fees.find(f => f.feeName === selectedName);
    if (fee) {
      const group = this.additionalFees.at(index);
      group.patchValue({
        price: fee.amountAtCheckout,
        maxAmount: fee.maxAmount
      });
    }
  }

  formatFeeName(name: string): string {
    if (!name) return '';
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  // ─── Date Helpers ──────────────────────────────────────────────────

  updateActualCheckOut() {
    const date = this.checkoutDateControl.value;
    const time = this.checkoutTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours, +minutes);
      this.checkoutDatetime.setValue(combined);
    }
  }

  updateActualCheckIn() {
    const date = this.checkinDateControl.value;
    const time = this.checkinTimeControl.value;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combined = new Date(date);
      combined.setHours(+hours, +minutes);
      this.checkinDatetime.setValue(combined);
    }
  }

  // ─── Utility ───────────────────────────────────────────────────────

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

  calculateAge(dob: string | Date | null): number | '' {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  isIdExpired(): boolean {
    const expiry = this.customerFormGroup.get('idExpiry')?.value;
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  }

  isLicenseRecent(): 'warning' | 'ok' | '' {
    const issued = this.customerFormGroup.get('licenseIssued')?.value;
    if (!issued) return '';
    const issuedDate = new Date(issued);
    const today = new Date();
    const diffInMonths = (today.getFullYear() - issuedDate.getFullYear()) * 12 + today.getMonth() - issuedDate.getMonth();
    if (diffInMonths < 3) return 'warning';
    if (diffInMonths >= 6) return 'ok';
    return '';
  }

  showYoungDriverNotice(): boolean {
    const dob = this.customerFormGroup.get('dob')?.value;
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    return age >= 18 && age <= 21;
  }

  selectExpiryMonth(month: Moment, datepicker: MatDatepicker<Moment>) {
    const date = month.startOf('month').toDate();
    this.expiryDateControl.setValue(date);
    datepicker.close();
  }

  onFileSelected(event: Event, key: string) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      this.fileMap[key] = file;
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  getExtrasTotal(): number {
    const fees = this.buildAdditionalFees();
    if (!fees || fees.length === 0) return 0;
    return fees.reduce((sum, fee) => {
      const n = Number(fee.amount);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }

  fetchVehiclesByGroup(carGroup: string) {
    this.vehicleService.getVehiclesByGroup(carGroup).subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.noVehiclesForGroup = false;
        const mvaControl = this.carInformationFormGroup.get('mva');
        if (mvaControl && !vehicles.some(v => v.mva === mvaControl.value)) {
          mvaControl.setValue('');
        }
      },
      error: (err) => {
        this.vehicles = [];
        this.noVehiclesForGroup = err.status === 404;
      }
    });
  }

  // ─── Exchange ──────────────────────────────────────────────────────

  setCarLeftLot(answer: 'yes' | 'no') {
    this.carLeftLot = answer;
  }

  submitExchange() {
    const payload = {
      carLeftLot: this.carLeftLot,
      currentCar: this.currentCarForm.value,
      newCar: this.newCarForm.value,
      inspection: this.carLeftLot === 'yes' ? this.inspectionForm.value : null
    };

    // TODO: Wire to backend exchange endpoint when available
    console.log('Exchange submitted:', payload);

    this.snackBar.open('Exchange completed successfully!', 'Close', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });

    this.carLeftLot = null;
    this.newCarForm.reset();
    this.inspectionForm.reset();
  }
}
