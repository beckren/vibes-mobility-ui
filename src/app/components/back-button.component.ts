import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-back-button',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    template: `
    <button *ngIf="showBackButton" (click)="goBack()" mat-button class="back-button">
      ← Back
    </button>
  `,
    styles: [`
    .back-button {
      margin: 10px;
      font-weight: bold;
      background-color: transparent;
      color: #b0b0b0 !important;
      border: none;
      font-size: 16px;
    }

    .back-button:hover {
      background-color: #333333 !important;
      color: #ffffff;
    }

    .back-button:focus {
      outline: none;
      box-shadow: none;
    }
  `]
})
export class BackButtonComponent {
    showBackButton = false;

    constructor(private location: Location, private router: Router) {
        this.router.events.subscribe(() => {
            this.showBackButton = this.shouldShowBackButton();
        });
    }

    goBack(): void {
        this.location.back();
    }

    private shouldShowBackButton(): boolean {
        const currentUrl = this.router.url;
        const baseRoutes = ['/', '/dashboard'];
        return !baseRoutes.includes(currentUrl);
    }
}
