import { CheckIcon } from 'lucide-react';

type Profile = {
  name: string;
  avatar: string;
};

const profile: Profile = {
  name: 'Josh',
  avatar: 'https://assets.watermelon.sh/wm_josh.png',
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word.slice(0, 1))
    .join('');

const Avatar8 = () => {
  return (
    <span className="ring-offset-background relative grid size-5 place-items-center overflow-visible rounded-full bg-muted text-xs ring-2 ring-emerald-600 ring-offset-2 dark:ring-emerald-400">
      <img
        src={profile.avatar}
        alt={profile.name}
        className="size-full rounded-full object-cover"
      />
      <span className="sr-only">{getInitials(profile.name)}</span>
      <span className="absolute -bottom-0.5 -right-0.5 grid size-2.5 place-items-center rounded-full bg-emerald-600 text-white dark:bg-emerald-400">
        <CheckIcon className="size-1.5" />
      </span>
    </span>
  );
};

export default Avatar8;
