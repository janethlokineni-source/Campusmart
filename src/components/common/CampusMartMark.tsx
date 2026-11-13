import Image from 'next/image';

interface CampusMartMarkProps {
  size?: number;
  className?: string;
}

export default function CampusMartMark({ size = 48, className = '' }: CampusMartMarkProps) {
  return (
    <Image
      src="/campusmart-mark.svg"
      alt=""
      width={size}
      height={size}
      className={className}
    />
  );
}
