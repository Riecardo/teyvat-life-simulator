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

  function GameScreen({ gs, isLoading, displayedText, showChoices, currentEvent, statDeltas, resolution, busy, onChoice, onContinue }) {
    const nation = NATIONS.find((item) => item.id === gs.nation_id);
    const activeAge = resolution ? resolution.age : gs.age;
    const stage = getStageByAge(activeAge);
    const statKeys = ["intellect", "spirit", "physique", "elemental"];
    const visibleChoices = currentEvent?.type === "major"
      ? currentEvent.choices
      : [{ text: currentEvent?.actionText || "下一年" }];
    const checkLabel = resolution?.checkResult
      ? `${STAT_META[resolution.checkResult.stat]?.label || resolution.checkResult.stat} ${resolution.checkResult.passed ? "成功" : "失败"}`
      : null;

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, padding: "18px 18px 24px" }}>
        <div className="mobile-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(200,165,106,0.1)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(200,165,106,0.14)", color: "#e8d5a3", fontSize: 11 }}>{gs.age}岁</div>
            <div style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(200,165,106,0.2)", color: "#7a6a50", fontSize: 11 }}>{stage.name}</div>
            <div style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(200,165,106,0.2)", color: "#7a6a50", fontSize: 11 }}>寿命阈值 {gs.lifespan}</div>
            {(gs.age_increment || 1) > 1 && (
              <div style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(240,216,144,0.3)", color: "#d8c090", fontSize: 11 }}>每{gs.age_increment}年推进</div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#7a6a50" }}>
            <span style={{ color: nation?.color }}>{gs.race_name} · {gs.nation_name}</span>{" · "}{gs.birthplace}
          </div>
        </div>
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, flex: 1, alignItems: "start" }}>
          <div className="card mobile-sidebar" style={{ padding: "16px 14px", position: "sticky", top: 18 }}>
            <div style={{ fontSize: 10, color: "#6a5a40", letterSpacing: "0.2em", marginBottom: 14 }}>年度状态</div>
            {statKeys.map((key) => {
              const meta = STAT_META[key];
              const color = key === "elemental" ? nation?.color || meta.color : meta.color;
              return <StatBar key={key} label={meta.label} value={gs.stats[key]} color={color} delta={statDeltas?.[key]} compact />;
            })}
            {(gs.nation_id === "khaenriah" && gs.abyss_corruption !== undefined) && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
                <AbyssBar value={gs.abyss_corruption || 0} />
              </div>
            )}
            {(gs.race_id === "khaenriah" && gs.nation_id !== "khaenriah") && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
                <CurseBar value={gs.curse_progress || 0} />
              </div>
            )}
            {(gs.race_id === "angel") && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
                <FaithBar value={gs.faith_loss || 0} />
              </div>
            )}
            <div style={{ marginTop: 10, paddingTop: 12, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
              <div style={{ fontSize: 10, color: "#6a5a40", marginBottom: 8 }}>系统信息</div>
              <div style={{ fontSize: 12, color: "#d8c79f", lineHeight: 1.8 }}>
                {gs.era}<br />{gs.birthplace}
                {gs.specialLine ? ` · ${gs.specialLine === "dragon" ? "龙之一生" : "天使之一生"}` : ""}
              </div>
            </div>
            {gs.talents?.length ? (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
                <div style={{ fontSize: 10, color: "#6a5a40", marginBottom: 8 }}>已选天赋</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {gs.talents.map((talent) => (
                    <span key={talent.id} style={{ fontSize: 10, padding: "2px 7px", background: "rgba(200,165,106,0.08)", border: "1px solid rgba(200,165,106,0.18)", borderRadius: 10, color: "#c8a56a" }}>{talent.name}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {gs.history.length ? (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(200,165,106,0.08)" }}>
                <div style={{ fontSize: 10, color: "#6a5a40", marginBottom: 8 }}>近期年份</div>
                {gs.history.slice(-8).map((item, index) => (
                  <div key={`${item.age}-${index}`} style={{ fontSize: 10, color: "#4a3a28", marginBottom: 5, lineHeight: 1.6 }}>
                    <span style={{ color: "#6a5040" }}>{item.label}</span>
                    {item.result ? <span style={{ color: "#7a6a50" }}> · {item.result}</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="card" style={{ padding: "24px 24px 22px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(200,165,106,0.08)" }}>
              <span style={{ fontFamily: "Cinzel,serif", fontSize: 22, fontWeight: 500, color: nation?.color, textShadow: `0 0 24px ${nation?.color}44` }}>{activeAge}岁</span>
              <span style={{ fontSize: 12, color: "#7a6a50" }}>{stage.name}</span>
              {currentEvent?.title ? <span style={{ fontSize: 11, color: "#c8a56a" }}>{currentEvent.title}</span> : null}
            </div>
            {gs.history.length === 0 && !resolution ? (
              <div style={{ marginBottom: 18, padding: "14px 16px", background: "rgba(0,0,0,0.24)", border: "1px solid rgba(200,165,106,0.12)", borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "#7a6a50", letterSpacing: "0.18em", marginBottom: 8 }}>系统初始化</div>
                <div style={{ fontSize: 14, lineHeight: 1.9, color: "#d8c79f" }}>
                  种族：{gs.race_name} · 时代：{gs.era} · 出生地：{gs.birthplace}
                  <br />基础属性：智力 {gs.initialStats?.intellect ?? gs.stats.intellect}，精神 {gs.initialStats?.spirit ?? gs.stats.spirit}，元素力 {gs.initialStats?.elemental ?? gs.stats.elemental}，体质 {gs.initialStats?.physique ?? gs.stats.physique}
                  <br />机制说明：每年自动进行事件判定；体质 &lt; 0 时肉体死亡，精神 &lt; 0 时意识崩溃并判定死亡。
                </div>
              </div>
            ) : null}
            <div style={{ minHeight: 140, marginBottom: 22 }}>
              {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#6a5a40", padding: "20px 0" }}>
                  <div className="spinner" />
                  <span style={{ fontSize: 14 }}>命运的齿轮正在转动……</span>
                </div>
              ) : (
                <p className="mobile-story-text" style={{ fontSize: 15, lineHeight: 2.1, color: "#c4b48a", position: "relative" }}>
                  {displayedText}
                  {displayedText.length < (currentEvent?.story?.length || 0) ? (
                    <span style={{ animation: "blink 1s step-end infinite", marginLeft: 2, color: "#c8a56a" }}>|</span>
                  ) : null}
                </p>
              )}
            </div>
            {statDeltas && Object.keys(statDeltas).length ? (
              <div className="fade-up" style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18, padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: 5 }}>
                {Object.entries(statDeltas).filter(([, value]) => value !== 0).map(([key, value]) => (
                  <span key={key} style={{ fontSize: 12, padding: "2px 10px", borderRadius: 4, color: value > 0 ? "#5ec878" : "#e07070", background: value > 0 ? "rgba(94,200,120,0.1)" : "rgba(224,112,112,0.1)" }}>
                    {STAT_META[key]?.label || key} {value > 0 ? `+${value}` : value}
                  </span>
                ))}
              </div>
            ) : null}
            {resolution ? (
              <div className="fade-up">
                <div style={{ marginBottom: 16, padding: "14px 16px", background: "rgba(0,0,0,0.24)", border: "1px solid rgba(200,165,106,0.12)", borderRadius: 6 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {checkLabel ? <span style={{ fontSize: 11, color: resolution.checkResult.passed ? "#5ec878" : "#e07070" }}>{checkLabel}</span> : null}
                    {resolution.checkResult ? <span style={{ fontSize: 11, color: "#7a6a50" }}>骰值 {resolution.checkResult.roll} / 目标 {resolution.checkResult.target}</span> : null}
                    {resolution.isDead ? <span style={{ fontSize: 11, color: "#e07070" }}>命数已尽</span> : null}
                  </div>
                  <p className="mobile-resolution-text" style={{ fontSize: 14, lineHeight: 2, color: resolution.isDead ? "#e6a0a0" : "#d8c79f" }}>{resolution.text}</p>
                  {resolution.passiveAgeing?.physique ? (
                    <p style={{ fontSize: 12, lineHeight: 1.8, color: "#b98989", marginTop: 10 }}>寿命透支：体质 {resolution.passiveAgeing.physique}</p>
                  ) : null}
                </div>
                <button className="choice-btn" onClick={onContinue} disabled={busy}
                  style={{ textAlign: "center", color: resolution.isDead ? "#f0b0b0" : "rgba(200,165,106,0.85)", borderColor: resolution.isDead ? "rgba(224,112,112,0.35)" : "rgba(200,165,106,0.22)" }}>
                  {resolution.isDead ? "走向终章" : "迈入下一年"}
                </button>
              </div>
            ) : showChoices && currentEvent && !isLoading ? (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {currentEvent.type === "major" ? (
                  <div style={{ fontSize: 11, color: "#6a5a40", letterSpacing: "0.18em", marginBottom: 3 }}>重大历史节点：你会怎么做？</div>
                ) : (
                  <div style={{ fontSize: 11, color: "#6a5a40", letterSpacing: "0.18em", marginBottom: 3 }}>平常一年：只能继续前行</div>
                )}
                {visibleChoices.map((choice, index) => (
                  <button key={`${choice.text}-${index}`} className="choice-btn" onClick={() => onChoice(choice)} disabled={busy}
                    style={currentEvent.type === "major" ? null : { textAlign: "center", color: "rgba(200,165,106,0.8)", letterSpacing: "0.1em", borderColor: "rgba(200,165,106,0.2)" }}>
                    {currentEvent.type === "major" ? <span style={{ color: "rgba(200,165,106,0.6)", marginRight: 9, fontSize: 10 }}>▶</span> : null}
                    {choice.text}
                    {choice.check ? <span style={{ marginLeft: 8, fontSize: 11, color: "#7a6a50" }}>{STAT_META[choice.check.stat]?.label}检定 {choice.check.difficulty}</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // ── Summary Screen ──

  function SummaryScreen({ gs, summary, isLoading, onRestart }) {
    const [visibleCount, setVisibleCount] = useState(5);
    const finalStats = ["intellect", "spirit", "physique", "elemental"];

    useEffect(() => {
      setVisibleCount(5);
    }, []);

    const visibleHistory = gs.history.slice(0, visibleCount);

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ color: "rgba(200,165,106,0.35)", fontSize: 11, letterSpacing: "0.45em", marginBottom: 12 }}>LIFE COMPLETE</div>
            <h2 className="gold" style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
              {gs.isHilichurlEnding ? "荒野的低语" : (gs.nation_id === "primordial" && gs.race_id === "dragon") ? "旧世界的残骸" : (gs.nation_id === "primordial" && gs.race_id === "angel") ? "引路的微光" : gs.isDead ? "命数终止" : "人生终章"}
            </h2>
            <p style={{ color: "#7a6a50", fontSize: 14 }}>{gs.race_name} · {gs.nation_name} · {gs.birthplace} · {gs.era}</p>
            <p style={{ color: "#7a6a50", fontSize: 12, marginTop: 8 }}>
              {gs.isDead ? `止于${gs.age}岁 · ` : `活到${gs.age}岁 · `}
              寿命阈值 {gs.lifespan}
            </p>
            {gs.isDead ? <p style={{ color: gs.isHilichurlEnding ? "#c0a060" : gs.nation_id === "primordial" ? "#e8d080" : "#b97b7b", fontSize: 12, marginTop: 6 }}>{gs.deathReason}</p> : null}
            {gs.isHilichurlEnding ? (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(96,60,130,0.15)", border: "1px solid rgba(160,80,200,0.25)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: "#c0a0d0", lineHeight: 1.8 }}>
                  【结局达成：荒野的低语】<br />
                  生存评价：D（失落王朝的遗民）
                </div>
              </div>
            ) : null}
            {(gs.nation_id === "primordial" && gs.race_id === "dragon" && gs.isDead) ? (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(200,160,60,0.12)", border: "1px solid rgba(240,216,144,0.3)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: "#e8d080", lineHeight: 1.8 }}>
                  【结局达成：旧世界的残骸】<br />
                  生存评价：S（太古的殉道者）
                </div>
              </div>
            ) : null}
            {(gs.nation_id === "primordial" && gs.race_id === "angel" && gs.isDead) ? (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(180,200,220,0.12)", border: "1px solid rgba(180,200,240,0.3)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: "#c0d0f0", lineHeight: 1.8 }}>
                  【结局达成：引路的微光】<br />
                  生存评价：D（坠落的晨星）<br />
                  从高天威权的代行者，沦为凭吊遗迹的孤魂。你背叛了神明，却终究未能拯救凡人——你的余生将在永世的徘徊中度过。
                </div>
              </div>
            ) : null}
          </div>
          <div className="fade-up mobile-summary-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 22, overflow: "hidden", border: "1px solid rgba(200,165,106,0.15)", borderRadius: 8, animationDelay: "0.15s" }}>
            {finalStats.map((key, index) => (
              <div key={key} style={{ padding: "16px 10px", textAlign: "center", background: "rgba(8,12,24,0.9)", borderRight: index < 3 ? "1px solid rgba(200,165,106,0.1)" : "none" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: STAT_META[key].color }}>{gs.stats[key]}</div>
                <div style={{ fontSize: 11, color: "#6a5a40", marginTop: 4 }}>{STAT_META[key].label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 11, color: "#7a6a50", letterSpacing: "0.2em", marginBottom: 14, textAlign: "center" }}>人生编年</div>
            <div className="card" style={{ padding: "16px 20px", maxHeight: 420, overflowY: "auto" }}>
              {gs.history.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6a5040", textAlign: "center", padding: "20px 0" }}>无事可记。</p>
              ) : (
                <div>
                  {visibleHistory.map((item, index) => (
                    <div key={`${item.age}-${index}`} className="fade-up" style={{
                      animationDelay: `${index * 0.03}s`,
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(200,165,106,0.05)",
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: item.label?.includes("死") || item.label?.includes("陨") ? "#d08070" : "#c4b48a",
                    }}>
                      <span style={{ color: "#8a7a60", fontSize: 12, marginRight: 8 }}>{item.age}岁</span>
                      {item.summary}
                      {item.result ? <span style={{ color: "#7a6a50", fontSize: 11, marginLeft: 8 }}>[{item.result}]</span> : null}
                    </div>
                  ))}
                  {visibleCount < gs.history.length && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button className="choice-btn" onClick={() => setVisibleCount((c) => c + 20)}
                        style={{ display: "inline-block", width: "auto", padding: "6px 28px", fontSize: 12 }}>
                        展开更多 ({gs.history.length - visibleCount} 条剩余)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {gs.talents?.length ? (
            <div className="fade-up" style={{ textAlign: "center", marginBottom: 32, animationDelay: "0.35s" }}>
              <div style={{ fontSize: 11, color: "#6a5a40", letterSpacing: "0.2em", marginBottom: 12 }}>命运赐下的天赋</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {gs.talents.map((talent) => (
                  <span key={talent.id} style={{ padding: "4px 14px", fontSize: 12, borderRadius: 20, background: "rgba(200,165,106,0.08)", border: "1px solid rgba(200,165,106,0.25)", color: "#c8a56a" }}>{talent.name}</span>
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
