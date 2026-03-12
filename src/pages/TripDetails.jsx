// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { api } from "../api/client.js";
// import {
//   Alert,
//   Badge,
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
// } from "../components/UI.jsx";

// function fmtRange(start, end) {
//   return start && end ? `${start} → ${end}` : "Dates not available";
// }

// function Section({ title, items, icon }) {
//   if (!items?.length) return null;

//   return (
//     <div className="mt-5">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
//           <span className="text-sm normal-case">{icon}</span>
//           {title}
//         </div>
//         <div className="text-[11px] text-slate-500">
//           {items.length} item{items.length > 1 ? "s" : ""}
//         </div>
//       </div>

//       <ul className="mt-2 space-y-2">
//         {items.map((x, idx) => (
//           <li
//             key={x?.id ?? `${x?.title}-${idx}`}
//             className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
//           >
//             <div className="text-sm font-semibold text-slate-900">{x?.title || "Activity"}</div>

//             {(x?.durationHours || x?.notes || x?.location) && (
//               <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
//                 {x?.durationHours ? <span>{x.durationHours}h</span> : null}
//                 {x?.location ? <span>{x.location}</span> : null}
//                 {x?.notes ? <span>{x.notes}</span> : null}
//               </div>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// function InfoTile({ label, value }) {
//   if (!value) return null;

//   return (
//     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//       <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
//         {label}
//       </div>
//       <div className="mt-1 text-sm leading-6 text-slate-800">{value}</div>
//     </div>
//   );
// }

// export default function TripDetails() {
//     useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);
//   const { id } = useParams();
//   const nav = useNavigate();

//   const [trip, setTrip] = useState(null);
//   const [err, setErr] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     async function load() {
//       setErr("");
//       setLoading(true);

//       try {
//         const { data } = await api.get(`/trips/${id}`);
//         if (!cancelled) setTrip(data);
//       } catch (e) {
//         if (!cancelled) {
//           setErr(e?.response?.data?.message || "Failed to load trip");
//         }
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     load();

//     return () => {
//       cancelled = true;
//     };
//   }, [id]);

//   const summary = useMemo(() => {
//     return trip?.itinerary?.tripSummary || {};
//   }, [trip]);

//   if (loading) {
//     return (
//       <div className="mx-auto max-w-5xl">
//         <Card>
//           <CardBody>
//             <div className="flex items-center gap-3">
//               <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
//               <div className="flex-1 space-y-2">
//                 <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
//                 <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
//               </div>
//             </div>
//             <div className="mt-5 h-32 animate-pulse rounded-2xl bg-slate-100" />
//           </CardBody>
//         </Card>
//       </div>
//     );
//   }

//   if (err) {
//     return (
//       <div className="mx-auto max-w-2xl space-y-4">
//         <Alert type="error">{err}</Alert>
//         <Button variant="secondary" onClick={() => nav("/trips")}>
//           Back to My Trips
//         </Button>
//       </div>
//     );
//   }

//   if (!trip) {
//     return (
//       <div className="mx-auto max-w-2xl space-y-4">
//         <Alert type="warning">Trip not found.</Alert>
//         <Button variant="secondary" onClick={() => nav("/trips")}>
//           Back to My Trips
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <Card className="overflow-hidden">
//         <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
//           <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
//             <div className="max-w-2xl">
//               <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
//                 Trip Details
//               </div>
//               <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
//                 {trip.destination || "Trip"}
//               </h1>
//               <p className="mt-3 text-sm leading-6 text-white/90 sm:text-base">
//                 {fmtRange(trip.startDate, trip.endDate)}
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               {summary.days ? (
//                 <Badge className="border-white/20 bg-white/10 text-white">
//                   {summary.days} days
//                 </Badge>
//               ) : null}
//               {summary.style ? (
//                 <Badge className="border-white/20 bg-white/10 text-white">
//                   pace: {summary.style}
//                 </Badge>
//               ) : null}
//               {summary.budget ? (
//                 <Badge className="border-white/20 bg-white/10 text-white">
//                   budget: {summary.budget}
//                 </Badge>
//               ) : null}
//             </div>
//           </div>
//         </div>

//         <CardBody>
//           <div className="flex flex-wrap gap-3">
//             <Button variant="secondary" onClick={() => nav("/trips")}>
//               Back to My Trips
//             </Button>
//             <Button onClick={() => nav("/create")}>Create New Trip</Button>
//           </div>
//         </CardBody>
//       </Card>

//       {/* Summary */}
//       <Card>
//         <CardHeader
//           title="Trip Summary"
//           subtitle="Overview of your saved itinerary"
//         />
//         <CardBody>
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             <MiniInfo label="Destination" value={trip.destination || "—"} />
//             <MiniInfo label="Dates" value={fmtRange(trip.startDate, trip.endDate)} />
//             <MiniInfo label="Days" value={String(summary.days || trip.itinerary?.days?.length || 0)} />
//             <MiniInfo label="Budget" value={summary.budget || trip.preferences?.budget || "—"} />
//           </div>
//         </CardBody>
//       </Card>

//       {/* Days */}
//       {!!trip.itinerary?.days?.length && (
//         <div className="grid gap-6 md:grid-cols-2">
//           {trip.itinerary.days.map((day) => (
//             <Card key={day.day} className="overflow-hidden">
//               <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
//                 <div className="flex items-start justify-between gap-3">
//                   <div>
//                     <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
//                       Day {day.day}
//                     </div>
//                     <div className="mt-1 text-xl font-black">{day.title}</div>
//                     <div className="mt-1 text-sm text-white/80">{day.date}</div>
//                   </div>

//                   <Badge className="border-white/20 bg-white/10 text-white">
//                     Day Plan
//                   </Badge>
//                 </div>
//               </div>

//               <CardBody>
//                 <Section title="Morning" icon="☀️" items={day.morning} />
//                 <Section title="Afternoon" icon="🌤️" items={day.afternoon} />
//                 <Section title="Evening" icon="🌙" items={day.evening} />

//                 {(day.foodSuggestion || day.backupPlan) && (
//                   <div className="mt-5 grid gap-3 sm:grid-cols-2">
//                     <InfoTile label="Food Suggestion" value={day.foodSuggestion} />
//                     <InfoTile label="Backup Plan" value={day.backupPlan} />
//                   </div>
//                 )}
//               </CardBody>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Tips */}
//       {!!trip.itinerary?.tips?.length && (
//         <Card>
//           <CardHeader
//             title="Trip Tips"
//             subtitle="Helpful reminders for a smoother trip"
//           />
//           <CardBody>
//             <div className="grid gap-3 sm:grid-cols-2">
//               {trip.itinerary.tips.map((tip, idx) => (
//                 <div
//                   key={idx}
//                   className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
//                 >
//                   {tip}
//                 </div>
//               ))}
//             </div>
//           </CardBody>
//         </Card>
//       )}

//       {/* Raw JSON fallback/debug */}
//       <Card>
//         <CardHeader
//           title="Raw Itinerary Data"
//           subtitle="Useful for debugging while building the project"
//         />
//         <CardBody>
//           <pre className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
//             {JSON.stringify(trip.itinerary, null, 2)}
//           </pre>
//         </CardBody>
//       </Card>
//     </div>
//   );
// }

// function MiniInfo({ label, value }) {
//   return (
//     <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
//       <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//         {label}
//       </div>
//       <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
//     </div>
//   );
// }