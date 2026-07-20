import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DamageDiagramData {
  markerX?: number;
  markerY?: number;
  imageUrls?: string[];
  part?: string;
  damageType?: string;
}

@Component({
  selector: 'app-damage-diagram-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './damage-diagram-dialog.component.html',
  styleUrls: ['./damage-diagram-dialog.component.scss'],
})
export class DamageDiagramDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DamageDiagramDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DamageDiagramData
  ) {}

  get hasMarker(): boolean {
    return this.data?.markerX != null && this.data?.markerY != null;
  }

  close() {
    this.dialogRef.close();
  }
}
