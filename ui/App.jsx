(() => {
  const { useState, useEffect, useMemo, useRef, useCallback } = React;
  const { STAT_META } = window.TeyvatData;
  const { createStars } = window.TeyvatUtils;
  const { getRace } = window.TeyvatRaceData;
  const { createSetupState, getSetupBudget, validateSetup, buildGameState, advanceYear, getAllocationCaps } = window.TeyvatEngine;
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
    const [pendingMajor, setPendingMajor] = useState(null);
    const [isDead, setIsDead] = useState(false);
    const [autoMode, setAutoMode] = useState(false);
    const [busy, setBusy] = useState(false);

    const stars = useMemo(() => createStars(110), []);
    const setupBudget = useMemo(() => (setupState ? getSetupBudget(setupState, selectedTalentIds) : null), [setupState, selectedTalentIds]);
    const totalAllocated = useMemo(() => Object.values(allocation).reduce((sum, v) => sum + v, 0), [allocation]);
    const validation = useMemo(() => (setupState ? validateSetup(setupState, selectedTalentIds, allocation) : { ok: false, reason: "" }), [setupState, selectedTalentIds, allocation]);
    const allocationCaps = useMemo(() => {
      if (!setupState || !setupBudget) return null;
      const race = getRace(setupState.race_id || "human");
      return getAllocationCaps(race, setupBudget.selectedTalents);
    }, [setupState, setupBudget]);

    // Refs for interval
    const gsRef = useRef(gameState);
    const pendingRef = useRef(pendingMajor);
    const isDeadRef = useRef(isDead);
    const busyRef = useRef(busy);
    gsRef.current = gameState;
    pendingRef.current = pendingMajor;
    isDeadRef.current = isDead;
    busyRef.current = busy;

    function addTimelineEntry(entry) {
      setTimeline((prev) => [...prev, entry]);
    }

    function doAdvance(choice) {
      if (busyRef.current) return;
      if (isDeadRef.current) return;

      const gs = gsRef.current;
      if (!gs) return;

      setBusy(true);
      const result = advanceYear(gs, choice || undefined);

      if (result.storyText) {
        addTimelineEntry({ type: "story", text: result.storyText, title: result.storyTitle, age: gs.age });
      }

      if (result.majorChoices) {
        // Save pending major and raw event data
        if (result._rawEvent && result._rawGameState) {
          setPendingMajor({ event: result._rawEvent, gs: result._rawGameState });
        } else {
          setPendingMajor({ choices: result.majorChoices });
        }
        setBusy(false);
        return;
      }

      if (result.resolutionText) {
        addTimelineEntry({
          type: "resolution",
          text: result.resolutionText,
          age: gs.age,
          checkResult: result.checkResult,
          isDead: result.isDead,
          statDeltas: result.statDeltas,
        });
      }

      if (result.nextGameState) {
        setGameState(result.nextGameState);
        gsRef.current = result.nextGameState;
        if (result.isDead) {
          setIsDead(true);
          isDeadRef.current = true;
          if (result.isHilichurlEnding && !result.nextGameState.flags.includes("荒野的低语")) {
            result.nextGameState.flags.push("荒野的低语");
          }
        }
      }

      setPendingMajor(null);
      setBusy(false);
    }

    // Auto-advance interval
    useEffect(() => {
      if (!autoMode) return;
      const timer = setInterval(() => {
        if (busyRef.current || isDeadRef.current || pendingRef.current) return;
        doAdvance(null);
      }, 1000);
      return () => clearInterval(timer);
    }, [autoMode]);

    function toggleAuto() { setAutoMode((p) => !p); }

    function handleChoice(choice) {
      setAutoMode(false);
      doAdvance(choice);
    }

    function handleRaceSelect(race) {
      setSelectedRace(race);
      const { getNationsForRace } = window.TeyvatRaceData;
      const availableNations = getNationsForRace(race.id);
      if (availableNations.length === 1) {
        beginSetup(availableNations[0], race);
      } else {
        setScreen("nation");
      }
    }

    function handleNationSelect(nation) {
      if (!selectedRace) return;
      beginSetup(nation, selectedRace);
    }

    function beginSetup(nation, race) {
      const nextSetup = createSetupState(nation, race);
      setSetupState(nextSetup);
      setSelectedTalentIds([]);
      setAllocation(EMPTY_ALLOCATION);
      setScreen("setup");
    }

    function toggleTalent(talentId) {
      if (!setupState) return;
      const talent = setupState.talentDraw.find((item) => item.id === talentId);
      if (!talent) return;
      setSelectedTalentIds((prev) => {
        if (prev.includes(talentId)) return prev.filter((item) => item !== talentId);
        if (prev.length >= 2) return prev;
        const selectedTalents = prev.map((id) => setupState.talentDraw.find((item) => item.id === id)).filter(Boolean);
        if (talent.specialLine && selectedTalents.some((item) => item.specialLine && item.specialLine !== talent.specialLine)) return prev;
        return [...prev, talentId];
      });
    }

    function adjustAllocation(statKey, delta) {
      setAllocation((prev) => {
        const nextValue = Math.max(0, (prev[statKey] || 0) + delta);
        if (delta > 0 && allocationCaps && nextValue > (allocationCaps[statKey] || 5)) return prev;
        if (delta > 0 && setupBudget && totalAllocated >= setupBudget.totalPoints) return prev;
        return { ...prev, [statKey]: nextValue };
      });
    }

    function beginLife() {
      if (!setupState || !validation.ok) return;
      const nextGameState = buildGameState(setupState, selectedTalentIds, allocation);
      setGameState(nextGameState);
      gsRef.current = nextGameState;
      setTimeline([]);
      setIsDead(false);
      isDeadRef.current = false;
      setPendingMajor(null);
      setScreen("game");
      doAdvance(null);
    }

    function restart() {
      setScreen("title");
      setSelectedRace(null);
      setSetupState(null);
      setSelectedTalentIds([]);
      setAllocation(EMPTY_ALLOCATION);
      setGameState(null);
      setTimeline([]);
      setPendingMajor(null);
      setIsDead(false);
      setAutoMode(false);
      setBusy(false);
    }

    // Check if we should go to summary (dead + no pending major)
    useEffect(() => {
      if (isDead && !pendingMajor && screen === "game") {
        setAutoMode(false);
        const t = setTimeout(() => setScreen("summary"), 600);
        return () => clearTimeout(t);
      }
    }, [isDead, pendingMajor, screen]);

    return (
      <div className="root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <StarField stars={stars} />
        {screen === "title" ? <TitleScreen onStart={() => setScreen("race")} /> : null}
        {screen === "race" ? <RaceScreen onSelect={handleRaceSelect} /> : null}
        {screen === "nation" && selectedRace ? <NationScreen selectedRace={selectedRace} onSelect={handleNationSelect} /> : null}
        {screen === "setup" && setupState ? (
          <SetupScreen setupState={setupState} selectedTalentIds={selectedTalentIds} allocation={allocation}
            setupBudget={setupBudget} totalAllocated={totalAllocated} validation={validation} statMeta={STAT_META}
            allocationCaps={allocationCaps} onToggleTalent={toggleTalent} onAdjustAllocation={adjustAllocation} onBegin={beginLife} />
        ) : null}
        {screen === "game" && gameState ? (
          <GameScreen gs={gameState} timeline={timeline} pendingMajor={pendingMajor}
            isDead={isDead} autoMode={autoMode} busy={busy}
            onChoice={handleChoice} onAdvance={() => doAdvance(null)} onToggleAuto={toggleAuto} />
        ) : null}
        {screen === "summary" && gameState ? (
          <SummaryScreen gs={gameState} onRestart={restart} />
        ) : null}
      </div>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
})();
