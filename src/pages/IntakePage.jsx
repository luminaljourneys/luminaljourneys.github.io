import { useState } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import { navigate } from "../App.jsx";

const STEPS = ["Personal Info", "Contact Info", "About You", "Confirm"];

const inputStyle = (focused, name) => ({
  width: "100%", padding: "0.8rem 1rem", boxSizing: "border-box",
  border: "1.5px solid " + (focused === name ? "var(--color-primary)" : "var(--color-border)"),
  borderRadius: "0.6rem", fontSize: "0.92rem", outline: "none",
  background: "var(--color-bg-soft)", color: "var(--color-text)",
  fontFamily: "'DM Sans', sans-serif", transition: "border 0.2s",
  boxShadow: focused === name ? "0 0 0 3px rgba(17,76,92,0.08)" : "none"
});

const labelStyle = {
  display: "block", fontSize: "0.72rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-text-soft)", marginBottom: "0.4rem"
};

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: "var(--color-accent)" }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function IntakePage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", preferredName: "", dateOfBirth: "", pronouns: "",
    email: "", phone: "", address: "", city: "", state: "", zip: "", preferredContact: "email",
    primaryGoal: "", hearAboutUs: "", additionalNotes: ""
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const inp = (field) => ({ value: form[field], onChange: set(field), onFocus: () => setFocused(field), onBlur: () => setFocused(null), style: inputStyle(focused, field) });

  const handleSubmit = () => setSubmitted(true);

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 40%, #EDE0CC 0%, var(--color-bg) 70%)",
        fontFamily: "'DM Serif Display', Georgia, serif", padding: "2rem", textAlign: "center"
      }}>
        <div>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 400, color: "var(--color-text)", marginBottom: "1rem" }}>
            Thank you, {form.preferredName || form.firstName}.
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--color-text-soft)", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, maxWidth: 440, margin: "0 auto 2rem", lineHeight: 1.7 }}>
            We've received your intake form and will reach out to <strong>{form.email}</strong> within 1–2 business days to schedule your first visit.
          </p>
          <button onClick={() => navigate("/")} style={{
            color: "var(--color-primary)", fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem", letterSpacing: "0.06em", background: "none", border: "none",
            cursor: "pointer", borderBottom: "1px solid rgba(155,94,82,0.4)", padding: 0
          }}>← Back to home</button>
        </div>
        <MockupBanner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "'DM Serif Display', Georgia, serif" }}>

      {/* TOP BAR */}
      <div style={{ padding: "1.2rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(95,158,160,0.15)", background: "var(--color-bg)" }}>
        <button onClick={() => navigate("/")} style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}>
          Luminal Journey
        </button>
        <span style={{ fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif", color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>
          New Client Intake
        </span>
      </div>

      {/* PROGRESS */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 2rem 0" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? "var(--color-primary)" : "rgba(95,158,160,0.2)", transition: "background 0.3s" }} />
              <div style={{ fontSize: "0.65rem", marginTop: "0.4rem", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", color: i <= step ? "var(--color-primary)" : "var(--color-text-muted)", transition: "color 0.3s" }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "0.3rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>
          Step {step + 1} of {STEPS.length}
        </div>
        <h2 style={{ fontSize: "2rem", fontWeight: 400, color: "var(--color-primary)", marginBottom: "0.5rem", marginTop: 0 }}>
          {STEPS[step]}
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "var(--color-text-soft)", marginBottom: "2rem", marginTop: 0 }}>
          {step === 0 && "Let's start with the basics — tell us who you are."}
          {step === 1 && "How can we reach you? We'll use this to confirm your appointment."}
          {step === 2 && "A little more about you so we can prepare."}
          {step === 3 && "Everything look right? Review and submit when ready."}
        </p>

        {/* STEP 1 - Personal Info */}
        {step === 0 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="First Name" required>
                <input type="text" placeholder="First name" {...inp("firstName")} />
              </Field>
              <Field label="Last Name" required>
                <input type="text" placeholder="Last name" {...inp("lastName")} />
              </Field>
            </div>
            <Field label="Preferred Name">
              <input type="text" placeholder="What should we call you?" {...inp("preferredName")} />
            </Field>
            <Field label="Date of Birth" required>
              <input type="date" {...inp("dateOfBirth")} />
            </Field>
            <Field label="Pronouns">
              <select {...inp("pronouns")} style={{ ...inputStyle(focused, "pronouns"), appearance: "none" }}>
                <option value="">Select pronouns</option>
                <option>She / Her</option>
                <option>He / Him</option>
                <option>They / Them</option>
                <option>Ze / Zir</option>
                <option>Prefer not to say</option>
                <option>Not listed</option>
              </select>
            </Field>
          </div>
        )}

        {/* STEP 2 - Contact Info */}
        {step === 1 && (
          <div>
            <Field label="Email Address" required>
              <input type="email" placeholder="your@email.com" {...inp("email")} />
            </Field>
            <Field label="Phone Number">
              <input type="tel" placeholder="+1 (555) 000-0000" {...inp("phone")} />
            </Field>
            <Field label="Street Address">
              <input type="text" placeholder="123 Main St" {...inp("address")} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
              <Field label="City">
                <input type="text" placeholder="City" {...inp("city")} />
              </Field>
              <Field label="State">
                <input type="text" placeholder="ST" {...inp("state")} />
              </Field>
              <Field label="ZIP">
                <input type="text" placeholder="00000" {...inp("zip")} />
              </Field>
            </div>
            <Field label="Preferred Contact Method">
              <div style={{ display: "flex", gap: "1rem", fontFamily: "'DM Sans', sans-serif" }}>
                {["email", "phone", "text"].map(method => (
                  <label key={method} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text)", textTransform: "capitalize" }}>
                    <input type="radio" name="preferredContact" value={method} checked={form.preferredContact === method} onChange={set("preferredContact")} />
                    {method}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* STEP 3 - About You */}
        {step === 2 && (
          <div>
            <Field label="Primary Goal" required>
              <select {...inp("primaryGoal")} style={{ ...inputStyle(focused, "primaryGoal"), appearance: "none" }}>
                <option value="">Select your primary goal</option>
                <option>Stress & Anxiety Management</option>
                <option>Hormonal Balance</option>
                <option>Sleep Improvement</option>
                <option>Energy & Vitality</option>
                <option>Digestive Health</option>
                <option>Chronic Pain Management</option>
                <option>Mental Clarity & Focus</option>
                <option>General Wellness</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="How did you hear about us?">
              <select {...inp("hearAboutUs")} style={{ ...inputStyle(focused, "hearAboutUs"), appearance: "none" }}>
                <option value="">Select an option</option>
                <option>Friend or Family</option>
                <option>Google Search</option>
                <option>Social Media</option>
                <option>Healthcare Provider Referral</option>
                <option>Online Advertisement</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Anything else you'd like us to know?">
              <textarea
                placeholder="Share anything that might help us prepare for your visit..."
                value={form.additionalNotes}
                onChange={set("additionalNotes")}
                onFocus={() => setFocused("additionalNotes")}
                onBlur={() => setFocused(null)}
                rows={5}
                style={{ ...inputStyle(focused, "additionalNotes"), resize: "vertical" }}
              />
            </Field>
          </div>
        )}

        {/* STEP 4 - Confirm */}
        {step === 3 && (
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {[
              { title: "Personal Info", fields: [
                ["First Name", form.firstName], ["Last Name", form.lastName],
                ["Preferred Name", form.preferredName || "—"], ["Date of Birth", form.dateOfBirth],
                ["Pronouns", form.pronouns || "—"]
              ]},
              { title: "Contact Info", fields: [
                ["Email", form.email], ["Phone", form.phone || "—"],
                ["Address", [form.address, form.city, form.state, form.zip].filter(Boolean).join(", ") || "—"],
                ["Preferred Contact", form.preferredContact]
              ]},
              { title: "About You", fields: [
                ["Primary Goal", form.primaryGoal || "—"],
                ["Heard Via", form.hearAboutUs || "—"],
                ["Additional Notes", form.additionalNotes || "—"]
              ]},
            ].map(section => (
              <div key={section.title} style={{ marginBottom: "1.8rem", background: "var(--color-bg-soft)", borderRadius: "0.8rem", padding: "1.5rem", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "1rem" }}>{section.title}</div>
                {section.fields.map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.88rem" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                    <span style={{ color: "var(--color-text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                  </div>
                ))}
              </div>
            ))}
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              By submitting this form, you consent to being contacted by Luminal Journeys to schedule your appointment. Your information is kept private and never shared.
            </p>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingBottom: "3rem" }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} style={{
              background: "none", border: "1.5px solid var(--color-border)",
              color: "var(--color-text-soft)", padding: "0.75rem 1.8rem", borderRadius: "2rem",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem"
            }}>← Back</button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} style={{
              background: "var(--color-primary)", color: "#fff",
              padding: "0.85rem 2.4rem", borderRadius: "2rem", border: "none",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
              fontWeight: 600, transition: "all 0.2s"
            }}>Continue →</button>
          ) : (
            <button onClick={handleSubmit} style={{
              background: "var(--color-accent)", color: "#fff",
              padding: "0.85rem 2.4rem", borderRadius: "2rem", border: "none",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
              fontWeight: 600, transition: "all 0.2s"
            }}>Submit Intake ✦</button>
          )}
        </div>
      </div>
      <MockupBanner />
    </div>
  );
}