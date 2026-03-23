import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FeeService } from '../../services/fee.service';

@Component({
  selector: 'app-update-fees',
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
    MatTableModule,
    RouterModule,
  ],
  templateUrl: './update-fees.component.html',
  styleUrls: ['./update-fees.component.scss'],
})
export class UpdateFeesComponent implements OnInit {
  updateFeesForm!: FormGroup;
  // Data for grouped select
  feeGroups = [
    {
      name: 'Car Group',
      options: [
        { value: 'groupA', viewValue: 'IDMR' },
        { value: 'groupB', viewValue: 'CDMR' },
      ]
    },
    {
      name: 'Additional Fees',
      options: [
        { value: 'insurance', viewValue: 'Insurance' },
        { value: 'crossBorder', viewValue: 'Cross Border' },
        { value: 'childSeat', viewValue: 'Child Seat' },
      ]
    }
  ];
  checkOutVisible = false;
  checkInVisible = false;

  toggleCheckOut() {
    this.checkOutVisible = !this.checkOutVisible;
  }

  toggleCheckIn() {
    this.checkInVisible = !this.checkInVisible;
  }

  allFees: any[] = []; // raw from API
  displayedColumns = ['name', 'categoryEnum', 'interval', 'currentAmount', 'maxAmount'];


  constructor(private fb: FormBuilder, private router: Router, private feeService: FeeService) { }



  ngOnInit() {
    this.updateFeesForm = this.fb.group({
      additionalFee: new FormControl(''),      // will hold the fee "name"
      additionalFeeType: new FormControl(''),  // Daily/Weekly/Weekend
      additionalFeeFrom: new FormControl(''),
      additionalFeeTo: new FormControl(''),
      maxAmount: new FormControl('')
    });

    this.feeService.getAllFees().subscribe(res => {
      const fees = res?.data;
      if (!fees?.length) return;

      this.allFees = fees;

      const carGroup = fees.filter(f => f.categoryEnum === 'CarGroup');
      const additional = fees.filter(f => f.categoryEnum === 'Additional');

      // Replace the whole array so Angular's change detection picks it up
      this.feeGroups = [
        {
          name: 'Car Group',
          options: carGroup.map(f => ({ value: f.name, viewValue: f.name }))
        },
        {
          name: 'Additional Fees',
          options: additional.map(f => ({ value: f.name, viewValue: f.name }))
        }
      ];
    });
  }

  goback() {
    this.router.navigate(['/user-profile']);
  }
  onSave() {
  const feeName = this.updateFeesForm.value.additionalFee;      // string
  const interval = this.updateFeesForm.value.additionalFeeType; // 'Daily'|'Weekly'|'Weekend'
  const changeFrom = this.updateFeesForm.value.additionalFeeFrom;
  const changeTo = this.updateFeesForm.value.additionalFeeTo;
  const maxAmount = this.updateFeesForm.value.maxAmount ?? '0';

  // Find the selected fee in the loaded list so we know its Category and (true) Interval
  const matched = this.allFees.find(f => f.name === feeName && f.interval === interval);
  if (!matched) {
    alert('Selected fee does not exist with that interval. Pick one from the list.');
    return;
  }

  const payload = [{
    name: feeName,
    category: matched.categoryEnum,  // 'Additional' or 'CarGroup'
    interval: matched.interval,      // 'Daily' | 'Weekly' | 'Weekend'
    changeFrom: String(changeFrom ?? ''), // backend parses decimal, send as string
    changeTo: String(changeTo ?? ''),
    maxAmount: String(maxAmount ?? '')
  }];

  this.feeService.updateFees(payload).subscribe({
    next: (res) => {
      if (res.isSuccess) {
        alert('Fees updated successfully!');
      } else {
        alert(res.errors ?? 'Update failed.');
      }
    },
    error: (err) => {
      // Common pitfalls: 401 (no token), 403 (missing permission), 400 (bad payload)
      console.error(err);
      alert(err?.error?.message ?? 'Request failed.');
    }
  });
}

}
