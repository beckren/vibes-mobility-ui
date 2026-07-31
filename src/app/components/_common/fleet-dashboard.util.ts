import { RentalSearchResult } from './_service/rental.service';
import { Vehicle } from './_service/vehicle.service';

export type FleetCategory =
  | 'On Hand'
  | 'Due In'
  | 'Res D/I'
  | 'Stn-Inv'
  | 'Veh-Rsvd'
  | 'Available';

export function toDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getManifestStatus(
  rental: RentalSearchResult,
  today = new Date()
): 'Upcoming' | 'Returning' | 'On Rent' | 'Closed' {
  if (rental.status !== 'Active') {
    return 'Closed';
  }

  const todayKey = toDateKey(today);
  const checkoutKey = toDateKey(rental.checkoutDate);
  const checkinKey = toDateKey(rental.checkinDate);

  if (checkoutKey > todayKey) {
    return 'Upcoming';
  }
  if (checkinKey <= todayKey) {
    return 'Returning';
  }
  return 'On Rent';
}

export function getVehiclesForCategory(
  category: FleetCategory,
  dateKey: string,
  rentals: RentalSearchResult[],
  vehicles: Vehicle[]
): Vehicle[] {
  const activeRentals = rentals.filter(rental => rental.status === 'Active');
  const rentalsOnDate = activeRentals.filter(rental =>
    toDateKey(rental.checkoutDate) <= dateKey &&
    toDateKey(rental.checkinDate) >= dateKey
  );

  let mvas: Set<string> | null = null;

  switch (category) {
    case 'Due In':
      mvas = new Set(
        activeRentals
          .filter(rental => toDateKey(rental.checkinDate) === dateKey)
          .map(rental => rental.mva)
      );
      break;
    case 'Res D/I':
      mvas = new Set(
        activeRentals
          .filter(rental => toDateKey(rental.checkoutDate) === dateKey)
          .map(rental => rental.mva)
      );
      break;
    case 'Veh-Rsvd':
      mvas = new Set(rentalsOnDate.map(rental => rental.mva));
      break;
    case 'Available': {
      const reservedMvas = new Set(rentalsOnDate.map(rental => rental.mva));
      return vehicles.filter(vehicle =>
        vehicle.status === 'Available' && !reservedMvas.has(vehicle.mva)
      );
    }
    case 'On Hand':
      return vehicles.filter(vehicle => vehicle.status !== 'On Rent');
    case 'Stn-Inv':
      return vehicles;
  }

  return vehicles.filter(vehicle => mvas?.has(vehicle.mva));
}
