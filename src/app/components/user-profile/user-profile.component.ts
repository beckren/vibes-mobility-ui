import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDivider } from '@angular/material/divider';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../_common/_model/user';
import { UserService } from '../_common/_service/user.service';
import { AuthenticationService } from '../_common/_service/authentication.service';


@Component({
  selector: 'app-user-profile',

  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDivider,
    MatCard,
    MatCardContent,
    RouterModule,
    MatSnackBarModule
  ]

})
export class UserProfileComponent {

  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authenticationService: AuthenticationService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }]
    });

    const currentUser = this.authenticationService.userValue;
    this.userForm.patchValue({
      fname: currentUser?.firstname ?? '',
      lname: currentUser?.lastname ?? '',
      email: currentUser?.email ?? this.getEmailFromToken(),
      role: (currentUser?.roles ?? []).join(', ')
    });
  }

  saveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.getRawValue();
      const user: User = {
        firstname: formValue.fname,
        lastname: formValue.lname,
        email: formValue.email,
        roles: this.authenticationService.userValue?.roles ?? []
      };

      this.userService.updateUser(user).subscribe({
        next: () => {
          this.snackBar.open('Profile updated successfully.', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error updating profile.', 'Close', { duration: 5000 });
          console.error(error);
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  manageAccount() {
    this.authenticationService.manageAccount();
  }

  gotoFees(){
    this.router.navigate(['/update-fees']);
  }

  private getEmailFromToken(): string {
    const token = this.authenticationService.getAccessToken();
    if (!token) return '';

    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload = JSON.parse(atob(padded));
      return payload.email ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? '';
    } catch {
      return '';
    }
  }
}
