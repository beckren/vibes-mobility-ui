import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
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
    CommonModule
  ],
})
export class UsersTableComponent implements OnInit, AfterViewInit, OnDestroy {
  users$: Observable<User[]>; // Use the $ suffix to indicate it's an Observable
  errorMessage: string = '';
  users: User[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private userService: UserService) {
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<User>;
  dataSource = new MatTableDataSource<User>(); // Create a MatTableDataSource instance

  displayedColumns = ['firstname', 'lastname', 'email'];

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
