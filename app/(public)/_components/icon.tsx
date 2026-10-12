// app/(public)/_components/icon.tsx
type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function Icon({ name, className = "", filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`qx-icon${filled ? " qx-icon-filled" : ""} ${className}`}
    >
      {name}
    </span>
  );
}
