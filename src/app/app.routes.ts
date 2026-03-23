import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './components/_common/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Login',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
    title: 'Forgot Password',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
    title: 'Reset Password',
  },

  {
    path: '',
    loadComponent: () =>
      import('./layouts/default-layout/default-layout.component').then(
        (m) => m.DefaultLayoutComponent
      ),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dash/dash.component').then(
            (m) => m.DashComponent
          ),
        title: 'Dashboard',
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./components/vehicles-table/vehicles-table.component').then(
            (m) => m.VehiclesTableComponent
          ),
        title: 'Vehicles',
      },
      {
        path: 'edit-vehicle/:id',
        loadComponent: () =>
          import('./components/edit-vehicle/edit-vehicle.component').then(
            (m) => m.EditVehicleComponent
          ),
        title: 'Edit Vehicle',
      },
      {
        path: 'add-vehicle',
        loadComponent: () =>
          import('./components/add-vehicle/add-vehicle.component').then(
            (m) => m.AddVehicleComponent
          ),
        title: 'Add Vehicle',
      },
      {
        path: 'vehicle-registration',
        loadComponent: () =>
          import(
            './components/vehicle-registration/vehicle-registration.component'
          ).then((m) => m.VehicleRegistrationComponent),
        title: 'Vehicle Registration',
      },
      {
        path: 'vehicle-rental-history',
        loadComponent: () =>
          import(
            './components/vehicle-rental-history/vehicle-rental-history.component'
          ).then((m) => m.VehicleRentalHistoryComponent),
        title: 'Vehicle Rental History',
      },
      {
        path: 'vehicle-maintenance-history',
        loadComponent: () =>
          import(
            './components/vehicle-maintenance-history/vehicle-maintenance-history.component'
          ).then((m) => m.VehicleMaintenanceHistoryComponent),
        title: 'Vehicle Maintenance History',
      },
      {
        path: 'check-out',
        loadComponent: () =>
          import('./components/check-out/check-out.component').then(
            (m) => m.CheckOutComponent
          ),
        title: 'Check Out',
      },
      {
        path: 'check-in',
        loadComponent: () =>
          import('./components/check-in/check-in.component').then(
            (m) => m.CheckInComponent
          ),
        title: 'Check In',
      },
      {
        path: 'users-table',
        loadComponent: () =>
          import('./components/users-table/users-table.component').then(
            (m) => m.UsersTableComponent
          ),
        title: 'Users',
      },
      {
        path: 'add-users',
        loadComponent: () =>
          import('./components/add-user/add-user.component').then(
            (m) => m.AddUserComponent
          ),
        title: 'Add Users',
      },
      {
        path: 'rental-lists',
        loadComponent: () =>
          import('./components/rental-lists/rental-lists.component').then(
            (m) => m.RentalListsComponent
          ),
        title: 'Rental Lists',
      },
      {
        path: 'edit-user',
        loadComponent: () =>
          import('./components/edit-user/edit-user.component').then(
            (m) => m.EditUserComponent
          ),
        title: 'Edit User',
      },
      {
        path: 'user-profile',
        loadComponent: () =>
          import('./components/user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent
          ),
        title: 'User Profile',
      },
      {
        path: 'help-page',
        loadComponent: () =>
          import('./components/help-page/help-page.component').then(
            (m) => m.HelpPageComponent
          ),
        title: 'Help Page',
      },
      {
        path: 'available-vehicles',
        loadComponent: () =>
          import('./components/available-vehicles/available-vehicles.component').then(
            (m) => m.AvailableVehiclesComponent
          ),
        title: 'Available Vehicles',
      },
      {
        path: 'update-fees',
        loadComponent: () =>
          import('./components/update-fees/update-fees.component').then(
            (m) => m.UpdateFeesComponent
          ),
        title: 'Update Fees',
      },
      {
        path: 'new-upcoming-rental',
        loadComponent: () =>
          import('./components/new-upcoming-rental/new-upcoming-rental.component').then(
            (m) => m.NewUpcomingRentalComponent
          ),
        title: 'New Upcoming Rental',
      },
      {
        path: 'internal-checkout',
        loadComponent: () =>
          import('./components/internal-checkout/internal-checkout.component').then(
            (m) => m.InternalCheckoutComponent
          ),
        title: 'Internal Checkout',
      },
      {
        path: 'manifest-menu',
        loadComponent: () =>
          import('./components/manifest-menu/manifest-menu.component').then(
            (m) => m.ManifestMenuComponent
          ),
        title: 'Manifest Menu',
      },
      {
        path: 'sm-dashboard',
        loadComponent: () =>
          import('./components/sm-dashboard/sm-dashboard.component').then(
            (m) => m.SmDashboardComponent
          ),
        title: 'SM Dashboard',
      },
      {
        path: 'new-maintenance-info',
        loadComponent: () =>
          import('./components/new-maintenance-info/new-maintenance-info.component').then(
            (m) => m.NewMaintenanceInfoComponent
          ),
        title: 'Maintenance Information',
      },
      {
        path: 'car-status',
        loadComponent: () =>
          import('./components/car-status/car-status.component').then(
            (m) => m.CarStatusComponent
          ),
        title: 'Car Status',
      },
      {
        path: 'rental-edit-exchange', loadComponent: () =>
          import('./components/rental-edit-exchange/rental-edit-exchange.component').then(
            (m) => m.RentalEditExchangeComponent
          ),
        title: 'Rental Edit Exchange',
      },




    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
