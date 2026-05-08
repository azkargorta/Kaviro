"use client";

import { useEffect } from "react";
import { useTripBoardHeader, type TripBoardHeaderConfig } from "@/components/layout/TripBoardHeaderContext";
import { getTripTabIconSrc } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

export default function TripBoardPageHeader(props: TripBoardHeaderConfig) {
  const { setHeader } = useTripBoardHeader();
  const isDark = useIsDarkMode();

  useEffect(() => {
    const iconSrc = props.iconKey ? getTripTabIconSrc(props.iconKey, isDark) : props.iconSrc;
    setHeader({ ...props, iconSrc });
    // Importante: no limpiamos el header en unmount.
    // En transiciones entre páginas del mismo layout, limpiarlo provoca un “flash” donde el header queda vacío
    // y se renderiza el fallback (logo grande) durante unas décimas hasta que el siguiente header se setea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.section, props.title, props.description, props.iconSrc, props.iconKey, props.iconAlt, props.actions, isDark]);

  return null;
}

