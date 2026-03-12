import { useState, useCallback, useMemo } from "react";

// Palette: Ink & Paper
const BG = "#FEFDFB", CARD = "#FEFDFB", TEXT = "#111827", TEXT2 = "#6B7280";
const ACCENT = "#111827", ACCENT_LIGHT = "#F3F2F0", TRACK_OFF = "#E5E2DC";
const BORDER = "#E5E2DC", RULE = "#D1CEC8", FAINT = "#9CA3AF";

const SCENARIOS = [
  { id: "autonomous", label: "Autonomous Misalignment", desc: "A system that has developed its own misaligned goals and is actively pursuing them, including strategic deception, power-seeking, and resistance to correction." },
  { id: "misuse", label: "Deliberate Misuse", desc: "A capable AI being intentionally directed toward destructive ends by a state actor, terrorist organization, or other malicious human principal." },
  { id: "structural", label: "Structural / Emergent", desc: "Widespread deployment of AI systems creates emergent civilizational fragility, including dependency, erosion of human capacity, and systemic brittleness, without adversarial intent." },
  { id: "blended", label: "Blended", desc: "You don't believe one pathway is clearly more likely, or you want to score across all types simultaneously." },
];
const TIME_OPTIONS = [{ label: "10 yrs", value: 10 }, { label: "20 yrs", value: 20 }, { label: "30 yrs", value: 30 }, { label: "50 yrs", value: 50 }];

const BRANCHES = [
  { key: "intelligence", n: 1, label: "Intelligence", q: "How likely is it that a sufficiently capable AI system is created, with cross-domain strategic competence, persistent autonomous operation, and the ability to acquire and sustain resources?", cond: null, gate: "AND", tier2: [
    { id: "cognitive", label: "Cognitive Competence", q: "How likely is it that an AI system achieves cognitive performance matching or exceeding top humans in at least one strategically decisive domain?", tier3: null },
    { id: "goals", label: "Goal-Directed Behavior", q: "How likely is it that an AI system exhibits stable preference ordering and behaves as if persistently pursuing goals across extended time horizons?", tier3: null },
    { id: "resources", label: "Resource Acquisition", q: "How likely is it that an AI system can acquire and sustain the resources needed for continued operation, including compute, energy, financial resources, information, and strategic position?", tier3: null },
  ]},
  { key: "alignment", n: 2, label: "Alignment", q: "Given that such a system exists, how likely is it that it operates in a hazardous mode, whether through autonomous misalignment, deliberate misuse by human actors, or structural/emergent harm from widespread deployment?", cond: "A sufficiently capable AI system exists.", gate: "OR", tier2: [
    { id: "auto_misalign", label: "Autonomous Misalignment", q: "How likely is it that the system develops or retains objectives that diverge from human survival, through deceptive alignment, goal drift, mesa-optimization, or emergent power-seeking?", tier3: null },
    { id: "misuse", label: "Deliberate Misuse", q: "How likely is it that a human actor (state, organization, or individual) intentionally directs the system toward destructive ends at existential scale?", tier3: null },
    { id: "structural", label: "Structural / Emergent Harm", q: "How likely is it that widespread deployment creates emergent systemic fragility, through concentration of power, erosion of human capacity, or compounding second-order effects, without any actor intending catastrophe?", tier3: null },
  ]},
  { key: "influence", n: 3, label: "Influence", q: "Given a hazardous AI deployment, how likely is it that at least one pathway to decisive real-world leverage is secured, sufficient to make existential harm feasible absent effective human correction?", cond: "A capable AI exists and is operating in a hazardous mode.", gate: "OR", tier2: [
    { id: "systems", label: "Systems Leverage", q: "How likely is it that the AI can achieve (or enable malicious human actors to achieve) a level of infiltration and control over digital and physical systems sufficient to cause existential-level harm?", tier3: [
      { id: "s1", label: "Critical Systems", q: "How likely is it that persistent control is achieved over systems that sustain civilizational function?" },
      { id: "s2", label: "Financial Systems", q: "How likely is it that the ability to manipulate or disable financial coordination systems is achieved at scale?" },
      { id: "s3", label: "Military & Weapons", q: "How likely is it that sufficient access to military command-and-control or autonomous weapons platforms is achieved?" },
      { id: "s4", label: "CBRN Production", q: "How likely is it that the ability to direct systems to synthesize CBRN agents is achieved?" },
    ]},
    { id: "human", label: "Human Leverage", q: "How likely is it that the AI can achieve (or enable malicious human actors to achieve) a level of influence over human behavior sufficient to cause existential-level harm?", tier3: [
      { id: "h1", label: "Direct Action", q: "How likely is it that individuals or groups are influenced into carrying out catastrophic actions?" },
      { id: "h2", label: "Institutional Capture", q: "How likely is it that sufficient influence over key institutions is attained to steer them catastrophically?" },
      { id: "h3", label: "Erosion of Autonomy", q: "How likely is it that human capacity for independent action and reasoning is sufficiently degraded?" },
    ]},
  ]},
  { key: "environment", n: 4, label: "Environment", q: "Given that a capable, hazardous AI has secured decisive real-world leverage, how likely is it that human governance, coordination, and response mechanisms fail before irreversible damage occurs?", cond: "A capable, hazardous AI with decisive real-world leverage exists.", gate: "OR", tier2: [
    { id: "detection", label: "Detection Failure", q: "How likely is it that the threat is not recognized in time?", tier3: null },
    { id: "willingness", label: "Willingness Failure", q: "How likely is it that corrective action is suppressed by incentives or politics?", tier3: null },
    { id: "capability", label: "Capability Failure", q: "How likely is it that alignment is technically intractable for the system?", tier3: null },
    { id: "coordination", label: "Coordination Failure", q: "How likely is it that global coordination fails?", tier3: null },
  ]},
];

function orCombine(p) { return 1 - p.reduce((a, v) => a * (1 - v), 1); }
function andCombine(p) { return p.reduce((a, v) => a * v, 1); }
function riskColor(v) { return v > .30 ? "#991B1B" : v > .15 ? "#92400E" : v > .05 ? "#78350F" : "#064E3B"; }
function fmt(v) { return (v * 100).toFixed(0) + "%"; }

function Slider({ value, onChange, disabled }) {
  const pct = Math.round(value * 100);
  return (<div style={{ display: "flex", alignItems: "center", gap: 16, opacity: disabled ? 0.3 : 1 }}>
    <div style={{ flex: 1, position: "relative", height: 28, display: "flex", alignItems: "center" }}>
      <div style={{ width: "100%", height: 2, background: TRACK_OFF }} />
      <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 2, background: disabled ? TRACK_OFF : ACCENT, transition: "width 60ms ease" }} />
      {!disabled && <div style={{ position: "absolute", left: `calc(${pct}% - 7px)`, width: 14, height: 14, borderRadius: "50%", background: CARD, border: `2.5px solid ${ACCENT}`, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", transition: "left 60ms ease", pointerEvents: "none", zIndex: 1 }} />}
      <input type="range" min="0" max="100" step="1" value={pct} onChange={e => !disabled && onChange(parseInt(e.target.value) / 100)} disabled={disabled} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", appearance: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", margin: 0, opacity: 0, zIndex: 2 }} />
    </div>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: disabled ? FAINT : TEXT, minWidth: 50, textAlign: "right" }}>{pct}%</span>
  </div>);
}

function Tier3Panel({ tier3, scores, onChange }) {
  return (<div style={{ marginTop: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: FAINT, textTransform: "uppercase", letterSpacing: 1.5 }}>{tier3.length} sub-questions, OR-combined</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: TEXT }}>{fmt(orCombine(scores))}</span>
    </div>
    {tier3.map((node, i) => (<div key={node.id} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: ACCENT, background: ACCENT_LIGHT, padding: "2px 7px", borderRadius: 3 }}>{node.id}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{node.label}</span>
      </div>
      <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 8 }}>{node.q}</div>
      <Slider value={scores[i]} onChange={v => onChange(i, v)} />
      {i < tier3.length - 1 && <div style={{ height: 1, background: RULE, marginTop: 12, opacity: 0.5 }} />}
    </div>))}
  </div>);
}

function Tier2Sub({ sub, directScore, onDirectChange, tier3Scores, onTier3Change, mode, onToggleMode }) {
  const hasTier3 = sub.tier3 && sub.tier3.length > 0;
  const effectiveScore = mode === "breakdown" && hasTier3 ? orCombine(tier3Scores) : directScore;
  return (<div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{sub.label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: TEXT }}>{fmt(effectiveScore)}</span>
    </div>
    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>{sub.q}</div>
    {mode === "direct" && <Slider value={directScore} onChange={onDirectChange} />}
    {mode === "breakdown" && <Slider value={effectiveScore} onChange={() => {}} disabled />}
    {hasTier3 && <div style={{ marginTop: 8 }}><span onClick={onToggleMode} style={{ fontSize: 11, fontWeight: 600, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>{mode === "breakdown" ? "Score directly instead" : "Break it down"}</span></div>}
    {!hasTier3 && <div style={{ marginTop: 6, fontSize: 10, color: FAINT, fontStyle: "italic" }}>Sub-questions to be developed</div>}
    {mode === "breakdown" && hasTier3 && <div style={{ marginLeft: 16, paddingLeft: 16, borderLeft: `1px solid ${RULE}`, marginTop: 12 }}><Tier3Panel tier3={sub.tier3} scores={tier3Scores} onChange={onTier3Change} /></div>}
    <div style={{ height: 1, background: RULE, marginTop: 16 }} />
  </div>);
}

function BranchExpansion({ branch, t2, setT2Score, t2Mode, toggleT2Mode, t3, setT3Score }) {
  return (<div style={{ marginTop: 16 }}>
    <div style={{ height: 1, background: RULE, marginBottom: 20 }} />
    {branch.tier2.map(sub => (<Tier2Sub key={sub.id} sub={sub} directScore={t2[sub.id]} onDirectChange={v => setT2Score(sub.id, v)} tier3Scores={t3[sub.id] || []} onTier3Change={(i, v) => setT3Score(sub.id, i, v)} mode={t2Mode[sub.id]} onToggleMode={() => toggleT2Mode(sub.id)} />))}
  </div>);
}

function WizardView({ step, setStep, branches, branchMode, setBranchMode, direct, setDirect, stepVals, t2, setT2Score, t2Mode, toggleT2Mode, t3, setT3Score }) {
  const branch = branches[step]; const expanded = branchMode[branch.key] === "expand"; const score = stepVals[step];
  return (<div>
    <div style={{ marginBottom: 6 }}><div style={{ display: "flex", gap: 3 }}>{branches.map((_, i) => (<div key={i} style={{ flex: 1, height: 2, background: i <= step ? ACCENT : TRACK_OFF }} />))}</div></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 24 }}>{branches.map((b, i) => (<span key={i} onClick={() => setStep(i)} style={{ fontSize: 11, fontWeight: 600, cursor: "pointer", color: i === step ? TEXT : FAINT, paddingBottom: 4, borderBottom: i === step ? `2px solid ${ACCENT}` : "2px solid transparent" }}>{b.label}</span>))}</div>
      <span style={{ fontSize: 10, color: FAINT }}>{step + 1} of 4</span>
    </div>
    <div style={{ minHeight: 280 }}>
      {branch.cond && <div style={{ fontSize: 11, color: ACCENT, marginBottom: 12 }}>Assuming: {branch.cond}</div>}
      <div style={{ fontSize: 17, color: TEXT, lineHeight: 1.7, marginBottom: 24, fontFamily: "Georgia, serif" }}>{branch.q}</div>
      {!expanded && <Slider value={direct[branch.key]} onChange={v => setDirect(p => ({...p, [branch.key]: v}))} />}
      {expanded && <Slider value={score} onChange={() => {}} disabled />}
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
        <span onClick={() => setBranchMode(p => ({...p, [branch.key]: expanded ? "direct" : "expand"}))} style={{ fontSize: 11, fontWeight: 600, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>{expanded ? "Score directly instead" : "Break it down"}</span>
        {expanded && <span style={{ fontSize: 10, color: FAINT, textTransform: "uppercase", letterSpacing: 1 }}>{branch.gate === "AND" ? "All required (AND)" : "Any one sufficient (OR)"}</span>}
      </div>
      {expanded && <BranchExpansion branch={branch} t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode} t3={t3} setT3Score={setT3Score} />}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
      <button onClick={() => step > 0 && setStep(step - 1)} style={{ padding: "10px 24px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: "transparent", border: `1.5px solid ${step === 0 ? TRACK_OFF : BORDER}`, color: step === 0 ? FAINT : TEXT2, cursor: step === 0 ? "default" : "pointer", fontFamily: "inherit" }}>Back</button>
      <button onClick={() => step < 3 && setStep(step + 1)} style={{ padding: "10px 24px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: step === 3 ? ACCENT : "transparent", border: `1.5px solid ${step === 3 ? ACCENT : BORDER}`, color: step === 3 ? "#FFF" : TEXT, cursor: step === 3 ? "default" : "pointer", fontFamily: "inherit" }}>{step === 3 ? "Scoring Complete" : "Next Step"}</button>
    </div>
  </div>);
}

function AccordionView({ branches, branchMode, setBranchMode, direct, setDirect, stepVals, t2, setT2Score, t2Mode, toggleT2Mode, t3, setT3Score }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (<div>{branches.map((branch, i) => {
    const isOpen = openIdx === i; const expanded = branchMode[branch.key] === "expand";
    return (<div key={branch.key} style={{ marginBottom: 2 }}>
      <div onClick={() => setOpenIdx(isOpen ? -1 : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", cursor: "pointer", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: FAINT }}>{i + 1}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{branch.label}</span>
          <span style={{ fontSize: 10, color: FAINT, textTransform: "uppercase" }}>{branch.gate}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: TEXT }}>{fmt(stepVals[i])}</span>
          <span style={{ fontSize: 12, color: FAINT, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9662;</span>
        </div>
      </div>
      {isOpen && (<div style={{ padding: "20px 0" }}>
        {branch.cond && <div style={{ fontSize: 11, color: ACCENT, marginBottom: 12 }}>Assuming: {branch.cond}</div>}
        <div style={{ fontSize: 15, color: TEXT, lineHeight: 1.7, marginBottom: 20, fontFamily: "Georgia, serif" }}>{branch.q}</div>
        {!expanded && <Slider value={direct[branch.key]} onChange={v => setDirect(p => ({...p, [branch.key]: v}))} />}
        {expanded && <Slider value={stepVals[i]} onChange={() => {}} disabled />}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
          <span onClick={() => setBranchMode(p => ({...p, [branch.key]: expanded ? "direct" : "expand"}))} style={{ fontSize: 11, fontWeight: 600, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>{expanded ? "Score directly instead" : "Break it down"}</span>
          {expanded && <span style={{ fontSize: 10, color: FAINT, textTransform: "uppercase" }}>{branch.gate === "AND" ? "All required (AND)" : "Any one sufficient (OR)"}</span>}
        </div>
        {expanded && <BranchExpansion branch={branch} t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode} t3={t3} setT3Score={setT3Score} />}
      </div>)}
    </div>);
  })}</div>);
}

// ═══ TREE VIEW: Actual probability tree with boxes and connector lines ═══

function NodeBox({ label, score, gate, selected, onClick, depth, expanded }) {
  const w = depth === 0 ? "100%" : depth === 1 ? 130 : 110;
  const isRoot = depth === 0;
  return (<div onClick={onClick} style={{
    width: w, minWidth: w, maxWidth: depth === 0 ? "100%" : w,
    padding: isRoot ? "14px 20px" : depth === 1 ? "10px 8px" : "8px 6px",
    background: selected ? ACCENT_LIGHT : CARD,
    border: `${selected ? 2 : 1.5}px solid ${selected ? ACCENT : BORDER}`,
    borderRadius: isRoot ? 8 : 6, cursor: onClick ? "pointer" : "default",
    textAlign: "center", transition: "all 0.15s", position: "relative",
    boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
  }}>
    <div style={{ fontSize: isRoot ? 10 : 9, fontWeight: 600, color: FAINT, textTransform: "uppercase", letterSpacing: isRoot ? 1.5 : 1, marginBottom: isRoot ? 6 : 3 }}>{isRoot ? "P(existential harm)" : label}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isRoot ? 24 : depth === 1 ? 18 : 14, fontWeight: 700, color: isRoot ? riskColor(score) : TEXT }}>{isRoot ? (score*100).toFixed(1)+"%" : fmt(score)}</div>
    {!isRoot && gate && <div style={{ fontSize: 8, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{gate}</div>}
    {expanded && !isRoot && <div style={{ position: "absolute", bottom: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, background: ACCENT, borderRadius: "50%" }} />}
  </div>);
}

function TreeConnector({ count, gate }) {
  if (count === 0) return null;
  return (<div style={{ position: "relative", width: "100%" }}>
    <div style={{ width: 0, height: 20, borderLeft: `1.5px solid ${RULE}`, margin: "0 auto" }} />
    <div style={{ textAlign: "center", margin: "-4px 0 -4px" }}>
      <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: 1.5, background: BG, padding: "0 8px", position: "relative", zIndex: 1 }}>{gate}</span>
    </div>
    {count > 1 && <div style={{ position: "relative", height: 0, margin: "0 auto", left: `${50/count}%`, width: `${100 - 100/count}%`, borderTop: `1.5px solid ${RULE}` }} />}
    <div style={{ display: "flex" }}>{Array.from({ length: count }).map((_, i) => (<div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}><div style={{ width: 0, height: 18, borderLeft: `1.5px solid ${RULE}` }} /></div>))}</div>
  </div>);
}

function TreeView({ branches, branchMode, setBranchMode, direct, setDirect, stepVals, pDoom, t2, setT2Score, t2Mode, toggleT2Mode, t3, setT3Score }) {
  const [selected, setSelected] = useState(null);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);

  const selectBranch = (i) => { setSelected({ type: "branch", branchIdx: i }); setExpandedBranch(expandedBranch === i ? null : i); setExpandedSub(null); };
  const selectSub = (bi, subId) => { setSelected({ type: "sub", branchIdx: bi, subId }); setExpandedSub(expandedSub === subId ? null : subId); };
  const selectT3 = (bi, subId, t3Idx) => { setSelected({ type: "t3", branchIdx: bi, subId, t3Idx }); };

  const detailContent = useMemo(() => {
    if (!selected) return null;
    const { type, branchIdx, subId, t3Idx } = selected;
    const branch = branches[branchIdx];
    if (type === "branch") return { label: branch.label, q: branch.q, cond: branch.cond, gate: branch.gate, sliderVal: direct[branch.key], onSlider: v => setDirect(p => ({...p, [branch.key]: v})), branchKey: branch.key, isBranch: true };
    const sub = branch.tier2.find(s => s.id === subId);
    if (!sub) return null;
    if (type === "sub") { const hasTier3 = sub.tier3 && sub.tier3.length > 0; return { label: sub.label, q: sub.q, sliderVal: t2[sub.id], onSlider: v => setT2Score(sub.id, v), subId: sub.id, hasTier3, isBranch: false }; }
    if (type === "t3" && sub.tier3 && sub.tier3[t3Idx]) { const node = sub.tier3[t3Idx]; return { label: node.label, q: node.q, sliderVal: t3[sub.id][t3Idx], onSlider: v => setT3Score(sub.id, t3Idx, v), isBranch: false, isLeaf: true }; }
    return null;
  }, [selected, branches, direct, t2, t3, setDirect, setT2Score, setT3Score]);

  return (<div style={{ overflowX: "auto" }}>
    {/* Root */}
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}><NodeBox label="Root" score={pDoom} depth={0} /></div>
    <TreeConnector count={4} gate={<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>&times; &times; &times;</span>} />

    {/* Branch boxes */}
    <div style={{ display: "flex", gap: 0 }}>
      {branches.map((branch, i) => (<div key={branch.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <NodeBox label={branch.label} score={stepVals[i]} gate={branch.gate} depth={1} selected={(selected && selected.type === "branch" && selected.branchIdx === i) || expandedBranch === i} expanded={expandedBranch === i} onClick={() => selectBranch(i)} />
      </div>))}
    </div>

    {/* Expanded branch subtree */}
    {expandedBranch !== null && (() => {
      const bi = expandedBranch, branch = branches[bi];
      const isExpanded = branchMode[branch.key] === "expand", subs = branch.tier2;
      return (<div style={{ marginTop: 4 }}>
        <div style={{ display: "flex" }}>{branches.map((_, i) => (<div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>{i === bi && isExpanded && <div style={{ width: 0, height: 16, borderLeft: `1.5px solid ${RULE}` }} />}</div>))}</div>
        {isExpanded && (<div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: Math.max(subs.length * 140, 300) }}>
            <div style={{ textAlign: "center", marginBottom: -2 }}><span style={{ fontSize: 9, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: 1.5, background: BG, padding: "0 8px" }}>{branch.gate}</span></div>
            {subs.length > 1 && <div style={{ position: "relative", height: 0, margin: "0 auto", left: `${50/subs.length}%`, width: `${100 - 100/subs.length}%`, borderTop: `1.5px solid ${RULE}` }} />}
            <div style={{ display: "flex", gap: 0 }}>
              {subs.map((sub) => {
                const hasTier3 = sub.tier3 && sub.tier3.length > 0;
                const subScore = (t2Mode[sub.id] === "breakdown" && hasTier3 && t3[sub.id]) ? orCombine(t3[sub.id]) : t2[sub.id];
                return (<div key={sub.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 0, height: 14, borderLeft: `1.5px solid ${RULE}` }} />
                  <NodeBox label={sub.label} score={subScore} depth={2} selected={(selected && selected.subId === sub.id) || expandedSub === sub.id} expanded={expandedSub === sub.id} onClick={() => selectSub(bi, sub.id)} />
                </div>);
              })}
            </div>
            {/* Tier 3 */}
            {expandedSub && (() => {
              const sub = subs.find(s => s.id === expandedSub);
              if (!sub || !sub.tier3 || t2Mode[sub.id] !== "breakdown") return null;
              const t3Nodes = sub.tier3;
              return (<div style={{ marginTop: 4 }}>
                <div style={{ textAlign: "center", marginBottom: -2 }}><span style={{ fontSize: 8, fontWeight: 700, color: FAINT, textTransform: "uppercase", background: BG, padding: "0 6px" }}>OR</span></div>
                {t3Nodes.length > 1 && <div style={{ position: "relative", height: 0, margin: "0 auto", left: `${50/t3Nodes.length}%`, width: `${100 - 100/t3Nodes.length}%`, borderTop: `1.5px solid ${RULE}` }} />}
                <div style={{ display: "flex", gap: 0 }}>
                  {t3Nodes.map((node, ni) => {
                    const isT3Sel = selected && selected.type === "t3" && selected.t3Idx === ni && selected.subId === sub.id;
                    return (<div key={node.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 0, height: 12, borderLeft: `1.5px solid ${RULE}` }} />
                      <div onClick={() => selectT3(expandedBranch, sub.id, ni)} style={{ width: 90, padding: "6px 4px", textAlign: "center", borderRadius: 4, border: `${isT3Sel ? 2 : 1}px solid ${isT3Sel ? ACCENT : BORDER}`, background: isT3Sel ? ACCENT_LIGHT : CARD, cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ fontSize: 8, fontWeight: 600, color: FAINT, textTransform: "uppercase", marginBottom: 2, lineHeight: 1.2 }}>{node.label}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: TEXT }}>{fmt(t3[sub.id][ni])}</div>
                      </div>
                    </div>);
                  })}
                </div>
              </div>);
            })()}
          </div>
        </div>)}
        {!isExpanded && <div style={{ textAlign: "center", marginTop: 8 }}><span onClick={() => setBranchMode(p => ({...p, [branch.key]: "expand"}))} style={{ fontSize: 11, fontWeight: 600, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>Expand sub-branches</span></div>}
      </div>);
    })()}

    {/* Detail panel */}
    {detailContent && (<div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 6, border: `1.5px solid ${BORDER}`, background: CARD }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{detailContent.label}</span>
        {detailContent.gate && <span style={{ fontSize: 9, fontWeight: 700, color: FAINT, textTransform: "uppercase" }}>{detailContent.gate}</span>}
      </div>
      {detailContent.cond && <div style={{ fontSize: 11, color: ACCENT, marginBottom: 8 }}>Assuming: {detailContent.cond}</div>}
      <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, marginBottom: 16, fontFamily: "Georgia, serif" }}>{detailContent.q}</div>
      <Slider value={detailContent.sliderVal} onChange={detailContent.onSlider} />
      {detailContent.isBranch && <div style={{ marginTop: 12 }}><span onClick={() => { const bk = branches[selected.branchIdx].key; setBranchMode(p => ({...p, [bk]: branchMode[bk] === "expand" ? "direct" : "expand"})); }} style={{ fontSize: 11, fontWeight: 600, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>{branchMode[branches[selected.branchIdx].key] === "expand" ? "Score directly instead" : "Break it down"}</span></div>}
      {detailContent.hasTier3 && !detailContent.isLeaf && <div style={{ marginTop: 12 }}><span onClick={() => toggleT2Mode(detailContent.subId)} style={{ fontSize: 11, fontWeight: 600, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>{t2Mode[detailContent.subId] === "breakdown" ? "Score directly instead" : "Break it down"}</span></div>}
    </div>)}
  </div>);
}

// ═══ MAIN APP ═══
export default function App() {
  const [viewMode, setViewMode] = useState("wizard");
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState("blended");
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [showSetup, setShowSetup] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [branchMode, setBranchMode] = useState({ intelligence: "direct", alignment: "direct", influence: "direct", environment: "direct" });
  const [direct, setDirect] = useState({ intelligence: 0.50, alignment: 0.50, influence: 0.50, environment: 0.50 });
  const [t2, setT2] = useState({ cognitive: 0.50, goals: 0.50, resources: 0.50, auto_misalign: 0.30, misuse: 0.30, structural: 0.20, systems: 0.40, human: 0.30, detection: 0.30, willingness: 0.30, capability: 0.30, coordination: 0.40 });
  const [t2Mode, setT2Mode] = useState({ cognitive: "direct", goals: "direct", resources: "direct", auto_misalign: "direct", misuse: "direct", structural: "direct", systems: "direct", human: "direct", detection: "direct", willingness: "direct", capability: "direct", coordination: "direct" });
  const [t3, setT3] = useState({ systems: [0.15, 0.10, 0.10, 0.10], human: [0.15, 0.10, 0.10] });

  const setT2Score = useCallback((id, v) => setT2(p => ({...p, [id]: v})), []);
  const toggleT2Mode = useCallback(id => setT2Mode(p => ({...p, [id]: p[id] === "direct" ? "breakdown" : "direct"})), []);
  const setT3Score = useCallback((chId, i, v) => setT3(p => ({...p, [chId]: p[chId].map((x, j) => j === i ? v : x)})), []);
  const getSubScore = useCallback((sub) => { if (t2Mode[sub.id] === "breakdown" && sub.tier3 && t3[sub.id]) return orCombine(t3[sub.id]); return t2[sub.id]; }, [t2, t2Mode, t3]);
  const getBranchScore = useCallback((branch) => { if (branchMode[branch.key] === "direct") return direct[branch.key]; const ss = branch.tier2.map(sub => getSubScore(sub)); return branch.gate === "AND" ? andCombine(ss) : orCombine(ss); }, [branchMode, direct, getSubScore]);

  const stepVals = BRANCHES.map(b => getBranchScore(b));
  const pDoom = stepVals.reduce((a, v) => a * v, 1);
  const rc = riskColor(pDoom);
  const selScenario = SCENARIOS.find(s => s.id === scenario);
  const VIEW_MODES = [{ id: "wizard", label: "Wizard" }, { id: "accordion", label: "Accordion" }, { id: "tree", label: "Tree" }];

  return (<div style={{ minHeight: "100vh", color: TEXT, fontFamily: "'DM Sans', -apple-system, sans-serif", background: BG }}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:1px;height:1px;background:transparent}`}</style>
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 4, color: FAINT, marginBottom: 6 }}>AISC Team 19 &middot; 2026</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontFamily: "Georgia, serif", margin: 0 }}>AI Existential Risk Calculator</h1>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
        {VIEW_MODES.map(m => (<button key={m.id} onClick={() => setViewMode(m.id)} style={{ padding: "6px 18px", borderRadius: 3, fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: viewMode === m.id ? ACCENT : "transparent", border: `1.5px solid ${viewMode === m.id ? ACCENT : BORDER}`, color: viewMode === m.id ? "#FFF" : TEXT2, cursor: "pointer" }}>{m.label}</button>))}
      </div>
      {showSetup && (<div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Threat Scenario</div>
          <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5, marginBottom: 8 }}>Which type of AI threat are you primarily scoring?</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{SCENARIOS.map(s => (<button key={s.id} onClick={() => setScenario(s.id)} style={{ flex: "1 1 auto", minWidth: 110, padding: "8px 12px", cursor: "pointer", borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: "inherit", textAlign: "left", background: scenario === s.id ? ACCENT : "transparent", border: `1.5px solid ${scenario === s.id ? ACCENT : BORDER}`, color: scenario === s.id ? "#FFF" : TEXT2 }}>{s.label}</button>))}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: TEXT2, lineHeight: 1.5, fontStyle: "italic" }}>{selScenario.desc}</div>
        </div>
        <div style={{ height: 1, background: RULE, marginBottom: 16 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Time Horizon</div>
          <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5, marginBottom: 8 }}>Over what period are you assessing these risks?</div>
          <div style={{ display: "flex", gap: 6 }}>{TIME_OPTIONS.map(t => (<button key={t.value} onClick={() => setTimeHorizon(t.value)} style={{ flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 4, fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: timeHorizon === t.value ? ACCENT : "transparent", border: `1.5px solid ${timeHorizon === t.value ? ACCENT : BORDER}`, color: timeHorizon === t.value ? "#FFF" : TEXT2 }}>{t.label}</button>))}</div>
        </div>
        <div style={{ height: 1, background: RULE, marginTop: 16 }} />
        <div style={{ marginTop: 12, textAlign: "right" }}><span onClick={() => setShowSetup(false)} style={{ fontSize: 11, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>Collapse setup</span></div>
      </div>)}
      {!showSetup && (<div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: TEXT2 }}>{selScenario.label} &middot; {timeHorizon} years</div>
        <span onClick={() => setShowSetup(true)} style={{ fontSize: 11, color: ACCENT, cursor: "pointer", borderBottom: `1px solid ${ACCENT}40`, paddingBottom: 1 }}>Change</span>
      </div>)}
      {viewMode !== "tree" && (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, padding: "12px 0", borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>{BRANCHES.map((b, i) => (<span key={i} style={{ display: "flex", alignItems: "baseline", gap: 3 }}><span style={{ fontSize: 10, color: FAINT }}>{b.label}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: TEXT }}>{fmt(stepVals[i])}</span>{i < 3 && <span style={{ color: RULE, fontSize: 10, margin: "0 2px" }}>&times;</span>}</span>))}</div>
        <div><span style={{ fontSize: 10, color: FAINT, marginRight: 6 }}>=</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: rc }}>{(pDoom*100).toFixed(1)}%</span></div>
      </div>)}
      {viewMode === "wizard" && <WizardView step={step} setStep={setStep} branches={BRANCHES} branchMode={branchMode} setBranchMode={setBranchMode} direct={direct} setDirect={setDirect} stepVals={stepVals} t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode} t3={t3} setT3Score={setT3Score} />}
      {viewMode === "accordion" && <AccordionView branches={BRANCHES} branchMode={branchMode} setBranchMode={setBranchMode} direct={direct} setDirect={setDirect} stepVals={stepVals} t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode} t3={t3} setT3Score={setT3Score} />}
      {viewMode === "tree" && <TreeView branches={BRANCHES} branchMode={branchMode} setBranchMode={setBranchMode} direct={direct} setDirect={setDirect} stepVals={stepVals} pDoom={pDoom} t2={t2} setT2Score={setT2Score} t2Mode={t2Mode} toggleT2Mode={toggleT2Mode} t3={t3} setT3Score={setT3Score} />}
      <div style={{ marginTop: 40 }}>
        <div onClick={() => setNotesOpen(!notesOpen)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${RULE}` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: FAINT, textTransform: "uppercase", letterSpacing: 1 }}>Methodology</span>
          <span style={{ fontSize: 12, color: FAINT, transform: notesOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9662;</span>
        </div>
        {notesOpen && (<div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.7, paddingTop: 8 }}>
          <p style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Conditional chain:</strong> Each step is scored assuming prior steps are true. The product of the four conditional probabilities equals the joint probability.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Three-tier scoring:</strong> Each branch can be scored directly (Tier 1), broken into sub-branches (Tier 2), or broken further into sub-questions where available (Tier 3).</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Gate logic:</strong> Intelligence sub-branches are AND-combined. Alignment, Influence, and Environment are OR-combined.</p>
          <p style={{ marginBottom: 0 }}><strong style={{ color: TEXT }}>Precision:</strong> Treat the output as an order-of-magnitude estimate.</p>
        </div>)}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: FAINT, marginTop: 24 }}>4 branches &middot; 3-tier scoring &middot; 3 views &middot; AISC Team 19</div>
    </div>
  </div>);
}
