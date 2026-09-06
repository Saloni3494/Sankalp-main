import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useAnalyticsStates } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

const geoUrl = "/india.geojson";

export function IndiaMap() {
  const { data: states, isLoading, error } = useAnalyticsStates();
  const [position, setPosition] = useState({ coordinates: [80, 22], zoom: 1 });
  const [tooltip, setTooltip] = useState<{ name: string; risk: number | string; x: number; y: number } | null>(null);

  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }

  function handleMoveEnd(position: any) {
    setPosition(position);
  }

  const riskData = useMemo(() => {
    if (!states) return {};
    return states.reduce((acc: any, s: any) => {
      acc[s.state.toLowerCase()] = s.avg_risk;
      return acc;
    }, {});
  }, [states]);

  const getFill = (stateName: string) => {
    const risk = riskData[stateName.toLowerCase()];
    if (risk === undefined) return "#6eadffff"; // slate-200 (No data)
    if (risk >= 60) return "#C94F22"; // Saffron (High Risk)
    if (risk >= 30) return "#fb923c"; // Orange (Med Risk)
    if (risk > 0) return "#fcd34d"; // Yellow (Low Risk)
    return "#2F6B3F"; // Green (Safe)
  };

  return (
    <Card className="card-surface flex flex-col h-full border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-navy">India Risk Heatmap</CardTitle>
        <CardDescription>Average risk score by state</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Loading Map...
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-danger text-sm">
            Failed to load map data.
          </div>
        ) : (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 1000,
              center: [80, 22]
            }}
            width={800}
            height={600}
            className="w-full h-full object-contain"
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates as [number, number]}
              onMoveEnd={handleMoveEnd}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateName = geo.properties.NAME_1 || geo.properties.name || "";
                    const risk = riskData[stateName.toLowerCase()];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: getFill(stateName),
                            stroke: "#cbd5e1",
                            strokeWidth: 0.5,
                            outline: "none"
                          },
                          hover: {
                            fill: "#102B4E",
                            stroke: "#ffffff",
                            strokeWidth: 1,
                            outline: "none",
                            cursor: "pointer",
                            transition: "all 250ms"
                          },
                          pressed: {
                            fill: "#102B4E",
                            outline: "none"
                          },
                        }}
                        onClick={() => {
                          console.log(`Clicked on ${stateName} (Risk: ${risk})`);
                        }}
                        onMouseEnter={(e) => {
                          setTooltip({
                            name: stateName,
                            risk: risk !== undefined ? risk : "No Data",
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseMove={(e) => {
                          setTooltip((prev) =>
                            prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                          );
                        }}
                        onMouseLeave={() => {
                          setTooltip(null);
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 rounded-md bg-navy px-3 py-2 text-xs text-white shadow-xl pointer-events-none border border-white/10"
            style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}
          >
            <div className="font-bold">{tooltip.name}</div>
            <div className="text-white/80 mt-0.5">
              Risk: {typeof tooltip.risk === "number" ? tooltip.risk.toFixed(1) : tooltip.risk}
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-card/80 backdrop-blur border border-border rounded-md shadow-sm hover:bg-secondary transition-colors text-navy"
            title="Zoom In"
          >
            <Plus className="size-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-card/80 backdrop-blur border border-border rounded-md shadow-sm hover:bg-secondary transition-colors text-navy"
            title="Zoom Out"
          >
            <Minus className="size-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur border border-border p-3 rounded-lg shadow-sm">
          <div className="text-xs font-semibold mb-2 text-navy">Risk Level</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]"><span className="w-3 h-3 rounded-sm bg-[#C94F22]"></span> High (≥60)</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="w-3 h-3 rounded-sm bg-[#fb923c]"></span> Medium (30-59)</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="w-3 h-3 rounded-sm bg-[#fcd34d]"></span> Low (&gt;0)</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="w-3 h-3 rounded-sm bg-[#2F6B3F]"></span> Safe (0)</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="w-3 h-3 rounded-sm bg-[#e2e8f0]"></span> No Data</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
