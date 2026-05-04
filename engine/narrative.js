window.TeyvatNarrative = (() => {
  const { NATIONS, SUMMARY_TONES } = window.TeyvatData;
  const { pick } = window.TeyvatUtils;

  function getAnthropicApiKey() {
    return window.TEYVAT_ANTHROPIC_API_KEY || window.localStorage.getItem("teyvat_anthropic_api_key") || "";
  }

  function buildPastSummary(gameState) {
    return gameState.history.length
      ? gameState.history.slice(-4).map((item) => item.summary).join("；")
      : "人生刚刚开始";
  }

  function buildLocalSummary(gameState) {
    const nation = NATIONS.find((item) => item.id === gameState.nation_id);
    const memories = gameState.history.length
      ? gameState.history.slice(-8).map((item) => item.label).join("；")
      : "平淡无声";
    const flags = gameState.flags.length
      ? `你的一生带着${gameState.flags.join("、")}这些印记。`
      : "你没有留下轰烈传奇，却也不曾虚度岁月。";
    const deathText = gameState.isDead
      ? `可惜在${gameState.deathReason || "命数骤止"}之后，你的人生提前停在了这里。`
      : "";
    const talentText = gameState.talents?.length
      ? `你曾背负天赋${gameState.talents.map((item) => item.name).join("、")}。`
      : "";

    return (
      `${gameState.era}的${gameState.birthplace || nation.name}见证了你的一生。` +
      `从${memories}中一步步走来，最终在${gameState.age}岁前后走到人生尽头。` +
      `临终之际，你仍保有智力${gameState.stats.intellect}、精神${gameState.stats.spirit}、体质${gameState.stats.physique}与元素力${gameState.stats.elemental}。` +
      `${talentText}${flags}${deathText}`
    );
  }

  async function requestAnthropic(system, user, maxTokens) {
    const apiKey = getAnthropicApiKey();
    if (!apiKey) {
      throw new Error("No api key");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    return response.json();
  }

  async function fetchSummary(gameState) {
    const system = `你是提瓦特人生重开模拟器叙事者。为一个提瓦特普通居民的一生写终章总结。200字以内，第三人称，融入提瓦特世界观的风格。`;
    const user =
      `${gameState.nation_name}，${gameState.era}，出生地${gameState.birthplace || "不详"}\n` +
      `享年或停在：${gameState.age}岁，寿命阈值${gameState.lifespan}\n` +
      `最终属性：智力${gameState.stats.intellect} 精神${gameState.stats.spirit} 体质${gameState.stats.physique} 元素力${gameState.stats.elemental}\n` +
      `天赋与标记：${[...(gameState.talents?.map((item) => item.name) || []), ...gameState.flags].join("、") || "平淡一生"}\n` +
      `是否中途身亡：${gameState.isDead ? `是，死因：${gameState.deathReason}` : "否"}\n` +
      `经历摘要：${buildPastSummary(gameState)}`;

    try {
      const data = await requestAnthropic(system, user, 700);
      return data.content[0].text;
    } catch {
      return buildLocalSummary(gameState);
    }
  }

  return {
    fetchSummary,
  };
})();
