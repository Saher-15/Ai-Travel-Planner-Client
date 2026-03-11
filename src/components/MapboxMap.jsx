import { useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_CENTER = { longitude: 35.2137, latitude: 31.7683, zoom: 11 };

function isValidPoint(point) {
  return (
    point &&
    Number.isFinite(Number(point.lat)) &&
    Number.isFinite(Number(point.lon)) &&
    Math.abs(Number(point.lat)) <= 90 &&
    Math.abs(Number(point.lon)) <= 180
  );
}

export default function MapboxMap({
  points = [],
  height = 420,
  selectedPoint = null,
  onSelectPoint,
}) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const validPoints = useMemo(
    () => (Array.isArray(points) ? points.filter(isValidPoint) : []),
    [points]
  );

  const initialViewState = useMemo(() => {
    if (!validPoints.length) return DEFAULT_CENTER;

    const first = validPoints[0];
    return {
      longitude: Number(first.lon),
      latitude: Number(first.lat),
      zoom: validPoints.length === 1 ? 13 : 10,
    };
  }, [validPoints]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Missing VITE_MAPBOX_TOKEN in your .env file
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm"
      style={{ height }}
    >
      <Map
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/standard"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {validPoints.map((point, index) => (
          <Marker
            key={`${point.location || "point"}-${index}`}
            longitude={Number(point.lon)}
            latitude={Number(point.lat)}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectPoint?.(point);
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white shadow-lg">
              {index + 1}
            </div>
          </Marker>
        ))}

        {selectedPoint && isValidPoint(selectedPoint) ? (
          <Popup
            longitude={Number(selectedPoint.lon)}
            latitude={Number(selectedPoint.lat)}
            anchor="top"
            onClose={() => onSelectPoint?.(null)}
            closeOnClick={false}
          >
            <div className="min-w-[180px]">
              <div className="font-semibold text-slate-800">
                {selectedPoint.title || "Location"}
              </div>
              {selectedPoint.location ? (
                <div className="mt-1 text-sm text-slate-600">
                  {selectedPoint.location}
                </div>
              ) : null}
              {selectedPoint.notes ? (
                <div className="mt-2 text-xs text-slate-500">
                  {selectedPoint.notes}
                </div>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}