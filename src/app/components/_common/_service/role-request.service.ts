// role-request.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export type RoleRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface RoleRequestOptions {
  currentRole: string;
  requestableRoles: string[];
}

export interface RoleRequest {
  roleRequestId: string;
  requesterName: string;
  requesterEmail: string;
  requestedRole: string;
  justification: string;
  status: RoleRequestStatus;
  decisionComment?: string | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  createdAt: string;
}

export interface CreateRoleRequest {
  requestedRole: string;
  justification: string;
}

@Injectable({ providedIn: 'root' })
export class RoleRequestService {
  private readonly baseUrl = `${environment.apiUrl}/role-request`;

  constructor(private http: HttpClient) {}

  getOptions(): Observable<RoleRequestOptions> {
    return this.http.get<RoleRequestOptions>(`${this.baseUrl}/options`);
  }

  getMine(): Observable<RoleRequest[]> {
    return this.http.get<RoleRequest[]>(`${this.baseUrl}/mine`);
  }

  getDecidable(): Observable<RoleRequest[]> {
    return this.http.get<RoleRequest[]>(this.baseUrl);
  }

  create(request: CreateRoleRequest): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(this.baseUrl, request);
  }

  approve(id: string, comment?: string): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(`${this.baseUrl}/${id}/approve`, { comment: comment ?? null });
  }

  reject(id: string, comment?: string): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(`${this.baseUrl}/${id}/reject`, { comment: comment ?? null });
  }

  cancel(id: string): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
