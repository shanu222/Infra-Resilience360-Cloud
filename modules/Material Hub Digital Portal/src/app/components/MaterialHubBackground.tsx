import { ReactNode } from "react";

type MaterialHubBackgroundProps = {
  children: ReactNode;
};

const resolveMaterialHubBackgroundUrl = () => {
  if (typeof window === "undefined") {
    return "/assets/images/material_hub_bg.png";
  }

  const marker = "/material-hubs";
  const markerIndex = window.location.pathname.indexOf(marker);
  const basePath = markerIndex === -1 ? "" : window.location.pathname.slice(0, markerIndex + marker.length);
  return `${basePath}/assets/images/material_hub_bg.png`;
};

export function MaterialHubBackground({ children }: MaterialHubBackgroundProps) {
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${resolveMaterialHubBackgroundUrl()})` }}
    >
      <div className="min-h-screen w-full bg-white/15">{children}</div>
    </div>
  );
}
