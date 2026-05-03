javascript

import { useState, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════
   GAME DATA
═══════════════════════════════════════════ */
const NATIONS = [
  { id:"mondstadt", name:"蒙德", element:"风", color:"#7ed8e8",
    desc:"自由之风吹拂的葡萄酒之国",
    eras:["暴风王时代","骑士团重建期","蒙德繁荣期"] },
  { id:"liyue", name:"璃月", element:"岩", color:"#d4aa6a",
    desc:"岩神庇护下的商贸港口之城",
    eras:["魔神战争余波","仙人隐世期","摩拉克斯盛世"] },
  { id:"inazuma", name:"稻妻", element:"雷", color:"#a07fe8",
    desc:"永恒将军统治的孤立岛国",
    eras:["锁国前夕","锁国严峻期","开国改革后"] },
  { id:"sumeru", name:"须弥", element:"草", color:"#5ec87a",
    desc:"智慧沙漠与雨林并存之地",
    eras:["大旱笼罩期","学者院黄金期","雨林复苏时代"] },
  { id:"fontaine", name:"枫丹", element:"水", color:"#5ba8e8",
    desc:"以审判立国、艺术为魂的水之国",
    eras:["审判制度建立期","工业革命浪潮","歌剧院繁盛时代"] },
];

const CLASSES = [
  { id:"commoner", name:"平民", wealth:20, desc:"日出而作，勤劳度日" },
  { id:"craftsman", name:"工匠", wealth:35, desc:"以一技之长谋生立业" },
  { id:"merchant", name:"商人", wealth:55, desc:"走南闯北，以货通天下" },
  { id:"scholar", name:"学者", wealth:30, desc:"寒窗苦读，以学问安身" },
  { id:"warrior", name:"武者", wealth:25, desc:"习武强身，闯荡四方" },
  { id:"noble", name:"贵族", wealth:80, desc:"生于锦绣，坐拥荣华" },
];

const STAGES = [
  { name:"幼年", range:"0–12岁" },
  { name:"少年", range:"13–17岁" },
  { name:"青年", range:"18–30岁" },
  { name:"中年", range:"31–50岁" },
  { name:"晚年", range:"51岁+" },
];

const EVENTS_PER_STAGE = 2;

/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */
const rnd  = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo=0, hi=100) => Math.max(lo, Math.min(hi, v));

function initStats(cls) {
  return {
    physique:   rnd(20, 80),
    intellect:  rnd(20, 80),
    charm:      rnd(20, 80),
    elemental:  rnd(10, 90),
    wealth:     clamp(cls.wealth + rnd(-10, 15)),
    reputation: 10,
    health:     100,
    happiness:  50,
  };
}

/* ═══════════════════════════════════════════
   API CALLS
═══════════════════════════════════════════ */
async function fetchEvent(gs, stage) {
  const past = gs.history.length
    ? gs.history.slice(-3).map(h => h.summary).join("；")
    : "人生刚刚开始";

  const system = `你是提瓦特人生重开模拟器的叙事者。以"你"称呼主角，讲述提瓦特普通居民的一段人生事件。

规则：
• 主角是无名小人物，不涉及神明/旅行者等主线角色直接出场
• 融入国家特色：蒙德(风/葡萄酒/骑士团/蒲公英)；璃月(岩/摩拉/往生堂/商会)；稻妻(雷/武士/紫式部/封闭)；须弥(草/学者院/梦境/沙漠旅队)；枫丹(水/审判庭/歌剧/机械)
• 故事120-160字，语言生动，贴近所选时代背景
• 仅输出纯JSON（不加代码块标记），格式如下：
{"story":"故事文本","summary":"10字以内摘要","choices":[{"text":"选项文字（15字以内）","effect":{"wealth":数值,"reputation":数值,"health":数值,"happiness":数值},"flag":"标记名或null"},{"text":"选项2","effect":{},"flag":null}]}
• effect数值范围-20到+20；晚年stages的choices为[]；其余阶段2-3个选项`;

  const user = `角色：${gs.nation_name}的${gs.class_name}（${gs.era}）
当前阶段：${stage.name}（${stage.range}）
属性：体魄${gs.stats.physique} 智识${gs.stats.intellect} 魅力${gs.stats.charm} 元素亲和${gs.stats.elemental} 财富${gs.stats.wealth} 声望${gs.stats.reputation} 健康${gs.stats.health} 幸福${gs.stats.happiness}
人生标记：${gs.flags.join("、") || "无"}
往事摘要：${past}`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 900,
      system, messages: [{ role: "user", content: user }]
    })
  });
  const d = await r.json();
  try { return JSON.parse(d.content[0].text.replace(/```json|```/g, "").trim()); }
  catch { return { story: d.content[0].text || "世事无常，又是平淡的一天。", summary: "平淡度日", choices: [] }; }
}

async function fetchSummary(gs) {
  const system = `你是提瓦特人生重开模拟器叙事者。为一个提瓦特普通居民的一生写终章总结。
200-250字，第三人称，温情哲思，带有提瓦特气息（可提及当地风物、传统）。
最后一句必须以"……如此，这一生，便已足够。"结尾。只返回纯文字。`;
  const user = `${gs.nation_name}的${gs.class_name}，${gs.era}
最终属性：财富${gs.stats.wealth} 声望${gs.stats.reputation} 幸福${gs.stats.happiness} 健康${gs.stats.health}
人生标记：${gs.flags.join("、") || "平淡一生"}
经历摘要：${gs.history.map(h => h.summary).join("；") || "默默无闻"}`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, system, messages: [{ role: "user", content: user }] })
  });
  const d = await r.json();
  return d.content[0].text;
}

/* ═══════════════════════════════════════════
   CSS
═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Cinzel:wght@500;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes twinkle {
  0%,100% { opacity: 0.1; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.6); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-7px); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes blink {
  0%,100% { opacity: 1; }
  50%     { opacity: 0; }
}
@keyframes pulseGlow {
  0%,100% { opacity: 0.5; }
  50%     { opacity: 1; }
}
@keyframes revealStat {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}

body { background: #06080f; }

.root {
  min-height: 100vh;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  color: #d4c4a0;
  background: #06080f;
  position: relative;
  overflow-x: hidden;
}

.gold {
  background: linear-gradient(90deg, #8a5a20, #e8d080, #c8a56a, #e8d5a3, #c8a56a, #e8d080, #8a5a20);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 5s linear infinite;
}

.fade-up { animation: fadeUp 0.55s ease both; }

.card {
  background: rgba(8, 12, 24, 0.92);
  border: 1px solid rgba(200, 165, 106, 0.18);
  border-radius: 8px;
  backdrop-filter: blur(16px);
}

.choice-btn {
  width: 100%;
  padding: 11px 18px;
  background: rgba(200, 165, 106, 0.06);
  border: 1px solid rgba(200, 165, 106, 0.25);
  border-radius: 6px;
  color: #c4b48a;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Noto Serif SC', serif;
  line-height: 1.5;
}
.choice-btn:hover {
  background: rgba(200, 165, 106, 0.15);
  border-color: rgba(200, 165, 106, 0.6);
  color: #e8d5a3;
  transform: translateX(5px);
}
.choice-btn:active { transform: translateX(3px); }

.primary-btn {
  cursor: pointer;
  border: 1px solid rgba(200, 165, 106, 0.5);
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(200,165,106,0.15), rgba(200,165,106,0.05));
  color: #e8d5a3;
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  letter-spacing: 0.2em;
  padding: 13px 48px;
  transition: all 0.25s;
}
.primary-btn:hover {
  background: rgba(200, 165, 106, 0.22);
  border-color: rgba(200, 165, 106, 0.8);
}

.spinner {
  width: 22px; height: 22px;
  border: 2px solid rgba(200,165,106,0.15);
  border-top-color: #c8a56a;
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
  flex-shrink: 0;
}

.stat-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.9s cubic-bezier(0.25, 1, 0.5, 1);
}

.nation-card {
  cursor: pointer;
  padding: 22px 18px;
  background: rgba(8, 12, 24, 0.85);
  border: 1px solid rgba(200, 165, 106, 0.12);
  border-radius: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  text-align: center;
}
.nation-card:hover {
  transform: translateY(-5px);
  background: rgba(10, 15, 30, 0.96);
}
`;

/* ═══════════════════════════════════════════
   STAR FIELD
═══════════════════════════════════════════ */
function StarField({ stars }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
      background:"radial-gradient(ellipse at 25% 40%, #0d1828 0%, #06080f 65%)" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:`${s.size}px`, height:`${s.size}px`,
          background:"#fff", borderRadius:"50%", opacity:s.opacity,
          animation:`twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`
        }} />
      ))}
      {/* Subtle nebula blobs */}
      <div style={{position:"absolute",width:"40%",height:"30%",top:"10%",left:"60%",
        background:"radial-gradient(ellipse,rgba(90,60,180,0.04),transparent 70%)"}}/>
      <div style={{position:"absolute",width:"35%",height:"25%",bottom:"20%",left:"5%",
        background:"radial-gradient(ellipse,rgba(60,120,180,0.04),transparent 70%)"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STAT BAR
═══════════════════════════════════════════ */
function StatBar({ label, value, color="#c8a56a", delta, compact=false }) {
  const dColor = delta > 0 ? "#5ec878" : delta < 0 ? "#e07070" : "#c8a56a";
  return (
    <div style={{ marginBottom: compact ? 5 : 8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, fontSize: compact ? 11 : 12 }}>
        <span style={{ color:"#7a6a50" }}>{label}</span>
        <span style={{ color: delta !== undefined && delta !== 0 ? dColor : "#c8a56a" }}>
          {value}
          {delta !== undefined && delta !== 0 &&
            <span style={{ fontSize:10, marginLeft:3, color:dColor }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>}
        </span>
      </div>
      <div style={{ height: compact ? 3 : 4, background:"rgba(255,255,255,0.04)", borderRadius:2 }}>
        <div className="stat-fill" style={{
          width:`${clamp(value)}%`,
          background:`linear-gradient(90deg, ${color}66, ${color})`
        }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DIVIDER
═══════════════════════════════════════════ */
function GoldDivider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, justifyContent:"center", margin:"20px 0" }}>
      <div style={{ height:1, width:60, background:"linear-gradient(90deg,transparent,rgba(200,165,106,0.4))" }}/>
      <div style={{ color:"#c8a56a", fontSize:14, animation:"pulseGlow 2.5s ease-in-out infinite" }}>◆</div>
      <div style={{ height:1, width:60, background:"linear-gradient(90deg,rgba(200,165,106,0.4),transparent)" }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TITLE SCREEN
═══════════════════════════════════════════ */
function TitleScreen({ onStart }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100vh", padding:"40px 24px",
      position:"relative", zIndex:1, textAlign:"center" }}>

      <div className="fade-up">
        <div style={{ fontFamily:"Cinzel,serif", fontSize:11, letterSpacing:"0.55em",
          color:"rgba(200,165,106,0.55)", marginBottom:28 }}>
          TEYVAT · LIFE · SIMULATOR
        </div>

        <h1 className="gold" style={{ fontSize:"clamp(26px,5.5vw,52px)", fontWeight:700,
          lineHeight:1.25, marginBottom:14, fontFamily:"'Noto Serif SC',serif" }}>
          提瓦特人生重开模拟器
        </h1>

        <p style={{ color:"rgba(200,165,106,0.45)", fontSize:15, letterSpacing:"0.25em", marginBottom:6 }}>
          一千种命运，一万种人生
        </p>
        <p style={{ color:"rgba(100,80,50,0.7)", fontSize:13, marginBottom:64 }}>
          你将以一名无名小卒的身份，降生于提瓦特的某处
        </p>

        <GoldDivider />

        <button className="primary-btn" onClick={onStart}
          style={{ marginTop:32, animation:"float 3.5s ease-in-out infinite" }}>
          开始新的人生
        </button>

        <p style={{ color:"rgba(60,40,20,0.6)", fontSize:11, marginTop:52,
          letterSpacing:"0.08em", lineHeight:1.8 }}>
          同人UGC作品，与米哈游官方无关<br/>
          内容由AI随机生成，每一世皆独一无二
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NATION SCREEN
═══════════════════════════════════════════ */
function NationCard({ nation, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="nation-card"
      onClick={() => onSelect(nation)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderColor: hov ? nation.color : "rgba(200,165,106,0.12)",
        boxShadow: hov ? `0 0 32px ${nation.color}33, 0 6px 28px rgba(0,0,0,0.5)` : "0 2px 14px rgba(0,0,0,0.3)",
      }}>
      <div style={{ fontSize:28, marginBottom:10, color:nation.color,
        textShadow: hov ? `0 0 20px ${nation.color}88` : "none",
        transition:"text-shadow 0.3s", fontFamily:"Cinzel,serif", fontWeight:700 }}>
        {nation.element}
      </div>
      <div style={{ fontSize:22, fontWeight:700, marginBottom:4,
        color: hov ? nation.color : "#d4c4a0", transition:"color 0.3s" }}>
        {nation.name}
      </div>
      <div style={{ fontSize:11, letterSpacing:"0.2em", color:"#7a6a50", marginBottom:12 }}>
        {nation.element}元素之国
      </div>
      <div style={{ fontSize:12, color:"#6a5a40", lineHeight:1.7,
        borderTop:"1px solid rgba(200,165,106,0.08)", paddingTop:10 }}>
        {nation.desc}
      </div>
      {hov && (
        <div style={{ marginTop:12 }}>
          {nation.eras.map(e => (
            <div key={e} style={{ fontSize:11, color:`${nation.color}99`,
              padding:"2px 0", letterSpacing:"0.05em" }}>· {e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function NationScreen({ onSelect }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", padding:"56px 20px 48px", position:"relative", zIndex:1 }}>
      <div className="fade-up" style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ color:"rgba(200,165,106,0.4)", fontSize:11, letterSpacing:"0.45em", marginBottom:12 }}>
          CHOOSE YOUR HOMELAND
        </div>
        <h2 className="gold" style={{ fontSize:"clamp(20px,4vw,32px)", fontWeight:700 }}>
          选择你的出生之地
        </h2>
        <p style={{ color:"rgba(90,70,40,0.8)", fontSize:13, marginTop:8 }}>
          时代与阶层将由命运随机决定
        </p>
      </div>

      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
        gap:14, width:"100%", maxWidth:880 }}>
        {NATIONS.map((n, i) => (
          <div key={n.id} className="fade-up" style={{ animationDelay:`${i * 0.08}s` }}>
            <NationCard nation={n} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REVEAL SCREEN
═══════════════════════════════════════════ */
function RevealScreen({ gs, onBegin }) {
  const [step, setStep] = useState(0);
  const nation = NATIONS.find(n => n.id === gs.nation_id);

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 350),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1600),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const statRows = [
    { label:"体魄", key:"physique",   color:"#e07870" },
    { label:"智识", key:"intellect",  color:"#7098e0" },
    { label:"魅力", key:"charm",      color:"#d070a0" },
    { label:"元素亲和", key:"elemental", color: nation?.color },
    { label:"财富", key:"wealth",     color:"#c8a56a" },
    { label:"幸福", key:"happiness",  color:"#c8a0d8" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 20px", position:"relative", zIndex:1 }}>
      <div style={{ width:"100%", maxWidth:460, textAlign:"center" }}>

        <div className="fade-up" style={{ marginBottom:28 }}>
          <div style={{ color:"rgba(200,165,106,0.4)", fontSize:11, letterSpacing:"0.45em", marginBottom:12 }}>
            FATE IS SEALED
          </div>
          <h2 className="gold" style={{ fontSize:30, fontWeight:700 }}>命运已定</h2>
        </div>

        <div className="card fade-up" style={{ padding:"28px 28px 24px", animationDelay:"0.15s" }}>

          {/* Nation + Era */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16,
            paddingBottom:20, marginBottom:20, borderBottom:"1px solid rgba(200,165,106,0.1)" }}>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:11, color:"#7a6a50", letterSpacing:"0.2em", marginBottom:6 }}>出生之地</div>
              <div style={{ fontSize:22, fontWeight:700, color:nation?.color }}>{gs.nation_name}</div>
              <div style={{ fontSize:12, color:"#7a6a50" }}>{gs.nation_element}元素之国</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:"#7a6a50", letterSpacing:"0.2em", marginBottom:6 }}>所处时代</div>
              <div style={{ fontSize:14, color:"#c8a56a", lineHeight:1.5 }}>{gs.era}</div>
            </div>
          </div>

          {/* Class */}
          {step >= 1 && (
            <div className="fade-up" style={{ padding:"14px 16px", marginBottom:20,
              background:"rgba(200,165,106,0.05)",
              border:"1px solid rgba(200,165,106,0.12)", borderRadius:6 }}>
              <div style={{ fontSize:11, color:"#7a6a50", letterSpacing:"0.15em", marginBottom:5 }}>你的身份</div>
              <div style={{ fontSize:24, fontWeight:700, color:"#e8d5a3" }}>{gs.class_name}</div>
              <div style={{ fontSize:12, color:"#7a6a50" }}>
                {CLASSES.find(c => c.name === gs.class_name)?.desc}
              </div>
            </div>
          )}

          {/* Stats */}
          {step >= 2 && (
            <div className="fade-up">
              <div style={{ fontSize:11, color:"#7a6a50", letterSpacing:"0.2em", marginBottom:14 }}>先天属性</div>
              {statRows.map((s, i) => (
                <div key={s.key} style={{ animation:"revealStat 0.4s ease both",
                  animationDelay:`${i * 0.07}s` }}>
                  <StatBar label={s.label} value={gs.stats[s.key]} color={s.color} />
                </div>
              ))}
            </div>
          )}
        </div>

        {step >= 3 && (
          <button className="primary-btn fade-up" onClick={onBegin}
            style={{ marginTop:28 }}>
            开始人生
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   GAME SCREEN
═══════════════════════════════════════════ */
function GameScreen({ gs, stageIdx, eventIdx, isLoading,
  displayedText, showChoices, currentEvent, statDeltas, onChoice }) {

  const nation = NATIONS.find(n => n.id === gs.nation_id);

  const statRows = [
    { label:"体魄", key:"physique",   color:"#e07870" },
    { label:"智识", key:"intellect",  color:"#7098e0" },
    { label:"魅力", key:"charm",      color:"#d070a0" },
    { label:"元素", key:"elemental",  color: nation?.color || "#c8a56a" },
    { label:"财富", key:"wealth",     color:"#c8a56a" },
    { label:"声望", key:"reputation", color:"#d8c050" },
    { label:"健康", key:"health",     color:"#50c878" },
    { label:"幸福", key:"happiness",  color:"#c8a0d8" },
  ];

  const statLabel = { physique:"体魄", intellect:"智识", charm:"魅力",
    elemental:"元素亲和", wealth:"财富", reputation:"声望", health:"健康", happiness:"幸福" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      position:"relative", zIndex:1, padding:"18px 18px 24px" }}>

      {/* Top bar: stages */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:14, paddingBottom:12, borderBottom:"1px solid rgba(200,165,106,0.1)" }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {STAGES.map((s, i) => (
            <div key={s.name} style={{
              padding:"3px 10px", borderRadius:3, fontSize:11, letterSpacing:"0.08em",
              background: i === stageIdx ? "rgba(200,165,106,0.18)" : i < stageIdx ? "rgba(200,165,106,0.06)" : "transparent",
              border:`1px solid ${i <= stageIdx ? "rgba(200,165,106,0.35)" : "rgba(200,165,106,0.08)"}`,
              color: i === stageIdx ? "#e8d5a3" : i < stageIdx ? "#6a5a40" : "#2a1a0a"
            }}>{s.name}</div>
          ))}
        </div>
        <div style={{ fontSize:11, color:"#7a6a50" }}>
          <span style={{ color: nation?.color }}>{gs.nation_name}</span>{" · "}{gs.class_name}
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:14, flex:1, alignItems:"start" }}>

        {/* Left: Stat panel */}
        <div className="card" style={{ padding:"16px 14px", position:"sticky", top:18 }}>
          <div style={{ fontSize:10, color:"#6a5a40", letterSpacing:"0.2em", marginBottom:14 }}>人物属性</div>
          {statRows.map(s => (
            <StatBar key={s.key} label={s.label} value={gs.stats[s.key]}
              color={s.color} delta={statDeltas?.[s.key]} compact />
          ))}

          {gs.flags.length > 0 && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid rgba(200,165,106,0.08)" }}>
              <div style={{ fontSize:10, color:"#6a5a40", marginBottom:8 }}>人生标记</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {gs.flags.map(f => (
                  <span key={f} style={{
                    fontSize:10, padding:"2px 7px",
                    background:"rgba(200,165,106,0.08)",
                    border:"1px solid rgba(200,165,106,0.18)",
                    borderRadius:10, color:"#c8a56a"
                  }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {gs.history.length > 0 && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid rgba(200,165,106,0.08)" }}>
              <div style={{ fontSize:10, color:"#6a5a40", marginBottom:8 }}>往事</div>
              {gs.history.slice(-4).map((h, i) => (
                <div key={i} style={{ fontSize:10, color:"#4a3a28", marginBottom:4, lineHeight:1.5 }}>
                  <span style={{ color:"#6a5040" }}>{h.stage}：</span>{h.summary}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Story panel */}
        <div className="card" style={{ padding:"24px 24px 22px" }}>

          {/* Stage header */}
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:18,
            paddingBottom:14, borderBottom:"1px solid rgba(200,165,106,0.08)" }}>
            <span style={{ fontFamily:"Cinzel,serif", fontSize:22, fontWeight:500,
              color: nation?.color, textShadow:`0 0 24px ${nation?.color}44` }}>
              {STAGES[stageIdx].name}
            </span>
            <span style={{ fontSize:12, color:"#7a6a50" }}>{STAGES[stageIdx].range}</span>
            <span style={{ fontSize:11, color:"rgba(200,165,106,0.3)", marginLeft:"auto" }}>
              {eventIdx + 1}/{EVENTS_PER_STAGE}
            </span>
          </div>

          {/* Story text */}
          <div style={{ minHeight:140, marginBottom:22 }}>
            {isLoading ? (
              <div style={{ display:"flex", alignItems:"center", gap:12, color:"#6a5a40",
                padding:"20px 0" }}>
                <div className="spinner" />
                <span style={{ fontSize:14 }}>命运的齿轮正在转动……</span>
              </div>
            ) : (
              <p style={{ fontSize:15, lineHeight:2.1, color:"#c4b48a", position:"relative" }}>
                {displayedText}
                {displayedText.length < (currentEvent?.story?.length || 0) && (
                  <span style={{ animation:"blink 1s step-end infinite", marginLeft:2, color:"#c8a56a" }}>|</span>
                )}
              </p>
            )}
          </div>

          {/* Stat deltas */}
          {statDeltas && Object.keys(statDeltas).length > 0 && (
            <div className="fade-up" style={{ display:"flex", flexWrap:"wrap", gap:7,
              marginBottom:18, padding:"10px 14px",
              background:"rgba(0,0,0,0.25)", borderRadius:5 }}>
              {Object.entries(statDeltas).filter(([,v]) => v !== 0).map(([k, v]) => (
                <span key={k} style={{
                  fontSize:12, padding:"2px 10px", borderRadius:4,
                  color: v > 0 ? "#5ec878" : "#e07070",
                  background: v > 0 ? "rgba(94,200,120,0.1)" : "rgba(224,112,112,0.1)"
                }}>
                  {statLabel[k] || k} {v > 0 ? `+${v}` : v}
                </span>
              ))}
            </div>
          )}

          {/* Choices */}
          {showChoices && currentEvent && !isLoading && (
            <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {currentEvent.choices && currentEvent.choices.length > 0 ? (
                <>
                  <div style={{ fontSize:11, color:"#6a5a40", letterSpacing:"0.18em", marginBottom:3 }}>
                    你会怎么做？
                  </div>
                  {currentEvent.choices.map((c, i) => (
                    <button key={i} className="choice-btn" onClick={() => onChoice(c)}>
                      <span style={{ color:"rgba(200,165,106,0.6)", marginRight:9, fontSize:10 }}>▶</span>
                      {c.text}
                    </button>
                  ))}
                </>
              ) : (
                <button className="choice-btn" onClick={() => onChoice({ text:"继续", effect:{}, flag:null })}
                  style={{ textAlign:"center", color:"rgba(200,165,106,0.8)",
                    letterSpacing:"0.1em", borderColor:"rgba(200,165,106,0.2)" }}>
                  继续 →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUMMARY SCREEN
═══════════════════════════════════════════ */
function SummaryScreen({ gs, summary, isLoading, onRestart }) {
  const [displayed, setDisplayed] = useState("");
  const nation = NATIONS.find(n => n.id === gs.nation_id);

  useEffect(() => {
    if (!summary || isLoading) { setDisplayed(""); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(summary.slice(0, i));
      if (i >= summary.length) clearInterval(iv);
    }, 22);
    return () => clearInterval(iv);
  }, [summary, isLoading]);

  const finalStats = [
    { label:"财富", key:"wealth",     color:"#c8a56a" },
    { label:"声望", key:"reputation", color:"#d8c050" },
    { label:"健康", key:"health",     color:"#50c878" },
    { label:"幸福", key:"happiness",  color:"#c8a0d8" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"60px 20px 48px", position:"relative", zIndex:1 }}>
      <div style={{ width:"100%", maxWidth:580 }}>

        <div className="fade-up" style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ color:"rgba(200,165,106,0.35)", fontSize:11, letterSpacing:"0.45em", marginBottom:12 }}>
            LIFE COMPLETE
          </div>
          <h2 className="gold" style={{ fontSize:32, fontWeight:700, marginBottom:8 }}>人生终章</h2>
          <p style={{ color:"#7a6a50", fontSize:14 }}>
            {gs.nation_name} · {gs.class_name} · {gs.era}
          </p>
        </div>

        {/* Final stat cards */}
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gap:1, marginBottom:22, overflow:"hidden",
          border:"1px solid rgba(200,165,106,0.15)", borderRadius:8,
          animationDelay:"0.15s" }}>
          {finalStats.map((s, i) => (
            <div key={s.label} style={{
              padding:"16px 10px", textAlign:"center",
              background:"rgba(8,12,24,0.9)",
              borderRight: i < 3 ? "1px solid rgba(200,165,106,0.1)" : "none"
            }}>
              <div style={{ fontSize:26, fontWeight:700, color:s.color }}>{gs.stats[s.key]}</div>
              <div style={{ fontSize:11, color:"#6a5a40", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Summary text */}
        <div className="card fade-up" style={{ padding:"26px 28px", marginBottom:26,
          animationDelay:"0.25s", minHeight:120 }}>
          {isLoading ? (
            <div style={{ display:"flex", alignItems:"center", gap:12, color:"#6a5a40" }}>
              <div className="spinner" />
              <span style={{ fontSize:14 }}>正在回顾这一生……</span>
            </div>
          ) : (
            <p style={{ fontSize:14, lineHeight:2.3, color:"#c4b48a" }}>
              {displayed}
              {displayed.length < summary.length && (
                <span style={{ animation:"blink 1s step-end infinite", color:"#c8a56a" }}>|</span>
              )}
            </p>
          )}
        </div>

        {/* Flags */}
        {gs.flags.length > 0 && (
          <div className="fade-up" style={{ textAlign:"center", marginBottom:32, animationDelay:"0.35s" }}>
            <div style={{ fontSize:11, color:"#6a5a40", letterSpacing:"0.2em", marginBottom:12 }}>
              留在史书之外的印记
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
              {gs.flags.map(f => (
                <span key={f} style={{
                  padding:"4px 14px", fontSize:12, borderRadius:20,
                  background:"rgba(200,165,106,0.08)",
                  border:"1px solid rgba(200,165,106,0.25)",
                  color:"#c8a56a"
                }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign:"center" }}>
          <button className="primary-btn" onClick={onRestart}>再来一世</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [screen,       setScreen]       = useState("title");
  const [gameState,    setGameState]    = useState(null);
  const [stageIdx,     setStageIdx]     = useState(0);
  const [eventIdx,     setEventIdx]     = useState(0);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [displayedText,setDisplayedText]= useState("");
  const [showChoices,  setShowChoices]  = useState(false);
  const [statDeltas,   setStatDeltas]   = useState(null);
  const [summary,      setSummary]      = useState("");
  const [busy,         setBusy]         = useState(false);

  // Stable star positions
  const stars = useMemo(() => Array.from({ length: 110 }, (_, i) => ({
    id:i, x:(i*37.17+3)%100, y:(i*23.71+7)%100,
    size:(i%3)+1, dur:((i%4)+2.5), delay:(i%5)*0.55,
    opacity:((i%8)/8)*0.65+0.08
  })), []);

  /* Typewriter */
  useEffect(() => {
    if (!currentEvent?.story) return;
    const text = currentEvent.story;
    setDisplayedText(""); setShowChoices(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setShowChoices(true); }
    }, 28);
    return () => clearInterval(iv);
  }, [currentEvent]);

  const loadEvent = async (gs, sIdx) => {
    setIsLoading(true);
    setCurrentEvent(null); setStatDeltas(null);
    setDisplayedText(""); setShowChoices(false);
    try {
      const ev = await fetchEvent(gs, STAGES[sIdx]);
      setCurrentEvent(ev);
    } catch {
      setCurrentEvent({ story:"世事无常，又是平静的一天。", summary:"平淡度日", choices:[] });
    }
    setIsLoading(false);
  };

  const handleNationSelect = (nation) => {
    const era = pick(nation.eras);
    const cls = pick(CLASSES);
    const gs = {
      nation_id: nation.id, nation_name: nation.name,
      nation_element: nation.element, nation_color: nation.color,
      era, class_id: cls.id, class_name: cls.name,
      stats: initStats(cls), flags: [], history: [],
    };
    setGameState(gs);
    setScreen("reveal");
  };

  const beginLife = () => {
    setStageIdx(0); setEventIdx(0);
    setScreen("game");
    loadEvent(gameState, 0);
  };

  const handleChoice = (choice) => {
    if (busy) return;
    setBusy(true);

    const newStats = { ...gameState.stats };
    const deltas   = {};
    if (choice.effect) {
      Object.entries(choice.effect).forEach(([k, v]) => {
        if (newStats[k] !== undefined) {
          const old = newStats[k];
          newStats[k] = clamp(old + v);
          if (newStats[k] !== old) deltas[k] = newStats[k] - old;
        }
      });
    }

    const newFlags   = choice.flag
      ? [...new Set([...gameState.flags, choice.flag])]
      : gameState.flags;
    const newHistory = [...gameState.history,
      { stage: STAGES[stageIdx].name, summary: currentEvent?.summary || "发生了一件事", choice: choice.text }];

    const newGs = { ...gameState, stats: newStats, flags: newFlags, history: newHistory };
    setGameState(newGs);
    setStatDeltas(Object.keys(deltas).length ? deltas : null);
    setShowChoices(false);

    setTimeout(() => {
      const nextEv = eventIdx + 1;
      if (nextEv >= EVENTS_PER_STAGE) {
        const nextSt = stageIdx + 1;
        if (nextSt >= STAGES.length) {
          endLife(newGs);
        } else {
          setStageIdx(nextSt); setEventIdx(0);
          loadEvent(newGs, nextSt);
        }
      } else {
        setEventIdx(nextEv);
        loadEvent(newGs, stageIdx);
      }
      setBusy(false);
    }, 1600);
  };

  const endLife = async (gs) => {
    setScreen("summary");
    setIsLoading(true);
    try {
      const txt = await fetchSummary(gs);
      setSummary(txt);
    } catch {
      setSummary(`${gs.nation_name}的${gs.class_name}，就这样走完了在${gs.era}的一生。每一次选择，都刻入了这段岁月之中。……如此，这一生，便已足够。`);
    }
    setIsLoading(false);
  };

  const restart = () => {
    setScreen("title"); setGameState(null);
    setStageIdx(0); setEventIdx(0);
    setCurrentEvent(null); setSummary("");
    setStatDeltas(null); setBusy(false);
  };

  return (
    <div className="root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <StarField stars={stars} />

      {screen === "title"   && <TitleScreen onStart={() => setScreen("nation")} />}
      {screen === "nation"  && <NationScreen onSelect={handleNationSelect} />}
      {screen === "reveal"  && gameState && <RevealScreen gs={gameState} onBegin={beginLife} />}
      {screen === "game"    && gameState && (
        <GameScreen
          gs={gameState} stageIdx={stageIdx} eventIdx={eventIdx}
          isLoading={isLoading} displayedText={displayedText}
          showChoices={showChoices} currentEvent={currentEvent}
          statDeltas={statDeltas} onChoice={handleChoice}
        />
      )}
      {screen === "summary" && gameState && (
        <SummaryScreen gs={gameState} summary={summary} isLoading={isLoading} onRestart={restart} />
      )}
    </div>
  );
}
