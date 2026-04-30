import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FeeService } from '../../services/fee.service';

@Component({
  selector: 'app-update-fees',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './update-fees.component.html',
  styleUrls: ['./update-fees.component.scss'],
})
export class UpdateFeesComponent implements OnInit {
  allFees: any[] = [];
  feesDataSource = new MatTableDataSource<any>([]);
  displayedColumns = ['name', 'category', 'interval', 'amount', 'maxAmount', 'actions'];
  filterName = '';
  filterCategory = '';
  filterInterval = '';

  // Inline editing state
  editingKey: string | null = null;
  savingKey: string | null = null;
  editValues = { amount: 0, capAmount: 0 };

  feeKey(fee: any): string {
    return `${fee.name}|${fee.interval}`;
  }

  constructor(private router: Router, private feeService: FeeService) {}

  ngOnInit() {
    this.feeService.getAllFees().subscribe(fees => {
      if (!fees?.length) return;

      this.allFees = fees;
      this.feesDataSource.data = fees;
      this.feesDataSource.filterPredicate = (fee, filter) => {
        const f = JSON.parse(filter);
        return (!f.name || fee.name.toLowerCase().includes(f.name.toLowerCase()))
          && (!f.category || fee.category === f.category)
          && (!f.interval || fee.interval === f.interval);
      };
    });
  }

  applyFilters() {
    this.feesDataSource.filter = JSON.stringify({
      name: this.filterName,
      category: this.filterCategory,
      interval: this.filterInterval,
    });
  }

  startEdit(fee: any) {
    this.editingKey = this.feeKey(fee);
    this.editValues = {
      amount: fee.amount,
      capAmount: fee.capAmount,
    };
  }

  cancelEdit() {
    this.editingKey = null;
  }

  saveRow(fee: any) {
    this.savingKey = this.feeKey(fee);
    const payload = {
      name: fee.name,
      category: fee.category,
      interval: fee.interval,
      amount: this.editValues.amount,
      capAmount: this.editValues.capAmount,
      isRequired: fee.isRequired ?? false,
    };

    this.feeService.updateFee(payload).subscribe({
      next: () => {
        this.editingKey = null;
        this.savingKey = null;
        this.feeService.getAllFees().subscribe(fees => {
          if (fees?.length) {
            this.allFees = fees;
            this.feesDataSource.data = fees;
          }
        });
      },
      error: (err) => {
        this.savingKey = null;
        console.error(err);
        alert(err?.error?.message ?? 'Request failed.');
      },
    });
  }

  goback() {
    this.router.navigate(['/user-profile']);
  }
}
