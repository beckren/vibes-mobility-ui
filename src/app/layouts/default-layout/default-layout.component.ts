import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { DefaultHeaderComponent } from '../default-header/default-header.component';
import { RouterModule } from '@angular/router';
import { BackButtonComponent } from '../../components/back-button.component';
import { ViewChild, ElementRef, HostListener } from '@angular/core';
import { AuthenticationService } from '../../components/_common/_service/authentication.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  permission?: string;
}

@Component({
  selector: 'app-default-layout',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    DefaultHeaderComponent,
    BackButtonComponent,
  ],
})
export class DefaultLayoutComponent {
  isExpanded = false;

  menuItems: MenuItem[] = [
    { label: 'Manifest', route: '/manifest-menu', icon: 'schedule' },
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Check Out', route: '/check-out', icon: 'call_missed_outgoing' },
    {
      label: 'Internal Check Out',
      route: '/internal-checkout',
      icon: 'call_made',
    },
    {label:'Display Rental', route: '/rental-edit-exchange', icon:'edit'},
    { label: 'Check In', route: '/check-in', icon: 'check_circle_outline' },
    { label: 'Cars', icon: 'directions_car', route: '/vehicles' },
    { label: 'Users', route: '/users-table', icon: 'group', permission: 'READ_USER' },
    { label: 'Update Fees', route: '/update-fees', icon: 'attach_money' },
    { label: 'Help', route: '/help-page', icon: 'help_outline' },
  ];

  get visibleMenuItems(): MenuItem[] {
    return this.menuItems.filter(
      (item) => !item.permission || this.authenticationService.hasPermission(item.permission)
    );
  }
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;
  @ViewChild('sidenav', { read: ElementRef }) sidenavRef!: ElementRef;
  @ViewChild('header', { read: ElementRef }) headerRef!: ElementRef;

  constructor(public router: Router, private cdr: ChangeDetectorRef, private authenticationService: AuthenticationService) {
    console.log('✅ DefaultLayoutComponent Loaded');
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    setTimeout(() => {
      const clickedInsideSidenav = this.sidenavRef?.nativeElement.contains(
        event.target
      );
      const clickedInsideHeader = this.headerRef?.nativeElement.contains(
        event.target
      );

      if (!clickedInsideSidenav && !clickedInsideHeader && this.isExpanded) {
        this.isExpanded = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSidenav() {
    this.isExpanded = !this.isExpanded;
  }

  navigate(route: string) {
    this.router.navigate([route]);
    this.isExpanded = false; // collapse the sidebar
    this.cdr.detectChanges(); // update the view

  }

}
