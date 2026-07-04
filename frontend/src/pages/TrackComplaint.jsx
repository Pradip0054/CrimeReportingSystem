import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Calendar,
  Info,
  CheckCircle2,
  Search,
  FileText,
} from "lucide-react";
import "./TrackComplaint.css";

function TrackComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchComplaint = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/complaint/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (response.status === 404) {
          alert("Complaint not found");
          navigate("/citizen-dashboard");
          return;
        }

        const data = await response.json();
        setComplaint(data);
      } catch (error) {
        console.error("Error fetching complaint:", error);
        alert("Failed to load complaint data.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id, token, navigate]);

  if (loading) return <div className="loader">Loading Case File...</div>;
  if (!complaint) return null;

  // Dynamic Progress Logic
  const getStatusStep = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("resolved")) return 4;
    if (s.includes("investigation")) return 3;
    if (s.includes("assigned")) return 2;
    return 1;
  };

  const currentStep = getStatusStep(complaint.status);

  return (
    <div className="track-page-wrapper">
      <div className="track-container">
        <header className="track-header">
          <button
            className="back-link"
            onClick={() => navigate("/citizen-dashboard")}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <div className="header-main">
            <h1>
              Case ID:{" "}
              <span className="highlight">#{complaint.id}</span>
            </h1>

            <span
              className={`status-badge ${
                complaint.status?.toLowerCase().replace(/\s+/g, "-")
              }`}
            >
              {complaint.status}
            </span>
          </div>
        </header>

        {/* Status Stepper */}
        <section className="status-stepper">
          {[
            { label: "Submitted", icon: <FileText size={18} /> },
            { label: "Assigned", icon: <Shield size={18} /> },
            { label: "In Investigation", icon: <Search size={18} /> },
            { label: "Resolved", icon: <CheckCircle2 size={18} /> },
          ].map((step, index) => (
            <div
              key={index}
              className={`step ${
                index + 1 <= currentStep ? "completed" : ""
              }`}
            >
              <div className="step-icon-wrapper">
                {index + 1 < currentStep ? (
                  <CheckCircle2 size={20} />
                ) : (
                  step.icon
                )}
              </div>

              <p>{step.label}</p>

              {index < 3 && <div className="step-line"></div>}
            </div>
          ))}
        </section>

        {/* Complaint Details */}
        <div className="details-grid">
          <div className="info-card">
            <div className="card-header">
              <h3>
                <Info size={18} /> Incident Overview
              </h3>
            </div>

            <p className="desc-text">
              {complaint.description || "No description provided"}
            </p>

            <div className="meta-row">
              <div className="meta-item">
                <Calendar size={16} />
                <p>{complaint.incident_date || "Not specified"}</p>
              </div>

              <div className="meta-item">
                <MapPin size={16} />
                <p>
                  {complaint.incident_location || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackComplaint;
