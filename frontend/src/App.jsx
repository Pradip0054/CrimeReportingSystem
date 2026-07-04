import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./components/Index";
import Login from "./components/Login";
import CitizenDashboard from "./pages/CitizenDashboard";
import ComplaintForm from "./components/Complaint"; 
import VoiceComplaint from "./pages/VoiceComplaint";
import TrackStatusSearch from "./pages/TrackStatusSearch"; 
import TrackComplaint from "./pages/TrackComplaint"; 
import AdminLayout from "./layouts/AdminLayout"; 
import AdminOverview from "./pages/AdminOverview";
import CreatePolice from "./pages/CreatePolice";
import AllComplaints from "./pages/AllComplaints"; 
import AssignComplaint from "./pages/AssignComplaint";
import OfficerDashboard from "./pages/OfficerDashboard";

function App() {
  return (
    <div className="App">
      <Routes>
        {/**
         * 1. Public accessibility routes and citizen submission portals.
         */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
        <Route path="/complaint-form" element={<ComplaintForm />} />
        <Route path="/police-dashboard" element={<OfficerDashboard />} />
        
        <Route path="/voice-complaint" element={<VoiceComplaint />} />
        <Route path="/track-status" element={<TrackStatusSearch />} />
        <Route path="/track/:id" element={<TrackComplaint />} />
        
        {/**
         * 2. Protected administrative group encapsulated within a nested layout wrapper.
         */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} /> 
          <Route path="manage-police" element={<CreatePolice />} /> 
          <Route path="complaints" element={<AllComplaints />} /> 
          <Route path="assign/:id" element={<AssignComplaint />} />
        </Route>

        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
        
        {/**
         * 3. Global catch-all wildcard directing fallback traffic to the main citizen deck.
         */}
        <Route path="*" element={<Navigate to="/citizen-dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;