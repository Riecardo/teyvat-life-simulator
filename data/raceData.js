window.TeyvatRaceData = (() => {
  const LIFESPAN_TYPE_MULTIPLIERS = {
    short: 0.7,
    normal: 1.0,
    long: 1.4,
    immortal: 3.0,
  };

  const RACES = [
    {
      id: "human",
      name: "人类",
      desc: "提瓦特大陆最为普遍的种族。足迹遍布七国，适应力极强，在各式各样的时代与环境里都能找到生存之道。凡人寿命虽短，却也因此更懂得抓紧每一个转瞬即逝的机会。",
      lifespan_type: "normal",
      lifespan_modifier: 0,
      stat_caps: { intellect: 5, spirit: 5, physique: 5, elemental: 5 },
      stat_bonus: {},
      special_mechanics: null,
      event_pool_tags: ["凡人", "市井"],
      available_nation_eras: null,
      is_selectable: true,
    },
    {
      id: "dragon",
      name: "龙族",
      desc: "远古龙裔的血脉后嗣。龙族曾在七王时代统御提瓦特，如今虽已式微，但龙血中仍流淌着蛮荒的元素之力。寿命极长，在太古纪元中更以百年为单位计算存在的时间——从七王黄金时代到葬火之年的神战，龙族见证了提瓦特最原始、最蛮荒的兴衰。",
      lifespan_type: "long",
      lifespan_modifier: 10,
      stat_caps: { intellect: 5, spirit: 7, physique: 9, elemental: 9 },
      stat_bonus: { elemental: 2, physique: 2 },
      special_mechanics: { type: "dragon_awakening" },
      event_pool_tags: ["龙裔", "远古", "太古", "元素"],
      available_nation_eras: {
        mondstadt: ["雪山古国时代", "高塔孤王时代"],
        liyue: ["归离集时代", "魔神战争余波"],
        natlan: ["火龙时代", "火龙复辟时代"],
        primordial: ["龙的时代"],
      },
      is_selectable: true,
    },
    {
      id: "khaenriah",
      name: "坎瑞亚人",
      desc: "无神之国的子民。坎瑞亚不依赖神明庇护，以机械工学与炼金术构筑了辉煌的地下文明。坎瑞亚人的元素力天生为零——他们的骄傲是「黑土之术」与钢铁。血脉中潜伏着深渊的侵蚀与不死诅咒的阴影。",
      lifespan_type: "normal",
      lifespan_modifier: 3,
      stat_caps: { intellect: 8, spirit: 8, physique: 7, elemental: 0 },
      stat_bonus: { intellect: 2, elemental: 0 },
      special_mechanics: { type: "khaenriah_curse", curse_max: 100 },
      event_pool_tags: ["机械", "炼金", "深渊", "地下", "坎瑞亚"],
      available_nation_eras: {
        khaenriah: ["黑日王朝末期"],
      },
      is_selectable: true,
    },
    {
      id: "angel",
      name: "天使族",
      desc: "天理创造的最初使者，高天残羽的末裔。天使族拥有提瓦特最纯净的元素感知力，以及远超凡俗的寿命。然而「信仰」是天使存在的根基——背弃天理之路，羽翼便会化为光尘。",
      lifespan_type: "long",
      lifespan_modifier: 8,
      stat_caps: { intellect: 5, spirit: 7, physique: 4, elemental: 8 },
      stat_bonus: { elemental: 3, spirit: 1 },
      special_mechanics: { type: "faith", faith_max: 100 },
      event_pool_tags: ["天使", "高天", "神谕"],
      available_nation_eras: {
        inazuma: ["白夜国余响", "雷电真时代"],
        fontaine: ["雷穆利亚遗音", "审判庭成型期"],
        mondstadt: ["雪山古国时代"],
        primordial: ["高天原初时期"],
      },
      is_selectable: true,
    },
    {
      id: "hilichurl",
      name: "丘丘人",
      desc: "被诅咒扭曲的存在。丘丘人曾经也是提瓦特的普通居民——多数是坎瑞亚灾变的受害者。他们戴着面具遮蔽本来的面目，在荒野中聚落而居。记忆早已碎成残片，偶尔在月光下才会闪过前世的一瞬。",
      lifespan_type: "short",
      lifespan_modifier: -10,
      stat_caps: { intellect: 2, spirit: 3, physique: 6, elemental: 4 },
      stat_bonus: { physique: 2, intellect: -2, spirit: -1 },
      special_mechanics: null,
      event_pool_tags: ["丘丘", "荒野", "诅咒"],
      available_nation_eras: null,
      is_selectable: false,
    },
  ];

  function getRace(raceId) {
    return RACES.find((r) => r.id === raceId) || RACES[0];
  }

  function getSelectableRaces() {
    return RACES.filter((r) => r.is_selectable);
  }

  function getNationsForRace(raceId) {
    const race = getRace(raceId);
    const allNations = window.TeyvatData.NATIONS;
    if (!race.available_nation_eras) return allNations;
    return allNations.filter((n) => n.id in race.available_nation_eras);
  }

  function getAvailableErasForNation(nationId, raceId) {
    const race = getRace(raceId);
    if (!race.available_nation_eras) return null;
    const eras = race.available_nation_eras[nationId];
    if (!eras) return [];
    if (eras === "*") return null;
    return eras;
  }

  return {
    RACES,
    LIFESPAN_TYPE_MULTIPLIERS,
    getRace,
    getSelectableRaces,
    getNationsForRace,
    getAvailableErasForNation,
  };
})();
