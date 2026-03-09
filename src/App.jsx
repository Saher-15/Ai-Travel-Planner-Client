import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import CreateTrip from "./pages/CreateTrip.jsx";
import TripResult from "./pages/TripResult.jsx";
import MyTrips from "./pages/MyTrips.jsx";
import ViewTrip from "./pages/ViewTrip.jsx";
import EditTrip from "./pages/EditTrip.jsx";

import Contact from "./pages/Contact.jsx";
import Profile from "./pages/Profile.jsx";
import AdminContacts from "./pages/AdminContacts.jsx";

import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

import ProtectedRoute from "./auth/ProtectedRoute.jsx";

import "leaflet/dist/leaflet.css";

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location.pathname,
        page_title: document.title,
      });
    }
  }, [location.pathname]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/create" element={<P><CreateTrip /></P>} />
        <Route path="/result" element={<P><TripResult /></P>} />
        <Route path="/trips" element={<P><MyTrips /></P>} />
        <Route path="/trip/:id" element={<P><ViewTrip /></P>} />
        <Route path="/trip/:id/edit" element={<P><EditTrip /></P>} />

        <Route path="/admin/contacts" element={<P><AdminContacts /></P>} />

        <Route
          path="*"
          element={<div className="text-sm text-slate-600">Not found</div>}
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
