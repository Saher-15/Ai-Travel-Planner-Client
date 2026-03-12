import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEFAULT_CENTER = [2.3522, 48.8566]; // Paris fallback
const DEFAULT_ZOOM = 11;
const ROUTE_SOURCE_ID = "trip-route-source";
const ROUTE_LAYER_ID = "trip-route-layer";

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildPlaceTitle(place = {}, index = 0) {
  return (
    place?.title ||
    place?.name ||
    place?.placeName ||
    `Stop ${index + 1}`
  );
}

function buildPlaceQuery(place = {}, destination = "") {
  return (
    place?.address ||
    place?.location ||
    [place?.title || place?.name || place?.placeName, destination]
      .filter(Boolean)
      .join(", ")
  );
}

async function geocodePlace(query) {
  if (!query || !MAPBOX_TOKEN) return null;

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward` +
    `?q=${encodeURIComponent(query)}` +
    `&limit=1` +
    `&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const feature = Array.isArray(data?.features) ? data.features[0] : null;
  const coordinates = feature?.geometry?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return null;
  }

  return {
    lng: Number(coordinates[0]),
    lat: Number(coordinates[1]),
    placeName:
      feature?.properties?.full_address ||
      feature?.properties?.name ||
      feature?.properties?.place_formatted ||
      query,
    query,
  };
}

async function getDirections(points, profile = "driving") {
  if (!MAPBOX_TOKEN || points.length < 2) return null;

  const profileMap = {
    driving: "mapbox/driving",
    walking: "mapbox/walking",
    cycling: "mapbox/cycling",
  };

  const selectedProfile = profileMap[profile] || profileMap.driving;
  const coordinates = points.map((p) => `${p.lng},${p.lat}`).join(";");

  const url =
    `https://api.mapbox.com/directions/v5/${selectedProfile}/${coordinates}` +
    `?geometries=geojson` +
    `&overview=full` +
    `&steps=false` +
    `&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const route = Array.isArray(data?.routes) ? data.routes[0] : null;
  if (!route?.geometry) return null;

  return {
    geometry: route.geometry,
    distanceKm: Number.isFinite(route.distance) ? route.distance / 1000 : null,
    durationMin: Number.isFinite(route.duration) ? route.duration / 60 : null,
  };
}

function fitMapToPoints(map, points) {
  if (!map || !points?.length) return;

  if (points.length === 1) {
    map.flyTo({
      center: [points[0].lng, points[0].lat],
      zoom: 13,
      essential: true,
    });
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  points.forEach((p) => bounds.extend([p.lng, p.lat]));
  map.fitBounds(bounds, { padding: 60, duration: 900 });
}

function createMarkerElement(index) {
  const el = document.createElement("div");
  el.className =
    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-xs font-bold text-white shadow-lg";
  el.textContent = String(index + 1);
  return el;
}

export default function RouteTripMap({
  places = [],
  destination = "",
  profile = "driving",
  height = 420,
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);

  const normalizedPlaces = useMemo(() => {
    const seen = new Set();

    return safeArray(places)
      .map((place, index) => {
        const title = buildPlaceTitle(place, index);
        const query = buildPlaceQuery(place, destination);
        const key = normalizeText(query || title);
        return {
          ...place,
          title,
          query,
          _key: key,
        };
      })
      .filter((place) => {
        if (!place.query) return false;
        if (seen.has(place._key)) return false;
        seen.add(place._key);
        return true;
      });
  }, [places, destination]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      if (!mapRef.current) return;

      if (!MAPBOX_TOKEN) {
        setLoading(false);
        setError("Missing VITE_MAPBOX_TOKEN in your frontend .env file.");
        return;
      }

      setLoading(true);
      setError("");
      setRouteInfo(null);

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const map = mapRef.current;

      if (map.getLayer(ROUTE_LAYER_ID)) {
        map.removeLayer(ROUTE_LAYER_ID);
      }
      if (map.getSource(ROUTE_SOURCE_ID)) {
        map.removeSource(ROUTE_SOURCE_ID);
      }

      if (!normalizedPlaces.length) {
        setLoading(false);
        setError("No places available for the map.");
        return;
      }

      const geocoded = [];
      for (const place of normalizedPlaces) {
        const result = await geocodePlace(place.query);
        if (result) {
          geocoded.push({
            ...place,
            ...result,
          });
        }
      }

      if (cancelled) return;

      if (!geocoded.length) {
        setLoading(false);
        setError("Could not find valid map locations for these places.");
        return;
      }

      geocoded.forEach((place, index) => {
        const popupHtml = `
          <div style="min-width:180px">
            <div style="font-weight:700; margin-bottom:6px;">${place.title}</div>
            <div style="font-size:12px; color:#475569;">${place.placeName || place.query}</div>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: createMarkerElement(index) })
          .setLngLat([place.lng, place.lat])
          .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml))
          .addTo(map);

        markersRef.current.push(marker);
      });

      fitMapToPoints(map, geocoded);

      if (geocoded.length >= 2) {
        const directions = await getDirections(geocoded, profile);

        if (!cancelled && directions?.geometry) {
          map.addSource(ROUTE_SOURCE_ID, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: directions.geometry,
            },
          });

          map.addLayer({
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#0ea5e9",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });

          setRouteInfo(directions);
        }
      }

      setLoading(false);
    }

    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      loadMapData();
    } else {
      map.once("load", loadMapData);
    }

    return () => {
      cancelled = true;
    };
  }, [normalizedPlaces, profile]);

  return (
    <div className={`overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900">
            Route Map
          </div>
          <div className="text-xs text-slate-500">
            Showing places from addresses or locations
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {normalizedPlaces.length} stop{normalizedPlaces.length !== 1 ? "s" : ""}
          </span>

          {routeInfo?.distanceKm ? (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-700">
              {routeInfo.distanceKm.toFixed(1)} km
            </span>
          ) : null}

          {routeInfo?.durationMin ? (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-700">
              {Math.round(routeInfo.durationMin)} min
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="px-4 py-4 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="relative">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-600 backdrop-blur-sm">
            Loading map...
          </div>
        ) : null}

        <div
          ref={mapContainerRef}
          style={{ height }}
          className="w-full"
        />
      </div>
    </div>
  );
}