import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDivider } from '@angular/material/divider';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../_common/_service/user.service';
import { User } from '../_common/_model/user';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDivider,
    MatCard,
    MatCardContent,
    CommonModule
  ]
})
export class AddUserComponent {
  userForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {
    this.userForm = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  saveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const user: User = {
        firstname: formValue.fname,
        lastname: formValue.lname,
        password: formValue.password,
        email: formValue.email,
        roles: [formValue.role]
      };

      this.userService.createUser(user).subscribe({
        next: () => {
          this.router.navigate(['/users-table']);
        },
        error: (error) => {
          this.errorMessage = 'Error creating user';
          console.error(error);
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
