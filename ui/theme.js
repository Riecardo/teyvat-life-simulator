window.TeyvatTheme = (() => {
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Cinzel:wght@500;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { min-height: 100%; }
body { background: #06080f; }

@keyframes twinkle {
  0%,100% { opacity: 0.1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.6); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -300% center; }
  100% { background-position: 300% center; }
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes blink {
  0%,100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes pulseGlow {
  0%,100% { opacity: 0.5; }
  50% { opacity: 1; }
}
@keyframes revealStat {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

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
  width: 22px;
  height: 22px;
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
  appearance: none;
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
.nation-card.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.6);
}
.nation-card.disabled:hover {
  transform: none;
  background: rgba(8, 12, 24, 0.85);
}
.race-card {
  appearance: none;
  cursor: pointer;
  padding: 22px 18px;
  background: rgba(8, 12, 24, 0.85);
  border: 1px solid rgba(200, 165, 106, 0.12);
  border-radius: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  text-align: left;
  width: 100%;
  color: inherit;
  font-family: 'Noto Serif SC', serif;
}
.race-card:hover {
  transform: translateY(-5px);
  background: rgba(10, 15, 30, 0.96);
}
.curse-bar-bg {
  height: 6px;
  background: rgba(60, 20, 60, 0.4);
  border-radius: 3px;
  overflow: hidden;
}
.curse-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a2080, #c040d0);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.faith-bar-bg {
  height: 6px;
  background: rgba(40, 40, 20, 0.4);
  border-radius: 3px;
  overflow: hidden;
}
.faith-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #c8a040, #f0d880);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.cap-text {
  font-size: 10px;
  color: #7a6a50;
  margin-left: 4px;
}
.cap-text.limited {
  color: #c8a040;
}
.abyss-bar-bg {
  height: 6px;
  background: rgba(20, 10, 40, 0.5);
  border-radius: 3px;
  overflow: hidden;
}
.abyss-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2a1050, #8040c0);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.pity-indicator {
  font-size: 11px;
  color: #8b78c0;
  letter-spacing: 0.08em;
}
`;

  return { CSS };
})();
