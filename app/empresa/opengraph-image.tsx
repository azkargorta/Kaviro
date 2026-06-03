import { ImageResponse } from "next/og";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

export const alt = `${KAVIRO_TRIPS_PRODUCT_NAME} — Software para agencias de viajes`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function EmpresaOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a5f 0%, #162d4d 45%, #0f2744 100%)",
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          {KAVIRO_TRIPS_PRODUCT_NAME}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            fontWeight: 500,
            color: "#93c5fd",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Software para agencias · Portal con tu marca
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 18,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          kaviro.app/empresa
        </div>
      </div>
    ),
    { ...size }
  );
}
