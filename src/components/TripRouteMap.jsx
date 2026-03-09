import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [31.7683, 35.2137];
const DEFAULT_ZOOM = 13;
const BLOCK_ORDER = { morning: 1, afternoon: 2, evening: 3 };

function isValidPoint(p) {
  return (
    p &&
    Number.isFinite(Number(p.lat)) &&
    Number.isFinite(Number(p.lon)) &&
    Math.abs(Number(p.lat)) <= 90 &&
    Math.abs(Number(p.lon)) <= 180
  );
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function roundCoord(value, digits = 5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(digits));
}

function pointSort(a, b) {
  return (
    (Number(a?.day) || 0) - (Number(b?.day) || 0) ||
    (BLOCK_ORDER[a?.timeBlock] ?? 99) - (BLOCK_ORDER[b?.timeBlock] ?? 99) ||
    normalizeText(a?.title).localeCompare(normalizeText(b?.title)) ||
    normalizeText(a?.location).localeCompare(normalizeText(b?.location))
  );
}

function getRelevantPoints(points) {
  const valid = (points ?? []).filter(isValidPoint).sort(pointSort);

  const unique = [];
  const seen = new Set();

  for (const p of valid) {
    const lat = roundCoord(p.lat);
    const lon = roundCoord(p.lon);
    const locationKey = normalizeText(
      p?.displayName || p?.location || p?.title || p?.name
    );

    const key = `${lat}|${lon}|${locationKey}`;
    if (seen.has(key)) continue;

    seen.add(key);

    unique.push({
      ...p,
      lat: Number(p.lat),
      lon: Number(p.lon),
      roundedLat: lat,
      roundedLon: lon,
    });
  }

  return unique;
}

function getPopupLabel(point) {
  if (point?.title) return point.title;
  if (point?.name) return point.name;
  if (point?.displayName) return point.displayName;
  if (point?.location) return point.location;
  return "Place";
}

function getMarkerVariant(index, total) {
  if (total <= 1) return "single";
  if (index === 0) return "start";
  if (index === total - 1) return "end";
  return "middle";
}

function getMarkerTitle(index, total) {
  const variant = getMarkerVariant(index, total);

  if (variant === "single") return "Single stop";
  if (variant === "start") return "Start";
  if (variant === "end") return "End";
  return `Stop ${index + 1}`;
}

function createNumberedIcon(index, total) {
  const variant = getMarkerVariant(index, total);

  const stylesByVariant = {
    single: {
      bg: "linear-gradient(135deg, #0284c7, #2563eb)",
      ring: "#ffffff",
      label: "•",
    },
    start: {
      bg: "linear-gradient(135deg, #16a34a, #22c55e)",
      ring: "#ffffff",
      label: "S",
    },
    middle: {
      bg: "linear-gradient(135deg, #0284c7, #2563eb)",
      ring: "#ffffff",
      label: String(index + 1),
    },
    end: {
      bg: "linear-gradient(135deg, #7c3aed, #a855f7)",
      ring: "#ffffff",
      label: "E",
    },
  };

  const style = stylesByVariant[variant];

  return L.divIcon({
    className: "custom-numbered-marker",
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        background: ${style.bg};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        border: 2px solid ${style.ring};
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.28);
      ">
        ${style.label}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

function RouteControl({ points }) {
  const map = useMap();
  const controlRef = useRef(null);

  const waypoints = useMemo(() => {
    return (points ?? [])
      .filter(isValidPoint)
      .map((p) => L.latLng(Number(p.lat), Number(p.lon)));
  }, [points]);

  useEffect(() => {
    if (!map) return;

    const removeControlSafely = () => {
      if (!controlRef.current) return;

      try {
        if (controlRef.current.getPlan) {
          try {
            controlRef.current.getPlan().setWaypoints([]);
          } catch {}
        }
        map.removeControl(controlRef.current);
      } catch {}

      controlRef.current = null;
    };

    removeControlSafely();

    if (waypoints.length < 2) {
      return () => removeControlSafely();
    }

    const control = L.Routing.control({
      waypoints,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
      routeWhileDragging: false,
      createMarker: () => null,
      lineOptions: {
        styles: [
          {
            color: "#0ea5e9",
            opacity: 0.9,
            weight: 5,
          },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
    });

    controlRef.current = control;

    try {
      control.addTo(map);
    } catch {}

    return () => {
      removeControlSafely();
    };
  }, [map, waypoints]);

  return null;
}

function FitBounds({ points }) {
  const map = useMap();

  const valid = useMemo(() => (points ?? []).filter(isValidPoint), [points]);

  useEffect(() => {
    if (!map) return;

    if (!valid.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (valid.length === 1) {
      map.setView([Number(valid[0].lat), Number(valid[0].lon)], 14);
      return;
    }

    const latLngs = valid.map((p) => [Number(p.lat), Number(p.lon)]);
    const bounds = L.latLngBounds(latLngs);

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 14,
    });
  }, [map, valid]);

  return null;
}

function RouteLegend({ total }) {
  if (!total) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Route guide
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
        {total === 1 ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
            Single stop
          </span>
        ) : (
          <>
            <span className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
              S = Start
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
              Numbers = Stops
            </span>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
              E = End
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function saveRelevantPoints(storageKey, points) {
  if (!storageKey || typeof window === "undefined") return;

  try {
    const payload = points.map((p, index) => ({
      order: index + 1,
      title: p?.title || p?.name || null,
      label: getPopupLabel(p),
      location: p?.location || null,
      displayName: p?.displayName || null,
      day: p?.day ?? null,
      date: p?.date ?? null,
      timeBlock: p?.timeBlock ?? null,
      category: p?.category ?? null,
      type: p?.type ?? null,
      lat: roundCoord(p?.lat, 6),
      lon: roundCoord(p?.lon, 6),
    }));

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {}
}

export default function TripRouteMap({
  points,
  storageKey = "trip-relevant-route-points",
  onResolvedPoints,
}) {
  const validPoints = useMemo(() => getRelevantPoints(points), [points]);

  const initialCenter = useMemo(() => {
    if (validPoints.length) {
      return [Number(validPoints[0].lat), Number(validPoints[0].lon)];
    }
    return DEFAULT_CENTER;
  }, [validPoints]);

  useEffect(() => {
    saveRelevantPoints(storageKey, validPoints);

    if (typeof onResolvedPoints === "function") {
      onResolvedPoints(validPoints);
    }
  }, [storageKey, validPoints, onResolvedPoints]);

  return (
    <div
      className="trip-route-map relative overflow-hidden rounded-3xl"
      style={{ height: 420, width: "100%" }}
    >
      <RouteLegend total={validPoints.length} />

      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBounds points={validPoints} />
        <RouteControl points={validPoints} />

        {validPoints.map((p, idx) => {
          const variant = getMarkerVariant(idx, validPoints.length);

          return (
            <Marker
              key={`${roundCoord(p.lat, 6)}-${roundCoord(p.lon, 6)}-${p.location || p.title || p.name || "p"}-${p.day || "d"}-${p.timeBlock || "b"}-${idx}`}
              position={[Number(p.lat), Number(p.lon)]}
              icon={createNumberedIcon(idx, validPoints.length)}
            >
              <Popup>
                <div style={{ maxWidth: 280 }}>
                  <div
                    style={{
                      display: "inline-block",
                      marginBottom: 8,
                      borderRadius: 9999,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        variant === "start"
                          ? "#dcfce7"
                          : variant === "end"
                          ? "#f3e8ff"
                          : "#e0f2fe",
                      color:
                        variant === "start"
                          ? "#166534"
                          : variant === "end"
                          ? "#6b21a8"
                          : "#075985",
                    }}
                  >
                    {getMarkerTitle(idx, validPoints.length)}
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    {getPopupLabel(p)}
                  </div>

                  {p.location ? (
                    <div style={{ fontSize: 12, color: "#475569" }}>{p.location}</div>
                  ) : null}

                  {p.displayName && p.displayName !== p.location ? (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      {p.displayName}
                    </div>
                  ) : null}

                  {p.day || p.timeBlock ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 8,
                        fontWeight: 600,
                      }}
                    >
                      {p.day ? `Day ${p.day}` : ""}
                      {p.day && p.timeBlock ? " • " : ""}
                      {p.timeBlock || ""}
                    </div>
                  ) : null}

                  {p.address ? (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      {p.address}
                    </div>
                  ) : null}

                  {p.category || p.type ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      {p.category ? (
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#475569",
                            borderRadius: 9999,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {p.category}
                        </span>
                      ) : null}

                      {p.type ? (
                        <span
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            borderRadius: 9999,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {p.type}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {`Lat: ${roundCoord(p.lat, 5)} • Lon: ${roundCoord(p.lon, 5)}`}
                  </div>

                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={getPopupLabel(p)}
                      style={{
                        marginTop: 10,
                        borderRadius: 12,
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}