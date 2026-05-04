window.TeyvatEngine = (() => {
  const {
    ERA_PROFILES,
    AGE_STAGES,
    STAT_META,
    DEFAULT_ALLOCATION_CAP,
    MAX_STAT_CAP,
    STARTING_ATTRIBUTE_POINTS,
    TALENT_DRAW_COUNT,
    MAX_TALENT_SELECTION,
  } = window.TeyvatData;
  const { YEARLY_CHRONICLES, YEARLY_POOLS, MAJOR_EVENTS, SPECIAL_LINES } = window.TeyvatLifeData;
  const { RACES, LIFESPAN_TYPE_MULTIPLIERS, getRace, getAvailableErasForNation } = window.TeyvatRaceData;
  const { filterTalentsByRace, getTalentWeight } = window.TeyvatTalentData;
  const { rnd, pick, clamp, pickWeighted } = window.TeyvatUtils;

  const STAT_KEYS = ["intellect", "spirit", "physique", "elemental"];

  function getStageByAge(age) {
    return AGE_STAGES.find((stage) => age >= stage.minAge && age <= stage.maxAge) || AGE_STAGES[AGE_STAGES.length - 1];
  }

  // ── Talent Gacha ──

  function pickWeightedTalent(pool) {
    const total = pool.reduce((sum, talent) => sum + getTalentWeight(talent.rarity), 0);
    let cursor = rnd(1, total);
    for (const talent of pool) {
      cursor -= getTalentWeight(talent.rarity);
      if (cursor <= 0) return talent;
    }
    return pool[0];
  }

  function drawTalents(count, raceId) {
    count = count || TALENT_DRAW_COUNT;
    raceId = raceId || "human";
    const pool = filterTalentsByRace(raceId);
    const available = [...pool];
    const result = [];
    let epicStreak = 0;

    while (result.length < count && available.length > 0) {
      if (epicStreak >= 9) {
        const epicPool = available.filter((t) => t.rarity === "epic");
        if (epicPool.length > 0) {
          const forced = pick(epicPool);
          result.push(forced);
          const idx = available.findIndex((t) => t.id === forced.id);
          if (idx >= 0) available.splice(idx, 1);
          epicStreak = 0;
          continue;
        }
      }

      const next = pickWeightedTalent(available);
      result.push(next);
      const idx = available.findIndex((t) => t.id === next.id);
      if (idx >= 0) available.splice(idx, 1);

      if (next.rarity === "epic") {
        epicStreak = 0;
      } else {
        epicStreak++;
      }
    }
    return result;
  }

  // ── Era Profile ──

  function getEraProfile(nationId, era) {
    return ERA_PROFILES[nationId]?.[era] || {
      birthplace: "无名聚落",
      desc: "你在时代夹缝中降生。",
      lifespanBase: 58,
    };
  }

  // ── Setup State ──

  function createSetupState(nation, race) {
    const availableEras = getAvailableErasForNation(nation.id, race.id);
    const eraChoices = availableEras
      ? nation.eras.filter((e) => availableEras.includes(e))
      : nation.eras;
    const finalEras = eraChoices.length > 0 ? eraChoices : nation.eras;
    const era = pick(finalEras);
    const eraProfile = getEraProfile(nation.id, era);

    return {
      nation_id: nation.id,
      nation_name: nation.name,
      nation_element: nation.element,
      nation_color: nation.color,
      era,
      birthplace: eraProfile.birthplace,
      era_desc: eraProfile.desc,
      lifespan_base: eraProfile.lifespanBase || 58,
      talentDraw: drawTalents(TALENT_DRAW_COUNT, race.id),
      race_id: race.id,
      race_name: race.name,
    };
  }

  // ── Talent helpers ──

  function getTalentByIdFromDraw(setupState, talentId) {
    return setupState.talentDraw.find((item) => item.id === talentId) || window.TeyvatTalentData.getTalentById(talentId) || null;
  }

  function getSelectedTalents(setupState, selectedTalentIds) {
    return selectedTalentIds
      .map((id) => getTalentByIdFromDraw(setupState, id))
      .filter(Boolean);
  }

  function summarizeTalentEffects(talents) {
    return talents.reduce(
      (acc, talent) => {
        STAT_KEYS.forEach((key) => {
          acc.stats[key] += talent.stats?.[key] || 0;
        });
        acc.bonusPoints += talent.bonusPoints || 0;
        acc.lifespanBonus += talent.lifespanBonus || 0;
        if (!acc.specialLine && talent.specialLine) acc.specialLine = talent.specialLine;

        if (talent.cap_modifiers) {
          Object.entries(talent.cap_modifiers).forEach(([key, value]) => {
            acc.capModifiers[key] = (acc.capModifiers[key] || 0) + value;
          });
        }
        if (talent.storyline_flags) {
          acc.storylineFlags.push(...talent.storyline_flags);
        }
        if (talent.event_weight_modifiers) {
          acc.eventWeightModifiers.push(...talent.event_weight_modifiers);
        }

        return acc;
      },
      {
        stats: { intellect: 0, spirit: 0, physique: 0, elemental: 0 },
        bonusPoints: 0,
        lifespanBonus: 0,
        specialLine: null,
        capModifiers: {},
        storylineFlags: [],
        eventWeightModifiers: [],
      }
    );
  }

  // ── Setup Budget ──

  function getSetupBudget(setupState, selectedTalentIds) {
    const selectedTalents = getSelectedTalents(setupState, selectedTalentIds);
    const effectSummary = summarizeTalentEffects(selectedTalents);
    return {
      selectedTalents,
      effectSummary,
      totalPoints: Math.max(4, STARTING_ATTRIBUTE_POINTS + effectSummary.bonusPoints),
    };
  }

  // ── Allocation Caps ──

  function getAllocationCaps(race, selectedTalents) {
    const caps = { ...(race.stat_caps || { intellect: 5, spirit: 5, physique: 5, elemental: 5 }) };
    selectedTalents.forEach((talent) => {
      if (talent.cap_modifiers) {
        Object.entries(talent.cap_modifiers).forEach(([key, value]) => {
          const raceCap = race.stat_caps?.[key] || DEFAULT_ALLOCATION_CAP;
          const hardMax = Math.max(raceCap, MAX_STAT_CAP);
          caps[key] = Math.min((caps[key] || DEFAULT_ALLOCATION_CAP) + value, hardMax);
        });
      }
    });
    return caps;
  }

  function countAllocatedPoints(allocation) {
    return STAT_KEYS.reduce((sum, key) => sum + (allocation[key] || 0), 0);
  }

  function getFinalStats(allocation, talentStats, raceStats) {
    const result = {};
    STAT_KEYS.forEach((key) => {
      result[key] = (allocation[key] || 0) + (talentStats[key] || 0) + (raceStats[key] || 0);
    });
    return result;
  }

  // ── Validation ──

  function validateSetup(setupState, selectedTalentIds, allocation) {
    if (!setupState) {
      return { ok: false, reason: "缺少开局信息。" };
    }
    if (selectedTalentIds.length !== MAX_TALENT_SELECTION) {
      return { ok: false, reason: `需要选择 ${MAX_TALENT_SELECTION} 个天赋。` };
    }

    const { selectedTalents, effectSummary, totalPoints } = getSetupBudget(setupState, selectedTalentIds);
    const specialLines = selectedTalents.filter((item) => item.specialLine);
    if (specialLines.length > 1) {
      return { ok: false, reason: "只能开启一条特殊事件线。" };
    }

    const allocated = countAllocatedPoints(allocation);
    if (allocated !== totalPoints) {
      return { ok: false, reason: `初始属性必须刚好分配完 ${totalPoints} 点。` };
    }

    const race = getRace(setupState.race_id || "human");
    const caps = getAllocationCaps(race, selectedTalents);
    for (const key of STAT_KEYS) {
      const value = allocation[key] || 0;
      const cap = caps[key] || DEFAULT_ALLOCATION_CAP;
      if (value > cap) {
        return { ok: false, reason: `${STAT_META[key].label}分配了${value}点，超过上限${cap}点。` };
      }
    }

    const finalStats = getFinalStats(allocation, effectSummary.stats, race.stat_bonus || {});
    const hasNegative = STAT_KEYS.some((key) => finalStats[key] < 0);
    if (hasNegative) {
      return { ok: false, reason: "天赋与种族修正后属性不能为负数。", finalStats };
    }

    return {
      ok: true,
      selectedTalents,
      effectSummary,
      totalPoints,
      finalStats,
    };
  }

  // ── Lifespan ──

  function calculateLifespan(eraProfile, race, talentBonus) {
    const base = (eraProfile.lifespanBase || 58) + rnd(0, 10);
    const multiplier = LIFESPAN_TYPE_MULTIPLIERS[race.lifespan_type] || 1.0;
    const adjusted = Math.round(base * multiplier);
    return Math.max(18, adjusted + (race.lifespan_modifier || 0) + (talentBonus || 0));
  }

  // ── Build Game State ──

  function buildGameState(setupState, selectedTalentIds, allocation) {
    const validation = validateSetup(setupState, selectedTalentIds, allocation);
    if (!validation.ok) throw new Error(validation.reason);

    const race = getRace(setupState.race_id || "human");
    const eraProfile = getEraProfile(setupState.nation_id, setupState.era);
    const lifespan = calculateLifespan(eraProfile, race, validation.effectSummary.lifespanBonus);

    let specialLine = validation.effectSummary.specialLine;
    if (!specialLine && race.special_mechanics?.type === "dragon_awakening") specialLine = "dragon";
    if (!specialLine && race.special_mechanics?.type === "faith") specialLine = "angel";

    // Khaenri'ah: force elemental to 0, their power is "黑土之术"
    const finalStats = { ...validation.finalStats };
    if (setupState.nation_id === "khaenriah") {
      finalStats.elemental = 0;
    }

    const talentFlags = validation.selectedTalents.map((t) => t.name);
    const storylineFlags = validation.effectSummary.storylineFlags || [];
    const raceFlag = `种族:${race.name}`;

    const ageIncrement = eraProfile.age_increment || 1;

    return {
      nation_id: setupState.nation_id,
      nation_name: setupState.nation_name,
      nation_element: setupState.nation_element,
      nation_color: setupState.nation_color,
      era: setupState.era,
      birthplace: setupState.birthplace,
      era_desc: setupState.era_desc,
      age: 0,
      age_increment: ageIncrement,
      age_sub_index: 0,
      lifespan,
      maxAge: (ageIncrement > 1 || race.lifespan_type === "immortal") ? lifespan + 500 : Math.min(160, lifespan + 30),
      stats: finalStats,
      initialStats: { ...finalStats },
      talents: validation.selectedTalents,
      specialLine,
      flags: [...new Set([...talentFlags, ...storylineFlags, raceFlag])],
      history: [],
      isDead: false,
      deathReason: "",
      race_id: race.id,
      race_name: race.name,
      curse_progress: 0,
      faith_loss: 0,
      abyss_corruption: (setupState.nation_id === "khaenriah") ? 0 : undefined,
      event_weight_modifiers: validation.effectSummary.eventWeightModifiers || [],
      used_event_ids: [],
    };
  }

  // ── Fill Tokens ──

  function fillTokens(text, gameState) {
    if (!text) return "";
    const stage = getStageByAge(gameState.age);
    return text
      .replaceAll("{{era}}", gameState.era)
      .replaceAll("{{nation_name}}", gameState.nation_name)
      .replaceAll("{{birthplace}}", gameState.birthplace || "")
      .replaceAll("{{stage_name}}", stage.name);
  }

  function pickVariant(variants, era) {
    if (!variants) return "";
    return variants[era] || variants.default || Object.values(variants)[0] || "";
  }

  function cloneChoices(choices) {
    return (choices || []).map((choice) => ({
      ...choice,
      check: choice.check ? { ...choice.check } : null,
      success: choice.success ? { ...choice.success } : null,
      failure: choice.failure ? { ...choice.failure } : null,
    }));
  }

  // ── Event Matching ──

  function findMajorEvent(gameState) {
    const specialMajor = gameState.specialLine
      ? SPECIAL_LINES[gameState.specialLine]?.major?.find((event) => event.age === gameState.age)
      : null;
    if (specialMajor) return { source: "special", event: specialMajor };

    const nationMajor = MAJOR_EVENTS[gameState.nation_id]?.find((event) => event.age === gameState.age);
    if (nationMajor) return { source: "nation", event: nationMajor };
    return null;
  }

  function entryMatchesConditions(entry, gameState) {
    // Flag conditions
    const requiresFlags = entry.requiresFlags || [];
    const excludesFlags = entry.excludesFlags || [];
    const hasRequired = requiresFlags.every((f) => gameState.flags.includes(f));
    const hasExcluded = excludesFlags.some((f) => gameState.flags.includes(f));
    if (!hasRequired || hasExcluded) return false;

    // Stat conditions (e.g. { intellect: { min: 3 }, spirit: { max: -1 } })
    const statCond = entry.stat_conditions || {};
    for (const [key, cond] of Object.entries(statCond)) {
      const val = gameState.stats[key] || 0;
      if (cond.min !== undefined && val < cond.min) return false;
      if (cond.max !== undefined && val > cond.max) return false;
    }

    return true;
  }

  function entryMatchesFlags(entry, flags) {
    const requiresFlags = entry.requiresFlags || [];
    const excludesFlags = entry.excludesFlags || [];
    const hasRequired = requiresFlags.every((flag) => flags.includes(flag));
    const hasExcluded = excludesFlags.some((flag) => flags.includes(flag));
    return hasRequired && !hasExcluded;
  }

  function findChronicleEntries(gameState) {
    const byEra = YEARLY_CHRONICLES[gameState.nation_id]?.[gameState.era] || [];
    return byEra.filter((entry) => entry.age === gameState.age && entryMatchesFlags(entry, gameState.flags));
  }

  function findChronicleEntry(gameState) {
    const entries = findChronicleEntries(gameState);
    const idx = gameState.age_sub_index || 0;
    return entries[idx] || null;
  }

  function createFallbackYearlyEvent(gameState) {
    return {
      id: `fallback-${gameState.age}`,
      type: "normal",
      age: gameState.age,
      stageId: getStageByAge(gameState.age).id,
      title: "平常一年",
      story: `${gameState.age}岁：你在${gameState.era}的${gameState.nation_name}继续活着、学习、受伤，也慢慢懂得更多。`,
      actionText: "下一年",
      tags: [],
      outcome: {
        text: "这一年并不显赫，却也实打实地组成了你的人生。",
        summary: "平淡地又活过了一年",
        effect: { spirit: 1 },
        flag: null,
        death: false,
        deathReason: "",
      },
    };
  }

  // ── Create Year Event ──

  function createYearEvent(gameState) {
    const stage = getStageByAge(gameState.age);
    const chronicleEntry = findChronicleEntry(gameState);
    if (chronicleEntry) {
      return {
        id: `chronicle-${gameState.nation_id}-${gameState.era}-${gameState.age}`,
        type: "normal",
        age: gameState.age,
        stageId: stage.id,
        title: "时代年表",
        story: `${gameState.age}岁：${fillTokens(chronicleEntry.text, gameState)}`,
        actionText: "下一年",
        tags: chronicleEntry.tags || [],
        outcome: {
          text: fillTokens(chronicleEntry.summary || chronicleEntry.text, gameState),
          summary: fillTokens(chronicleEntry.summary || chronicleEntry.text, gameState),
          effect: chronicleEntry.effect || {},
          flag: chronicleEntry.flag || null,
          death: Boolean(chronicleEntry.death),
          deathReason: chronicleEntry.deathReason || "",
        },
      };
    }

    const majorMatch = findMajorEvent(gameState);
    if (majorMatch) {
      const event = majorMatch.event;
      const story = fillTokens(pickVariant(event.variants, gameState.era), gameState);
      return {
        id: `${majorMatch.source}-${gameState.nation_id}-${gameState.age}`,
        type: "major",
        age: gameState.age,
        stageId: stage.id,
        title: event.title,
        story,
        choices: cloneChoices(event.choices),
      };
    }

    const nationPool = YEARLY_POOLS[gameState.nation_id]?.[stage.id] || [];
    const specialPool = gameState.specialLine ? SPECIAL_LINES[gameState.specialLine]?.yearly?.[stage.id] || [] : [];
    // Assign unique IDs and filter
    const usedIds = gameState.used_event_ids || [];
    const indexedPool = combinedPool.map((entry, i) => ({
      ...entry,
      _poolId: `${gameState.nation_id}-${stage.id}-${i}`,
    }));

    // Filter: conditions + anti-repeat
    const filteredPool = indexedPool.filter(
      (entry) => entryMatchesConditions(entry, gameState) && !usedIds.includes(entry._poolId)
    );

    // Pool exhausted: reset and cycle
    if (!filteredPool.length) {
      const resetPool = indexedPool.filter((entry) => entryMatchesConditions(entry, gameState));
      if (resetPool.length) {
        // Reset tracked IDs for this stage and start over
        const stageEventIds = resetPool.map((e) => e._poolId);
        const cleanIds = usedIds.filter((id) => !stageEventIds.includes(id));
        gameState.used_event_ids = cleanIds;
        // Recurse with cleaned state
        return createYearEvent({ ...gameState, used_event_ids: cleanIds });
      }
      return createFallbackYearlyEvent(gameState);
    }

    const entry = pickWeighted(filteredPool, (entry) => {
      let weight = 1;
      const entryTags = entry.tags || [];
      (gameState.event_weight_modifiers || []).forEach((mod) => {
        if (mod.event_tags.some((tag) => entryTags.includes(tag))) {
          weight *= mod.weight_multiplier;
        }
      });
      const race = getRace(gameState.race_id);
      if (race?.event_pool_tags) {
        if (race.event_pool_tags.some((tag) => entryTags.includes(tag))) {
          weight *= 1.5;
        }
      }
      return weight;
    });

    return {
      id: entry._poolId || `${gameState.nation_id}-${stage.id}-${gameState.age}`,
      type: "normal",
      age: gameState.age,
      stageId: stage.id,
      title: stage.name,
      story: `${gameState.age}岁：${fillTokens(entry.text, gameState)}`,
      actionText: "下一年",
      tags: entry.tags || [],
      outcome: {
        text: fillTokens(entry.summary || entry.text, gameState),
        summary: fillTokens(entry.summary || entry.text, gameState),
        effect: entry.effect || {},
        flag: entry.flag || null,
        death: false,
        deathReason: "",
      },
    };
  }

  // ── Check / Effects ──

  function getCheckTarget(statValue, difficulty) {
    return clamp(Math.round(60 + statValue * 6 - difficulty * 7), 8, 95);
  }

  function applyEffects(gameState, effects) {
    const nextStats = { ...gameState.stats };
    let nextCurseProgress = gameState.curse_progress || 0;
    let nextFaithLoss = gameState.faith_loss || 0;
    let nextAbyssCorruption = gameState.abyss_corruption !== undefined ? gameState.abyss_corruption : 0;
    let nextFlags = [...gameState.flags];

    if (effects.stats) {
      Object.entries(effects.stats).forEach(([key, value]) => {
        if (nextStats[key] !== undefined) {
          nextStats[key] = clamp((nextStats[key] || 0) + value, -30, 40);
        }
      });
    }

    if (effects.flag) {
      nextFlags = [...new Set([...nextFlags, effects.flag])];
    }

    if (effects.curse_change !== undefined) {
      nextCurseProgress = clamp(nextCurseProgress + effects.curse_change, 0, 100);
    }
    if (effects.faith_change !== undefined) {
      nextFaithLoss = clamp(nextFaithLoss + effects.faith_change, 0, 100);
    }
    if (effects.abyss_corruption !== undefined) {
      nextAbyssCorruption = clamp(nextAbyssCorruption + effects.abyss_corruption, 0, 100);
    }

    return {
      ...gameState,
      stats: nextStats,
      flags: nextFlags,
      curse_progress: nextCurseProgress,
      faith_loss: nextFaithLoss,
      abyss_corruption: nextAbyssCorruption,
    };
  }

  function applyEffectDelta(nextStats, effect) {
    const deltas = {};
    Object.entries(effect || {}).forEach(([key, amount]) => {
      if (nextStats[key] === undefined) return;
      const before = nextStats[key];
      nextStats[key] = Math.max(-30, Math.min(40, before + amount));
      if (nextStats[key] !== before) {
        deltas[key] = nextStats[key] - before;
      }
    });
    return deltas;
  }

  function mergeDeltas(base, extra) {
    const result = { ...base };
    Object.entries(extra).forEach(([key, value]) => {
      result[key] = (result[key] || 0) + value;
    });
    return result;
  }

  function buildPassiveAgeing(gameState) {
    const passive = {};
    if (gameState.age > gameState.lifespan) {
      passive.physique = -(1 + Math.floor((gameState.age - gameState.lifespan - 1) / 6));
    }
    return passive;
  }

  // ── Passive Race Mechanics ──

  function processPassiveMechanics(gameState) {
    const next = { ...gameState, stats: { ...gameState.stats } };

    // Khaenri'ah race on Khaenri'ah nation: chronicle events drive the curse narrative
    // Khaenri'ah race on other nations (legacy): passive curse erosion
    if (gameState.race_id === "khaenriah" && gameState.nation_id !== "khaenriah") {
      const passiveCurse = rnd(1, 4);
      next.curse_progress = Math.min(100, (next.curse_progress || 0) + passiveCurse);

      if (next.curse_progress >= 100) {
        next.isDead = true;
        next.deathReason = "坎瑞亚的不死诅咒终于将你完全吞噬。你的身体开始异化，意识渐渐模糊——当你再次睁开眼时，已经不再记得自己曾经是谁。";
        next.flags = [...next.flags, "诅咒吞噬"];
      } else if (next.curse_progress >= 60) {
        next.stats.physique = clamp(next.stats.physique - 1, -30, 40);
      }
    }

    if (gameState.race_id === "angel") {
      next.faith_loss = Math.max(0, (next.faith_loss || 0) - 1);

      if (next.faith_loss >= 100) {
        next.isDead = true;
        next.deathReason = "你失去了最后的信仰之光，高天的联系彻底断裂，羽翼化作光尘消散于风中。";
      } else if (next.faith_loss >= 75) {
        next.stats.spirit = clamp(next.stats.spirit - 1, -30, 40);
      }
    }

    return next;
  }

  // ── Death Determination ──

  function determineDeath(nextStats, currentEvent, outcome, gameState) {
    if (outcome.deathWhenCurrentStatBelow) {
      const { stat, value, reason } = outcome.deathWhenCurrentStatBelow;
      if ((gameState.stats[stat] || 0) < value) {
        return { isDead: true, deathReason: reason || "你死在了这一年的选择里。" };
      }
    }
    if (outcome.deathWhenStatBelow) {
      const { stat, value, reason } = outcome.deathWhenStatBelow;
      if ((nextStats[stat] || 0) < value) {
        return { isDead: true, deathReason: reason || "你没能撑过这一年的代价。" };
      }
    }
    if (outcome.death) {
      return { isDead: true, deathReason: outcome.deathReason || "你在这一年的巨大代价里死去。" };
    }
    if (nextStats.spirit <= 0 && gameState.race_id === "khaenriah") {
      return {
        isDead: true,
        deathReason: "人类的意识已彻底消亡。肉体虽然获得了扭曲的「永生」，但你的余生将作为荒野中的无智魔物，在无尽的诅咒中徘徊。你变成了丘丘人。",
        isHilichurlEnding: true,
      };
    }
    if (nextStats.spirit < 0) {
      const abyssText = currentEvent.tags?.includes("abyss") ? "深渊回响撕裂了你的精神" : "你的精神终于在连年重压中断裂";
      return { isDead: true, deathReason: `${abyssText}，命数止于${gameState.age}岁。` };
    }
    if (nextStats.physique < 0) {
      const ageText = gameState.age > gameState.lifespan ? "你的身体终究没能扛过衰老与旧伤" : "你的身体再也支撑不住这一年的代价";
      return { isDead: true, deathReason: `${ageText}，命数止于${gameState.age}岁。` };
    }
    return { isDead: false, deathReason: "" };
  }

  function buildHistoryEntry(gameState, currentEvent, outcome, checkResult) {
    const checkLabel = checkResult
      ? `${STAT_META[checkResult.stat]?.label || checkResult.stat}检定${checkResult.passed ? "成功" : "失败"}`
      : null;

    return {
      age: gameState.age,
      label: `${gameState.age}岁：${outcome.summary || currentEvent.title || "度过了一年"}`,
      title: currentEvent.title,
      summary: outcome.summary || currentEvent.title || "度过了一年",
      result: checkLabel,
    };
  }

  // ── Resolve Year ──

  function resolveYearAction(gameState, action, currentEvent) {
    const nextStats = { ...gameState.stats };
    let outcome = currentEvent.type === "major" ? action.success : currentEvent.outcome;
    let checkResult = null;

    if (currentEvent.type === "major") {
      const stat = action.check?.stat || "intellect";
      const difficulty = action.check?.difficulty || 6;
      const roll = rnd(1, 100);
      const statValue = gameState.stats[stat] || 0;
      const target = getCheckTarget(statValue, difficulty);
      const passed = roll <= target;
      outcome = passed ? action.success : action.failure;
      checkResult = {
        stat,
        difficulty,
        statValue,
        target,
        roll,
        passed,
      };
    }

    // Apply direct outcome effect
    const directDeltas = applyEffectDelta(nextStats, outcome.effect);

    // Build combined effects for applyEffects
    const outcomeEffect = { stats: outcome.effect || {}, flag: outcome.flag || null };
    if (outcome.curse_change !== undefined) outcomeEffect.curse_change = outcome.curse_change;
    if (outcome.faith_change !== undefined) outcomeEffect.faith_change = outcome.faith_change;
    if (outcome.abyss_corruption !== undefined) outcomeEffect.abyss_corruption = outcome.abyss_corruption;

    const afterDirect = applyEffects(gameState, outcomeEffect);

    // Apply passive ageing
    const passiveAgeing = buildPassiveAgeing(gameState);
    const ageDeltas = applyEffectDelta(afterDirect.stats, passiveAgeing);
    const withAge = { ...afterDirect, stats: { ...afterDirect.stats } };
    Object.assign(withAge.stats, afterDirect.stats);

    // Apply race-specific passives
    const afterMechanics = processPassiveMechanics(withAge);

    // Death from event outcome
    const deathFromEvent = determineDeath(afterMechanics.stats, currentEvent, outcome, gameState);

    let finalIsDead = deathFromEvent.isDead || afterMechanics.isDead;
    let finalDeathReason = deathFromEvent.isDead ? deathFromEvent.deathReason : afterMechanics.deathReason;
    let finalIsHilichurl = deathFromEvent.isHilichurlEnding || false;

    // Multi-entry chronicle: check if there are more entries for this age
    const chronicleEntries = findChronicleEntries(gameState);
    const currentSubIdx = gameState.age_sub_index || 0;
    const hasMoreEntries = currentSubIdx + 1 < chronicleEntries.length;

    // Age advancement
    let nextAge = gameState.age;
    let nextSubIdx = 0;
    if (hasMoreEntries && currentEvent?.id?.startsWith("chronicle-")) {
      nextSubIdx = currentSubIdx + 1;
    } else {
      // Check if chronicle entry specifies nextAge (for variable time jumps)
      const currentEntry = chronicleEntries[currentSubIdx] || null;
      const targetAge = currentEntry?.nextAge;
      nextAge = targetAge != null ? targetAge : gameState.age + (gameState.age_increment || 1);
      nextSubIdx = 0;
    }

    // Max age death
    if (!finalIsDead && nextAge > gameState.maxAge) {
      finalIsDead = true;
      finalDeathReason = `你在${gameState.age}岁后的漫长余年里安然辞世。`;
    }

    const nextFlags = outcome.flag ? [...new Set([...afterMechanics.flags, outcome.flag])] : afterMechanics.flags;
    if (finalIsHilichurl) nextFlags.push("荒野的低语");

    const deltas = mergeDeltas(directDeltas, ageDeltas);
    const nextHistory = [...gameState.history, buildHistoryEntry(gameState, currentEvent, outcome, checkResult)];
    const nextUsedIds = [...(gameState.used_event_ids || []), currentEvent.id].filter(Boolean);

    return {
      nextGameState: {
        ...afterMechanics,
        age: nextAge,
        age_sub_index: nextSubIdx,
        stats: { ...afterMechanics.stats },
        flags: nextFlags,
        history: nextHistory,
        isDead: finalIsDead,
        deathReason: finalDeathReason,
        isHilichurlEnding: finalIsHilichurl,
        used_event_ids: nextUsedIds,
      },
      deltas,
      resolution: {
        age: gameState.age,
        text: fillTokens(outcome.text, gameState),
        summary: outcome.summary,
        checkResult,
        isDead: finalIsDead,
        deathReason: finalDeathReason,
        isHilichurlEnding: finalIsHilichurl,
        passiveAgeing,
      },
    };
  }

  // ── Unified Year Advance (inspired by lifeRestart's next()) ──
  function advanceYear(gameState, choice) {
    const event = createYearEvent(gameState);

    if (event.type === "major") {
      if (!choice) {
        // Major event needs player choice - return it for display
        return {
          storyText: fillTokens(event.story, gameState),
          storyTitle: event.title,
          majorChoices: event.choices.map((c) => ({
            text: c.text,
            check: c.check,
          })),
          nextGameState: null,
          resolutionText: null,
          checkResult: null,
          statDeltas: null,
          isDead: false,
          isHilichurlEnding: false,
          _rawEvent: event,
          _rawGameState: gameState,
        };
      }
      // Major event with choice - resolve it
      const { nextGameState, deltas, resolution: res } = resolveYearAction(gameState, choice, event);
      return {
        storyText: fillTokens(event.story, gameState),
        storyTitle: event.title,
        majorChoices: null,
        nextGameState,
        resolutionText: res.text,
        checkResult: res.checkResult,
        statDeltas: Object.keys(deltas).length ? deltas : null,
        isDead: nextGameState.isDead,
        isHilichurlEnding: nextGameState.isHilichurlEnding || false,
        _rawEvent: null,
        _rawGameState: null,
      };
    }

    // Normal event: auto-resolve immediately
    const action = { text: event.actionText || "下一年", success: event.outcome };
    const { nextGameState, deltas, resolution: res } = resolveYearAction(gameState, action, event);

    return {
      storyText: fillTokens(event.story, gameState),
      storyTitle: event.title,
      majorChoices: null,
      nextGameState,
      resolutionText: res.text,
      checkResult: res.checkResult,
      statDeltas: Object.keys(deltas).length ? deltas : null,
      isDead: nextGameState.isDead,
      isHilichurlEnding: nextGameState.isHilichurlEnding || false,
      _rawEvent: null,
      _rawGameState: null,
    };
  }

  return {
    createSetupState,
    getSetupBudget,
    validateSetup,
    buildGameState,
    advanceYear,
    createYearEvent,
    resolveYearAction,
    getStageByAge,
    getAllocationCaps,
    getRace,
    applyEffects,
  };
})();
