import Image from "next/image";

type Props = {
  size: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/** Raster del mark coral (PWA, notificaciones, lugares que exigen <img>). */
export default function KaviroMarkImage({ size, className = "", alt = "", priority }: Props) {
  return (
    <Image
      src="/brand/icon.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
