import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DamageService, DamageRecord } from '../_common/_service/damage.service';
import { DamageMarkerComponent } from '../damage-marker/damage-marker.component';
import { DamageDiagramDialogComponent } from '../damage-diagram-dialog/damage-diagram-dialog.component';

@Component({
  selector: 'app-vehicle-damage-history',
  templateUrl: './vehicle-damage-history.component.html',
  styleUrls: ['./vehicle-damage-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
  ],
})
export class VehicleDamageHistoryComponent implements OnInit {
  mva = '';
  damages: DamageRecord[] = [];
  displayedColumns = ['part', 'direction', 'damageType', 'severity', 'state', 'reportedAt', 'markers'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private damageService: DamageService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.mva = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.mva) {
      this.loadDamages();
    }
  }

  loadDamages() {
    this.damageService.getDamagesByVehicle(this.mva).subscribe({
      next: (damages) => { this.damages = damages; },
      error: (err) => console.error('Failed to load damage history', err),
    });
  }

  addDamage() {
    const dialogRef = this.dialog.open(DamageMarkerComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const payload: DamageRecord = {
        vehicleId: this.mva,
        part: result.part,
        direction: result.direction,
        damageType: result.damageType,
        severity: result.severity,
        state: result.state,
        licensePlate: result.licensePlate,
        markerX: result.markerX,
        markerY: result.markerY,
      };

      this.damageService.createDamage(payload).subscribe({
        next: (created) => {
          this.damages = [created, ...this.damages];
          if (result.files?.length > 0 && created.id) {
            this.damageService.uploadImages(created.id, result.files).subscribe();
          }
        },
        error: (err) => console.error('Failed to save damage', err),
      });
    });
  }

  goBack() {
    this.router.navigate(['/edit-vehicle', this.mva]);
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
}
