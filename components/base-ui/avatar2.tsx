import { CheckIcon } from 'lucide-react';

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word.slice(0, 1))
    .join('');

interface Avatar9Props {
  name?: string;
  avatar?: string;
}

const Avatar9 = ({ name = 'User', avatar }: Avatar9Props) => {
  return (
    <span className="ring-offset-background relative grid size-7 place-items-center overflow-visible rounded-full bg-muted text-xs ring-2 ring-emerald-600 ring-offset-2 dark:ring-emerald-400">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold text-foreground">{getInitials(name)}</span>
      )}
      <span className="sr-only">{getInitials(name)}</span>
      <span className="absolute -bottom-0.5 -right-0.5 grid size-3 place-items-center rounded-full bg-emerald-600 text-white dark:bg-emerald-400">
        <CheckIcon className="size-2" />
      </span>
    </span>
  );
};

export default Avatar9;
