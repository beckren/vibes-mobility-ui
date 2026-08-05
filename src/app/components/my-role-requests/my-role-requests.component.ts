import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { RoleRequest, RoleRequestOptions, RoleRequestService } from '../_common/_service/role-request.service';
import { AlertService } from '../_common/_service/alert.service';

@Component({
  selector: 'app-my-role-requests',
  standalone: true,
  templateUrl: './my-role-requests.component.html',
  styleUrls: ['./my-role-requests.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDividerModule,
  ],
})
export class MyRoleRequestsComponent implements OnInit {
  options?: RoleRequestOptions;
  requests: RoleRequest[] = [];
  requestForm: FormGroup;
  displayedColumns = ['requestedRole', 'status', 'justification', 'createdAt', 'decision', 'actions'];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private roleRequestService: RoleRequestService,
    private alertService: AlertService
  ) {
    this.requestForm = this.fb.group({
      requestedRole: ['', Validators.required],
      justification: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadOptions();
    this.loadRequests();
  }

  private loadOptions(): void {
    this.roleRequestService.getOptions().subscribe({
      next: (options) => {
        this.options = options;
        if (options.requestableRoles.length === 1) {
          this.requestForm.patchValue({ requestedRole: options.requestableRoles[0] });
        }
      },
      error: () => this.alertService.error('Could not load requestable roles.'),
    });
  }

  loadRequests(): void {
    this.roleRequestService.getMine().subscribe({
      next: (requests) => (this.requests = requests),
      error: () => this.alertService.error('Could not load your role requests.'),
    });
  }

  submit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.roleRequestService.create(this.requestForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.alertService.success('Role request submitted.');
        this.requestForm.reset({ requestedRole: '', justification: '' });
        this.loadOptions();
        this.loadRequests();
      },
      error: (err) => {
        this.loading = false;
        this.alertService.error(err?.error ?? 'Could not submit the role request.');
      },
    });
  }

  cancel(request: RoleRequest): void {
    this.roleRequestService.cancel(request.roleRequestId).subscribe({
      next: () => {
        this.alertService.info('Role request cancelled.');
        this.loadOptions();
        this.loadRequests();
      },
      error: (err) => this.alertService.error(err?.error ?? 'Could not cancel the role request.'),
    });
  }

  get hasRequestableRoles(): boolean {
    return (this.options?.requestableRoles?.length ?? 0) > 0;
  }
}
