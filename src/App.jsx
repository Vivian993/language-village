import { useState, useEffect, useRef, useMemo } from "react";

const LOCATIONS = [
  {
    id: "home",
    name: "家裡",
    emoji: "🏠",
    color: "#F2A65A",
    soft: "#FCE3C3",
    words: [
      { id: "baba", label: "爸爸", emoji: "👨" },
      { id: "mama", label: "媽媽", emoji: "👩" },
      { id: "agong", label: "阿公", emoji: "👴" },
      { id: "ama", label: "阿嬤", emoji: "👵" },
      { id: "chifan", label: "吃飯", emoji: "🍚" },
      { id: "xizao", label: "洗澡", emoji: "🛁" },
      { id: "shuijiao", label: "睡覺", emoji: "😴" },
    ],
  },
  {
    id: "market",
    name: "超市",
    emoji: "🍎",
    color: "#E8636B",
    soft: "#FBD6D8",
    words: [
      { id: "pingguo", label: "蘋果", emoji: "🍎" },
      { id: "xiangjiao", label: "香蕉", emoji: "🍌" },
      { id: "niunai", label: "牛奶", emoji: "🥛" },
      { id: "binggan", label: "餅乾", emoji: "🍪" },
      { id: "naiping", label: "奶瓶", emoji: "🍼" },
    ],
  },
  {
    id: "station",
    name: "車站",
    emoji: "🚗",
    color: "#4FA3D1",
    soft: "#D3E9F6",
    words: [
      { id: "cheche", label: "車車", emoji: "🚗" },
      { id: "gongche", label: "公車", emoji: "🚌" },
      { id: "huoche", label: "火車", emoji: "🚂" },
    ],
  },
  {
    id: "zoo",
    name: "動物園",
    emoji: "🐶",
    color: "#6FB07F",
    soft: "#D9EEDD",
    words: [
      { id: "gou", label: "狗狗", emoji: "🐶" },
      { id: "mao", label: "貓咪", emoji: "🐱" },
      { id: "daxiang", label: "大象", emoji: "🐘" },
    ],
  },
  {
    id: "hospital",
    name: "醫院",
    emoji: "🩺",
    color: "#8E8FD9",
    soft: "#E2E2F7",
    words: [
      { id: "yisheng", label: "醫生", emoji: "🩺" },
      { id: "zuiba", label: "嘴巴", emoji: "👄" },
      { id: "erduo", label: "耳朵", emoji: "👂" },
    ],
  },
  {
    id: "restaurant",
    name: "餐廳",
    emoji: "🍔",
    color: "#E0A93E",
    soft: "#FBEBC7",
    words: [
      { id: "woyao", label: "我要", emoji: "🙋" },
      { id: "genduo", label: "更多", emoji: "➕" },
      { id: "haochi", label: "好吃", emoji: "😋" },
      { id: "shui", label: "水", emoji: "💧" },
    ],
  },
];

const ALL_WORDS = LOCATIONS.flatMap((loc) =>
  loc.words.map((w) => ({ ...w, locId: loc.id, locColor: loc.color }))
);

function pickDailyMission(dateStr, count = 6) {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pool = [...ALL_WORDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-TW";
    u.rate = 0.85;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function LanguageVillage() {
  const [screen, setScreen] = useState("map");
  const [activeLocId, setActiveLocId] = useState(null);
  const [activeWord, setActiveWord] = useState(null);
  const [stars, setStars] = useState({});
  const [showBurst, setShowBurst] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const dateKey = useMemo(() => todayKey(), []);
  const mission = useMemo(() => pickDailyMission(dateKey), [dateKey]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (sessionStart) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [sessionStart]);

  const activeLoc = LOCATIONS.find((l) => l.id === activeLocId);
  const starCount = Object.keys(stars).length;
  const missionDone = mission.filter((w) => stars[w.id]).length;

  function openLocation(loc) {
    setActiveLocId(loc.id);
    setScreen("location");
  }

  function openWord(word, locColor) {
    setActiveWord({ ...word, locColor });
    speak(word.label);
  }

  function giveStar(word) {
    setStars((s) => ({ ...s, [word.id]: true }));
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 900);
    setTimeout(() => setActiveWord(null), 700);
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const sessionWarn = elapsed >= 15 * 60;

  return (
    <div
      style={{
        fontFamily: "'Baloo 2', 'Nunito', sans-serif",
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 10%, #FFF6E6 0%, #FDEFD9 40%, #F7E3BE 100%)",
        color: "#4A3B2A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 12px 40px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        @keyframes pop { 0% { transform: scale(0.6); opacity:0 } 60% { transform: scale(1.08); opacity:1 } 100% { transform: scale(1) } }
        @keyframes floatUp { 0% { transform: translateY(0); opacity:1 } 100% { transform: translateY(-60px); opacity:0 } }
        @keyframes wiggle { 0%,100% { transform: rotate(-2deg) } 50% { transform: rotate(2deg) } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>語言小城市</div>
          <div style={{ fontSize: 13, opacity: 0.65, fontWeight: 500 }}>陪孩子開口說說看</div>
        </div>
        <button
          onClick={() => setShowProgress(true)}
          style={{
            background: "#fff",
            border: "2px solid #F2A65A",
            borderRadius: 999,
            padding: "8px 14px",
            fontWeight: 700,
            color: "#B5661F",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ⭐ {starCount}
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: sessionWarn ? "#FBD6D8" : "#fff",
          border: `2px solid ${sessionWarn ? "#E8636B" : "#F0D9B5"}`,
          borderRadius: 16,
          padding: "10px 14px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {sessionStart ? (sessionWarn ? "今天玩得很棒，休息一下吧 🌤️" : "遊戲時間") : "今天的語言遊戲"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sessionStart && <span style={{ fontWeight: 800 }}>{fmtTime(elapsed)}</span>}
          <button
            onClick={() => (sessionStart ? (setSessionStart(null), setElapsed(0)) : setSessionStart(Date.now()))}
            style={{
              background: sessionStart ? "#EFEFEF" : "#F2A65A",
              color: sessionStart ? "#555" : "#fff",
              border: "none",
              borderRadius: 999,
              padding: "6px 14px",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {sessionStart ? "結束" : "開始 15 分鐘"}
          </button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 480, marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, opacity: 0.75 }}>
          今日任務 {missionDone}/{mission.length}
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {mission.map((w) => (
            <div
              key={w.id}
              onClick={() => openWord(w, w.locColor)}
              style={{
                flex: "0 0 auto",
                background: stars[w.id] ? "#FFF3D0" : "#fff",
                border: `2px solid ${stars[w.id] ? "#F2C94C" : "#EEE3CC"}`,
                borderRadius: 14,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                minWidth: 76,
              }}
            >
              <span style={{ fontSize: 20 }}>{w.emoji}</span>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{w.label}</div>
              {stars[w.id] && <span style={{ fontSize: 13 }}>⭐</span>}
            </div>
          ))}
        </div>
      </div>

      {screen === "map" && (
        <div style={{ width: "100%", maxWidth: 480, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => openLocation(loc)}
              style={{
                background: loc.soft,
                border: `3px solid ${loc.color}`,
                borderRadius: 20,
                padding: "18px 8px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                boxShadow: `0 4px 0 ${loc.color}`,
              }}
            >
              <div style={{ fontSize: 36 }}>{loc.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#4A3B2A" }}>{loc.name}</div>
              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600 }}>{loc.words.length} 個詞彙</div>
            </button>
          ))}
        </div>
      )}

      {screen === "location" && activeLoc && (
        <div style={{ width: "100%", maxWidth: 480 }}>
          <button
            onClick={() => setScreen("map")}
            style={{ background: "none", border: "none", fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#8A6B3F" }}
          >
            ← 回到小城市
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 30 }}>{activeLoc.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{activeLoc.name}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {activeLoc.words.map((w) => (
              <button
                key={w.id}
                onClick={() => openWord(w, activeLoc.color)}
                style={{
                  background: "#fff",
                  border: `3px solid ${stars[w.id] ? "#F2C94C" : activeLoc.soft}`,
                  borderRadius: 18,
                  padding: "18px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 40 }}>{w.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{w.label}</div>
                {stars[w.id] && <div style={{ fontSize: 13 }}>⭐</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeWord && (
        <div
          onClick={() => setActiveWord(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(74,59,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 28, padding: "36px 28px 28px", width: "100%", maxWidth: 340, textAlign: "center", border: `4px solid ${activeWord.locColor || "#F2A65A"}` }}
          >
            <div style={{ fontSize: 72, marginBottom: 6 }}>{activeWord.emoji}</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 18 }}>{activeWord.label}</div>
            <button
              onClick={() => speak(activeWord.label)}
              style={{ background: "#F1E9DA", border: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 700, fontSize: 15, marginBottom: 12 }}
            >
              🔊 再聽一次
            </button>
            <button
              onClick={() => giveStar(activeWord)}
              style={{ background: "#F2C94C", border: "none", borderRadius: 999, padding: "12px 26px", fontWeight: 800, fontSize: 16, color: "#5A4300", width: "100%" }}
            >
              他開口了！給一顆星 ⭐
            </button>
          </div>
        </div>
      )}

      {showProgress && (
        <div
          onClick={() => setShowProgress(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(74,59,42,0.45)", display: "flex", alignItems: "flex-end", zIndex: 30 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", borderRadius: "24px 24px 0 0", padding: "22px 20px 30px" }}>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>今天說過的詞</div>
            {starCount === 0 ? (
              <div style={{ fontSize: 14, opacity: 0.6 }}>還沒有紀錄，去城市裡玩玩看吧！</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_WORDS.filter((w) => stars[w.id]).map((w) => (
                  <div key={w.id} style={{ background: "#FFF3D0", border: "2px solid #F2C94C", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14 }}>
                    <span>{w.emoji}</span>{w.label}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowProgress(false)} style={{ marginTop: 20, background: "#F1E9DA", border: "none", borderRadius: 999, padding: "10px 20px", fontWeight: 700, width: "100%" }}>
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
