import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../_common/_service/user.service';
import { User } from '../_common/_model/user';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ],
})
export class UsersTableComponent implements OnInit, AfterViewInit, OnDestroy {
  users$: Observable<User[]>; // Use the $ suffix to indicate it's an Observable
  errorMessage: string = '';
  users: User[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private router: Router, private userService: UserService) {
    this.users$ = this.userService.getUsers();
  }

  ngOnInit(): void {
    this.subscription.add(
      this.userService.getUsers().subscribe({
        next: (data) => {
          this.users = data;
          this.dataSource.data = this.users;
        },
        error: (error) => {
          this.errorMessage = 'Error fetching users';
          console.error(error);
        }
      })
    );
  }

  editUser(user: User) {
    this.router.navigate(['/edit-user'], { state: { user } });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<User>;
  dataSource = new MatTableDataSource<User>(); // Create a MatTableDataSource instance

  displayedColumns = ['firstname', 'lastname', 'email', 'roles', 'actions'];

  gotoNewUser() {
    this.router.navigate(['/add-users']);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // Unsubscribe to prevent memory leaks
  }
}
