import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { RoleRequest, RoleRequestService } from '../_common/_service/role-request.service';
import { AlertService } from '../_common/_service/alert.service';

@Component({
  selector: 'app-role-request-approvals',
  standalone: true,
  templateUrl: './role-request-approvals.component.html',
  styleUrls: ['./role-request-approvals.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
})
export class RoleRequestApprovalsComponent implements OnInit {
  requests: RoleRequest[] = [];
  comments: Record<string, string> = {};
  processing: Record<string, boolean> = {};

  constructor(
    private roleRequestService: RoleRequestService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.roleRequestService.getDecidable().subscribe({
      next: (requests) => (this.requests = requests),
      error: () => this.alertService.error('Could not load role requests to decide.'),
    });
  }

  approve(request: RoleRequest): void {
    this.decide(request, true);
  }

  reject(request: RoleRequest): void {
    this.decide(request, false);
  }

  private decide(request: RoleRequest, approve: boolean): void {
    const id = request.roleRequestId;
    const comment = this.comments[id];
    this.processing[id] = true;
    const call = approve
      ? this.roleRequestService.approve(id, comment)
      : this.roleRequestService.reject(id, comment);
    call.subscribe({
      next: () => {
        this.processing[id] = false;
        this.alertService.success(
          approve
            ? 'Request approved. The role takes effect after the user renews their token.'
            : 'Request rejected.'
        );
        delete this.comments[id];
        this.loadRequests();
      },
      error: (err) => {
        this.processing[id] = false;
        this.alertService.error(err?.error ?? 'Could not process the decision.');
      },
    });
  }
}
