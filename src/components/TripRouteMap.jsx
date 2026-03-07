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

function isValidPoint(p) {
  return (
    p &&
    Number.isFinite(Number(p.lat)) &&
    Number.isFinite(Number(p.lon)) &&
    Math.abs(Number(p.lat)) <= 90 &&
    Math.abs(Number(p.lon)) <= 180
  );
}

function createNumberedIcon(index) {
  return L.divIcon({
    className: "custom-numbered-marker",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0284c7, #2563eb);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        border: 2px solid white;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.25);
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
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

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, valid]);

  return null;
}

export default function TripRouteMap({ points }) {
  const validPoints = useMemo(() => {
    return (points ?? []).filter(isValidPoint);
  }, [points]);

  const initialCenter = useMemo(() => {
    if (validPoints.length) {
      return [Number(validPoints[0].lat), Number(validPoints[0].lon)];
    }
    return DEFAULT_CENTER;
  }, [validPoints]);

  return (
    <div className="trip-route-map" style={{ height: 420, width: "100%" }}>
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds points={validPoints} />
        <RouteControl points={validPoints} />

        {validPoints.map((p, idx) => (
          <Marker
            key={`${p.location || p.title || "p"}-${p.day}-${p.timeBlock}-${idx}`}
            position={[Number(p.lat), Number(p.lon)]}
            icon={createNumberedIcon(idx)}
          >
            <Popup>
              <div style={{ maxWidth: 250 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  {p.title || p.displayName || "Place"}
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

                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt={p.title || p.location || "place"}
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
        ))}
      </MapContainer>
    </div>
  );
}