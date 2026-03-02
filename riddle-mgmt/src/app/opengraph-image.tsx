import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Riddle Management — Artist Management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const logoData = readFileSync(join(process.cwd(), "public", "logo.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "40px",
        }}
      >
        <img src={logoBase64} width={600} height={143} alt="" />
        <div
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 18,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 300,
          }}
        >
          Artist Management
        </div>
      </div>
    ),
    { ...size }
  );
}
