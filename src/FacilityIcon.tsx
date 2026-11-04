import { SignIn } from '@phosphor-icons/react/dist/csr/SignIn';
import { ForkKnife } from '@phosphor-icons/react/dist/csr/ForkKnife';
import { Wheelchair } from '@phosphor-icons/react/dist/csr/Wheelchair';
import { Elevator } from '@phosphor-icons/react/dist/csr/Elevator';
import { Stairs } from '@phosphor-icons/react/dist/csr/Stairs';
import { Armchair } from '@phosphor-icons/react/dist/csr/Armchair';
import { Bed } from '@phosphor-icons/react/dist/csr/Bed';
import { Users } from '@phosphor-icons/react/dist/csr/Users';
import { Barbell } from '@phosphor-icons/react/dist/csr/Barbell';
import { BellSimple } from '@phosphor-icons/react/dist/csr/BellSimple';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import type { MapNode } from './types';

const icons = {
  facility: MapPin,
  reception: BellSimple, entrance: SignIn, dining: ForkKnife, restroom: Wheelchair,
  stairs: Stairs, elevator: Elevator, lounge: Armchair, room: Bed,
  conference: Users, fitness: Barbell,
};

export function FacilityIcon({ category, size = 22, weight = 'regular' }: { category?: MapNode['category']; size?: number; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' }) {
  const Icon = category ? icons[category] : MapPin;
  return <Icon size={size} weight={weight} aria-hidden="true" />;
}
