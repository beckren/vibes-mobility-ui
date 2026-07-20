import { ChangeDetectorRef, Component, Input, Output, ViewChild, ElementRef, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../components/_common/_service/authentication.service';

@Component({
  selector: 'app-default-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './default-header.component.html',
  styleUrls: ['./default-header.component.scss'],
})
export class DefaultHeaderComponent implements AfterViewInit {
  @Input() sidenav!: any;
  @Output() sidebarToggle = new EventEmitter<void>();

  isSearchExpanded = false;

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('searchButton', { static: false }) searchButton!: ElementRef;

  constructor(private router: Router, private cdr: ChangeDetectorRef, private authenticationService: AuthenticationService) {}

  ngAfterViewInit() {
    if (this.searchButton) {
      this.searchButton.nativeElement.addEventListener('click', () => {
        console.log('🛠 Manual event binding works!');
        this.toggleSearch();
      });
    }
  }

  toggleSearch() {
    console.log('Search button clicked!');
    this.isSearchExpanded = !this.isSearchExpanded;
    this.cdr.detectChanges(); 
  }
  openUserProfile(){
    this.router.navigate(['/user-profile']);
  }
  closeSearch(event?: MouseEvent) {
    if (event) {
      const clickedInside = this.searchInput?.nativeElement.contains(event.target);
      if (clickedInside) return;
    }
    this.isSearchExpanded = false;
  }
  logout(){
    this.authenticationService.logout();
  }
  toggleSidebar() {
    this.sidebarToggle.emit();
  }
}
