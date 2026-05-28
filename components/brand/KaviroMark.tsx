/** Icono circular Kaviro: fondo coral (#F87171) y marca K (SVG vectorial). */



export const KAVIRO_MARK_CORAL = "#F87171";



type Props = {

  size?: number;

  className?: string;

  title?: string;

};



export default function KaviroMark({ size = 48, className = "", title }: Props) {

  return (

    // eslint-disable-next-line @next/next/no-img-element -- SVG vectorial escalable sin pixelado

    <img

      src="/brand/icon.png"

      width={size}

      height={size}

      className={className}

      alt={title ?? ""}

      aria-hidden={title ? undefined : true}

      role={title ? "img" : undefined}

    />

  );

}


