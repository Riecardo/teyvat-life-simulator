(() => {
  const { useState, useEffect } = React;
  const { NATIONS, STAT_META, TALENT_RARITY_META, MAX_TALENT_SELECTION } = window.TeyvatData;
  const { clamp } = window.TeyvatUtils;
  const { getStageByAge } = window.TeyvatEngine;
  const { getSelectableRaces, getNationsForRace } = window.TeyvatRaceData;

  function StarField({ stars }) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 25% 40%, #0d1828 0%, #06080f 65%)" }}>
        {stars.map((star) => (
          <div key={star.id} style={{ position: "absolute", left: `${star.x}%`, top: `${star.y}%`, width: `${star.size}px`, height: `${star.size}px`, background: "#fff", borderRadius: "50%", opacity: star.opacity, animation: `twinkle ${star.dur}s ease-in-out ${star.delay}s infinite` }} />
        ))}
        <div style={{ position: "absolute", width: "40%", height: "30%", top: "10%", left: "60%", background: "radial-gradient(ellipse,rgba(90,60,180,0.04),transparent 70%)" }} />
        <div style={{ position: "absolute", width: "35%", height: "25%", bottom: "20%", left: "5%", background: "radial-gradient(ellipse,rgba(60,120,180,0.04),transparent 70%)" }} />
      </div>
    );
  }

  function getBarWidth(value) {
    return clamp((value + 2) * 7, 0, 100);
  }

  function StatBar({ label, value, color = "#c8a56a", delta, compact = false }) {
    const deltaColor = delta > 0 ? "#5ec878" : delta < 0 ? "#e07070" : "#c8a56a";
    return (
      <div style={{ marginBottom: compact ? 5 : 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: compact ? 11 : 12 }}>
          <span style={{ color: "#7a6a50" }}>{label}</span>
          <span style={{ color: delta !== undefined && delta !== 0 ? deltaColor : "#c8a56a" }}>
            {value}
            {delta !== undefined && delta !== 0 ? (
              <span style={{ fontSize: 10, marginLeft: 3, color: deltaColor }}>{delta > 0 ? `+${delta}` : delta}</span>
            ) : null}
          </span>
        </div>
        <div style={{ height: compact ? 3 : 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
          <div className="stat-fill" style={{ width: `${getBarWidth(value)}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }} />
        </div>
      </div>
    );
  }

  function CurseBar({ value }) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10 }}>
          <span style={{ color: "#9060a0" }}>诅咒侵蚀</span>
          <span style={{ color: value >= 60 ? "#d08080" : "#9060a0" }}>{value}%</span>
        </div>
        <div className="curse-bar-bg"><div className="curse-bar-fill" style={{ width: `${value}%` }} /></div>
        {value >= 60 && <div style={{ fontSize: 9, color: "#b97b7b", marginTop: 3 }}>诅咒已侵蚀身体</div>}
      </div>
    );
  }

  function FaithBar({ value }) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10 }}>
          <span style={{ color: "#c8a040" }}>信仰动摇</span>
          <span style={{ color: value >= 75 ? "#d08080" : "#c8a040" }}>{value}%</span>
        </div>
        <div className="faith-bar-bg"><div className="faith-bar-fill" style={{ width: `${value}%` }} /></div>
        {value >= 75 && <div style={{ fontSize: 9, color: "#b97b7b", marginTop: 3 }}>高天联系濒临断裂</div>}
      </div>
    );
  }

  function AbyssBar({ value }) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10 }}>
          <span style={{ color: "#8060c0" }}>深渊侵蚀</span>
          <span style={{ color: value >= 50 ? "#c080d0" : "#8060c0" }}>{value}%</span>
        </div>
        <div className="abyss-bar-bg"><div className="abyss-bar-fill" style={{ width: `${value}%` }} /></div>
      </div>
    );
  }

  function GoldDivider() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", margin: "20px 0" }}>
        <div style={{ height: 1, width: 60, background: "linear-gradient(90deg,transparent,rgba(200,165,106,0.4))" }} />
        <div style={{ color: "#c8a56a", fontSize: 14, animation: "pulseGlow 2.5s ease-in-out infinite" }}>◆</div>
        <div style={{ height: 1, width: 60, background: "linear-gradient(90deg,rgba(200,165,106,0.4),transparent)" }} />
      </div>
    );
  }

  // ── Title Screen ──

  function TitleScreen({ onStart }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <div className="fade-up">
          <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: "0.55em", color: "rgba(200,165,106,0.55)", marginBottom: 28 }}>TEYVAT · LIFE · SIMULATOR</div>
          <h1 className="gold" style={{ fontSize: "clamp(26px,5.5vw,52px)", fontWeight: 700, lineHeight: 1.25, marginBottom: 14, fontFamily: "'Noto Serif SC',serif" }}>提瓦特人生重开模拟器</h1>
          <p style={{ color: "rgba(200,165,106,0.45)", fontSize: 15, letterSpacing: "0.25em", marginBottom: 6 }}>一千种命运，一万种人生</p>
          <p style={{ color: "rgba(100,80,50,0.7)", fontSize: 13, marginBottom: 64 }}>你将以一名无名小卒的身份，降生于提瓦特的某处</p>
          <GoldDivider />
          <button className="primary-btn" onClick={onStart} style={{ marginTop: 32, animation: "float 3.5s ease-in-out infinite" }}>开始新的人生</button>
          <p style={{ color: "rgba(60,40,20,0.6)", fontSize: 11, marginTop: 52, letterSpacing: "0.08em", lineHeight: 1.8 }}>
            同人UGC作品，与米哈游官方无关<br />
            种族 · 天赋 · 时代 — 构筑独一无二的一生
          </p>
        </div>
      </div>
    );
  }

  // ── Race Screen ──

  function RaceCard({ race, onSelect, delay }) {
    const [hovered, setHovered] = useState(false);
    const lifespanLabels = { short: "短寿", normal: "正常", long: "长寿", immortal: "永生" };
    const mechLabels = { dragon_awakening: "龙裔觉醒", curse: "诅咒侵蚀", faith: "信仰动摇" };
    return (
      <button type="button" className="race-card"
        onClick={() => onSelect(race)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderColor: hovered ? "#c8a56a" : "rgba(200,165,106,0.12)",
          boxShadow: hovered ? "0 0 32px rgba(200,165,106,0.15), 0 6px 28px rgba(0,0,0,0.5)" : "0 2px 14px rgba(0,0,0,0.3)",
          animationDelay: `${delay}s`,
        }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: hovered ? "#e8d5a3" : "#d4c4a0", transition: "color 0.3s" }}>{race.name}</div>
        <div style={{ fontSize: 12, color: "#7a6a50", marginBottom: 10, lineHeight: 1.6 }}>{race.desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11 }}>
          <span style={{ color: "#8a7a60", border: "1px solid rgba(200,165,106,0.15)", borderRadius: 4, padding: "2px 8px" }}>{lifespanLabels[race.lifespan_type] || "正常"}</span>
          {race.special_mechanics && (
            <span style={{ color: "#c8a56a", border: "1px solid rgba(200,165,106,0.25)", borderRadius: 4, padding: "2px 8px" }}>
              {mechLabels[race.special_mechanics.type] || race.special_mechanics.type}
            </span>
          )}
        </div>
      </button>
    );
  }

  function RaceScreen({ onSelect }) {
    const selectableRaces = getSelectableRaces();
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px 48px", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ color: "rgba(200,165,106,0.4)", fontSize: 11, letterSpacing: "0.45em", marginBottom: 12 }}>CHOOSE YOUR RACE</div>
          <h2 className="gold" style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 700 }}>选择你的种族</h2>
          <p style={{ color: "rgba(90,70,40,0.8)", fontSize: 13, marginTop: 8 }}>种族决定你能降生的国度、寿命与特殊命运</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, maxWidth: 920, width: "100%" }}>
          {selectableRaces.map((race, i) => (
            <div key={race.id} className="fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <RaceCard race={race} onSelect={onSelect} delay={i * 0.08} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Nation Screen ──

  function NationCard({ nation, available, onSelect }) {
    const [hovered, setHovered] = useState(false);
    const isAvail = available !== false;
    return (
      <button type="button"
        className={`nation-card${isAvail ? "" : " disabled"}`}
        onClick={() => isAvail && onSelect(nation)}
        onMouseEnter={() => isAvail && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={!isAvail}
        style={{
          borderColor: hovered ? nation.color : "rgba(200,165,106,0.12)",
          boxShadow: hovered ? `0 0 32px ${nation.color}33, 0 6px 28px rgba(0,0,0,0.5)` : "0 2px 14px rgba(0,0,0,0.3)",
        }}>
        <div style={{ fontSize: 28, marginBottom: 10, color: nation.color, textShadow: hovered ? `0 0 20px ${nation.color}88` : "none", transition: "text-shadow 0.3s", fontFamily: "Cinzel,serif", fontWeight: 700 }}>{nation.element}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: hovered ? nation.color : "#d4c4a0", transition: "color 0.3s" }}>{nation.name}</div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#7a6a50", marginBottom: 12 }}>{nation.element}元素之国</div>
        <div style={{ fontSize: 12, color: "#6a5a40", lineHeight: 1.7, borderTop: "1px solid rgba(200,165,106,0.08)", paddingTop: 10 }}>{nation.desc}</div>
        {hovered && isAvail && (
          <div style={{ marginTop: 12 }}>
            {nation.eras.map((era) => (
              <div key={era} style={{ fontSize: 11, color: `${nation.color}99`, padding: "2px 0", letterSpacing: "0.05em" }}>· {era}</div>
            ))}
          </div>
        )}
        {!isAvail && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#604040" }}>该种族无法在此地降生</div>
        )}
      </button>
    );
  }

  function NationScreen({ selectedRace, onSelect }) {
    const availableNations = selectedRace ? getNationsForRace(selectedRace.id) : NATIONS;
    const availableIds = new Set(availableNations.map((n) => n.id));
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px 48px", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ color: "rgba(200,165,106,0.4)", fontSize: 11, letterSpacing: "0.45em", marginBottom: 12 }}>CHOOSE YOUR HOMELAND</div>
          <h2 className="gold" style={{ fontSize: "clamp(20px,4vw,32px)", fontWeight: 700 }}>选择你的出生之地</h2>
          <p style={{ color: "rgba(90,70,40,0.8)", fontSize: 13, marginTop: 8 }}>
            {selectedRace ? `作为${selectedRace.name}，你能在以下国度降生` : "时代将由命运随机决定"}
          </p>
        </div>
        <div className="mobile-nation-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, width: "100%", maxWidth: 1100 }}>
          {NATIONS.map((nation, index) => (
            <div key={nation.id} className="fade-up" style={{ animationDelay: `${index * 0.08}s` }}>
              <NationCard nation={nation} available={availableIds.has(nation.id)} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Setup Screen ──

  function SetupScreen({
    setupState, selectedTalentIds, allocation, setupBudget, totalAllocated,
    validation, statMeta, allocationCaps, onToggleTalent, onAdjustAllocation, onBegin,
  }) {
    const nation = NATIONS.find((item) => item.id === setupState.nation_id);
    const finalStats = validation.finalStats || {
      intellect: (allocation.intellect || 0) + (setupBudget?.effectSummary.stats.intellect || 0),
      spirit: (allocation.spirit || 0) + (setupBudget?.effectSummary.stats.spirit || 0),
      physique: (allocation.physique || 0) + (setupBudget?.effectSummary.stats.physique || 0),
      elemental: (allocation.elemental || 0) + (setupBudget?.effectSummary.stats.elemental || 0),
    };
    const specialTalent = setupBudget?.selectedTalents.find((item) => item.specialLine);
    const caps = allocationCaps || { intellect: 5, spirit: 5, physique: 5, elemental: 5 };

    return (
      <div style={{ minHeight: "100vh", padding: "36px 18px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ color: "rgba(200,165,106,0.4)", fontSize: 11, letterSpacing: "0.45em", marginBottom: 12 }}>BIRTH PREPARATION</div>
            <h2 className="gold" style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 700 }}>构筑这一次人生</h2>
            <p style={{ color: "#7a6a50", fontSize: 13, marginTop: 8 }}>
              {setupState.race_name} · {setupState.nation_name} · {setupState.era} · {setupState.birthplace}
            </p>
          </div>
          <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            <div className="card fade-up" style={{ padding: "22px 22px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#7a6a50", letterSpacing: "0.18em", marginBottom: 4 }}>十连天赋</div>
                  <div style={{ fontSize: 18, color: "#e8d5a3", fontWeight: 700 }}>选择 {selectedTalentIds.length}/{MAX_TALENT_SELECTION}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#7a6a50", letterSpacing: "0.18em", marginBottom: 4 }}>时代背景</div>
                  <div style={{ fontSize: 14, color: nation?.color }}>{setupState.birthplace}</div>
                  <div style={{ fontSize: 12, color: "#6a5a40", maxWidth: 260 }}>{setupState.era_desc}</div>
                </div>
              </div>
              <div className="mobile-talent-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
                {setupState.talentDraw.map((talent) => {
                  const selected = selectedTalentIds.includes(talent.id);
                  const rarityMeta = TALENT_RARITY_META[talent.rarity];
                  return (
                    <button key={talent.id} type="button" onClick={() => onToggleTalent(talent.id)}
                      className="nation-card"
                      style={{
                        padding: "14px 14px 12px", textAlign: "left",
                        borderColor: selected ? rarityMeta.color : "rgba(200,165,106,0.12)",
                        boxShadow: selected ? `0 0 24px ${rarityMeta.color}22` : "none",
                        background: selected ? "rgba(16,22,36,0.96)" : "rgba(8,12,24,0.86)",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: selected ? "#f0dec0" : "#d4c4a0" }}>{talent.name}</div>
                        <div style={{ fontSize: 11, color: rarityMeta.color }}>{rarityMeta.label}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#8b7a58", lineHeight: 1.7 }}>{talent.desc}</div>
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {Object.entries(talent.stats || {}).map(([key, value]) => (
                          <span key={key} style={{ fontSize: 11, color: value >= 0 ? "#5ec878" : "#e07070" }}>
                            {statMeta[key].label}{value >= 0 ? `+${value}` : value}
                          </span>
                        ))}
                        {talent.bonusPoints ? <span style={{ fontSize: 11, color: talent.bonusPoints > 0 ? "#5ec878" : "#e07070" }}>初始点{talent.bonusPoints > 0 ? `+${talent.bonusPoints}` : talent.bonusPoints}</span> : null}
                        {talent.lifespanBonus ? <span style={{ fontSize: 11, color: talent.lifespanBonus > 0 ? "#5ec878" : "#e07070" }}>寿命{talent.lifespanBonus > 0 ? `+${talent.lifespanBonus}` : talent.lifespanBonus}</span> : null}
                        {talent.cap_modifiers && Object.entries(talent.cap_modifiers).map(([key, value]) => (
                          <span key={`cap-${key}`} style={{ fontSize: 11, color: value > 0 ? "#5ec878" : "#e07070" }}>
                            {statMeta[key]?.label || key}上限{value > 0 ? `+${value}` : value}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="card fade-up" style={{ padding: "22px 20px 18px", animationDelay: "0.08s" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#7a6a50", letterSpacing: "0.18em", marginBottom: 4 }}>属性分配</div>
                <div style={{ fontSize: 19, color: "#e8d5a3", fontWeight: 700 }}>{totalAllocated}/{setupBudget?.totalPoints || 0} 点</div>
                <div style={{ fontSize: 12, color: "#6a5a40", marginTop: 6 }}>
                  基础 {window.TeyvatData.STARTING_ATTRIBUTE_POINTS} 点
                  {setupBudget?.effectSummary.bonusPoints ? `，天赋修正 ${setupBudget.effectSummary.bonusPoints > 0 ? `+${setupBudget.effectSummary.bonusPoints}` : setupBudget.effectSummary.bonusPoints} 点` : ""}
                </div>
              </div>
              {Object.entries(statMeta).map(([key, meta]) => {
                const talentDelta = setupBudget?.effectSummary.stats[key] || 0;
                const cap = caps[key] || 5;
                const allocated = allocation[key] || 0;
                const atCap = allocated >= cap;
                return (
                  <div key={key} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(200,165,106,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, color: "#d8c79f" }}>{meta.label}</div>
                        <div style={{ fontSize: 11, color: "#6a5a40" }}>
                          分配 {allocated}<span className={`cap-text${atCap ? " limited" : ""}`}>/{cap}</span>
                          {talentDelta !== 0 ? ` / 天赋 ${talentDelta > 0 ? `+${talentDelta}` : talentDelta}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button type="button" className="choice-btn" style={{ width: 34, padding: "6px 0", textAlign: "center" }}
                          onClick={() => onAdjustAllocation(key, -1)}>-</button>
                        <div style={{ minWidth: 42, textAlign: "center", fontSize: 18, color: meta.color }}>{finalStats[key]}</div>
                        <button type="button" className="choice-btn"
                          style={{ width: 34, padding: "6px 0", textAlign: "center", opacity: atCap ? 0.4 : 1 }}
                          onClick={() => onAdjustAllocation(key, 1)}
                          disabled={atCap}>+</button>
                      </div>
                    </div>
                    <StatBar label="最终值" value={finalStats[key]} color={meta.color} compact />
                  </div>
                );
              })}
              <div style={{ marginBottom: 12, padding: "12px 14px", background: "rgba(0,0,0,0.24)", borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: "#7a6a50", marginBottom: 6 }}>系统初始化预览</div>
                <div style={{ fontSize: 14, color: "#d8c79f", lineHeight: 1.8 }}>
                  种族：{setupState.race_name}
                  <br />时代：{setupState.era}
                  <br />出生地：{setupState.birthplace}
                  <br />机制：体质 &lt; 0 时肉体死亡；精神 &lt; 0 时意识崩溃并判定死亡。
                  <br />{specialTalent ? `已开启特殊事件线：${specialTalent.name}` : "当前未开启特殊事件线。"}
                </div>
              </div>
              {!validation.ok ? (
                <div style={{ color: "#c78282", fontSize: 12, lineHeight: 1.8, marginBottom: 12 }}>{validation.reason}</div>
              ) : (
                <div style={{ color: "#7bb58b", fontSize: 12, lineHeight: 1.8, marginBottom: 12 }}>配置完成，可以开始按年推进人生。</div>
              )}
              <button className="primary-btn" onClick={onBegin} disabled={!validation.ok}
                style={{ width: "100%", opacity: validation.ok ? 1 : 0.55 }}>
                开始这一生（{selectedTalentIds.length}/{MAX_TALENT_SELECTION}天赋，{totalAllocated}/{setupBudget?.totalPoints || 0}点）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Screen ──

  function GameScreen({ gs, timeline, majorPending, autoOn, onToggleAuto, onAdvance, onChoice }) {
    const nation = NATIONS.find((item) => item.id === gs.nation_id);
    const statKeys = ["intellect", "spirit", "physique", "elemental"];
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
      const el = document.getElementById("timeline-scroll");
      if (el) el.scrollTop = el.scrollHeight;
    }, [timeline.length]);

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div className="mobile-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid rgba(200,165,106,0.1)", flexWrap: "wrap", gap: 4 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: nation?.color, fontWeight: 700, fontSize: 13 }}>{gs.race_name} · {gs.nation_name}</span>
            <span style={{ color: "#8a7a60", fontSize: 11 }}>{gs.era}</span>
            <span style={{ color: "#7a6a50", fontSize: 11 }}>|</span>
            <span style={{ color: "#e8d5a3", fontSize: 12, fontWeight: 700 }}>{gs.age}岁</span>
            {statKeys.map((key) => (
              <span key={key} style={{ fontSize: 10, color: STAT_META[key].color }}>{STAT_META[key].label}{gs.stats[key]}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button type="button" className="choice-btn" onClick={() => setSidebarOpen(true)}
              style={{ padding: "3px 10px", fontSize: 11, width: "auto" }}>☰</button>
            {!gs.isDead && (
              <button type="button" className="choice-btn" onClick={onToggleAuto}
                style={{ padding: "3px 12px", fontSize: 11, width: "auto", color: autoOn ? "#e8d080" : "rgba(200,165,106,0.5)", borderColor: autoOn ? "rgba(240,216,144,0.4)" : "rgba(200,165,106,0.12)" }}>
                {autoOn ? "⏸" : "▶"}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "flex-end" }}
            onClick={() => setSidebarOpen(false)}>
            <div className="card" style={{ width: 230, padding: "14px 12px", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#7a6a50" }}>{gs.age}岁 · 寿命{gs.lifespan}</span>
                <button type="button" onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "#7a6a50", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
              {statKeys.map((key) => {
                const meta = STAT_META[key];
                return <StatBar key={key} label={meta.label} value={gs.stats[key]} color={meta.color} compact />;
              })}
              {(gs.nation_id === "khaenriah" && gs.abyss_corruption !== undefined) && <AbyssBar value={gs.abyss_corruption || 0} />}
              {(gs.race_id === "khaenriah" && gs.nation_id !== "khaenriah") && <CurseBar value={gs.curse_progress || 0} />}
              {(gs.race_id === "angel") && <FaithBar value={gs.faith_loss || 0} />}
              {gs.talents?.length ? (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
                  <div style={{ fontSize: 10, color: "#6a5a40", marginBottom: 6 }}>天赋</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {gs.talents.map((t) => (
                      <span key={t.id} style={{ fontSize: 10, padding: "1px 6px", background: "rgba(200,165,106,0.08)", border: "1px solid rgba(200,165,106,0.15)", borderRadius: 8, color: "#c8a56a" }}>{t.name}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div id="timeline-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
          {/* Init block */}
          <div className="card" style={{ padding: "12px 14px", marginBottom: 10, background: "rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 12, lineHeight: 1.8, color: "#8a7a60" }}>
              {gs.race_name} · {gs.era} · {gs.birthplace}
              <br />智力{gs.initialStats?.intellect ?? gs.stats.intellect} 精神{gs.initialStats?.spirit ?? gs.stats.spirit} 元素力{gs.initialStats?.elemental ?? gs.stats.elemental} 体质{gs.initialStats?.physique ?? gs.stats.physique} · 寿命阈值{gs.lifespan}
            </div>
          </div>

          {/* Timeline entries */}
          {timeline.map((entry, i) => {
            if (entry.type === "story") {
              return (
                <div key={entry.id || `s-${i}`} className="fade-up" style={{ padding: "6px 0", borderBottom: "1px solid rgba(200,165,106,0.04)" }}>
                  <span style={{ color: "#8a7a60", fontSize: 12, marginRight: 6 }}>{entry.age}岁</span>
                  <span style={{ fontSize: 14, color: "#c4b48a", lineHeight: 1.9 }}>{entry.text}</span>
                </div>
              );
            }
            if (entry.type === "result") {
              const dc = entry.dead ? "#d08070" : "#8a7a60";
              const ck = entry.check ? ` [${STAT_META[entry.check.stat]?.label}${entry.check.passed?"成功":"失败"} 骰${entry.check.roll}/${entry.check.target}]` : "";
              const dt = entry.deltas ? Object.entries(entry.deltas).filter(([,v])=>v!==0).map(([k,v])=>`${STAT_META[k]?.label||k}${v>0?"+":""}${v}`).join(" ") : "";
              return (
                <div key={entry.id || `r-${i}`} className="fade-up" style={{ padding: "4px 0 10px 0" }}>
                  <span style={{ fontSize: 13, color: dc, lineHeight: 1.9 }}>{entry.text}</span>
                  {(ck||dt) ? <span style={{ fontSize: 11, color: "#6a5040", marginLeft: 4 }}>{ck}{dt?" · "+dt:""}</span> : null}
                </div>
              );
            }
            return null;
          })}

          {/* Major event choices */}
          {majorPending && !gs.isDead && (
            <div className="fade-up card" style={{ padding: "14px 16px", margin: "10px 0", borderColor: "rgba(200,165,106,0.35)" }}>
              <div style={{ fontSize: 13, color: "#e8d5a3", marginBottom: 12, fontWeight: 700 }}>⚡ 重大抉择</div>
              {majorPending.choices ? majorPending.choices.map((choice, idx) => (
                <button key={idx} className="choice-btn" onClick={() => onChoice(choice)}
                  style={{ marginBottom: 6, fontSize: 14 }}>
                  ▶ {choice.text}
                  {choice.check ? <span style={{ marginLeft: 6, fontSize: 11, color: "#7a6a50" }}>[{STAT_META[choice.check.stat]?.label}]{choice.check.difficulty}</span> : null}
                </button>
              )) : null}
            </div>
          )}

          {/* Advance button */}
          {!gs.isDead && !majorPending && (
            <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
              <button className="choice-btn" onClick={onAdvance}
                style={{ display: "inline-block", width: "auto", padding: "8px 32px", fontSize: 13, borderColor: "rgba(200,165,106,0.2)" }}>
                继续 →
              </button>
            </div>
          )}

          {gs.isDead && (
            <div style={{ textAlign: "center", padding: "16px 0 8px 0" }}>
              <span style={{ color: "#b97b7b", fontSize: 13 }}>人生结束</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Summary Screen ──

  function SummaryScreen({ gs, summary, isLoading, onRestart }) {
    const finalStats = ["intellect", "spirit", "physique", "elemental"];

    // Compute age-based evaluation
    const getAgeGrade = () => {
      const ratio = gs.age / gs.lifespan;
      if (gs.isDead && ratio < 0.2) return { label: "早夭", grade: 0, color: "#a0a0a0" };
      if (ratio < 0.5) return { label: "未尽天年", grade: 1, color: "#b0a0c0" };
      if (ratio < 0.8) return { label: "中寿", grade: 2, color: "#c0b080" };
      if (ratio < 1.1) return { label: "寿满天年", grade: 3, color: "#d8c56a" };
      return { label: "超然长寿", grade: 4, color: "#e8d080" };
    };

    const getAvgStat = () => (gs.stats.intellect + gs.stats.spirit + gs.stats.physique + gs.stats.elemental) / 4;
    const getOverallGrade = () => {
      const avg = getAvgStat();
      if (avg < 0) return { label: "灾厄缠身", grade: 0 };
      if (avg < 3) return { label: "平凡一生", grade: 1 };
      if (avg < 7) return { label: "有所作为", grade: 2 };
      if (avg < 12) return { label: "卓越不凡", grade: 3 };
      return { label: "传奇人物", grade: 4 };
    };

    const ageGrade = getAgeGrade();
    const overallGrade = getOverallGrade();

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ color: "rgba(200,165,106,0.35)", fontSize: 11, letterSpacing: "0.45em", marginBottom: 12 }}>LIFE COMPLETE</div>
            <h2 className="gold" style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
              {gs.isHilichurlEnding ? "荒野的低语" : (gs.nation_id === "primordial" && gs.race_id === "dragon") ? "旧世界的残骸" : (gs.nation_id === "primordial" && gs.race_id === "angel") ? "引路的微光" : gs.isDead ? "命数终止" : "人生终章"}
            </h2>
            <p style={{ color: "#7a6a50", fontSize: 13 }}>{gs.race_name} · {gs.nation_name} · {gs.era}</p>
          </div>

          {/* Final stat cards */}
          <div className="fade-up mobile-summary-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 18, border: "1px solid rgba(200,165,106,0.15)", borderRadius: 8 }}>
            {finalStats.map((key, i) => (
              <div key={key} style={{ padding: "14px 8px", textAlign: "center", background: "rgba(8,12,24,0.9)", borderRight: i < 3 ? "1px solid rgba(200,165,106,0.08)" : "none" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: STAT_META[key].color }}>{gs.stats[key]}</div>
                <div style={{ fontSize: 10, color: "#6a5a40", marginTop: 3 }}>{STAT_META[key].label}</div>
              </div>
            ))}
          </div>

          {/* Evaluation */}
          <div className="card fade-up" style={{ padding: "18px 20px", marginBottom: 14, animationDelay: "0.1s" }}>
            <div style={{ fontSize: 12, color: "#7a6a50", letterSpacing: "0.15em", marginBottom: 12 }}>人生评价</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
              <div style={{ color: "#7a6a50" }}>享年</div>
              <div style={{ color: ageGrade.color, textAlign: "right" }}>{gs.age}岁 · {ageGrade.label}</div>
              <div style={{ color: "#7a6a50" }}>寿命阈值</div>
              <div style={{ color: "#d8c56a", textAlign: "right" }}>{gs.lifespan}</div>
              <div style={{ color: "#7a6a50" }}>死亡原因</div>
              <div style={{ color: gs.isDead ? (gs.isHilichurlEnding ? "#c0a060" : "#b97b7b") : "#8a9a6a", textAlign: "right", fontSize: 12 }}>
                {gs.isDead ? gs.deathReason : "安然在世"}
              </div>
              <div style={{ color: "#7a6a50", marginTop: 8 }}>综合评价</div>
              <div style={{ color: overallGrade.grade >= 3 ? "#e8d080" : overallGrade.grade >= 2 ? "#c8c06a" : "#8a7a60", textAlign: "right", fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                {overallGrade.label}
              </div>
            </div>
          </div>

          {/* Ending panel */}
          {gs.isHilichurlEnding && (
            <div className="fade-up" style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(96,60,130,0.12)", border: "1px solid rgba(160,80,200,0.2)", borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: "#c0a0d0", lineHeight: 1.8 }}>【结局：荒野的低语】D·失落王朝的遗民</div>
            </div>
          )}
          {(gs.nation_id === "primordial" && gs.race_id === "dragon" && gs.isDead) && (
            <div className="fade-up" style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(200,160,60,0.1)", border: "1px solid rgba(240,216,144,0.25)", borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: "#e8d080", lineHeight: 1.8 }}>【结局：旧世界的残骸】S·太古的殉道者</div>
            </div>
          )}
          {(gs.nation_id === "primordial" && gs.race_id === "angel" && gs.isDead) && (
            <div className="fade-up" style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(180,200,220,0.1)", border: "1px solid rgba(180,200,240,0.2)", borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: "#c0d0f0", lineHeight: 1.8 }}>【结局：引路的微光】D·坠落的晨星</div>
            </div>
          )}

          {gs.talents?.length ? (
            <div className="fade-up" style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#6a5a40", marginBottom: 8 }}>天赋</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {gs.talents.map((t) => (
                  <span key={t.id} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 14, background: "rgba(200,165,106,0.06)", border: "1px solid rgba(200,165,106,0.15)", color: "#c8a56a" }}>{t.name}</span>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ textAlign: "center" }}>
            <button className="primary-btn" onClick={onRestart}>再来一世</button>
          </div>
        </div>
      </div>
    );
  }

  window.TeyvatUI = { StarField, TitleScreen, RaceScreen, NationScreen, SetupScreen, GameScreen, SummaryScreen };
})();
