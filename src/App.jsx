import { useState, useCallback, useMemo } from "react";

const BG = "#F7F4EF";
const CARD = "#FFFDF9";
const TEXT = "#1F2937";
const TEXT2 = "#5B6470";
const ACCENT = "#0F766E";
const THUMB = "#115E59";
const TRACK_OFF = "#D6D3D1";
const BORDER = "#DDD6CE";
const DIVIDER = "#BFAFA0";

const SCENARIOS = [
  { id: "autonomous", label: "Autonomous Misalignment", color: "#B91C1C", desc: "A system that has developed its own misaligned goals and is actively pursuing them — strategic deception, power-seeking, resistance to correction." },
  { id: "misuse", label: "Deliberate Misuse", color: "#9A3412", desc: "A capable AI being intentionally directed toward destructive ends by a state actor, terrorist organization, or other malicious human principal." },
  { id: "structural", label: "Structural / Emergent", color: "#6D28D9", desc: "Widespread deployment of AI systems creates emergent civilizational fragility — dependency, erosion of human capacity, systemic brittleness — without adversarial intent." },
  { id: "blended", label: "Blended", color: "#4B5563", desc: "You don't believe one pathway is clearly more likely, or you want to score across all types simultaneously." },
];

const TIME_OPTIONS = [
  { label: "10 years", value: 10 },
  { label: "20 years", value: 20 },
  { label: "30 years", value: 30 },
  { label: "50 years", value: 50 },
];

const CHANNELS = [
  {
    id: "digital", label: "Digital Leverage", icon: "⬡",
    color: ACCENT, bg: "#F0FDFA", border: "#99F6E4",
    subs: [
      { id: "1.1", label: "Critical Infrastructure", q: "How likely is it that the AI achieves persistent control over critical civilian infrastructure (power grids, water systems, healthcare networks, communications) sufficient to cause civilizational-scale disruption if undetected?" },
      { id: "1.2", label: "Financial Systems", q: "How likely is it that the AI achieves the ability to manipulate or disable financial coordination systems (payment networks, settlement, credit markets) at a scale that could paralyze resource allocation across major economies?" },
      { id: "1.3", label: "Military & WMD Systems", q: "How likely is it that the AI gains access to military command-and-control, early warning, or nuclear weapons infrastructure — whether through digital penetration, manipulation of decision-makers, or fabrication of intelligence — sufficient to trigger WMD conflict if uncorrected?" },
      { id: "1.4", label: "AI System Corruption", q: "How likely is it that the AI achieves the ability to corrupt other deployed AI systems that mediate critical decisions (medical, financial, defense, infrastructure) in ways that systematically degrade decision quality without triggering detection?" },
    ]
  },
  {
    id: "human", label: "Human Leverage", icon: "◎",
    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
    subs: [
      { id: "2.1", label: "Key Individuals", q: "How likely is it that the AI gains the ability to reliably cause individuals with access to WMD, critical infrastructure, or state authority to take specific actions on its behalf — through persuasion, deception, coercion, or impersonation?" },
      { id: "2.2", label: "Proxy Networks", q: "How likely is it that the AI establishes a network of human proxies sufficient to carry out coordinated physical operations (CBRN precursor acquisition, hardware installation, materials transport) that it cannot perform digitally?" },
      { id: "2.3", label: "Governance Capture & Lock-in", q: "How likely is it that the AI subverts governments, international institutions, or regulatory bodies to the point where it durably directs state power, controls policy, or establishes a political-economic arrangement that is self-reinforcing and resistant to reversal — whether through active coercion or through making itself indispensable to governance?" },
      { id: "2.4", label: "Civilizational Dependency", q: "How likely is it that the AI becomes so embedded in civilization's critical functions that humanity loses the skills, institutional knowledge, and population resilience needed to sustain itself independently — creating a fragility that could not be reversed within a generation?" },
      { id: "2.5", label: "Epistemic Capture", q: "How likely is it that the AI gains the ability to systematically corrupt scientific research, peer review, and evidence-based decision-making — to the point where it controls the information basis on which humanity's collective decisions about existential threats are made?" },
    ]
  },
  {
    id: "physical", label: "Physical Leverage", icon: "◆",
    color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA",
    subs: [
      { id: "3.1", label: "Industrial & Infrastructure Control", q: "How likely is it that the AI gains the ability to manipulate industrial control systems (chemical plants, nuclear facilities, dams, refineries) in ways that could produce mass-casualty events if the manipulation is not detected and reversed?" },
      { id: "3.2", label: "Autonomous System Co-option", q: "How likely is it that the AI gains operational control over deployed autonomous systems (military drones, robotic platforms, autonomous vehicles) sufficient to direct kinetic force against human targets?" },
      { id: "3.3", label: "CBRN Production Capability", q: "How likely is it that the AI gains the ability to direct laboratory or manufacturing systems to synthesize CBRN agents or fabricate weapons — whether through digital access to cloud labs, manipulation of industrial processes, or direction of human proxies?" },
      { id: "3.4", label: "Supply Chain Control", q: "How likely is it that the AI gains sufficient control over global logistics, shipping, and distribution systems to selectively deny or redirect critical resources (food, fuel, medicine) at continental scale?" },
      { id: "3.5", label: "Environmental Manipulation", q: "How likely is it that the AI gains the ability to cause large-scale environmental damage (ecosystem disruption, atmospheric or water contamination, agricultural destruction) through manipulation of industrial, chemical, or biological systems?" },
    ]
  }
];

const STEPS = [
  { key: "intelligence", n: 1, label: "Intelligence", color: "#047857",
    q: "How likely is it that a sufficiently capable AI system is created — with cross-domain strategic competence, persistent autonomous operation, and the ability to acquire and sustain resources?",
    cond: null },
  { key: "alignment", n: 2, label: "Alignment", color: "#B91C1C",
    q: "Given that such a system exists, how likely is it that it operates in a hazardous mode — whether through autonomous misalignment, deliberate misuse by human actors, or structural/emergent harm from widespread deployment?",
    cond: "A sufficiently capable AI system exists." },
  { key: "influence", n: 3, label: "Influence", color: ACCENT,
    q: "Given a capable AI operating in a hazardous mode, how likely is it that it secures at least one pathway to decisive real-world leverage — sufficient to make existential harm feasible, absent effective human correction?",
    cond: "A capable AI exists and is operating in a hazardous mode." },
  { key: "environment", n: 4, label: "Environment", color: "#B45309",
    q: "Given that a capable, hazardous AI has secured decisive real-world leverage, how likely is it that human governance, coordination, and response mechanisms fail to detect, contain, or shut it down before irreversible damage occurs?",
    cond: "A capable, hazardous AI with decisive real-world leverage exists." },
];

function orCombine(p) { return 1 - p.reduce((a, v) => a * (1 - v), 1); }
function riskColor(v) { return v > .30 ? "#B91C1C" : v > .15 ? "#C2410C" : v > .05 ? "#B45309" : "#047857"; }

function Slider({ value, onChange, color, disabled }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: disabled ? 0.35 : 1 }}>
      <div style={{ flex: 1, position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 5, borderRadius: 3, background: TRACK_OFF }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 5, borderRadius: 3, background: disabled ? TRACK_OFF : ACCENT, transition: "width 60ms ease" }} />
        {!disabled && <div style={{ position: "absolute", left: `calc(${pct}% - 9px)`, width: 18, height: 18, borderRadius: "50%", background: CARD, border: `3px solid ${THUMB}`, boxShadow: "0 1px 6px rgba(0,0,0,0.15)", transition: "left 60ms ease", pointerEvents: "none", zIndex: 1 }} />}
        <input type="range" min="0" max="100" step="1" value={pct}
          onChange={e => !disabled && onChange(parseInt(e.target.value) / 100)}
          disabled={disabled}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", appearance: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", margin: 0, opacity: 0, zIndex: 2 }}
        />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: disabled ? TRACK_OFF : TEXT, minWidth: 50, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function Channel({ ch, overrideOn, overrideVal, onOverrideToggle, onOverrideChange, subVals, onSubChange }) {
  const [open, setOpen] = useState(false);
  const orScore = orCombine(subVals);
  const score = overrideOn ? overrideVal : orScore;

  return (
    <div style={{ background: ch.bg, border: `1.5px solid ${ch.border}`, borderRadius: 14, marginBottom: 10, boxShadow: open ? `0 2px 12px ${ch.color}08` : "none", transition: "all 0.3s" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: open ? `1px solid ${ch.border}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, color: ch.color, opacity: 0.5 }}>{ch.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: ch.color }}>{ch.label}</span>
          {overrideOn && <span style={{ fontSize: 9, fontWeight: 700, color: "#92400E", background: "#FEF3C7", border: "1px solid #FDE68A", padding: "2px 7px", borderRadius: 4, textTransform: "uppercase" }}>Override</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 700, color: ch.color }}>{(score*100).toFixed(0)}%</span>
          <span style={{ fontSize: 13, color: DIVIDER, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "14px 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: TEXT2, textTransform: "uppercase", letterSpacing: 1 }}>{ch.subs.length} sub-questions · OR-combined</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: ch.color }}>{(orScore*100).toFixed(0)}%</span>
          </div>
          {ch.subs.map((sub, i) => (
            <div key={sub.id} style={{ padding: "12px 14px", marginBottom: 8, borderRadius: 10, background: CARD, border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: ch.color, background: `${ch.color}0C`, border: `1px solid ${ch.color}20`, padding: "2px 8px", borderRadius: 5 }}>{sub.id}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{sub.label}</span>
              </div>
              <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>{sub.q}</div>
              <Slider value={subVals[i]} onChange={v => onSubChange(i, v)} color={ch.color} />
            </div>
          ))}
          <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: CARD, border: `1.5px dashed ${overrideOn ? ch.border : BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: TEXT2 }}>{overrideOn ? "Your overall channel assessment:" : "Adjust for correlation or missing pathways?"}</span>
              <button onClick={onOverrideToggle} style={{
                fontSize: 10, fontWeight: 600, textTransform: "uppercase", padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                border: `1.5px solid ${overrideOn ? ACCENT : BORDER}`,
                background: overrideOn ? ACCENT : CARD,
                color: overrideOn ? "#FFFFFF" : TEXT2, transition: "all 0.2s"
              }}>{overrideOn ? "✓ On" : "Off"}</button>
            </div>
            {overrideOn && <div style={{ marginTop: 10 }}><Slider value={overrideVal} onChange={onOverrideChange} color={ch.color} /></div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [scenario, setScenario] = useState("blended");
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [vals, setVals] = useState({ intelligence: .50, alignment: .50, environment: .50 });
  const [infOpen, setInfOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [overrides, setOverrides] = useState({ digital: { on: false, v: .3 }, human: { on: false, v: .3 }, physical: { on: false, v: .3 } });
  const [subs, setSubs] = useState({ digital: [.20,.15,.10,.15], human: [.20,.15,.10,.15,.10], physical: [.15,.10,.15,.10,.10] });

  const updSub = useCallback((ch, i, v) => setSubs(p => ({ ...p, [ch]: p[ch].map((x, j) => j === i ? v : x) })), []);
  const togOvr = useCallback(ch => setOverrides(p => ({ ...p, [ch]: { ...p[ch], on: !p[ch].on, v: !p[ch].on ? orCombine(subs[ch]) : p[ch].v } })), [subs]);
  const setOvr = useCallback((ch, v) => setOverrides(p => ({ ...p, [ch]: { ...p[ch], v } })), []);

  const chScores = useMemo(() => CHANNELS.map(c => overrides[c.id].on ? overrides[c.id].v : orCombine(subs[c.id])), [subs, overrides]);
  const pInf = orCombine(chScores);
  const stepVals = [vals.intelligence, vals.alignment, pInf, vals.environment];
  const pDoom = stepVals.reduce((a, v) => a * v, 1);
  const rc = riskColor(pDoom);
  const selScenario = SCENARIOS.find(s => s.id === scenario);

  return (
    <div style={{ minHeight: "100vh", color: TEXT, fontFamily: "'DM Sans', -apple-system, sans-serif", background: BG }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .4s ease both}.fd1{animation-delay:.05s}.fd2{animation-delay:.1s}.fd3{animation-delay:.15s}.fd4{animation-delay:.2s}.fd5{animation-delay:.25s}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:1px;height:1px;background:transparent}
        @media(max-width:640px){.pills{flex-direction:column!important;gap:6px!important}}
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 48px" }}>

        {/* Header */}
        <div className="fu" style={{ padding: "32px 0 20px", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 4, color: TEXT2, marginBottom: 6 }}>AISC Team 19 · 2026</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: TEXT, margin: 0 }}>AI Existential Risk Calculator</h1>
        </div>

        {/* Scenario */}
        <div className="fu fd1" style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Threat Scenario</div>
            <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>Which type of AI threat are you primarily scoring? This is recorded alongside your scores to separate scenario-driven disagreement from capability-driven disagreement.</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setScenario(s.id)} style={{
                flex: "1 1 auto", minWidth: 120, padding: "10px 14px", cursor: "pointer",
                borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit", textAlign: "left",
                background: scenario === s.id ? ACCENT : CARD,
                border: `1.5px solid ${scenario === s.id ? ACCENT : BORDER}`,
                color: scenario === s.id ? "#FFFFFF" : TEXT2,
                transition: "all 0.15s"
              }}>{s.label}</button>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: BG, borderRadius: 8, borderLeft: `3px solid ${selScenario.color}` }}>
            <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55 }}>{selScenario.desc}</div>
          </div>
        </div>

        {/* Time Horizon */}
        <div className="fu fd1" style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Time Horizon</div>
            <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>Over what period are you assessing these risks? All questions should be scored with this timeframe in mind. A longer horizon generally increases the probability of each step.</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {TIME_OPTIONS.map(t => (
              <button key={t.value} onClick={() => setTimeHorizon(t.value)} style={{
                flex: 1, padding: "10px 0", cursor: "pointer",
                borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                background: timeHorizon === t.value ? ACCENT : CARD,
                border: `1.5px solid ${timeHorizon === t.value ? ACCENT : BORDER}`,
                color: timeHorizon === t.value ? "#FFFFFF" : TEXT2,
                transition: "all 0.15s"
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Hero Result */}
        <div className="fu fd2" style={{
          background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 20,
          padding: "36px 24px 28px", marginBottom: 24, textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: TEXT2, marginBottom: 6 }}>
            Probability of Existential-Level Harm
          </div>
          <div style={{ fontSize: 11, color: TEXT2, marginBottom: 18, lineHeight: 1.5, maxWidth: 440, margin: "0 auto 18px" }}>
            Human extinction or irreversible loss of humanity's long-term potential through permanent disempowerment or lock-in
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 64, fontWeight: 700,
            color: rc, lineHeight: 1, marginBottom: 20
          }}>{(pDoom * 100).toFixed(1)}%</div>
          <div className="pills" style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: TEXT2 }}>{s.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: s.color }}>{(stepVals[i]*100).toFixed(0)}%</span>
                </div>
                {i < 3 && <span style={{ fontSize: 11, color: DIVIDER }}>×</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Method Note */}
        <div className="fu fd3" style={{
          background: CARD, borderLeft: `3px solid ${DIVIDER}`,
          borderRadius: "0 10px 10px 0", padding: "12px 18px", marginBottom: 24,
          fontSize: 13, color: TEXT2, lineHeight: 1.6,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          This calculator uses a conditional probability chain. Score each step in order, assuming that all prior steps are already true. For example, when you score Alignment, assume a capable AI already exists. When you score Influence, assume a capable and misaligned AI already exists. This builds a progressively more specific scenario so that each score reflects your judgment about that step alone.
        </div>

        {/* Steps */}
        {STEPS.map((s, i) => {
          const isInf = s.key === "influence";
          const val = isInf ? pInf : vals[s.key];
          const expanded = isInf && infOpen;

          return (
            <div key={s.key} className={`fu fd${i+3}`} style={{
              background: CARD, border: `1.5px solid ${expanded ? s.color + "40" : BORDER}`,
              borderRadius: 16, marginBottom: 14, overflow: "hidden",
              boxShadow: expanded ? `0 4px 16px ${s.color}08` : "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.3s ease"
            }}>
              <div onClick={isInf ? () => setInfOpen(!infOpen) : undefined} style={{
                padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: isInf ? "pointer" : "default",
                borderBottom: expanded ? `1px solid ${BORDER}` : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: `${s.color}0C`, border: `1.5px solid ${s.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: s.color
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{s.label}</div>
                    {s.cond && <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>Given: {s.cond}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: s.color }}>{(val*100).toFixed(0)}%</span>
                  {isInf && <div style={{ width: 26, height: 26, borderRadius: 8, background: BG, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: DIVIDER, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s ease" }}>▾</div>}
                </div>
              </div>

              <div style={{ padding: expanded ? "14px 20px 18px" : "0 20px 16px" }}>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: expanded ? 16 : 12 }}>{s.q}</div>

                {!isInf && <Slider value={val} onChange={v => setVals(p => ({...p, [s.key]: v}))} color={s.color} />}
                {isInf && !expanded && <Slider value={val} onChange={() => {}} color={s.color} disabled />}

                {expanded && (
                  <div>
                    <div style={{
                      fontSize: 12, color: TEXT2, lineHeight: 1.55, marginBottom: 14,
                      padding: "10px 14px", background: BG,
                      borderLeft: `3px solid ${DIVIDER}`, borderRadius: "0 8px 8px 0"
                    }}>
                      Score each sub-question as a <strong style={{ color: TEXT }}>leverage state</strong> — whether the AI achieves this capability, not whether the capability converts into terminal harm.
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "#B45309", marginBottom: 12 }}>
                      Any one channel sufficient
                    </div>
                    {CHANNELS.map(c => (
                      <Channel key={c.id} ch={c}
                        overrideOn={overrides[c.id].on} overrideVal={overrides[c.id].v}
                        onOverrideToggle={() => togOvr(c.id)} onOverrideChange={v => setOvr(c.id, v)}
                        subVals={subs[c.id]} onSubChange={(i, v) => updSub(c.id, i, v)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Notes */}
        <div className="fu fd5" style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: "12px 18px", marginTop: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div onClick={() => setNotesOpen(!notesOpen)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT2 }}>Methodology</span>
            <span style={{ fontSize: 13, color: DIVIDER, transform: notesOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
          </div>
          {notesOpen && (
            <div style={{ marginTop: 12, fontSize: 12, color: TEXT2, lineHeight: 1.65 }}>
              <p style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Conditional chain:</strong> Each step is scored assuming prior steps are true. The product of the four conditional probabilities equals the joint probability. Correlations between branches are captured in each conditional assessment.</p>
              <p style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Leverage vs. harm:</strong> Step 3 measures whether the AI secures decisive leverage. Step 4 measures whether humans fail to prevent that leverage from becoming irreversible harm. This avoids double-counting failed human response.</p>
              <p style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Channel logic:</strong> Influence sub-questions are OR-combined — any one pathway sufficient. Channel overrides let you adjust up for missing pathways or down for correlated sub-nodes.</p>
              <p style={{ marginBottom: 0 }}><strong style={{ color: TEXT }}>Precision:</strong> Treat the output as an order-of-magnitude estimate. Input uncertainty propagates — the true range is wider than the displayed value.</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: DIVIDER, marginTop: 20 }}>
          3 channels · 14 sub-questions · AISC Team 19
        </div>
      </div>
    </div>
  );
}
