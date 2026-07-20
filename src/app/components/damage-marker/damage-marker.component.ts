import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { UploadOptionsComponent } from '../upload-options.component';

interface DamageMark {
  x: number;
  y: number;
}

@Component({
  selector: 'app-damage-marker',
  templateUrl: './damage-marker.component.html',
  styleUrls: ['./damage-marker.component.scss'],
  // ViewEncapsulation.None is required so the SCSS can theme the Material
  // dialog/overlay, which renders outside this component's DOM.
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class DamageMarkerComponent {
  damageForm: FormGroup;
  marker: DamageMark | null = null;
  uploadedFiles: File[] = [];

  constructor(
    public dialogRef: MatDialogRef<DamageMarkerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: unknown,
    private fb: FormBuilder
  ) {
    this.damageForm = this.fb.group({
      part: ['', Validators.required],
      direction: [''],
      damageType: ['', Validators.required],
      severity: [''],
      state: [''],
      licensePlate: ['']
    });
  }

  addMarker(event: MouseEvent) {
    const image = event.target as HTMLImageElement;
    if (!image || image.tagName !== 'IMG') return;

    const rect = image.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / image.clientWidth) * 100;
    let y = ((event.clientY - rect.top) / image.clientHeight) * 100;

    x = Math.min(Math.max(x, 0), 100);
    y = Math.min(Math.max(y, 0), 100);

    this.marker = { x, y };
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    this.uploadedFiles = input.files ? Array.from(input.files) : [];
  }

  removeMarker() {
    this.marker = null;
  }

  save() {
    if (this.damageForm.invalid) {
      this.damageForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      ...this.damageForm.value,
      markerX: this.marker?.x,
      markerY: this.marker?.y,
      files: this.uploadedFiles
    });
  }

  close() {
    this.dialogRef.close();
  }
}
