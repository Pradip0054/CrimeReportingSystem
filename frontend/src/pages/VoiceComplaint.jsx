import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Square, Loader2, AlertCircle, CheckCircle } from "lucide-react";

function VoiceComplaint() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [extractedLocation, setExtractedLocation] = useState(""); 
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /**
   * 1. Initialize microphone hardware access stream and start recording audio chunks.
   */
  const startRecording = async () => {
    try {
      setError("");
      setTranscribedText("");
      setExtractedLocation(""); 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not supported.");
      console.error(err);
    }
  };

  /**
   * 2. Stop active recording track frames safely and release hardware resource access.
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  /**
   * 3. Forward compressed multi-part binary data objects securely to the core API server.
   */
  const sendAudioToBackend = async (audioBlob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice.webm");

      const response = await fetch("http://localhost:8000/api/complaint/voice", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const resData = await response.json();
      console.log("Full AI response inside Voice UI:", resData);

      if (response.ok && (resData.text || resData.translated_text)) {
        const textOutput = resData.text || resData.translated_text;
        setTranscribedText(textOutput);

        const locOutput = resData.location || resData.extracted_data?.location || "";
        if (locOutput && locOutput !== "Unknown" && locOutput !== "Not Specified") {
          setExtractedLocation(locOutput);
        }
      } else {
        setError(resData.error || "AI processing failed. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to AI processing server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "40px", color: "#fff" }}>
      <button 
        onClick={() => navigate("/citizen-dashboard")} 
        style={{ background: "transparent", border: "none", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "30px", fontSize: "16px", fontWeight: "600" }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div style={{ maxWidth: "650px", margin: "40px auto 0", background: "#1e293b", padding: "40px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.5px" }}>Voice AI Complaint Portal</h2>
        <p style={{ color: "#94a3b8", fontSize: "15px", marginBottom: "35px", lineHeight: "1.6" }}>
          Record the details of the incident clearly using your microphone. Our Django Faster-Whisper AI microservice will automatically convert your speech to text and prepare a draft complaint filing for you.
        </p>

        <div style={{ marginBottom: "30px" }}>
          {!isRecording ? (
            <button 
              onClick={startRecording}
              disabled={loading}
              style={{ width: "110px", height: "110px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", cursor: "pointer", border: "3px solid #ef4444", transition: "0.3s", outline: "none", display: "inline-flex", justifyContent: "center" }}
            >
              <Mic size={40} color="#ef4444" style={{ marginTop: "32px" }} />
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              style={{ width: "110px", height: "110px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.9)", display: "flex", alignItems: "center", cursor: "pointer", border: "3px solid #ef4444", display: "inline-flex", justifyContent: "center" }}
            >
              <Square size={36} color="#fff" style={{ marginTop: "34px" }} />
            </button>
          )}
        </div>

        <div style={{ fontSize: "14px", fontWeight: "700", color: isRecording ? "#ef4444" : "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px" }}>
          {isRecording ? "Recording Live Case Details..." : "Click Icon to Start Recording"}
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#3b82f6", margin: "20px 0" }}>
            <Loader2 className="animate-spin" size={20} />
            <span>Faster-Whisper AI converting voice to text...</span>
          </div>
        )}

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "14px", borderRadius: "10px", color: "#f87171", margin: "20px 0", textAlign: "left" }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "14px", margin: 0 }}>{error}</p>
          </div>
        )}

        {transcribedText && (
          <div style={{ marginTop: "30px", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", marginBottom: "10px", fontWeight: "700" }}>
              <CheckCircle size={18} /> AI Transcribed Output Successfully Generated
            </div>
            
            {extractedLocation && (
              <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", marginBottom: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Detected Incident Location: {extractedLocation}
              </div>
            )}

            <div style={{ width: "100%", background: "#0f172a", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: "15px", lineHeight: "1.6", minHeight: "80px", boxSizing: "border-box" }}>
              {transcribedText}
            </div>

            {/**
             * 4. Inject structural context states into target routes during runtime navigation changes.
             */}
            <button 
              onClick={() => navigate("/complaint-form", { 
                state: { 
                  description: transcribedText,
                  location: extractedLocation 
                } 
              })}
              style={{ width: "100%", marginTop: "15px", background: "#2563eb", color: "#fff", padding: "16px", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "0.2s" }}
            >
              Proceed to File Complaint with this Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceComplaint;