import {
  BarbellIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  ChatCircleDotsIcon,
  ForkKnifeIcon,
  GearSixIcon,
  HouseIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react'

export function useIcons() {
  return { icons }
}

const icons = {
  home: <HouseIcon size={20} />,
  messages: <ChatCircleDotsIcon size={20} />,
  settings: <GearSixIcon size={20} />,
  patients: <UsersThreeIcon size={20} />,
  plans: <ForkKnifeIcon size={20} />,
  diet: <ForkKnifeIcon size={20} />,
  schedule: <CalendarBlankIcon size={20} />,
  workouts: <BarbellIcon size={20} />,
  progress: <ChartBarIcon size={20} />,
}
