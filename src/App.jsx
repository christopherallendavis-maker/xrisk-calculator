import { useState, useCallback, useMemo } from "react";

// ═══ PALETTE ═══
const BG = "#FEFDFB";
const CARD = "#FEFDFB";
const TEXT = "#111827";
const TEXT2 = "#4B5563";
const ACCENT = "#111827";
const ACCENT_LIGHT = "#F3F2F0";
const TRACK_OFF = "#E5E2DC";
const BORDER = "#E5E2DC";
const RULE = "#D1CEC8";
const MUTED = "#6B7280";

// ═══ FONT ═══
const SANS = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const SCENARIOS = [
  { id: "autonomous", label: "Autonomous Misalignment", desc: "A system that has developed its own misaligned goals and is actively pursuing them, including strategic deception, power-seeking, and resistance to correction." },
  { id: "misuse", label: "Deliberate Misuse", desc: "A capable AI being intentionally directed toward destructive ends by a state actor, terrorist organization, or other malicious human principal." },
  { id: "structural", label: "Structural / Emergent", desc: "Widespread deployment of AI systems creates emergent civilizational fragility, including dependency, erosion of human capacity, and systemic brittleness, without adversarial intent." },
  { id: "blended", label: "Blended", desc: "You don't believe one pathway is clearly more likely, or you want to score across all types simultaneously." },
];

const TIME_OPTIONS = [
  { label: "10 yrs", value: 10 },
  { label: "20 yrs", value: 20 },
  { label: "30 yrs", value: 30 },
  { label: "50 yrs", value: 50 },
];

const BRANCHES = [
  {
    key: "intelligence", n: 1, label: "Intelligence", color: "#047857",
    q: "How likely is it that a sufficiently capable AI system is created, with cross-domain strategic competence, persistent autonomous operation, and the ability to acquire and sustain resources?",
    cond: null, gate: "AND",
    tier2: [
      { id: "cognitive", label: "Cognitive Competence",
        q: "How likely is it that an AI system achieves cognitive performance matching or exceeding top humans in at least one strategically decisive domain?",
        tier3: null },
      { id: "goals", label: "Goal-Directed Behavior",
        q: "How likely is it that an AI system exhibits stable preference ordering and behaves as if persistently pursuing goals across extended time horizons?",
        tier3: null },
      { id: "resources", label: "Resource Acquisition",
        q: "How likely is it that an AI system can acquire and sustain the resources needed for continued operation, including compute, energy, financial resources, information, and strategic position?",
        tier3: null },
    ]
  },
  {
    key: "alignment", n: 2, label: "Alignment", color: "#B91C1C",
    q: "Given that such a system exists, how likely is it that it operates in a hazardous mode, whether through autonomous misalignment, deliberate misuse by human actors, or structural/emergent harm from widespread deployment?",
    cond: "A sufficiently capable AI system exists.", gate: "OR",
    tier2: [
      { id: "auto_misalign", label: "Autonomous Misalignment",
        q: "How likely is it that the system develops or retains objectives that diverge from human survival, through deceptive alignment, goal drift, mesa-optimization, or emergent power-seeking?",
        tier3: null },
      { id: "misuse", label: "Deliberate Misuse",
        q: "How likely is it that a human actor (state, organization, or individual) intentionally directs the system toward destructive ends at existential scale?",
        tier3: null },
      { id: "structural", label: "Structural / Emergent Harm",
        q: "How likely is it that widespread deployment creates emergent systemic fragility, through concentration of power, erosion of human capacity, or compounding second-order effects, without any actor intending catastrophe?",
        tier3: null },
    ]
  },
  {
    key: "influence", n: 3, label: "Influence", color: "#7C3AED",
    q: "Given a hazardous AI deployment, how likely is it that at least one pathway to decisive real-world leverage is secured, sufficient to make existential harm feasible absent effective human correction?",
    cond: "A capable AI exists and is misaligned.", gate: "OR",
    guidance: "Under misuse scenarios where the human actor already has physical access to execute, the Influence bottleneck is reduced. Score Influence based on how much additional real-world reach the AI provides beyond what the actor already has. If the actor already has everything they need except the knowledge (which is scored in Step 1), Influence may be high.",
    tier2: [
      { id: "systems", label: "Digital or Physical Systems Leverage",
        q: "How likely is it that the AI can achieve (or enable malicious human actors to achieve) a level of infiltration and control over digital and physical systems (including critical infrastructure, financial systems, military networks, industrial controls, CBRN capability) sufficient to cause existential-level harm?",
        tier3: [
          { id: "s1", label: "Critical Systems & Logistics", q: "How likely is it that persistent control is achieved over the systems that sustain civilizational function, including power grids, water systems, healthcare networks, communications, industrial facilities (chemical plants, nuclear facilities, dams, refineries), and the logistics networks that distribute food, fuel, and medicine, sufficient to cause civilizational-scale disruption, mass-casualty events, irreversible environmental contamination, or catastrophic resource shortages across multiple major regions?" },
          { id: "s2", label: "Financial Systems", q: "How likely is it that the ability to manipulate or disable financial coordination systems (payment networks, settlement, credit markets) is achieved at a scale that could paralyze resource allocation across major economies?" },
          { id: "s3", label: "Military & Weapons Systems", q: "How likely is it that sufficient access to military command-and-control, early warning, nuclear weapons infrastructure, or autonomous weapons platforms is achieved to trigger WMD conflict or project catastrophic force against populations or critical assets?" },
          { id: "s4", label: "CBRN Production", q: "How likely is it that the ability to direct laboratory or manufacturing systems to synthesize chemical, biological, radiological, or nuclear agents is achieved, whether through digital access to cloud labs, manipulation of industrial processes, or direction of human proxies?" },
        ]
      },
      { id: "human", label: "Human Leverage",
        q: "How likely is it that the AI can achieve (or enable malicious human actors to achieve) a level of influence over human behavior through persuasion, deception, coercion, impersonation, dependency creation, or recruitment sufficient to cause existential-level harm?",
        tier3: [
          { id: "h1", label: "Direct Human Action", q: "How likely is it that specific individuals or coordinated groups are influenced, recruited, deceived, or coerced into carrying out actions with catastrophic consequences, whether through manipulation of high-leverage decision-makers (political leaders, military commanders, infrastructure operators, scientists) or through recruitment and direction of proxy networks capable of executing physical operations?" },
          { id: "h2", label: "Institutional Capture", q: "How likely is it that sufficient influence over governments, regulators, militaries, major firms, or other key institutions is attained to durably steer institutional power in catastrophically harmful directions, whether through direct subversion or through making AI systems indispensable to institutional function?" },
          { id: "h3", label: "Erosion of Human Autonomy & Judgment", q: "How likely is it that human capacity for independent action and accurate collective reasoning is sufficiently degraded, through civilizational dependency on AI systems, corruption of the information environment, or erosion of the skills and institutional knowledge needed for self-governance, that humanity can no longer identify existential threats, coordinate effective responses, or sustain itself independently?" },
        ]
      },
    ]
  },
  {
    key: "environment", n: 4, label: "Environment", color: "#B45309",
    q: "Given that a capable, misaligned AI has secured decisive real-world leverage, how likely is it that human governance, coordination, and response mechanisms fail to detect, contain, or shut it down before irreversible damage occurs?",
    cond: "A capable, misaligned AI with decisive real-world leverage exists.", gate: "OR",
    tier2: [
      { id: "detection", label: "Detection Failure",
        q: "How likely is it that the threat is not recognized in time because the system's behavior is opaque, actively concealed, or normalized through gradual escalation?",
        tier3: null },
      { id: "willingness", label: "Willingness Failure",
        q: "How likely is it that even once detected, economic incentives, political dynamics, regulatory capture, or race conditions suppress corrective action?",
        tier3: null },
      { id: "capability", label: "Capability Failure",
        q: "How likely is it that alignment is technically intractable for the system in question, that the system exceeds human ability to correct, outruns response speed, or is too deeply integrated to safely remove?",
        tier3: null },
      { id: "coordination", label: "Coordination Failure",
        q: "How likely is it that geopolitical competition, institutional fragmentation, secrecy between actors, or lack of global governance prevents the coordinated response needed to contain the threat?",
        tier3: null },
    ]
  },
];

function orCombine(p) { return 1 - p.reduce((a, v) => a * (1 - v), 1); }
function andCombine(p) { return p.reduce((a, v) => a * v, 1); }
function riskColor(v) { return v > .30 ? "#991B1B" : v > .15 ? "#92400E" : v > .05 ? "#78350F" : "#064E3B"; }

// ═══ PURE ANALYSIS FUNCTIONS ═══

function getSubScorePure(sub, t2, t2Mode, t3) {
  if (t2Mode[sub.id] === "breakdown" && sub.tier3 && t3[sub.id]) return orCombine(t3[sub.id]);
  return t2[sub.id];
}

function getBranchScorePure(branch, branchMode, direct, t2, t2Mode, t3) {
  if (branchMode[branch.key] === "direct") return direct[branch.key];
  const subScores = branch.tier2.map(sub => getSubScorePure(sub, t2, t2Mode, t3));
  return branch.gate === "AND" ? andCombine(subScores) : orCombine(subScores);
}

function computePDoomPure(branchMode, direct, t2, t2Mode, t3) {
  return BRANCHES.map(b => getBranchScorePure(b, branchMode, direct, t2, t2Mode, t3))
    .reduce((a, v) => a * v, 1);
}

function enumerateActiveAssumptions(branchMode, t2Mode) {
  const result = [];
  for (const branch of BRANCHES) {
    if (branchMode[branch.key] === "direct") {
      result.push({ id: branch.key, type: "branch", label: branch.label, branchKey: branch.key, color: branch.color });
    } else {
      for (const sub of branch.tier2) {
        if (t2Mode[sub.id] === "breakdown" && sub.tier3 && sub.tier3.length > 0) {
          for (const t3Item of sub.tier3) {
            result.push({ id: t3Item.id, type: "t3", parentId: sub.id, label: `${sub.label}: ${t3Item.label}`, branchKey: branch.key, color: branch.color });
          }
        } else {
          result.push({ id: sub.id, type: "t2", parentId: branch.key, label: sub.label, branchKey: branch.key, color: branch.color });
        }
      }
    }
  }
  return result;
}

function getAssumptionValue(assumption, direct, t2, t3) {
  if (assumption.type === "branch") return direct[assumption.id];
  if (assumption.type === "t2") return t2[assumption.id];
  if (assumption.type === "t3") {
    const parentT3 = t3[assumption.parentId];
    const branch = BRANCHES.find(b => b.key === assumption.branchKey);
    const sub = branch.tier2.find(s => s.id === assumption.parentId);
    const idx = sub.tier3.findIndex(t => t.id === assumption.id);
    return parentT3[idx];
  }
  return 0;
}

function perturbAndCompute(assumption, delta, branchMode, direct, t2, t2Mode, t3) {
  const perturb = (d) => {
    const dClone = { ...direct };
    const t2Clone = { ...t2 };
    const t3Clone = {};
    for (const k of Object.keys(t3)) t3Clone[k] = [...t3[k]];

    if (assumption.type === "branch") {
      dClone[assumption.id] = Math.max(0, Math.min(1, direct[assumption.id] + d));
    } else if (assumption.type === "t2") {
      t2Clone[assumption.id] = Math.max(0, Math.min(1, t2[assumption.id] + d));
    } else if (assumption.type === "t3") {
      const branch = BRANCHES.find(b => b.key === assumption.branchKey);
      const sub = branch.tier2.find(s => s.id === assumption.parentId);
      const idx = sub.tier3.findIndex(t => t.id === assumption.id);
      t3Clone[assumption.parentId][idx] = Math.max(0, Math.min(1, t3[assumption.parentId][idx] + d));
    }
    return computePDoomPure(branchMode, dClone, t2Clone, t2Mode, t3Clone);
  };
  return { upPDoom: perturb(delta), downPDoom: perturb(-delta) };
}

function computeSensitivityReport(branchMode, direct, t2, t2Mode, t3, delta = 0.05) {
  const assumptions = enumerateActiveAssumptions(branchMode, t2Mode);
  const basePDoom = computePDoomPure(branchMode, direct, t2, t2Mode, t3);
  return assumptions.map(a => {
    const currentValue = getAssumptionValue(a, direct, t2, t3);
    const { upPDoom, downPDoom } = perturbAndCompute(a, delta, branchMode, direct, t2, t2Mode, t3);
    const sensitivity = Math.abs(upPDoom - downPDoom);
    return { ...a, currentValue, sensitivity, upPDoom, downPDoom, basePDoom };
  }).sort((a, b) => b.sensitivity - a.sensitivity);
}

function summarizeDrivingAssumptions(report) {
  return report.slice(0, 3).map(item => {
    const dir = item.upPDoom > item.downPDoom ? "raises" : "lowers";
    const delta = Math.abs(item.upPDoom - item.basePDoom) * 100;
    return {
      ...item,
      direction: dir,
      impactPp: delta,
      summary: `Shifting ±5pp ${dir} P(doom) by ~${delta.toFixed(1)}pp`,
    };
  });
}

function computeCruxView(report) {
  return report.map(item => {
    const uncertaintyFactor = 1.0 - 2 * Math.abs(item.currentValue - 0.5);
    const cruxScore = item.sensitivity * (0.6 + 0.4 * uncertaintyFactor);
    const conviction = item.currentValue <= 0.2 || item.currentValue >= 0.8
      ? "High conviction" : item.currentValue <= 0.35 || item.currentValue >= 0.65
      ? "Moderate conviction" : "Low conviction";
    return { ...item, cruxScore, uncertaintyFactor, conviction };
  }).sort((a, b) => b.cruxScore - a.cruxScore);
}

// ═══ Editable text component ═══
function EditableText({ text, onEdit, style }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={e => {
        const newText = e.target.innerText.trim();
        if (newText !== text) onEdit(newText);
      }}
      style={{
        ...style,
        outline: "none",
        borderRadius: 3,
        padding: "2px 0",
        transition: "background 0.2s",
        cursor: "text",
      }}
      onFocus={e => { e.target.style.background = ACCENT_LIGHT; }}
      onMouseOver={e => { if (document.activeElement !== e.target) e.target.style.background = `${ACCENT_LIGHT}80`; }}
      onMouseOut={e => { if (document.activeElement !== e.target) e.target.style.background = "transparent"; }}
      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.blur(); } }}
    >
      {text}
    </div>
  );
}

function Slider({ value, onChange, disabled }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: disabled ? 0.3 : 1 }}>
      <div style={{ flex: 1, position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 2, background: TRACK_OFF }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 2, background: disabled ? TRACK_OFF : ACCENT, transition: "width 60ms ease" }} />
        {!disabled && <div style={{ position: "absolute", left: `calc(${pct}% - 7px)`, width: 14, height: 14, borderRadius: "50%", background: CARD, border: `2.5px solid ${ACCENT}`, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", transition: "left 60ms ease", pointerEvents: "none", zIndex: 1 }} />}
        <input type="range" min="0" max="100" step="1" value={pct}
          onChange={e => !disabled && onChange(parseInt(e.target.value) / 100)}
          disabled={disabled}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", appearance: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", margin: 0, opacity: 0, zIndex: 2 }}
        />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: disabled ? MUTED : TEXT, minWidth: 50, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function Tier3Panel({ tier3, scores, onChange, qEdits, onEditQ }) {
  const orScore = orCombine(scores);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: MUTED, letterSpacing: 0.5 }}>{tier3.length} sub-questions · OR-combined</span>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: TEXT }}>{(orScore*100).toFixed(0)}%</span>
      </div>
      {tier3.map((node, i) => (
        <div key={node.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: ACCENT, background: ACCENT_LIGHT, padding: "3px 8px", borderRadius: 3 }}>{node.id}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{node.label}</span>
          </div>
          <EditableText
            text={qEdits[node.id] || node.q}
            onEdit={v => onEditQ(node.id, v)}
            style={{ fontSize: 13, color: TEXT2, lineHeight: 1.65, marginBottom: 10 }}
          />
          <Slider value={scores[i]} onChange={v => onChange(i, v)} />
          {i < tier3.length - 1 && <div style={{ height: 1, background: RULE, marginTop: 14, opacity: 0.5 }} />}
        </div>
      ))}
    </div>
  );
}

function Tier2Sub({ sub, directScore, onDirectChange, tier3Scores, onTier3Change, mode, onToggleMode, qEdits, onEditQ }) {
  const hasTier3 = sub.tier3 && sub.tier3.length > 0;
  const effectiveScore = mode === "breakdown" && hasTier3 ? orCombine(tier3Scores) : directScore;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{sub.label}</span>
        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: TEXT }}>{(effectiveScore*100).toFixed(0)}%</span>
      </div>
      <EditableText
        text={qEdits[sub.id] || sub.q}
        onEdit={v => onEditQ(sub.id, v)}
        style={{ fontSize: 13, color: TEXT2, lineHeight: 1.65, marginBottom: 12 }}
      />

      {mode === "direct" && <Slider value={directScore} onChange={onDirectChange} />}
      {mode === "breakdown" && <Slider value={effectiveScore} onChange={() => {}} disabled />}

      {hasTier3 && (
        <div style={{ marginTop: 10 }}>
          <span onClick={onToggleMode} style={{
            fontSize: 13, fontWeight: 600, color: ACCENT, cursor: "pointer",
            borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1
          }}>{mode === "breakdown" ? "Score directly instead" : "Break it down"}</span>
        </div>
      )}

      {!hasTier3 && (
        <div style={{ marginTop: 8, fontSize: 12, color: MUTED, fontStyle: "italic" }}>Sub-questions to be developed</div>
      )}

      {mode === "breakdown" && hasTier3 && (
        <div style={{ marginLeft: 16, paddingLeft: 16, borderLeft: `1px solid ${RULE}`, marginTop: 14 }}>
          <Tier3Panel tier3={sub.tier3} scores={tier3Scores} onChange={onTier3Change} qEdits={qEdits} onEditQ={onEditQ} />
        </div>
      )}

      <div style={{ height: 1, background: RULE, marginTop: 18 }} />
    </div>
  );
}

// ═══ ANALYSIS UI COMPONENTS ═══

function CollapsiblePanel({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <div onClick={() => setOpen(!open)} style={{
        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 0", borderBottom: open ? `1px solid ${RULE}` : "none"
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{title}</span>
        <span style={{ fontSize: 14, color: MUTED, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
      </div>
      {open && <div style={{ paddingTop: 12 }}>{children}</div>}
    </div>
  );
}

function SensitivityReportPanel({ items, drivingItems }) {
  if (items.length === 0) return null;
  const maxSens = Math.max(...items.map(i => i.sensitivity), 0.001);
  const drivingIds = new Set(drivingItems.map(d => d.id));
  return (
    <CollapsiblePanel title="Sensitivity Report" defaultOpen={true}>
      <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 12 }}>
        Each assumption perturbed ±5 percentage points. Bar width shows how much P(doom) changes.
      </div>
      {items.map(item => {
        const barPct = (item.sensitivity / maxSens) * 100;
        const isDriving = drivingIds.has(item.id);
        const drivingItem = isDriving ? drivingItems.find(d => d.id === item.id) : null;
        return (
          <div key={item.id} style={{
            marginBottom: isDriving ? 14 : 10,
            padding: isDriving ? "10px 12px" : "0",
            background: isDriving ? ACCENT_LIGHT : "transparent",
            borderRadius: isDriving ? 4 : 0,
            borderLeft: isDriving ? `3px solid ${item.color}` : "none"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
              <span style={{ fontSize: isDriving ? 13 : 12, fontWeight: 600, color: TEXT, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              <span style={{ fontSize: 11, color: MUTED, fontFamily: MONO }}>{(item.currentValue * 100).toFixed(0)}% · Δ{(item.sensitivity * 100).toFixed(2)}pp</span>
            </div>
            <div style={{ width: "100%", height: 6, background: TRACK_OFF, borderRadius: 3 }}>
              <div style={{ width: `${barPct}%`, height: 6, background: item.color, borderRadius: 3, transition: "width 0.3s" }} />
            </div>
            {drivingItem && (
              <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, marginTop: 6 }}>
                {drivingItem.summary}
              </div>
            )}
          </div>
        );
      })}
    </CollapsiblePanel>
  );
}

function CruxViewPanel({ items }) {
  if (items.length === 0) return null;
  const topCruxes = items.slice(0, 5);
  return (
    <CollapsiblePanel title="Crux View" defaultOpen={false}>
      <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 12 }}>
        Assumptions where sensitivity and genuine uncertainty overlap. Assumptions you hold with extreme confidence are weighted lower even if they are influential.
      </div>
      {topCruxes.map(item => (
        <div key={item.id} style={{
          marginBottom: 10, padding: "10px 12px", borderRadius: 4,
          background: ACCENT_LIGHT,
          border: `1px solid ${BORDER}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{item.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: item.color, fontFamily: MONO }}>{(item.currentValue * 100).toFixed(0)}%</span>
          </div>
          <div style={{ fontSize: 12, color: TEXT2 }}>
            {item.conviction} · Sensitivity Δ{(item.sensitivity * 100).toFixed(2)}pp
          </div>
        </div>
      ))}
    </CollapsiblePanel>
  );
}

function BranchContent({ branch, score, expanded, direct, setDirect, branchMode, setBranchMode, t2, setT2Score, t2Mode, toggleT2Mode, t3, setT3Score, qEdits, editQ }) {
  return (
    <div>
      {branch.cond && (
        <div style={{ fontSize: 13, fontWeight: 500, color: branch.color, marginBottom: 14 }}>
          Assuming: {branch.cond}
        </div>
      )}

      <EditableText
        text={qEdits[branch.key] || branch.q}
        onEdit={v => editQ(branch.key, v)}
        style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.7, marginBottom: 24 }}
      />

      {branch.guidance && (
        <div style={{
          fontSize: 13, color: TEXT2, lineHeight: 1.65, marginBottom: 20,
          padding: "12px 14px", background: ACCENT_LIGHT, borderLeft: `3px solid ${branch.color}`,
          borderRadius: "0 4px 4px 0"
        }}>
          <strong style={{ color: TEXT, fontWeight: 600 }}>Scoring guidance:</strong> {branch.guidance}
        </div>
      )}

      {!expanded && (
        <Slider value={direct[branch.key]} onChange={v => setDirect(p => ({...p, [branch.key]: v}))} />
      )}
      {expanded && (
        <Slider value={score} onChange={() => {}} disabled />
      )}

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span onClick={() => setBranchMode(p => ({...p, [branch.key]: expanded ? "direct" : "expand"}))} style={{
          fontSize: 13, fontWeight: 600, color: ACCENT, cursor: "pointer",
          borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1
        }}>{expanded ? "Score directly instead" : "Break it down"}</span>
        {expanded && (
          <span style={{ fontSize: 12, color: MUTED, letterSpacing: 0.5 }}>
            {branch.gate === "AND" ? "All required (AND)" : "Any one sufficient (OR)"}
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 24 }}>
          <div style={{ height: 1, background: RULE, marginBottom: 20 }} />
          {branch.tier2.map(sub => (
            <Tier2Sub
              key={sub.id}
              sub={sub}
              directScore={t2[sub.id]}
              onDirectChange={v => setT2Score(sub.id, v)}
              tier3Scores={t3[sub.id] || []}
              onTier3Change={(i, v) => setT3Score(sub.id, i, v)}
              mode={t2Mode[sub.id]}
              onToggleMode={() => toggleT2Mode(sub.id)}
              qEdits={qEdits}
              onEditQ={editQ}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [layout, setLayout] = useState("wizard");
  const [accordionOpen, setAccordionOpen] = useState({ intelligence: true, alignment: false, influence: false, environment: false });
  const [scenario, setScenario] = useState("blended");
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [showSetup, setShowSetup] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);

  // Editable question text overrides
  const [qEdits, setQEdits] = useState({});
  const editQ = useCallback((id, text) => setQEdits(p => ({ ...p, [id]: text })), []);

  const [branchMode, setBranchMode] = useState({
    intelligence: "direct", alignment: "direct", influence: "direct", environment: "direct"
  });
  const [direct, setDirect] = useState({
    intelligence: 0.50, alignment: 0.50, influence: 0.50, environment: 0.50
  });
  const [t2, setT2] = useState({
    cognitive: 0.50, goals: 0.50, resources: 0.50,
    auto_misalign: 0.30, misuse: 0.30, structural: 0.20,
    systems: 0.40, human: 0.30,
    detection: 0.30, willingness: 0.30, capability: 0.30, coordination: 0.40,
  });
  const [t2Mode, setT2Mode] = useState({
    cognitive: "direct", goals: "direct", resources: "direct",
    auto_misalign: "direct", misuse: "direct", structural: "direct",
    systems: "direct", human: "direct",
    detection: "direct", willingness: "direct", capability: "direct", coordination: "direct",
  });
  const [t3, setT3] = useState({
    systems: [0.15, 0.10, 0.10, 0.10],
    human: [0.15, 0.10, 0.10],
  });

  const setT2Score = useCallback((id, v) => setT2(p => ({ ...p, [id]: v })), []);
  const toggleT2Mode = useCallback(id => setT2Mode(p => ({ ...p, [id]: p[id] === "direct" ? "breakdown" : "direct" })), []);
  const setT3Score = useCallback((chId, i, v) => setT3(p => ({ ...p, [chId]: p[chId].map((x, j) => j === i ? v : x) })), []);

  const getSubScore = useCallback((sub) => {
    if (t2Mode[sub.id] === "breakdown" && sub.tier3 && t3[sub.id]) return orCombine(t3[sub.id]);
    return t2[sub.id];
  }, [t2, t2Mode, t3]);

  const getBranchScore = useCallback((branch) => {
    if (branchMode[branch.key] === "direct") return direct[branch.key];
    const subScores = branch.tier2.map(sub => getSubScore(sub));
    return branch.gate === "AND" ? andCombine(subScores) : orCombine(subScores);
  }, [branchMode, direct, getSubScore]);

  const stepVals = BRANCHES.map(b => getBranchScore(b));
  const pDoom = stepVals.reduce((a, v) => a * v, 1);
  const rc = riskColor(pDoom);
  const branch = BRANCHES[step];

  const sensitivityReport = useMemo(
    () => computeSensitivityReport(branchMode, direct, t2, t2Mode, t3),
    [branchMode, direct, t2, t2Mode, t3]
  );
  const drivingAssumptions = useMemo(
    () => summarizeDrivingAssumptions(sensitivityReport),
    [sensitivityReport]
  );
  const cruxView = useMemo(
    () => computeCruxView(sensitivityReport),
    [sensitivityReport]
  );
  const expanded = branchMode[branch.key] === "expand";
  const score = stepVals[step];
  const selScenario = SCENARIOS.find(s => s.id === scenario);

  return (
    <div style={{ minHeight: "100vh", color: TEXT, fontFamily: SANS, background: BG }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:1px;height:1px;background:transparent}
        [contenteditable]:focus{background:${ACCENT_LIGHT}!important}
      `}</style>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 3, color: MUTED, marginBottom: 8 }}>AISC Team 19 · 2026</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, margin: 0 }}>AI Existential Risk Calculator</h1>
          <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.65, maxWidth: 500, margin: "14px auto 0" }}>
            This tool estimates the probability of existential-level harm to humanity from artificial intelligence by decomposing the question into four conditional steps that scorers evaluate in sequence.
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, maxWidth: 480, margin: "10px auto 0", fontStyle: "italic" }}>
            This calculator represents one general decomposition of AI catastrophic risk, intended to be broad enough to cover many worldviews, but not exhaustive of all possible framings.
          </div>
        </div>

        {/* ─── ASSUMPTIONS ─── */}
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: MUTED, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${RULE}` }}>Assumptions</div>
        <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 16 }}>These frame your scoring but do not enter the calculation. The final probability is determined solely by the four steps below.</div>
        {showSetup && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Threat Scenario</div>
              <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>Which type of AI threat are you primarily scoring? This separates scenario-driven disagreement from capability-driven disagreement.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {SCENARIOS.map(s => (
                  <button key={s.id} onClick={() => setScenario(s.id)} style={{
                    padding: "9px 6px", cursor: "pointer",
                    borderRadius: 4, fontSize: 12, fontWeight: 600, fontFamily: "inherit", textAlign: "center",
                    background: scenario === s.id ? ACCENT : "transparent",
                    border: `1.5px solid ${scenario === s.id ? ACCENT : BORDER}`,
                    color: scenario === s.id ? "#FFFFFF" : TEXT2, transition: "all 0.15s"
                  }}>{s.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: TEXT2, lineHeight: 1.6, fontStyle: "italic" }}>{selScenario.desc}</div>
            </div>

            <div style={{ height: 1, background: RULE, marginBottom: 16 }} />

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Time Horizon</div>
              <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>Over what period are you assessing these risks? All questions should be scored with this timeframe in mind.</div>
              <div style={{ display: "flex", gap: 6 }}>
                {TIME_OPTIONS.map(t => (
                  <button key={t.value} onClick={() => setTimeHorizon(t.value)} style={{
                    flex: 1, padding: "9px 0", cursor: "pointer",
                    borderRadius: 4, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    background: timeHorizon === t.value ? ACCENT : "transparent",
                    border: `1.5px solid ${timeHorizon === t.value ? ACCENT : BORDER}`,
                    color: timeHorizon === t.value ? "#FFFFFF" : TEXT2, transition: "all 0.15s"
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: RULE, marginTop: 16 }} />
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <span onClick={() => setShowSetup(false)} style={{ fontSize: 13, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>Collapse</span>
            </div>
          </div>
        )}

        {!showSetup && (
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: TEXT2 }}>
              {selScenario.label} · {timeHorizon} years
            </div>
            <span onClick={() => setShowSetup(true)} style={{ fontSize: 13, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>Change</span>
          </div>
        )}

        {/* ─── CALCULATOR ─── */}
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: MUTED, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${RULE}` }}>Calculator</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.65, flex: 1, marginRight: 16 }}>
            Conditional probability chain. Score each step assuming all prior steps are true.
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {["wizard", "accordion"].map(l => (
              <button key={l} onClick={() => setLayout(l)} style={{
                padding: "6px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                fontFamily: "inherit", cursor: "pointer", textTransform: "capitalize",
                background: layout === l ? ACCENT : "transparent",
                border: `1.5px solid ${layout === l ? ACCENT : BORDER}`,
                color: layout === l ? "#FFFFFF" : TEXT2, transition: "all 0.15s"
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Running result */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28, padding: "14px 0", borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            {BRANCHES.map((b, i) => (
              <span key={i} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: b.color }}>{b.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: b.color }}>{(stepVals[i]*100).toFixed(0)}%</span>
                {i < 3 && <span style={{ color: RULE, fontSize: 12, margin: "0 2px" }}>×</span>}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 12, color: MUTED }}>=</span>
            <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: rc }}>{(pDoom*100).toFixed(1)}%</span>
          </div>
        </div>

        {/* ─── WIZARD LAYOUT ─── */}
        {layout === "wizard" && (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {BRANCHES.map((b, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 1.5, background: i <= step ? b.color : TRACK_OFF, transition: "background 0.3s" }} />
                ))}
              </div>
            </div>

            {/* Step tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 20 }}>
                {BRANCHES.map((b, i) => (
                  <span key={i} onClick={() => setStep(i)} style={{
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    color: i === step ? b.color : MUTED,
                    paddingBottom: 4,
                    borderBottom: i === step ? `2px solid ${b.color}` : "2px solid transparent",
                    transition: "all 0.2s"
                  }}>{b.label}</span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: MUTED }}>{step + 1} / 4</span>
            </div>

            <div style={{ minHeight: 280 }}>
              <BranchContent
                branch={branch} score={score} expanded={expanded}
                direct={direct} setDirect={setDirect} branchMode={branchMode} setBranchMode={setBranchMode}
                t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode}
                t3={t3} setT3Score={setT3Score} qEdits={qEdits} editQ={editQ}
              />
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
              <button onClick={() => step > 0 && setStep(step - 1)} style={{
                padding: "10px 24px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                background: "transparent", border: `1.5px solid ${step === 0 ? TRACK_OFF : BORDER}`,
                color: step === 0 ? MUTED : TEXT2, cursor: step === 0 ? "default" : "pointer",
                fontFamily: "inherit"
              }}>Back</button>
              <button onClick={() => step < 3 && setStep(step + 1)} style={{
                padding: "10px 24px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                background: step === 3 ? ACCENT : "transparent",
                border: `1.5px solid ${step === 3 ? ACCENT : BORDER}`,
                color: step === 3 ? "#FFFFFF" : TEXT,
                cursor: step === 3 ? "default" : "pointer",
                fontFamily: "inherit"
              }}>{step === 3 ? "Scoring Complete" : "Next Step"}</button>
            </div>
          </>
        )}

        {/* ─── ACCORDION LAYOUT ─── */}
        {layout === "accordion" && (
          <div>
            {BRANCHES.map((b, i) => {
              const isOpen = accordionOpen[b.key];
              const bScore = stepVals[i];
              const bExpanded = branchMode[b.key] === "expand";
              return (
                <div key={b.key} style={{ marginBottom: 12 }}>
                  <div
                    onClick={() => setAccordionOpen(p => ({ ...p, [b.key]: !p[b.key] }))}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 14px", cursor: "pointer", borderRadius: isOpen ? "6px 6px 0 0" : 6,
                      background: ACCENT_LIGHT, borderLeft: `3px solid ${b.color}`,
                      transition: "border-radius 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: b.color }}>{b.n}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{b.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: b.color }}>{(bScore*100).toFixed(0)}%</span>
                      <span style={{ fontSize: 14, color: MUTED, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "16px 14px", border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 6px 6px" }}>
                      <BranchContent
                        branch={b} score={bScore} expanded={bExpanded}
                        direct={direct} setDirect={setDirect} branchMode={branchMode} setBranchMode={setBranchMode}
                        t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode}
                        t3={t3} setT3Score={setT3Score} qEdits={qEdits} editQ={editQ}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── ANALYSIS ─── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: MUTED, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${RULE}` }}>Analysis</div>
          <SensitivityReportPanel items={sensitivityReport} drivingItems={drivingAssumptions} />
          <CruxViewPanel items={cruxView} />
        </div>

        {/* Methodology */}
        <div style={{ marginTop: 40 }}>
          <div onClick={() => setNotesOpen(!notesOpen)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${RULE}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: MUTED, letterSpacing: 0.5 }}>Methodology</span>
            <span style={{ fontSize: 14, color: MUTED, transform: notesOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
          </div>
          {notesOpen && (
            <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, paddingTop: 10 }}>
              <p style={{ marginBottom: 10 }}><strong style={{ color: TEXT }}>Conditional decomposition.</strong> This follows the structure of Carlsmith (2022) and related threat models: factor P(existential catastrophe from AI) into a product of conditional probabilities, where each step assumes all prior steps obtain. This avoids double-counting and isolates genuine disagreement to the step where it occurs.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: TEXT }}>Three-tier scoring.</strong> Each branch can be scored directly (Tier 1), broken into sub-branches (Tier 2), or decomposed further into sub-questions where available (Tier 3). The scoring depth you choose determines how the branch probability is computed.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: TEXT }}>Gate logic.</strong> Intelligence sub-branches are AND-combined (all conditions required). Alignment, Influence, and Environment sub-branches are OR-combined (any single pathway sufficient).</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: TEXT }}>Editable questions.</strong> All question text is editable. Click any question to revise the framing for your own threat model. Edits persist for the session.</p>
              <p style={{ marginBottom: 0 }}><strong style={{ color: TEXT }}>Precision.</strong> Treat the output as an order-of-magnitude estimate. Uncertainty in each input propagates multiplicatively, so the true credible interval is substantially wider than the point estimate displayed.</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: MUTED, marginTop: 24, lineHeight: 1.6 }}>
          4 branches · 3-tier scoring · AISC Team 19
        </div>
      </div>
    </div>
  );
}
