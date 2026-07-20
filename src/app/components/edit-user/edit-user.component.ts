import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User } from '../_common/_model/user';
import { UserService } from '../_common/_service/user.service';

@Component({
  selector: 'app-edit-user',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
})
export class EditUserComponent {
  usersForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.usersForm = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['']
    });

    const user = history.state?.user as User | undefined;
    if (user) {
      this.usersForm.patchValue({
        fname: user.firstname,
        lname: user.lastname,
        email: user.email,
        role: user.roles?.[0] ?? ''
      });
    }
  }

  saveUser() {
    if (this.usersForm.valid) {
      const formValue = this.usersForm.value;
      const user: User = {
        firstname: formValue.fname,
        lastname: formValue.lname,
        email: formValue.email,
        roles: [formValue.role]
      };

      this.userService.updateUser(user).subscribe({
        next: () => {
          this.snackBar.open('User updated successfully.', 'Close', { duration: 3000 });
          this.router.navigate(['/users-table']);
        },
        error: (error) => {
          this.snackBar.open('Error updating user.', 'Close', { duration: 5000 });
          console.error(error);
        }
      });
    } else {
      this.usersForm.markAllAsTouched();
    }
  }
}
