(() => {
  const { useState, useEffect, useMemo } = React;
  const { STAT_META } = window.TeyvatData;
  const { createStars } = window.TeyvatUtils;
  const { getRace } = window.TeyvatRaceData;
  const {
    createSetupState, getSetupBudget, validateSetup, buildGameState,
    advanceYear, getAllocationCaps,
  } = window.TeyvatEngine;
  const { CSS } = window.TeyvatTheme;
  const { StarField, TitleScreen, RaceScreen, NationScreen, SetupScreen, GameScreen, SummaryScreen } = window.TeyvatUI;

  const EMPTY_ALLOCATION = { intellect: 0, spirit: 0, physique: 0, elemental: 0 };

  function App() {
    const [screen, setScreen] = useState("title");
    const [selectedRace, setSelectedRace] = useState(null);
    const [setupState, setSetupState] = useState(null);
    const [selectedTalentIds, setSelectedTalentIds] = useState([]);
    const [allocation, setAllocation] = useState(EMPTY_ALLOCATION);
    const [gameState, setGameState] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [majorPending, setMajorPending] = useState(null);
    const [autoOn, setAutoOn] = useState(false);

    const stars = useMemo(() => createStars(110), []);
    const setupBudget = useMemo(() => setupState ? getSetupBudget(setupState, selectedTalentIds) : null, [setupState, selectedTalentIds]);
    const totalAllocated = useMemo(() => Object.values(allocation).reduce((s, v) => s + v, 0), [allocation]);
    const validation = useMemo(() => setupState ? validateSetup(setupState, selectedTalentIds, allocation) : { ok: false, reason: "" }, [setupState, selectedTalentIds, allocation]);
    const allocationCaps = useMemo(() => {
      if (!setupState || !setupBudget) return null;
      return getAllocationCaps(getRace(setupState.race_id || "human"), setupBudget.selectedTalents);
    }, [setupState, setupBudget]);

    // ── Core: process one year ──
    function tick(gs) {
      const result = advanceYear(gs, null);
      const newTimeline = [];

      // Story
      if (result.storyText) {
        newTimeline.push({ id: `s-${Date.now()}`, type: "story", age: gs.age, text: result.storyText });
      }

      // Major pending
      if (result.majorChoices) {
        return { newTimeline, nextGs: null, pending: { choices: result.majorChoices, event: result._rawEvent } };
      }

      // Resolution
      if (result.resolutionText) {
        newTimeline.push({
          id: `r-${Date.now()}`, type: "result", age: gs.age,
          text: result.resolutionText, check: result.checkResult,
          deltas: result.statDeltas, dead: result.isDead,
        });
      }

      return {
        newTimeline, pending: null,
        nextGs: result.nextGameState || gs,
        dead: result.isDead,
        hilichurl: result.isHilichurlEnding,
      };
    }

    function doTick() {
      if (!gameState || gameState.isDead) return;
      const { newTimeline, nextGs, pending, dead, hilichurl } = tick(gameState);
      setTimeline((t) => [...t, ...newTimeline]);
      setMajorPending(pending);
      if (nextGs) {
        if (hilichurl && !nextGs.flags.includes("荒野的低语")) {
          nextGs.flags.push("荒野的低语");
        }
        setGameState(nextGs);
      }
      if (dead && !pending) {
        setAutoOn(false);
        setTimeout(() => setScreen("summary"), 700);
      }
    }

    function doChoice(choice) {
      if (!majorPending || !gameState) return;
      setAutoOn(false);
      const result = advanceYear(gameState, choice);
      const newTimeline = [];
      if (result.resolutionText) {
        newTimeline.push({
          id: `r-${Date.now()}`, type: "result", age: gameState.age,
          text: result.resolutionText, check: result.checkResult,
          deltas: result.statDeltas, dead: result.isDead,
        });
      }
      setTimeline((t) => [...t, ...newTimeline]);
      setMajorPending(null);
      if (result.nextGameState) {
        if (result.isHilichurlEnding && !result.nextGameState.flags.includes("荒野的低语")) {
          result.nextGameState.flags.push("荒野的低语");
        }
        setGameState(result.nextGameState);
      }
      if (result.isDead) {
        setAutoOn(false);
        setTimeout(() => setScreen("summary"), 700);
      }
    }

    // Auto-advance
    useEffect(() => {
      if (!autoOn) return;
      if (majorPending || !gameState || gameState.isDead) return;
      const id = setTimeout(() => doTick(), 900);
      return () => clearTimeout(id);
    }, [autoOn, gameState, majorPending, timeline.length]);

    // ── Handlers ──
    function handleRaceSelect(race) {
      setSelectedRace(race);
      const nations = window.TeyvatRaceData.getNationsForRace(race.id);
      if (nations.length === 1) { beginSetup(nations[0], race); }
      else { setScreen("nation"); }
    }
    function handleNationSelect(nation) { beginSetup(nation, selectedRace); }
    function beginSetup(nation, race) {
      setSetupState(createSetupState(nation, race));
      setSelectedTalentIds([]);
      setAllocation(EMPTY_ALLOCATION);
      setScreen("setup");
    }
    function toggleTalent(talentId) {
      if (!setupState) return;
      const talent = setupState.talentDraw.find((t) => t.id === talentId);
      if (!talent) return;
      setSelectedTalentIds((prev) => {
        if (prev.includes(talentId)) return prev.filter((id) => id !== talentId);
        if (prev.length >= 2) return prev;
        const sel = prev.map((id) => setupState.talentDraw.find((t) => t.id === id)).filter(Boolean);
        if (talent.specialLine && sel.some((t) => t.specialLine && t.specialLine !== talent.specialLine)) return prev;
        return [...prev, talentId];
      });
    }
    function adjustAllocation(key, delta) {
      setAllocation((prev) => {
        const next = Math.max(0, (prev[key] || 0) + delta);
        if (delta > 0 && allocationCaps && next > (allocationCaps[key] || 5)) return prev;
        if (delta > 0 && setupBudget && totalAllocated >= setupBudget.totalPoints) return prev;
        return { ...prev, [key]: next };
      });
    }
    function beginLife() {
      if (!setupState || !validation.ok) return;
      const gs = buildGameState(setupState, selectedTalentIds, allocation);
      setGameState(gs);
      setTimeline([]);
      setMajorPending(null);
      setAutoOn(false);
      setScreen("game");
      setTimeout(() => {
        const { newTimeline, nextGs, pending, dead, hilichurl } = tick(gs);
        setTimeline(newTimeline);
        setMajorPending(pending);
        if (nextGs) {
          if (hilichurl && !nextGs.flags.includes("荒野的低语")) nextGs.flags.push("荒野的低语");
          setGameState(nextGs);
        }
        if (dead && !pending) { setTimeout(() => setScreen("summary"), 700); }
      }, 100);
    }
    function restart() {
      setScreen("title"); setSelectedRace(null); setSetupState(null);
      setSelectedTalentIds([]); setAllocation(EMPTY_ALLOCATION);
      setGameState(null); setTimeline([]); setMajorPending(null); setAutoOn(false);
    }

    return (
      <div className="root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <StarField stars={stars} />
        {screen === "title"   && <TitleScreen onStart={() => setScreen("race")} />}
        {screen === "race"    && <RaceScreen onSelect={handleRaceSelect} />}
        {screen === "nation"  && selectedRace && <NationScreen selectedRace={selectedRace} onSelect={handleNationSelect} />}
        {screen === "setup"   && setupState && (
          <SetupScreen setupState={setupState} selectedTalentIds={selectedTalentIds} allocation={allocation}
            setupBudget={setupBudget} totalAllocated={totalAllocated} validation={validation} statMeta={STAT_META}
            allocationCaps={allocationCaps} onToggleTalent={toggleTalent} onAdjustAllocation={adjustAllocation} onBegin={beginLife} />
        )}
        {screen === "game"    && gameState && (
          <GameScreen gs={gameState} timeline={timeline} majorPending={majorPending}
            autoOn={autoOn} onToggleAuto={() => setAutoOn((p) => !p)}
            onAdvance={majorPending ? null : doTick} onChoice={doChoice} />
        )}
        {screen === "summary" && gameState && <SummaryScreen gs={gameState} onRestart={restart} />}
      </div>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
})();
