window.TeyvatData = (() => {
  const NATIONS = [
    {
      id: "mondstadt",
      name: "蒙德",
      element: "风",
      color: "#7ed8e8",
      desc: "自由与反抗之歌并存的风之国",
      eras: ["雪山古国时代", "高塔孤王时代", "贵族专政时代"],
    },
    {
      id: "liyue",
      name: "璃月",
      element: "岩",
      color: "#d4aa6a",
      desc: "契约、旧神与山海传说交织的岩之国",
      eras: ["归离集时代", "魔神战争余波", "璃月港初建期"],
    },
    {
      id: "inazuma",
      name: "稻妻",
      element: "雷",
      color: "#a07fe8",
      desc: "诸岛分立、雷威长存的永恒之国",
      eras: ["白夜国余响", "雷电真时代", "锁国令时代"],
    },
    {
      id: "sumeru",
      name: "须弥",
      element: "草",
      color: "#5ec87a",
      desc: "知识、梦境与禁忌同时生长的智慧之国",
      eras: ["赤王与花神时代", "教令院建立期", "灾变余烬期"],
    },
    {
      id: "fontaine",
      name: "枫丹",
      element: "水",
      color: "#5ba8e8",
      desc: "审判、歌剧与机械轰鸣共鸣的水之国",
      eras: ["雷穆利亚遗音", "审判庭成型期", "机械与歌剧时代"],
    },
    {
      id: "natlan",
      name: "纳塔",
      element: "火",
      color: "#e87840",
      desc: "战争、还魂与龙焰交织不熄的火之国",
      eras: ["火龙时代", "火龙复辟时代", "历代火神时代"],
    },
    {
      id: "nodkrai",
      name: "挪德卡莱",
      element: "冰",
      color: "#a8d8f0",
      desc: "霜月照耀下自治不屈的冰原之地",
      eras: ["黄金城时代", "白沙皇时代", "霜月自治时代"],
    },
    {
      id: "khaenriah",
      name: "坎瑞亚",
      element: "虚",
      color: "#6050a0",
      desc: "无神庇护的地下古国，以机械工学与炼金术构筑的辉煌文明",
      eras: ["黑日王朝末期"],
    },
    {
      id: "primordial",
      name: "太古纪元",
      element: "光",
      color: "#f0d890",
      desc: "七王统治的蛮荒世界，龙族尚是大地真正的主人",
      eras: ["龙的时代", "高天原初时期"],
    },
  ];

  const ERA_PROFILES = {
    mondstadt: {
      "雪山古国时代": {
        birthplace: "苍风雪原聚落",
        desc: "冰雪与旧国残民之间求活的年代。",
        lifespanBase: 54,
      },
      "高塔孤王时代": {
        birthplace: "狂风之都（现风龙废墟）",
        desc: "迭卡拉庇安以风墙圈起都城，城中众生在高压统治下苟活。",
        lifespanBase: 55,
      },
      "贵族专政时代": {
        birthplace: "旧蒙德城",
        desc: "贵族盘剥与反抗暗潮并行的年代。",
        lifespanBase: 58,
      },
    },
    liyue: {
      "归离集时代": {
        birthplace: "归离原聚落",
        desc: "神明与机关遗迹尚未完全沉寂的时代。",
        lifespanBase: 56,
      },
      "魔神战争余波": {
        birthplace: "天衡山下避难村",
        desc: "战后余波未尽，山海之间仍遍布失所之人。",
        lifespanBase: 57,
      },
      "璃月港初建期": {
        birthplace: "璃月港旧埠头",
        desc: "契约秩序刚刚成形，商路与港口一同扩张。",
        lifespanBase: 60,
      },
    },
    inazuma: {
      "白夜国余响": {
        birthplace: "海祇旧民村落",
        desc: "旧传说尚未彻底退场，海潮与神祇余响仍近在身侧。",
        lifespanBase: 55,
      },
      "雷电真时代": {
        birthplace: "鸣神岛乡里",
        desc: "诸岛仍敬畏神威，却未被彻底锁死。",
        lifespanBase: 58,
      },
      "锁国令时代": {
        birthplace: "离岛町街",
        desc: "搜查与封锁并行，岛屿之间的呼吸都变得困难。",
        lifespanBase: 56,
      },
    },
    sumeru: {
      "赤王与花神时代": {
        birthplace: "沙海边镇",
        desc: "旧王与花神的余泽仍照着人间，也留下庞大阴影。",
        lifespanBase: 55,
      },
      "教令院建立期": {
        birthplace: "须弥城外学者聚居地",
        desc: "知识秩序渐成，普通人也被卷入新的规训。",
        lifespanBase: 59,
      },
      "灾变余烬期": {
        birthplace: "道成林边缘聚落",
        desc: "禁忌与污染的回声迟迟不散。",
        lifespanBase: 57,
      },
    },
    fontaine: {
      "雷穆利亚遗音": {
        birthplace: "古水道遗民聚点",
        desc: "旧文明余音未绝，海潮与废墟一同作响。",
        lifespanBase: 56,
      },
      "审判庭成型期": {
        birthplace: "枫丹廷外环街区",
        desc: "审判秩序逐渐定型，围观与流言成为另一种权力。",
        lifespanBase: 60,
      },
      "机械与歌剧时代": {
        birthplace: "白露区工坊街",
        desc: "歌剧、机器与审判交织成现代枫丹的日常。",
        lifespanBase: 61,
      },
    },
    natlan: {
      "火龙时代": {
        birthplace: "火山麓聚落",
        desc: "火龙王统御的时代，人与龙在灼风中共存。",
        lifespanBase: 53,
      },
      "火龙复辟时代": {
        birthplace: "硫磺温泉部落",
        desc: "人与龙的战争反复拉锯，英雄在烈焰中诞生又消逝。",
        lifespanBase: 55,
      },
      "历代火神时代": {
        birthplace: "圣火竞技场旁",
        desc: "人神更迭如火，每一次还魂都是新的开始。",
        lifespanBase: 57,
      },
    },
    nodkrai: {
      "黄金城时代": {
        birthplace: "亥珀波瑞亚遗民聚落",
        desc: "黄金城的余晖尚未散尽，霜月已悄然升起。",
        lifespanBase: 55,
      },
      "白沙皇时代": {
        birthplace: "挪德卡莱自治领",
        desc: "白沙皇的统治笼罩冰原，执灯人在暗处守望。",
        lifespanBase: 57,
      },
      "霜月自治时代": {
        birthplace: "霜月港町",
        desc: "妖僧离去，新月诞生，挪德卡莱在自治中寻找自己的路。",
        lifespanBase: 58,
      },
    },
    khaenriah: {
      "黑日王朝末期": {
        birthplace: "坎瑞亚地下王国",
        desc: "伊尔明王失去理智，漆黑灾厄在王国边缘蔓延。黑日王朝的最后荣光即将被深渊吞噬。",
        lifespanBase: 35,
      },
    },
    primordial: {
      "龙的时代": {
        birthplace: "香水海",
        desc: "始源之龙尼伯龙根尚在的时代，提瓦特尚未被天理重塑。巨龙翱翔于蛮荒而生机勃勃的大地之上。",
        lifespanBase: 800,
        age_increment: 100,
      },
      "高天原初时期": {
        birthplace: "高天神庭",
        desc: "鸽子衔枝之年。原初的那一位破壳而出，头戴王冠降临于世。天使作为祂的造物与晨星的代行，巡游于诸境之间。",
        lifespanBase: 6200,
        age_increment: 100,
      },
    },
  };

  const AGE_STAGES = [
    { id: "infant", name: "幼时", minAge: 0, maxAge: 5 },
    { id: "childhood", name: "童年", minAge: 6, maxAge: 12 },
    { id: "teen", name: "少年", minAge: 13, maxAge: 17 },
    { id: "youth", name: "青年", minAge: 18, maxAge: 30 },
    { id: "middle", name: "中年", minAge: 31, maxAge: 55 },
    { id: "elder", name: "暮年", minAge: 56, maxAge: 120 },
  ];

  const STAT_META = {
    intellect: { label: "智力", color: "#7098e0" },
    spirit: { label: "精神", color: "#b58cff" },
    physique: { label: "体质", color: "#e07870" },
    elemental: { label: "元素力", color: "#7ed8e8" },
  };

  const TALENT_RARITY_META = {
    common: { label: "普通", color: "#9aa4b2" },
    rare: { label: "稀有", color: "#5ba8e8" },
    epic: { label: "罕见", color: "#d8a85e" },
  };

  const DEFAULT_ALLOCATION_CAP = 5;
  const MAX_STAT_CAP = 10;
  const STARTING_ATTRIBUTE_POINTS = 10;
  const TALENT_DRAW_COUNT = 10;
  const MAX_TALENT_SELECTION = 2;

  const SUMMARY_TONES = [
    "这一生未必写进正史，却足够在亲历者心里留下回响。",
    "有些年份平淡如尘，有些年份却足以让命数彻底转向。",
    "你只是提瓦特众生中的一个，却也认真地活成了独一无二的一生。",
    "旧世界的残骸，新世界的基石——你的名字不会被铭记，但你的选择已在提瓦特的经络中留下痕迹。",
  ];

  return {
    NATIONS,
    ERA_PROFILES,
    AGE_STAGES,
    STAT_META,
    TALENT_RARITY_META,
    DEFAULT_ALLOCATION_CAP,
    MAX_STAT_CAP,
    STARTING_ATTRIBUTE_POINTS,
    TALENT_DRAW_COUNT,
    MAX_TALENT_SELECTION,
    SUMMARY_TONES,
  };
})();
