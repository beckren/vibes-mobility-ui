import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDivider } from '@angular/material/divider';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';


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
    RouterModule
  ]

})
export class UserProfileComponent {

  userForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
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
      console.log('User data:', this.userForm.value);
      //  API 
    }
  }
  gotoFees(){
    this.router.navigate(['/update-fees']);
  }
}
