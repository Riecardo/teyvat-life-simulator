(() => {
  const { useState, useEffect, useMemo } = React;
  const { STAT_META } = window.TeyvatData;
  const { createStars } = window.TeyvatUtils;
  const { getRace } = window.TeyvatRaceData;
  const { createSetupState, getSetupBudget, validateSetup, buildGameState, createYearEvent, resolveYearAction, getAllocationCaps } = window.TeyvatEngine;
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
    const [currentEvent, setCurrentEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [showChoices, setShowChoices] = useState(false);
    const [statDeltas, setStatDeltas] = useState(null);
    const [resolution, setResolution] = useState(null);
    const [summary, setSummary] = useState("");
    const [busy, setBusy] = useState(false);
    const [pendingTransition, setPendingTransition] = useState(null);

    const stars = useMemo(() => createStars(110), []);

    const setupBudget = useMemo(
      () => (setupState ? getSetupBudget(setupState, selectedTalentIds) : null),
      [setupState, selectedTalentIds]
    );

    const totalAllocated = useMemo(
      () => Object.values(allocation).reduce((sum, value) => sum + value, 0),
      [allocation]
    );

    const validation = useMemo(
      () => (setupState ? validateSetup(setupState, selectedTalentIds, allocation) : { ok: false, reason: "" }),
      [setupState, selectedTalentIds, allocation]
    );

    const allocationCaps = useMemo(() => {
      if (!setupState || !setupBudget) return null;
      const race = getRace(setupState.race_id || "human");
      return getAllocationCaps(race, setupBudget.selectedTalents);
    }, [setupState, setupBudget]);

    useEffect(() => {
      if (!currentEvent?.story) return undefined;
      const text = currentEvent.story;
      setDisplayedText("");
      setShowChoices(false);
      let index = 0;
      const timer = setInterval(() => {
        index += 1;
        setDisplayedText(text.slice(0, index));
        if (index >= text.length) { clearInterval(timer); setShowChoices(true); }
      }, 28);
      return () => clearInterval(timer);
    }, [currentEvent]);

    function loadEvent(nextGameState) {
      setIsLoading(true);
      setCurrentEvent(null);
      setStatDeltas(null);
      setResolution(null);
      setPendingTransition(null);
      setDisplayedText("");
      setShowChoices(false);
      const event = createYearEvent(nextGameState);
      setCurrentEvent(event);
      setIsLoading(false);
    }

    function handleRaceSelect(race) {
      setSelectedRace(race);
      // Single-nation races: skip nation screen
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
      setScreen("game");
      loadEvent(nextGameState);
    }

    function handleAction(choice) {
      if (busy || !gameState || !currentEvent) return;
      setBusy(true);
      const { nextGameState, deltas, resolution: nextResolution } = resolveYearAction(gameState, choice, currentEvent);
      setGameState(nextGameState);
      setStatDeltas(Object.keys(deltas).length ? deltas : null);
      setResolution(nextResolution);
      setPendingTransition(nextGameState);
      setShowChoices(false);
      setBusy(false);
    }

    async function continueAfterResolution() {
      if (!pendingTransition) return;
      const nextGameState = pendingTransition;
      setBusy(true);
      if (nextGameState.isDead) {
        await endLife(nextGameState);
      } else {
        loadEvent(nextGameState);
      }
      setBusy(false);
    }

    function endLife(nextGameState) {
      setGameState(nextGameState);
      setSummary("");
      setIsLoading(false);
      setScreen("summary");
    }

    function restart() {
      setScreen("title");
      setSelectedRace(null);
      setSetupState(null);
      setSelectedTalentIds([]);
      setAllocation(EMPTY_ALLOCATION);
      setGameState(null);
      setCurrentEvent(null);
      setSummary("");
      setStatDeltas(null);
      setResolution(null);
      setPendingTransition(null);
      setBusy(false);
    }

    return (
      <div className="root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <StarField stars={stars} />
        {screen === "title" ? <TitleScreen onStart={() => setScreen("race")} /> : null}
        {screen === "race" ? <RaceScreen onSelect={handleRaceSelect} /> : null}
        {screen === "nation" && selectedRace ? <NationScreen selectedRace={selectedRace} onSelect={handleNationSelect} /> : null}
        {screen === "setup" && setupState ? (
          <SetupScreen
            setupState={setupState}
            selectedTalentIds={selectedTalentIds}
            allocation={allocation}
            setupBudget={setupBudget}
            totalAllocated={totalAllocated}
            validation={validation}
            statMeta={STAT_META}
            allocationCaps={allocationCaps}
            onToggleTalent={toggleTalent}
            onAdjustAllocation={adjustAllocation}
            onBegin={beginLife}
          />
        ) : null}
        {screen === "game" && gameState ? (
          <GameScreen
            gs={gameState} isLoading={isLoading} displayedText={displayedText}
            showChoices={showChoices} currentEvent={currentEvent} statDeltas={statDeltas}
            resolution={resolution} busy={busy} onChoice={handleAction} onContinue={continueAfterResolution}
          />
        ) : null}
        {screen === "summary" && gameState ? (
          <SummaryScreen gs={gameState} summary={summary} isLoading={isLoading} onRestart={restart} />
        ) : null}
      </div>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
})();
