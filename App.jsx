import React, { useState, useEffect, useCallback, useRef } from "react";
import * as store from "./storage";
import "./styles.css";

/* ============================================================
   DADS WEEKEND 2026 — Tournament Scoring
   ============================================================ */

const C = {
  ink: "#14130E",
  panel: "#1F1D16",
  panel2: "#2A2720",
  line: "#3A362C",
  paper: "#F2EEE1",
  dim: "#8E8878",
  orange: "#E8890C",
  red: "#D93B2B",
  green: "#4B8F5E",
  gold: "#C9A227",
};

const TEAM_COLORS = ["#E8890C", "#D93B2B", "#4B8F5E", "#5B92C4"];

/* Bump this with every change so the Connection panel shows which build
   is actually live. */
const APP_VERSION = "1.7 \u2014 front, back and overall matches";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const DISPLAY =
  "'Helvetica Neue', 'Arial Narrow', system-ui, -apple-system, sans-serif";

/* ============================================================
   COURSE DATA
   ============================================================ */

const SUNDRE = {
  id: "sundre",
  name: "Sundre Golf Club",
  type: "18",
  par: [4, 3, 4, 5, 3, 4, 5, 4, 4, 4, 5, 4, 4, 3, 5, 4, 3, 4],
  si: [5, 9, 7, 11, 17, 3, 1, 13, 15, 8, 10, 6, 12, 16, 2, 4, 18, 14],
  tees: {
    Black: {
      rating: 71.9, slope: 128,
      yards: [412, 239, 353, 555, 144, 400, 562, 382, 387, 407, 523, 431, 376, 168, 556, 402, 151, 330],
    },
    "Black/Orange": {
      rating: 70.4, slope: 125,
      yards: [412, 189, 331, 555, 144, 380, 529, 348, 387, 407, 500, 398, 340, 168, 502, 402, 151, 330],
    },
    Orange: {
      rating: 69.2, slope: 124,
      yards: [390, 189, 331, 518, 140, 380, 529, 348, 340, 400, 500, 398, 340, 150, 502, 391, 113, 313],
    },
    Blue: {
      rating: 67.9, slope: 122,
      yards: [380, 175, 323, 505, 128, 368, 513, 338, 323, 390, 489, 390, 330, 141, 490, 316, 101, 298],
    },
    "Blue/White": {
      rating: 66.1, slope: 116,
      yards: [380, 144, 323, 432, 128, 336, 455, 338, 323, 349, 489, 328, 330, 141, 414, 316, 101, 298],
    },
    White: {
      rating: 63.3, slope: 105,
      yards: [334, 144, 237, 432, 100, 336, 455, 288, 277, 349, 380, 328, 264, 116, 414, 301, 96, 246],
    },
  },
};

// Innisfail — 27 holes, three nines. siFront used when played as holes 1-9,
// siBack when played as 10-18 (both printed on the card).
const INNISFAIL_NINES = {
  Aspen: {
    par: [4, 5, 4, 5, 3, 4, 4, 4, 3],
    siFront: [9, 17, 11, 3, 15, 1, 13, 7, 5],
    siBack: [10, 18, 12, 4, 16, 2, 14, 8, 6],
    yards: {
      Black: [388, 501, 366, 570, 183, 412, 336, 388, 190],
      Blue: [377, 481, 347, 548, 158, 360, 321, 360, 179],
      White: [359, 434, 307, 514, 128, 337, 310, 327, 168],
      Gold: [309, 409, 278, 452, 110, 289, 234, 287, 129],
    },
  },
  Spruce: {
    par: [4, 4, 4, 3, 5, 4, 3, 4, 5],
    siFront: [5, 11, 3, 13, 7, 9, 15, 1, 17],
    siBack: [6, 12, 4, 14, 8, 10, 16, 2, 18],
    yards: {
      Black: [376, 378, 404, 170, 525, 342, 161, 405, 510],
      Blue: [369, 348, 390, 162, 498, 335, 149, 384, 462],
      White: [362, 320, 345, 157, 444, 325, 138, 362, 447],
      Gold: [270, 279, 246, 140, 415, 312, 130, 306, 368],
    },
  },
  Hazelwood: {
    par: [4, 3, 5, 4, 5, 4, 4, 3, 4],
    siFront: [13, 17, 1, 5, 9, 7, 3, 15, 11],
    siBack: [14, 18, 2, 6, 10, 8, 4, 16, 12],
    yards: {
      Black: [381, 179, 553, 392, 545, 362, 371, 182, 373],
      Blue: [371, 166, 510, 370, 513, 352, 360, 170, 347],
      White: [344, 153, 463, 360, 472, 307, 345, 160, 327],
      Gold: [330, 142, 419, 316, 434, 220, 301, 112, 267],
    },
  },
};

// Printed rating/slope for the three signed combinations (men's).
const INNISFAIL_COMBO_TABLE = {
  "Aspen|Spruce": { label: "Aspen/Spruce", Black: [71.5, 135], Blue: [70.1, 130], White: [67.7, 124], Gold: [64.2, 112] },
  "Hazelwood|Aspen": { label: "Hazelwood/Aspen", Black: [72.3, 136], Blue: [70.5, 131], White: [68.4, 122], Gold: [65.1, 109] },
  "Spruce|Hazelwood": { label: "Spruce/Hazelwood", Black: [71.9, 137], Blue: [70.5, 132], White: [68.5, 126], Gold: [64.5, 117] },
};

/* Wolf Creek — 36 holes across four nines. The resort rotates them:
   West+East is the Old Course, South+North is the Links, and East+South
   and South+West are the other signed combinations. */
function buildInnisfail(frontName, backName, tee) {
  const c = buildNineCombo(INNISFAIL_NINES, INNISFAIL_COMBO_TABLE, frontName, backName, tee, "Innisfail");
  return { id: "innisfail", ...c };
}

const WOLFCREEK_NINES = {
  West: {
    par: [4, 4, 3, 4, 4, 5, 3, 4, 4],
    siFront: [11, 5, 15, 1, 7, 9, 17, 13, 3],
    siBack: [12, 6, 16, 2, 8, 10, 18, 14, 4],
    yards: {
      Black: [385, 423, 199, 385, 402, 534, 130, 345, 468],
      Silver: [349, 358, 177, 339, 369, 494, 105, 329, 408],
      Blue: [334, 328, 177, 298, 339, 455, 105, 314, 371],
      White: [317, 281, 144, 259, 258, 418, 94, 293, 336],
    },
  },
  East: {
    par: [3, 5, 4, 4, 4, 4, 4, 3, 4],
    siFront: [17, 3, 1, 11, 7, 9, 13, 15, 5],
    siBack: [18, 4, 2, 12, 8, 10, 14, 16, 6],
    yards: {
      Black: [197, 506, 427, 372, 430, 407, 338, 226, 450],
      Silver: [175, 484, 398, 326, 352, 377, 327, 174, 432],
      Blue: [152, 484, 398, 281, 352, 377, 320, 174, 432],
      White: [138, 450, 276, 237, 299, 326, 274, 152, 365],
    },
  },
  South: {
    par: [4, 3, 4, 4, 4, 3, 4, 4, 5],
    siFront: [13, 17, 1, 5, 11, 7, 9, 15, 3],
    siBack: [14, 18, 2, 6, 12, 8, 10, 16, 4],
    yards: {
      Black: [386, 168, 466, 454, 433, 225, 418, 341, 625],
      Silver: [339, 168, 409, 427, 388, 205, 395, 316, 561],
      Blue: [339, 136, 375, 394, 350, 182, 375, 282, 530],
      White: [301, 109, 337, 357, 290, 159, 357, 237, 480],
    },
  },
  North: {
    par: [4, 5, 4, 4, 3, 5, 4, 3, 4],
    siFront: [15, 7, 5, 13, 9, 3, 11, 17, 1],
    siBack: [16, 8, 6, 14, 10, 4, 12, 18, 2],
    yards: {
      Black: [382, 553, 462, 384, 269, 570, 410, 139, 470],
      Silver: [353, 527, 410, 347, 234, 548, 382, 115, 448],
      Blue: [308, 478, 376, 304, 194, 462, 325, 99, 426],
      White: [260, 416, 322, 287, 149, 412, 284, 85, 337],
    },
  },
};

// Printed men's rating/slope for the signed combinations.
const WOLFCREEK_COMBOS = {
  "West|East": { label: "Old Course", Black: [72.0, 133], Silver: [68.7, 126], Blue: [67.0, 124] },
  "South|North": { label: "Links Course", Black: [73.6, 126], Silver: [70.6, 123], Blue: [67.6, 118] },
  "East|South": { label: "East to South", Black: [72.6, 130], Silver: [69.5, 126], Blue: [68.2, 119] },
  "South|West": { label: "South to West", Black: [72.0, 137], Silver: [68.9, 131], Blue: [66.6, 121] },
};

function buildNineCombo(nines, combos, frontName, backName, tee, prefix) {
  const f = nines[frontName];
  const b = nines[backName];
  const key = `${frontName}|${backName}`;
  const entry = combos[key];
  const rs = entry && entry[tee];
  // Fall back to any rated combo on the same tee so net play still works.
  let est = null;
  if (!rs) {
    for (const v of Object.values(combos)) if (v[tee]) { est = v[tee]; break; }
  }
  const [rating, slope] = rs || est || [71.5, 128];
  const suffix = entry && entry.label ? entry.label : `${frontName}/${backName}`;
  return {
    name: `${prefix} — ${suffix}`,
    par: [...f.par, ...b.par],
    si: [...f.siFront, ...b.siBack],
    yards: [...f.yards[tee], ...b.yards[tee]],
    rating,
    slope,
    unrated: !rs,
  };
}

/* ============================================================
   HANDICAP + SCORING MATH
   ============================================================ */

const coursePar = (par) => par.reduce((a, b) => a + b, 0);

function courseHandicap(index, slope, rating, par) {
  return Math.round(index * (slope / 113) + (rating - par));
}

function strokesOnHole(ch, si) {
  if (!ch || ch <= 0) return 0;
  const base = Math.floor(ch / 18);
  const extra = ch % 18;
  return base + (si <= extra ? 1 : 0);
}

// "E", "-3", "+5" — with a real minus sign, not a hyphen.
function toPar(total, par) {
  const d = total - par;
  if (d === 0) return "E";
  return d < 0 ? `\u2212${Math.abs(d)}` : `+${d}`;
}
const parColor = (total, par) =>
  total === par ? C.paper : total < par ? C.green : C.dim;

const netOf = (gross, ch, si) =>
  gross == null ? null : gross - strokesOnHole(ch, si);

// Better-ball match play. Returns per-hole winner and running status.
function runMatch(aNets, bNets, aVoid = [], bVoid = [], from = 0, to = 18) {
  const holes = [];
  let diff = 0;
  let closed = null;
  for (let i = from; i < to; i++) {
    const a = aNets[i];
    const b = bNets[i];
    if (a == null || b == null) {
      holes.push(null);
      continue;
    }
    if (aVoid[i] || bVoid[i]) {
      // A pickup was taken — the hole is played but wins nothing.
      holes.push("v");
      continue;
    }
    const w = a < b ? "a" : b < a ? "b" : "h";
    holes.push(w);
    if (w === "a") diff += 1;
    if (w === "b") diff -= 1;
    const left = to - 1 - i;
    if (closed === null && Math.abs(diff) > left) {
      closed = { diff, upBy: Math.abs(diff), left, hole: i + 1 };
    }
  }
  const played = holes.filter((h) => h !== null).length;
  const span = to - from;
  return {
    holes, diff, played, closed, from, to, span,
    complete: closed !== null || played === span,
    decided: closed !== null || (played === span && diff !== 0),
  };
}

// High-low: two points per hole — one for best ball, one for worst ball.
function runHighLow(aNets, bNets, aNets2, bNets2, voids = [], from = 0, to = 18) {
  const holes = [];
  let diff = 0;
  for (let i = from; i < to; i++) {
    const A = [aNets[i], aNets2[i]].filter((v) => v != null);
    const B = [bNets[i], bNets2[i]].filter((v) => v != null);
    if (A.length < 2 || B.length < 2) {
      holes.push(null);
      continue;
    }
    if (voids[i]) {
      holes.push("v");
      continue;
    }
    const aLow = Math.min(...A), aHigh = Math.max(...A);
    const bLow = Math.min(...B), bHigh = Math.max(...B);
    let pts = 0;
    if (aLow < bLow) pts += 1; else if (bLow < aLow) pts -= 1;
    if (aHigh < bHigh) pts += 1; else if (bHigh < aHigh) pts -= 1;
    diff += pts;
    holes.push(pts > 0 ? "a" : pts < 0 ? "b" : "h");
  }
  const played = holes.filter((h) => h !== null).length;
  const span = to - from;
  return {
    holes, diff, played, closed: null, from, to, span,
    complete: played === span,
    decided: played === span && diff !== 0,
  };
}

/* ============================================================
   DEFAULT TOURNAMENT CONFIG
   ============================================================ */

const DEFAULT_CONFIG = {
  players: [
    { id: "kel", name: "Kel", index: 23, team: 0 },
    { id: "mike", name: "Mike", index: 18, team: 0 },
    { id: "kor", name: "Kor", index: 9, team: 1 },
    { id: "davey", name: "Davey", index: 19, team: 1 },
    { id: "skakes", name: "Skakes", index: 14, team: 2 },
    { id: "jc", name: "JC", index: 7, team: 2 },
    { id: "gb", name: "GB", index: 15, team: 3 },
    { id: "spen", name: "Spen", index: 17, team: 3 },
  ],
  teams: ["Team 1", "Team 2", "Team 3", "Team 4"],
  rounds: [
    { id: "sundre", label: "Sundre", day: "Friday", format: "match", course: "sundre", tee: "Blue" },
    { id: "wolfcreek", label: "Wolf Creek", day: "Saturday", format: "highlow", course: "wolfcreek", tee: "Blue", front: "West", back: "East" },
    { id: "innisfail", label: "Innisfail", day: "Sunday", format: "scramble", course: "innisfail", tee: "Blue", front: "Aspen", back: "Spruce" },
  ],
  matchups: {
    sundre: [[0, 1], [2, 3]],
    wolfcreek: [[0, 2], [1, 3]],
    innisfail: [[0, 3], [1, 2]],
  },
  // Each pairing plays three matches a day — front, back and overall — so
  // a pairing is still worth 3, and a course is still worth 9.
  points: { matchWin: 1, nineWin: 1, aggregateWin: 3, beersbeeWin: 1, bocce: [3, 2, 1, 0], beanbagPerShot: 1 },
  scrambleAllowance: [0.7, 0.3],
};

/* Mario Party rules: everybody gets a button, everybody gets called out. */
const EMOTES = [
  { id: "dog", e: "\u{1F436}", label: "Dog" },
  { id: "threeputt", e: "\u{1F40D}", label: "3 Putt" },
  { id: "mulligan", e: "\u{1F501}", label: "Mulligan" },
  { id: "kp", e: "\u{1F4CD}", label: "KP" },
  { id: "cry", e: "\u{1F602}", label: "Cryin'" },
  { id: "flush", e: "\u{1F525}", label: "Flushed" },
  { id: "water", e: "\u{1F4A6}", label: "Wet" },
  { id: "sandy", e: "\u{1F3D6}", label: "Sandy" },
  { id: "blowup", e: "\u{1F480}", label: "Blow-up" },
  { id: "beer", e: "\u{1F37A}", label: "Beer" },
  { id: "cold", e: "\u{1F9CA}", label: "Ice Cold" },
  { id: "greenie", e: "\u{1F3AF}", label: "Greenie" },
];
const EMOTE_BY_ID = Object.fromEntries(EMOTES.map((x) => [x.id, x]));

const NINE_SETS = { innisfail: INNISFAIL_NINES, wolfcreek: WOLFCREEK_NINES };

const BEERSBEE_PAIRS = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];

/* ============================================================
   STORAGE
   ============================================================ */

const K = {
  config: "dw26:config",
  scores: (pid) => `dw26:sc:${pid}`,
  teamScores: (tid) => `dw26:tsc:${tid}`,
  beersbee: "dw26:g:beersbee",
  bocce: "dw26:g:bocce",
  beanbag: "dw26:g:beanbag",
  emotes: (pid) => `dw26:em:${pid}`,
};

const sget = (key) => store.get(key);
const sset = (key, val) => store.set(key, val);

/* ------------------------------------------------------------
   A hole can be entered as a pickup: par + 2, flagged, and void
   for the direct match. Cells are either a plain number or
   { g, x: true }.
   ------------------------------------------------------------ */
const gv = (cell) => (cell && typeof cell === "object" ? cell.g : cell == null ? null : cell);
const gx = (cell) => Boolean(cell && typeof cell === "object" && cell.x);

/* ============================================================
   SMALL UI PIECES
   ============================================================ */

function Btn({ children, onClick, active, tone, style, disabled }) {
  const bg = active ? (tone || C.orange) : C.panel2;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        color: active ? C.ink : C.paper,
        border: `1px solid ${active ? bg : C.line}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontWeight: 700,
        fontSize: 14,
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children, color }) {
  return (
    <div
      style={{
        color: color || C.dim,
        fontSize: 11,
        letterSpacing: "0.18em",
        fontWeight: 800,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, ...style }}>
      {children}
    </div>
  );
}

/* The signature element: the match tape. 18 cells that fill in as holes
   are entered, colored by which team took the hole. */
function MatchTape({ result, colorA, colorB, current, muted }) {
  const from = result.from || 0;
  const span = result.span || 18;
  return (
    <div className="flex" style={{ gap: 2 }}>
      {Array.from({ length: span }, (_, k) => {
        const i = from + k;          // real hole number for the label
        const w = result.holes[k];   // results are indexed from the range start
        const bg =
          w === "a" ? colorA : w === "b" ? colorB : w === "h" ? C.line : "transparent";
        const isVoid = w === "v";
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 22,
              background: isVoid ? "transparent" : bg,
              border: `1px ${isVoid ? "dashed" : "solid"} ${current === i ? C.paper : muted ? "rgba(0,0,0,0.25)" : C.line}`,
              borderRadius: 2,
              fontSize: 8,
              color: isVoid ? C.dim : w ? C.ink : muted ? "rgba(0,0,0,0.55)" : C.dim,
              fontFamily: MONO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            {isVoid ? "*" : i + 1}
          </div>
        );
      })}
    </div>
  );
}

function statusText(res, nameA, nameB) {
  if (res.played === 0) return "All square";
  const d = res.diff;
  if (res.closed) {
    const c = res.closed;
    return `${c.diff > 0 ? nameA : nameB} won ${c.upBy}&${c.left}`;
  }
  if (d === 0) return "All square";
  return `${d > 0 ? nameA : nameB} ${Math.abs(d)} up`;
}

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [scores, setScores] = useState({});      // playerId -> { roundId: [18] }
  const [teamScores, setTeamScores] = useState({}); // teamIdx -> { roundId: [18] }
  const [games, setGames] = useState({ beersbee: {}, bocce: {}, beanbag: {} });
  const [emotes, setEmotes] = useState({});
  const [popup, setPopup] = useState(null);
  const seenEmote = useRef(0);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("play");
  const [activeRound, setActiveRound] = useState("sundre");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [net, setNet] = useState({ pending: 0, online: true });
  const pending = useRef({});

  /* ---------- load ---------- */
  const pull = useCallback(async () => {
    setSyncing(true);
    const keys = [
      K.config, K.beersbee, K.bocce, K.beanbag,
      ...DEFAULT_CONFIG.players.map((p) => K.scores(p.id)),
      ...[0, 1, 2, 3].map((t) => K.teamScores(t)),
      ...DEFAULT_CONFIG.players.map((p) => K.emotes(p.id)),
    ];
    const all = await store.getMany(keys);
    const c = all[K.config];
    if (c) {
      const points = { ...DEFAULT_CONFIG.points, ...(c.points || {}) };
      // A config saved before front/back matches existed put all 3 points on
      // the overall. Spread it across the three so a course still totals 9.
      if (c.points && c.points.nineWin === undefined) {
        points.matchWin = 1;
        points.nineWin = 1;
      }
      setCfg((prev) => ({ ...prev, ...c, points }));
    }
    const sc = {};
    for (const p of (c || DEFAULT_CONFIG).players) {
      const v = all[K.scores(p.id)];
      if (v) sc[p.id] = v;
    }
    setScores(sc);
    const ts = {};
    for (let t = 0; t < 4; t++) {
      const v = all[K.teamScores(t)];
      if (v) ts[t] = v;
    }
    setTeamScores(ts);
    setGames({
      beersbee: all[K.beersbee] || {},
      bocce: all[K.bocce] || {},
      beanbag: all[K.beanbag] || {},
    });
    const em = {};
    for (const p of (c || DEFAULT_CONFIG).players) {
      const v = all[K.emotes(p.id)];
      if (v) em[p.id] = v;
    }
    setEmotes(em);
    setSyncing(false);
    setLastSync(new Date());
  }, []);

  useEffect(() => {
    (async () => {
      await pull();
      const m = store.getMe();
      if (m) setMe(m);
      setLoading(false);
    })();
  }, [pull]);

  // Live push from the other phones.
  useEffect(() => store.subscribe(() => pull()), [pull]);

  // Backstop poll, plus the offline queue indicator.
  useEffect(() => {
    const t = setInterval(pull, 30000);
    const off = store.onSync((s) => setNet(s));
    return () => { clearInterval(t); off(); };
  }, [pull]);

  /* ---------- resolve a round into a playable course ---------- */
  const resolveCourse = useCallback(
    (round) => {
      if (round.course === "sundre") {
        const tee = SUNDRE.tees[round.tee] || SUNDRE.tees.Blue;
        return {
          name: `Sundre — ${round.tee}`,
          par: SUNDRE.par, si: SUNDRE.si, yards: tee.yards,
          rating: tee.rating, slope: tee.slope,
        };
      }
      if (round.course === "innisfail") {
        return buildInnisfail(round.front, round.back, round.tee);
      }
      return buildNineCombo(
        WOLFCREEK_NINES, WOLFCREEK_COMBOS, round.front, round.back, round.tee, "Wolf Creek"
      );
    },
    []
  );

  /* ---------- write helpers ---------- */
  const setHole = async (roundId, playerId, hole, value) => {
    setScores((prev) => {
      const mine = { ...(prev[playerId] || {}) };
      const arr = [...(mine[roundId] || Array(18).fill(null))];
      arr[hole] = value;
      mine[roundId] = arr;
      const next = { ...prev, [playerId]: mine };
      sset(K.scores(playerId), mine);
      return next;
    });
  };

  const setTeamHole = async (roundId, teamIdx, hole, value) => {
    setTeamScores((prev) => {
      const t = { ...(prev[teamIdx] || {}) };
      const arr = [...(t[roundId] || Array(18).fill(null))];
      arr[hole] = value;
      t[roundId] = arr;
      const next = { ...prev, [teamIdx]: t };
      sset(K.teamScores(teamIdx), t);
      return next;
    });
  };

  const sendEmote = async (emoteId, roundId, hole) => {
    if (!me) return;
    const mine = [
      { e: emoteId, at: Date.now(), r: roundId, h: hole },
      ...(emotes[me] || []),
    ].slice(0, 40);
    setEmotes((prev) => ({ ...prev, [me]: mine }));
    await sset(K.emotes(me), mine);
  };

  // Newest emote from anyone, for the popup.
  const feed = Object.entries(emotes)
    .flatMap(([pid, list]) => (list || []).map((x) => ({ ...x, pid })))
    .sort((a, b) => b.at - a.at);

  useEffect(() => {
    const top = feed[0];
    if (!top || top.at <= seenEmote.current) return;
    const first = seenEmote.current === 0;
    seenEmote.current = top.at;
    if (first) return; // don't replay history on load
    setPopup({ ...top, key: top.at });
    const t = setTimeout(() => setPopup(null), 3200);
    return () => clearTimeout(t);
  }, [feed.length, feed[0] && feed[0].at]);

  // Anyone can clear a reaction — it's eight guys, not a court record.
  const removeEmote = async (pid, at) => {
    const list = (emotes[pid] || []).filter((x) => x.at !== at);
    setEmotes((prev) => ({ ...prev, [pid]: list }));
    await sset(K.emotes(pid), list);
  };

  const resetData = async (what) => {
    const doScores = what === "scores" || what === "all";
    const doEmotes = what === "emotes" || what === "all";
    if (doScores) {
      for (const p of cfg.players) await sset(K.scores(p.id), {});
      for (let t = 0; t < 4; t++) await sset(K.teamScores(t), {});
      await sset(K.beersbee, {});
      await sset(K.bocce, {});
      await sset(K.beanbag, {});
      setScores({});
      setTeamScores({});
      setGames({ beersbee: {}, bocce: {}, beanbag: {} });
    }
    if (doEmotes) {
      for (const p of cfg.players) await sset(K.emotes(p.id), []);
      setEmotes({});
      seenEmote.current = Date.now();
      setPopup(null);
    }
  };

  const saveConfig = async (next) => {
    setCfg(next);
    await sset(K.config, next);
  };

  const saveGames = async (which, data) => {
    setGames((g) => ({ ...g, [which]: data }));
    await sset(K[which], data);
  };

  /* ---------- derived: handicaps per round ---------- */
  const chFor = useCallback(
    (player, course) => {
      const par = coursePar(course.par);
      return courseHandicap(player.index, course.slope, course.rating, par);
    },
    []
  );

  const netsFor = useCallback(
    (playerId, roundId, course) => {
      const p = cfg.players.find((x) => x.id === playerId);
      if (!p) return Array(18).fill(null);
      const ch = chFor(p, course);
      const gross = (scores[playerId] || {})[roundId] || Array(18).fill(null);
      return gross.map((cell, i) => netOf(gv(cell), ch, course.si[i]));
    },
    [cfg.players, scores, chFor]
  );

  // Which holes this player picked up on.
  const xsFor = useCallback(
    (playerId, roundId) => {
      const gross = (scores[playerId] || {})[roundId] || Array(18).fill(null);
      return gross.map(gx);
    },
    [scores]
  );

  const teamPlayers = (t) => cfg.players.filter((p) => p.team === t);

  const teamNetsBestBall = useCallback(
    (t, roundId, course) => {
      const [p1, p2] = teamPlayers(t);
      const a = netsFor(p1.id, roundId, course);
      const b = netsFor(p2.id, roundId, course);
      const xa = xsFor(p1.id, roundId);
      const xb = xsFor(p2.id, roundId);
      const nets = a.map((v, i) => {
        const vals = [v, b[i]].filter((x) => x != null);
        return vals.length ? Math.min(...vals) : null;
      });
      // Only void the hole if neither partner holed out.
      const voids = a.map((_, i) => xa[i] && xb[i]);
      return { nets, voids };
    },
    [netsFor, xsFor, cfg.players]
  );

  const teamScrambleNets = useCallback(
    (t, roundId, course) => {
      const [p1, p2] = teamPlayers(t);
      const c1 = chFor(p1, course), c2 = chFor(p2, course);
      const low = Math.min(c1, c2), high = Math.max(c1, c2);
      const [a, b] = cfg.scrambleAllowance;
      const teamCH = Math.round(a * low + b * high);
      const gross = (teamScores[t] || {})[roundId] || Array(18).fill(null);
      return {
        nets: gross.map((cell, i) => netOf(gv(cell), teamCH, course.si[i])),
        voids: gross.map(gx),
        teamCH,
        gross,
      };
    },
    [teamScores, chFor, cfg.players, cfg.scrambleAllowance]
  );

  /* ---------- points engine ---------- */
  const roundPoints = useCallback(
    (round) => {
      const course = resolveCourse(round);
      const pts = [0, 0, 0, 0];
      const detail = { matches: [], aggregate: [] };

      // Direct 2v2
      const pairs = cfg.matchups[round.id] || [];
      for (const [ta, tb] of pairs) {
        // Build the four score lines once, then read three ranges off them.
        let seg;
        if (round.format === "scramble") {
          const A = teamScrambleNets(ta, round.id, course);
          const B = teamScrambleNets(tb, round.id, course);
          seg = (f, t2) => runMatch(A.nets, B.nets, A.voids, B.voids, f, t2);
        } else if (round.format === "highlow") {
          const [a1, a2] = teamPlayers(ta), [b1, b2] = teamPlayers(tb);
          const vx = [a1, a2, b1, b2].map((p) => xsFor(p.id, round.id));
          const voids = Array.from({ length: 18 }, (_, i) => vx.some((v) => v[i]));
          const an1 = netsFor(a1.id, round.id, course), bn1 = netsFor(b1.id, round.id, course);
          const an2 = netsFor(a2.id, round.id, course), bn2 = netsFor(b2.id, round.id, course);
          seg = (f, t2) => runHighLow(an1, bn1, an2, bn2, voids, f, t2);
        } else {
          const A = teamNetsBestBall(ta, round.id, course);
          const B = teamNetsBestBall(tb, round.id, course);
          seg = (f, t2) => runMatch(A.nets, B.nets, A.voids, B.voids, f, t2);
        }

        const overall = seg(0, 18);
        const front = seg(0, 9);
        const back = seg(9, 18);
        detail.matches.push({ ta, tb, overall, front, back });

        const award = (res, worth) => {
          if (!res.complete) return;
          if (res.diff > 0) pts[ta] += worth;
          else if (res.diff < 0) pts[tb] += worth;
          else { pts[ta] += worth / 2; pts[tb] += worth / 2; }
        };
        award(overall, cfg.points.matchWin);
        award(front, cfg.points.nineWin);
        award(back, cfg.points.nineWin);
      }

      // Group: four-team net aggregate (or net scramble score at Innisfail)
      const totals = [0, 1, 2, 3].map((t) => {
        if (round.format === "scramble") {
          const { nets, voids } = teamScrambleNets(t, round.id, course);
          const done = nets.filter((v) => v != null).length;
          return { t, total: nets.reduce((s, v) => s + (v || 0), 0), done, star: voids.some(Boolean) };
        }
        // Sundre and Wolf Creek: the team is carried by whichever partner
        // posts the lower net round. Partners are not added together.
        const cards = teamPlayers(t).map((p) => {
          const nets = netsFor(p.id, round.id, course);
          return {
            p,
            done: nets.filter((v) => v != null).length,
            total: nets.reduce((s, v) => s + (v || 0), 0),
            star: xsFor(p.id, round.id).some(Boolean),
          };
        });
        // Only compare cards that are equally far along, or a half-finished
        // round would look like the lowest score on the board.
        const furthest = Math.max(...cards.map((c) => c.done));
        const level = cards.filter((c) => c.done === furthest);
        const best = level.reduce((lo, c) => (c.total < lo.total ? c : lo), level[0]);
        return { t, total: best.total, done: furthest, star: best.star, by: best.p.name };
      });
      detail.aggregate = [...totals].sort((x, y) => x.total - y.total);
      const allDone = totals.every((x) => x.done === 18);
      if (allDone) {
        const best = Math.min(...totals.map((x) => x.total));
        const winners = totals.filter((x) => x.total === best);
        for (const w of winners) pts[w.t] += cfg.points.aggregateWin / winners.length;
      }
      return { pts, detail, course, allDone };
    },
    [cfg, resolveCourse, netsFor, xsFor, teamNetsBestBall, teamScrambleNets]
  );

  const gamePoints = useCallback(() => {
    const pts = [0, 0, 0, 0];
    BEERSBEE_PAIRS.forEach((pair, i) => {
      const w = games.beersbee[i];
      if (w === 0 || w === 1) pts[pair[w]] += cfg.points.beersbeeWin;
    });
    const order = games.bocce.order;
    if (Array.isArray(order)) {
      order.forEach((t, i) => { if (t != null) pts[t] += cfg.points.bocce[i] || 0; });
    }
    [0, 1, 2, 3].forEach((t) => {
      pts[t] += (games.beanbag[t] || 0) * cfg.points.beanbagPerShot;
    });
    return pts;
  }, [games, cfg.points]);

  const standings = useCallback(() => {
    const total = [0, 0, 0, 0];
    const byRound = {};
    for (const r of cfg.rounds) {
      const { pts } = roundPoints(r);
      byRound[r.id] = pts;
      pts.forEach((p, i) => (total[i] += p));
    }
    const g = gamePoints();
    g.forEach((p, i) => (total[i] += p));
    return { total, byRound, games: g };
  }, [cfg.rounds, roundPoints, gamePoints]);

  if (loading) {
    return (
      <div style={{ background: C.ink, color: C.paper, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY }}>
        Loading tournament…
      </div>
    );
  }

  const round = cfg.rounds.find((r) => r.id === activeRound) || cfg.rounds[0];

  // Setup edits raw names; everywhere else shows a fallback so a half-typed
  // name never leaves a blank on the leaderboard.
  const view = {
    ...cfg,
    teams: cfg.teams.map((n, i) => (n && n.trim() ? n.trim() : `Team ${i + 1}`)),
  };

  return (
    <div className="app-body" style={{ background: C.ink, minHeight: "100vh", color: C.paper, fontFamily: DISPLAY }}>
      <Header cfg={view} me={me} syncing={syncing} lastSync={lastSync} onSync={pull} net={net} />

      <div style={{ padding: 14 }}>
        {tab === "play" && (
          <PlayTab
            cfg={view} round={round} setActiveRound={setActiveRound}
            course={resolveCourse(round)} me={me} setMe={(v) => { setMe(v); store.setMe(v); }}
            scores={scores} teamScores={teamScores}
            setHole={setHole} setTeamHole={setTeamHole}
            chFor={chFor} netsFor={netsFor} xsFor={xsFor}
            teamNetsBestBall={teamNetsBestBall} teamScrambleNets={teamScrambleNets}
            sendEmote={sendEmote} feed={feed} removeEmote={removeEmote}
          />
        )}
        {tab === "board" && (
          <BoardTab cfg={view} roundPoints={roundPoints} activeRound={activeRound} setActiveRound={setActiveRound} />
        )}
        {tab === "games" && <GamesTab cfg={view} games={games} saveGames={saveGames} />}
        {tab === "standings" && (
          <StandingsTab cfg={view} standings={standings()} feed={feed} removeEmote={removeEmote} />
        )}
        {tab === "setup" && (
          <SetupTab cfg={cfg} saveConfig={saveConfig} resolveCourse={resolveCourse}
            chFor={chFor} resetData={resetData} />
        )}
      </div>

      <EmotePopup popup={popup} cfg={view} />
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

/* A reaction from another phone lands here, Mario Party style. */
function EmotePopup({ popup, cfg }) {
  if (!popup) return null;
  const p = cfg.players.find((x) => x.id === popup.pid);
  const em = EMOTE_BY_ID[popup.e];
  if (!p || !em) return null;
  return (
    <div
      key={popup.key}
      className="emote-pop emote-anchor"
      style={{
        position: "fixed", left: 12, right: 12, zIndex: 50,
        background: C.panel, border: `2px solid ${TEAM_COLORS[p.team]}`,
        borderRadius: 14, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: 34, lineHeight: 1 }}>{em.e}</span>
      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: TEAM_COLORS[p.team] }}>{p.name}</div>
        <div style={{ fontSize: 13, color: C.paper, fontWeight: 700 }}>{em.label}</div>
      </div>
    </div>
  );
}

/* ============================================================
   HEADER + NAV
   ============================================================ */

function Header({ cfg, me, syncing, lastSync, onSync, net = {} }) {
  const p = cfg.players.find((x) => x.id === me);
  const waiting = net.pending || 0;
  const [confirm, setConfirm] = useState(0);

  useEffect(() => {
    if (confirm === 0) return;
    const t = setTimeout(() => setConfirm(0), 6000);
    return () => clearTimeout(t);
  }, [confirm]);

  const tapRefresh = () => {
    if (confirm < 2) return setConfirm(confirm + 1);
    setConfirm(0);
    onSync();
  };
  const label = waiting
    ? `${waiting} waiting`
    : confirm === 1
    ? "You sure?"
    : confirm === 2
    ? "Sure sure?"
    : syncing
    ? "Syncing"
    : "Refresh";
  const tone = confirm === 1 ? C.gold : confirm === 2 ? C.red : null;
  return (
    <div className="app-header" style={{ background: C.ink, borderBottom: `2px solid ${C.orange}`, paddingBottom: 12 }}>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
            DADS WEEKEND <span style={{ color: C.orange }}>2026</span>
          </div>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.16em", marginTop: 4, fontWeight: 700 }}>
            THREE COURSES · FOUR TEAMS · ONE CHAMPION
          </div>
        </div>
        <button
          onClick={tapRefresh}
          style={{
            background: waiting ? C.red : tone || "transparent",
            border: `1px solid ${waiting ? C.red : tone || C.line}`,
            borderRadius: 8, padding: "6px 10px",
            color: waiting || tone ? C.ink : syncing ? C.orange : C.dim,
            fontSize: 11, fontWeight: 800, minWidth: 76,
          }}
        >
          {label}
        </button>
      </div>
      {confirm > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: confirm === 2 ? C.red : C.gold, lineHeight: 1.5 }}>
          {confirm === 1
            ? "Refresh pulls everyone's latest scores over what's on this phone. Tap again."
            : "Last chance. Anything you typed but haven't sent could be overwritten."}
        </div>
      )}
      {p && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.dim }}>
          Entering as <span style={{ color: TEAM_COLORS[p.team], fontWeight: 800 }}>{p.name}</span>
          {lastSync && <span> · updated {lastSync.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
          {waiting > 0 && (
            <span style={{ color: C.red, fontWeight: 800 }}>
              {" "}· {waiting} score{waiting === 1 ? "" : "s"} saved on this phone, sending when signal returns
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* Inline SVGs so the nav costs no extra dependency. All stroke-based and
   inherit the tab's colour. */
function TabIcon({ name }) {
  const common = {
    width: 19, height: 19, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.9,
    strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": true, focusable: false,
  };
  switch (name) {
    case "play": // a scorecard grid, mid pencil stroke
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
      );
    case "board": // two pins facing off
      return (
        <svg {...common}>
          <path d="M6 21V4l6 2.5L6 9" />
          <path d="M18 21V4l-6 2.5L18 9" />
        </svg>
      );
    case "games": // bocce
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <circle cx="17" cy="16" r="3" />
          <circle cx="14" cy="7" r="2" />
        </svg>
      );
    case "standings": // the podium
      return (
        <svg {...common}>
          <path d="M4 21v-6h5v6M9.5 21v-11h5v11M15 21v-8h5v8" />
        </svg>
      );
    case "setup":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
        </svg>
      );
    default:
      return null;
  }
}

function TabBar({ tab, setTab }) {
  const tabs = [
    ["play", "Enter"],
    ["board", "Matches"],
    ["games", "Games"],
    ["standings", "Standings"],
    ["setup", "Setup"],
  ];
  return (
    <div className="tab-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.panel, borderTop: `1px solid ${C.line}`, display: "flex" }}>
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className="tab-btn"
          style={{
            flex: 1, padding: "8px 2px", background: "transparent", border: "none",
            color: tab === id ? C.orange : C.dim, fontWeight: 800,
            borderTop: `3px solid ${tab === id ? C.orange : "transparent"}`,
          }}
        >
          <span>{label}</span>
          <span className="tab-icon"><TabIcon name={id} /></span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   ENTRY
   ============================================================ */

function PlayTab({ cfg, round, setActiveRound, course, me, setMe, scores, teamScores, setHole, setTeamHole, chFor, netsFor, xsFor, teamNetsBestBall, teamScrambleNets, sendEmote, feed, removeEmote }) {
  const [hole, setHoleIdx] = useState(0);
  const [seat, setSeat] = useState(0);
  const [emoteOpen, setEmoteOpen] = useState(false);

  const myPlayer = cfg.players.find((p) => p.id === me);

  if (!me) {
    return (
      <div>
        <Eyebrow>Who's on this phone?</Eyebrow>
        <div className="grid grid-cols-2" style={{ gap: 8 }}>
          {cfg.players.map((p) => (
            <button
              key={p.id}
              onClick={() => setMe(p.id)}
              style={{ background: C.panel, border: `1px solid ${TEAM_COLORS[p.team]}`, borderRadius: 10, padding: 16, color: C.paper, textAlign: "left" }}
            >
              <div style={{ fontWeight: 900, fontSize: 17 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: TEAM_COLORS[p.team], fontWeight: 700 }}>
                {cfg.teams[p.team]} · idx {p.index}
              </div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 14, lineHeight: 1.5 }}>
          Everyone picks their own name. Scores sync between phones, so whoever gets to the
          hole first can enter it.
        </div>
      </div>
    );
  }

  // Find the match this player is in for this round.
  const pairs = cfg.matchups[round.id] || [];
  const myMatch = pairs.find((pr) => pr.includes(myPlayer.team)) || pairs[0];
  const [ta, tb] = myMatch;
  const scramble = round.format === "scramble";

  const seats = scramble
    ? [{ kind: "team", t: ta }, { kind: "team", t: tb }]
    : [ta, tb].flatMap((t) => cfg.players.filter((p) => p.team === t).map((p) => ({ kind: "player", p, t })));

  const advance = () => {
    if (seat < seats.length - 1) setSeat(seat + 1);
    else { setSeat(0); if (hole < 17) setHoleIdx(hole + 1); }
  };

  const current = seats[seat];
  const par = course.par[hole];
  const si = course.si[hole];

  const currentCell = current.kind === "team"
    ? ((teamScores[current.t] || {})[round.id] || [])[hole]
    : ((scores[current.p.id] || {})[round.id] || [])[hole];
  const currentGross = gv(currentCell);
  const currentX = gx(currentCell);

  const enter = (v) => {
    if (current.kind === "team") setTeamHole(round.id, current.t, hole, v);
    else setHole(round.id, current.p.id, hole, v);
    setTimeout(advance, 130);
  };
  const enterPickup = () => enter({ g: par + 2, x: true });

  const chOf = (p) => chFor(p, course);
  const dots = (n) => "•".repeat(Math.min(n, 4));

  return (
    <div>
      {/* round switcher */}
      <div className="flex" style={{ gap: 6, marginBottom: 14 }}>
        {cfg.rounds.map((r) => (
          <Btn key={r.id} active={r.id === round.id} onClick={() => { setActiveRound(r.id); setHoleIdx(0); setSeat(0); }} style={{ flex: 1, padding: "8px 4px", fontSize: 12 }}>
            {r.label}
          </Btn>
        ))}
      </div>

      {course.unrated && (
        <Panel style={{ borderColor: C.red, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.red, fontWeight: 800 }}>Course not rated yet</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
            Add rating and slope in Setup so net scores are right.
          </div>
        </Panel>
      )}

      {/* hole header */}
      <Panel style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
        <div className="flex items-stretch">
          <button onClick={() => setHoleIdx(Math.max(0, hole - 1))} style={{ background: C.panel2, border: "none", color: C.paper, width: 48, fontSize: 22 }}>‹</button>
          <div style={{ flex: 1, textAlign: "center", padding: "14px 0" }}>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.2em", fontWeight: 800 }}>HOLE</div>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, fontFamily: MONO }}>{hole + 1}</div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 4, fontFamily: MONO }}>
              PAR {par} · {course.yards[hole] || "—"} YD · SI {si}
            </div>
          </div>
          <button onClick={() => setHoleIdx(Math.min(17, hole + 1))} style={{ background: C.panel2, border: "none", color: C.paper, width: 48, fontSize: 22 }}>›</button>
        </div>
      </Panel>

      {/* seat selector */}
      <div className="flex" style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {seats.map((s, i) => {
          const label = s.kind === "team" ? cfg.teams[s.t] : s.p.name;
          const cell = s.kind === "team"
            ? ((teamScores[s.t] || {})[round.id] || [])[hole]
            : ((scores[s.p.id] || {})[round.id] || [])[hole];
          const g = gv(cell);
          const isX = gx(cell);
          const strokes = s.kind === "team"
            ? strokesOnHole(teamScrambleNets(s.t, round.id, course).teamCH, si)
            : strokesOnHole(chOf(s.p), si);
          return (
            <button
              key={i}
              onClick={() => setSeat(i)}
              style={{
                flex: "1 1 46%", background: i === seat ? C.panel2 : "transparent",
                border: `1px solid ${i === seat ? TEAM_COLORS[s.t] : C.line}`,
                borderRadius: 8, padding: "8px 10px", color: C.paper, textAlign: "left",
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontWeight: 800, fontSize: 13 }}>{label}</span>
                <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 900, color: g == null ? C.line : isX ? C.dim : C.paper }}>
                  {g == null ? "–" : isX ? `${g}*` : g}
                </span>
              </div>
              <div style={{ fontSize: 10, color: TEAM_COLORS[s.t], fontWeight: 700 }}>
                {strokes > 0 ? dots(strokes) : "no stroke"}
              </div>
            </button>
          );
        })}
      </div>

      {/* the pad */}
      <Eyebrow color={TEAM_COLORS[current.t]}>
        {current.kind === "team" ? `${cfg.teams[current.t]} scramble score` : `${current.p.name}'s score`}
      </Eyebrow>
      <div className="grid grid-cols-4" style={{ gap: 8 }}>
        {[par - 2, par - 1, par, par + 1, par + 2, par + 3, par + 4, null].map((v, i) => {
          if (v === null) {
            return (
              <button key="clear" onClick={() => enter(null)} style={{ background: "transparent", border: `1px dashed ${C.line}`, borderRadius: 10, padding: "14px 0", color: C.dim, fontSize: 12, fontWeight: 800 }}>
                Clear
              </button>
            );
          }
          if (v < 1) return <div key={i} />;
          const names = { [-2]: "Eagle", [-1]: "Birdie", 0: "Par", 1: "Bogey", 2: "Double", 3: "Triple", 4: "+4" };
          const rel = v - par;
          const on = currentGross === v && !currentX;
          return (
            <button
              key={i}
              onClick={() => enter(v)}
              style={{
                background: on ? TEAM_COLORS[current.t] : C.panel,
                border: `1px solid ${on ? TEAM_COLORS[current.t] : C.line}`,
                borderRadius: 10, padding: "12px 0", color: on ? C.ink : C.paper,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 700, marginTop: 3 }}>{names[rel] || ""}</div>
            </button>
          );
        })}
      </div>

      <div className="flex" style={{ gap: 8, marginTop: 10 }}>
        <Btn onClick={enterPickup} active={currentX} tone={C.dim} style={{ flex: 1 }}>
          Picked up · {par + 2}*
        </Btn>
        <Btn onClick={advance} style={{ flex: 1 }}>Skip →</Btn>
      </div>
      <div style={{ fontSize: 10, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>
        A pickup records par + 2 for the card. The hole is marked * and wins nothing in
        the direct match.
      </div>

      <EmoteBar
        cfg={cfg} feed={feed} open={emoteOpen} setOpen={setEmoteOpen} onRemove={removeEmote}
        onSend={(id) => { sendEmote(id, round.id, hole); setEmoteOpen(false); }}
      />

      <LiveMatch cfg={cfg} round={round} course={course} ta={ta} tb={tb} hole={hole}
        netsFor={netsFor} xsFor={xsFor} teamNetsBestBall={teamNetsBestBall} teamScrambleNets={teamScrambleNets} />
    </div>
  );
}

/* Swipe a reaction left to bin it. Horizontal intent only — a mostly
   vertical drag is the page scrolling and must be left alone. */
function SwipeRow({ children, onDelete, last }) {
  const [dx, setDx] = useState(0);
  const [going, setGoing] = useState(false);
  const start = useRef(null);
  const axis = useRef(null);
  const THRESHOLD = 88;

  const onStart = (e) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    axis.current = null;
  };

  const onMove = (e) => {
    if (!start.current) return;
    const t = e.touches[0];
    const mx = t.clientX - start.current.x;
    const my = t.clientY - start.current.y;
    if (!axis.current) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
      axis.current = Math.abs(mx) > Math.abs(my) ? "x" : "y";
    }
    if (axis.current !== "x") return;
    setDx(Math.min(0, mx));
  };

  const onEnd = () => {
    if (axis.current === "x" && dx <= -THRESHOLD) {
      setGoing(true);
      setDx(-window.innerWidth);
      setTimeout(onDelete, 180);
    } else {
      setDx(0);
    }
    start.current = null;
    axis.current = null;
  };

  const armed = dx <= -THRESHOLD;

  return (
    <div style={{ position: "relative", overflow: "hidden", borderBottom: last ? "none" : `1px solid ${C.line}` }}>
      <div
        style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "flex-end", paddingRight: 16,
          background: armed ? C.red : C.panel2,
          color: armed ? C.ink : C.dim, fontSize: 11, fontWeight: 800,
        }}
      >
        {armed ? "Release to delete" : "Delete"}
      </div>
      <div
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        style={{
          position: "relative",
          transform: `translateX(${dx}px)`,
          transition: dx === 0 || going ? "transform 180ms ease" : "none",
          background: C.panel,
          padding: "5px 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EmoteBar({ cfg, feed, open, setOpen, onSend, onRemove }) {
  const recent = (feed || []).slice(0, 6);
  return (
    <div style={{ marginTop: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <Eyebrow>Reactions</Eyebrow>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: open ? C.orange : C.panel2, color: open ? C.ink : C.paper,
            border: `1px solid ${open ? C.orange : C.line}`, borderRadius: 20,
            padding: "6px 14px", fontSize: 12, fontWeight: 800,
          }}
        >
          {open ? "Close" : "React"}
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-4" style={{ gap: 8, marginBottom: 12 }}>
          {EMOTES.map((em) => (
            <button
              key={em.id}
              onClick={() => onSend(em.id)}
              style={{
                background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12,
                padding: "12px 2px", color: C.paper,
              }}
            >
              <div style={{ fontSize: 26, lineHeight: 1.1 }}>{em.e}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.dim, marginTop: 3 }}>{em.label}</div>
            </button>
          ))}
        </div>
      )}

      {recent.length > 0 ? (
        <Panel style={{ padding: "4px 10px", overflow: "hidden" }}>
          {recent.map((f, i) => {
            const p = cfg.players.find((x) => x.id === f.pid);
            const em = EMOTE_BY_ID[f.e];
            if (!p || !em) return null;
            return (
              <SwipeRow
                key={`${f.pid}-${f.at}`}
                last={i === recent.length - 1}
                onDelete={() => onRemove(f.pid, f.at)}
              >
                <div className="flex items-center" style={{ gap: 10 }}>
                  <span style={{ fontSize: 19 }}>{em.e}</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: TEAM_COLORS[p.team] }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: C.paper }}>{em.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: C.dim, fontFamily: MONO }}>
                    {f.h != null ? `H${f.h + 1}` : ""}
                  </span>
                </div>
              </SwipeRow>
            );
          })}
          <div style={{ fontSize: 10, color: C.dim, marginTop: 8 }}>
            Swipe a reaction left to delete it.
          </div>
        </Panel>
      ) : (
        <div style={{ fontSize: 11, color: C.dim }}>
          Nobody's said anything yet. Somebody three-putt so we can get started.
        </div>
      )}
    </div>
  );
}

function LiveMatch({ cfg, round, course, ta, tb, hole, netsFor, xsFor, teamNetsBestBall, teamScrambleNets }) {
  const teamP = (t) => cfg.players.filter((p) => p.team === t);
  let seg;
  if (round.format === "scramble") {
    const A = teamScrambleNets(ta, round.id, course), B = teamScrambleNets(tb, round.id, course);
    seg = (f, t2) => runMatch(A.nets, B.nets, A.voids, B.voids, f, t2);
  } else if (round.format === "highlow") {
    const [a1, a2] = teamP(ta), [b1, b2] = teamP(tb);
    const vx = [a1, a2, b1, b2].map((p) => xsFor(p.id, round.id));
    const voids = Array.from({ length: 18 }, (_, i) => vx.some((v) => v[i]));
    const an1 = netsFor(a1.id, round.id, course), bn1 = netsFor(b1.id, round.id, course);
    const an2 = netsFor(a2.id, round.id, course), bn2 = netsFor(b2.id, round.id, course);
    seg = (f, t2) => runHighLow(an1, bn1, an2, bn2, voids, f, t2);
  } else {
    const A = teamNetsBestBall(ta, round.id, course), B = teamNetsBestBall(tb, round.id, course);
    seg = (f, t2) => runMatch(A.nets, B.nets, A.voids, B.voids, f, t2);
  }
  const overall = seg(0, 18);
  const m = { ta, tb };

  return (
    <Panel style={{ marginTop: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <Eyebrow color={C.dim}>Your match</Eyebrow>
        <div style={{ fontSize: 14, fontWeight: 900, color: overall.diff > 0 ? TEAM_COLORS[ta] : overall.diff < 0 ? TEAM_COLORS[tb] : C.paper }}>
          {statusText(overall, cfg.teams[ta], cfg.teams[tb])}
        </div>
      </div>
      <MatchTape result={overall} colorA={TEAM_COLORS[ta]} colorB={TEAM_COLORS[tb]} current={hole} />
      <div className="flex" style={{ gap: 8, marginTop: 10 }}>
        <NineBox label="FRONT" res={seg(0, 9)} m={m} cfg={cfg} worth={cfg.points.nineWin} />
        <NineBox label="BACK" res={seg(9, 18)} m={m} cfg={cfg} worth={cfg.points.nineWin} />
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: 11, color: C.dim }}>
        <span style={{ color: TEAM_COLORS[ta], fontWeight: 800 }}>{cfg.teams[ta]}</span>
        <span>{overall.played} of 18 in</span>
        <span style={{ color: TEAM_COLORS[tb], fontWeight: 800 }}>{cfg.teams[tb]}</span>
      </div>
    </Panel>
  );
}

/* Front and back share the row. Once a nine can't be caught, the whole
   box goes the winner's colour. */
function NineBox({ label, res, m, cfg, worth }) {
  const won = res.decided ? (res.diff > 0 ? m.ta : m.tb) : null;
  const halved = res.complete && res.diff === 0;
  const bg = won != null ? TEAM_COLORS[won] : halved ? C.panel2 : "transparent";
  const fg = won != null ? C.ink : C.paper;

  return (
    <div style={{
      flex: 1, minWidth: 0, background: bg,
      border: `1px solid ${won != null ? bg : C.line}`,
      borderRadius: 10, padding: 8,
    }}>
      <div className="flex items-center justify-between"
        style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 4, color: won != null ? "rgba(0,0,0,0.6)" : C.dim }}>
        <span>{label}</span>
        <span>{worth} PT</span>
      </div>
      <MatchTape
        result={res} muted={won != null}
        colorA={won != null ? "rgba(0,0,0,0.35)" : TEAM_COLORS[m.ta]}
        colorB={won != null ? "rgba(0,0,0,0.35)" : TEAM_COLORS[m.tb]}
        current={-1}
      />
      <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6, color: fg, lineHeight: 1.3 }}>
        {res.played === 0
          ? "Not started"
          : won != null
          ? `${cfg.teams[won]} ${res.closed ? `${res.closed.upBy}&${res.closed.left}` : `by ${Math.abs(res.diff)}`}`
          : halved
          ? "Halved"
          : res.diff === 0
          ? "All square"
          : `${cfg.teams[res.diff > 0 ? m.ta : m.tb]} ${Math.abs(res.diff)} up`}
      </div>
    </div>
  );
}

function GamesTab({ cfg, games, saveGames }) {
  const setBeersbee = (i, side) => {
    const next = { ...games.beersbee };
    if (next[i] === side) delete next[i]; else next[i] = side;
    saveGames("beersbee", next);
  };
  const setBocce = (place, team) => {
    const order = [...(games.bocce.order || [null, null, null, null])];
    const existing = order.indexOf(team);
    if (existing >= 0) order[existing] = null;
    order[place] = team;
    saveGames("bocce", { order });
  };
  const bumpBeanbag = (t, d) => {
    const next = { ...games.beanbag };
    next[t] = Math.max(0, (next[t] || 0) + d);
    saveGames("beanbag", next);
  };

  return (
    <div>
      <Eyebrow color={C.red}>Beersbee — six 2v2 matches, 1 pt each</Eyebrow>
      <Panel style={{ marginBottom: 16 }}>
        {BEERSBEE_PAIRS.map((pair, i) => (
          <div key={i} className="flex items-center" style={{ gap: 6, padding: "6px 0", borderBottom: i < 5 ? `1px solid ${C.line}` : "none" }}>
            {[0, 1].map((side) => {
              const t = pair[side];
              const won = games.beersbee[i] === side;
              return (
                <button
                  key={side}
                  onClick={() => setBeersbee(i, side)}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 8,
                    background: won ? TEAM_COLORS[t] : C.panel2,
                    border: `1px solid ${won ? TEAM_COLORS[t] : C.line}`,
                    color: won ? C.ink : C.paper, fontWeight: 800, fontSize: 13,
                  }}
                >
                  {cfg.teams[t]}
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ fontSize: 10, color: C.dim, marginTop: 8 }}>Tap the winner. Tap again to undo.</div>
      </Panel>

      <Eyebrow color={C.red}>Bocce — one game to 11 · 3 / 2 / 1</Eyebrow>
      <Panel style={{ marginBottom: 16 }}>
        {[0, 1, 2].map((place) => (
          <div key={place} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 5 }}>
              {["First — 3 pts", "Second — 2 pts", "Third — 1 pt"][place]}
            </div>
            <div className="flex" style={{ gap: 6 }}>
              {[0, 1, 2, 3].map((t) => {
                const on = (games.bocce.order || [])[place] === t;
                return (
                  <button key={t} onClick={() => setBocce(place, t)}
                    style={{ flex: 1, padding: "9px 2px", borderRadius: 8, background: on ? TEAM_COLORS[t] : C.panel2, border: `1px solid ${on ? TEAM_COLORS[t] : C.line}`, color: on ? C.ink : C.paper, fontWeight: 800, fontSize: 12 }}>
                    {t + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Panel>

      <Eyebrow color={C.red}>Bean bag deck — 1 pt per made shot</Eyebrow>
      <Panel>
        {[0, 1, 2, 3].map((t) => (
          <div key={t} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: t < 3 ? `1px solid ${C.line}` : "none" }}>
            <span style={{ color: TEAM_COLORS[t], fontWeight: 800, fontSize: 14 }}>{cfg.teams[t]}</span>
            <div className="flex items-center" style={{ gap: 10 }}>
              <button onClick={() => bumpBeanbag(t, -1)} style={{ width: 40, height: 40, borderRadius: 8, background: C.panel2, border: `1px solid ${C.line}`, color: C.paper, fontSize: 20 }}>−</button>
              <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 900, minWidth: 28, textAlign: "center" }}>{games.beanbag[t] || 0}</span>
              <button onClick={() => bumpBeanbag(t, 1)} style={{ width: 40, height: 40, borderRadius: 8, background: TEAM_COLORS[t], border: "none", color: C.ink, fontSize: 20, fontWeight: 900 }}>+</button>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ============================================================
   STANDINGS
   ============================================================ */

function StandingsTab({ cfg, standings, feed = [], removeEmote }) {
  const [showLog, setShowLog] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const rows = [0, 1, 2, 3]
    .map((t) => ({ t, total: standings.total[t] }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div>
      <Eyebrow color={C.orange}>The title — 40 points on the table</Eyebrow>
      <Panel style={{ marginBottom: 16 }}>
        {rows.map((r, i) => (
          <div key={r.t} style={{ padding: "10px 0", borderBottom: i < 3 ? `1px solid ${C.line}` : "none" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: i === 0 ? C.gold : C.dim, fontWeight: 900 }}>{i + 1}</span>
                <span style={{ color: TEAM_COLORS[r.t], fontWeight: 900, fontSize: 16 }}>{cfg.teams[r.t]}</span>
                <span style={{ fontSize: 10, color: C.dim }}>
                  {cfg.players.filter((p) => p.team === r.t).map((p) => p.name).join(" · ")}
                </span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 900 }}>{r.total}</span>
            </div>
            <div style={{ height: 6, background: C.panel2, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(r.total / max) * 100}%`, height: "100%", background: TEAM_COLORS[r.t] }} />
            </div>
          </div>
        ))}
      </Panel>

      <Eyebrow>Hall of shame</Eyebrow>
      <Panel style={{ marginBottom: 16 }}>
        {(() => {
          const tally = {};
          for (const f of feed) tally[f.e] = (tally[f.e] || 0) + 1;
          const rows = EMOTES.filter((e) => tally[e.id]).sort((a, b) => tally[b.id] - tally[a.id]);
          if (!rows.length)
            return <div style={{ fontSize: 12, color: C.dim }}>No reactions yet this weekend.</div>;
          return (
            <div className="flex" style={{ flexWrap: "wrap", gap: 8 }}>
              {rows.map((e) => (
                <div key={e.id} className="flex items-center"
                  style={{ gap: 6, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 20, padding: "6px 12px" }}>
                  <span style={{ fontSize: 17 }}>{e.e}</span>
                  <span style={{ fontSize: 11, color: C.dim, fontWeight: 700 }}>{e.label}</span>
                  <span style={{ fontFamily: MONO, fontWeight: 900, fontSize: 14 }}>{tally[e.id]}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {feed.length > 0 && (
          <button
            onClick={() => setShowLog(!showLog)}
            style={{
              marginTop: 12, width: "100%", background: C.panel2,
              border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px",
              color: C.paper, fontSize: 12, fontWeight: 800,
            }}
          >
            {showLog ? "Hide the log" : `Show all ${feed.length} reactions`}
          </button>
        )}
      </Panel>

      {showLog && (
        <>
          <Eyebrow>Every reaction, who sent it, and when</Eyebrow>
          <Panel style={{ marginBottom: 16, padding: 10 }}>
            {feed.map((f) => {
              const p = cfg.players.find((x) => x.id === f.pid);
              const em = EMOTE_BY_ID[f.e];
              if (!p || !em) return null;
              const rid = `${f.pid}-${f.at}`;
              const round = cfg.rounds.find((r) => r.id === f.r);
              const when = new Date(f.at);
              return (
                <div key={rid} className="flex items-center"
                  style={{ gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 20 }}>{em.e}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TEAM_COLORS[p.team] }}>
                      {p.name}
                      <span style={{ color: C.paper, fontWeight: 700 }}> · {em.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, fontFamily: MONO, marginTop: 2 }}>
                      {cfg.teams[p.team]}
                      {round ? ` · ${round.label}` : ""}
                      {f.h != null ? ` · hole ${f.h + 1}` : ""}
                      {" · "}
                      {when.toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                      {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirmId === rid) { removeEmote(f.pid, f.at); setConfirmId(null); }
                      else setConfirmId(rid);
                    }}
                    onBlur={() => setConfirmId(null)}
                    style={{
                      background: confirmId === rid ? C.red : "transparent",
                      border: `1px solid ${confirmId === rid ? C.red : C.line}`,
                      borderRadius: 6, padding: "6px 10px",
                      color: confirmId === rid ? C.ink : C.dim,
                      fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
                    }}
                  >
                    {confirmId === rid ? "Delete" : "\u00D7"}
                  </button>
                </div>
              );
            })}
          </Panel>
        </>
      )}

      <Eyebrow>Where the points came from</Eyebrow>
      <Panel>
        <div className="flex" style={{ fontSize: 10, color: C.dim, fontWeight: 800, paddingBottom: 8, borderBottom: `1px solid ${C.line}` }}>
          <span style={{ flex: 2 }}>TEAM</span>
          {cfg.rounds.map((r) => <span key={r.id} style={{ flex: 1, textAlign: "center" }}>{r.label.slice(0, 4).toUpperCase()}</span>)}
          <span style={{ flex: 1, textAlign: "center" }}>GAMES</span>
        </div>
        {[0, 1, 2, 3].map((t) => (
          <div key={t} className="flex items-center" style={{ padding: "9px 0", fontFamily: MONO, fontSize: 14, fontWeight: 800 }}>
            <span style={{ flex: 2, color: TEAM_COLORS[t], fontFamily: DISPLAY, fontSize: 13 }}>{cfg.teams[t]}</span>
            {cfg.rounds.map((r) => (
              <span key={r.id} style={{ flex: 1, textAlign: "center", color: standings.byRound[r.id][t] ? C.paper : C.line }}>
                {standings.byRound[r.id][t]}
              </span>
            ))}
            <span style={{ flex: 1, textAlign: "center", color: standings.games[t] ? C.paper : C.line }}>{standings.games[t]}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ============================================================
   SETUP
   ============================================================ */

/* Defined at module scope on purpose. Declaring this inside SetupTab gave
   it a new identity every render, so React remounted the whole panel on
   each keystroke and the keyboard closed. */
function Section({ id, title, open, setOpen, children }) {
  const isOpen = open === id;
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(isOpen ? "" : id)}
        style={{ width: "100%", textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, color: C.paper, fontWeight: 800, fontSize: 14 }}
      >
        {title} <span style={{ float: "right", color: C.dim }}>{isOpen ? "\u2212" : "+"}</span>
      </button>
      {isOpen && <div style={{ padding: "12px 2px" }}>{children}</div>}
    </div>
  );
}

function ConnectionPanel() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setState(await store.testConnection());
    setBusy(false);
  };

  useEffect(() => { run(); }, []);

  return (
    <Panel>
      <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
        <span style={{
          width: 12, height: 12, borderRadius: 6, flexShrink: 0,
          background: !state ? C.dim : state.ok ? C.green : C.red,
        }} />
        <span style={{ fontWeight: 900, fontSize: 14 }}>
          {!state ? "Checking\u2026" : state.ok ? "Syncing" : "Not syncing"}
        </span>
      </div>
      {state && (
        <div style={{ fontSize: 12, color: state.ok ? C.dim : C.red, lineHeight: 1.6, marginBottom: 12 }}>
          {state.reason}
        </div>
      )}
      {state && !state.ok && (
        <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6, marginBottom: 12 }}>
          Scores are still safe on each phone. Fix the keys in Netlify under
          Site configuration \u2192 Environment variables, then Deploys \u2192
          Trigger deploy \u2192 Clear cache and deploy site. Everything queued
          will send itself once this turns green.
        </div>
      )}
      <Btn onClick={run} disabled={busy} style={{ width: "100%" }}>
        {busy ? "Testing\u2026" : "Test again"}
      </Btn>
      <div style={{ fontSize: 10, color: C.dim, fontFamily: MONO, marginTop: 10, textAlign: "center" }}>
        Build {APP_VERSION}
      </div>
    </Panel>
  );
}

/* Nothing destructive on one tap. Same two-step as Refresh. */
function ResetButton({ label, onConfirm, tone }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step === 0) return;
    const t = setTimeout(() => setStep(0), 6000);
    return () => clearTimeout(t);
  }, [step]);

  const tap = async () => {
    if (step < 2) return setStep(step + 1);
    setStep(0);
    await onConfirm();
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  const bg = done ? C.green : step === 1 ? C.gold : step === 2 ? C.red : C.panel2;
  const text = done
    ? "Cleared"
    : step === 1
    ? "You sure?"
    : step === 2
    ? "Sure sure? This can't be undone"
    : label;

  return (
    <button
      onClick={tap}
      style={{
        width: "100%", marginBottom: 8, padding: "13px 12px", borderRadius: 10,
        background: bg,
        border: `1px solid ${step || done ? bg : tone || C.line}`,
        color: step || done ? C.ink : tone || C.paper,
        fontWeight: 800, fontSize: 13,
      }}
    >
      {text}
    </button>
  );
}

/* Text fields keep their own draft so typing never waits on the network.
   The change is pushed once you pause or move on. */
function DraftInput({ value, onCommit, style, ...rest }) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const change = (v) => {
    setDraft(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(v), 600);
  };

  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => change(e.target.value)}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        clearTimeout(timer.current);
        onCommit(draft);
      }}
      style={style}
    />
  );
}

function SetupTab({ cfg, saveConfig, resolveCourse, chFor, resetData }) {
  const [open, setOpen] = useState("courses");
  const upd = (patch) => saveConfig({ ...cfg, ...patch });

  const setRound = (id, patch) =>
    upd({ rounds: cfg.rounds.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  return (
    <div>
      <Section id="courses" title="Courses & tees" open={open} setOpen={setOpen}>
        {cfg.rounds.map((r) => {
          const course = resolveCourse(r);
          return (
            <Panel key={r.id} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 10 }}>
                {r.day} · {course.name} · par {coursePar(course.par)} · {course.rating}/{course.slope}
              </div>

              {NINE_SETS[r.course] && (
                <>
                  {["front", "back"].map((slot) => (
                    <div key={slot}>
                      <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 5 }}>
                        {slot === "front" ? "Front nine" : "Back nine"}
                      </div>
                      <div className="flex" style={{ gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        {Object.keys(NINE_SETS[r.course]).map((n) => (
                          <Btn key={n} active={r[slot] === n}
                            onClick={() => setRound(r.id, { [slot]: n })}
                            disabled={slot === "back" && n === r.front}
                            style={{ flex: "1 1 22%", fontSize: 12, padding: "8px 2px" }}>
                            {n}
                          </Btn>
                        ))}
                      </div>
                    </div>
                  ))}
                  {course.unrated && (
                    <div style={{ fontSize: 11, color: C.red, marginBottom: 10, lineHeight: 1.5 }}>
                      That pairing isn't on the printed rating table — net scores use an
                      estimate. Check the card in the pro shop and adjust if it differs.
                    </div>
                  )}
                </>
              )}

            </Panel>
          );
        })}
      </Section>

      <Section id="teams" title="Team names" open={open} setOpen={setOpen}>
        {[0, 1, 2, 3].map((t) => (
          <Panel key={t} style={{ marginBottom: 8 }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <div style={{ width: 6, alignSelf: "stretch", background: TEAM_COLORS[t], borderRadius: 3, minHeight: 40 }} />
              <div style={{ flex: 1 }}>
                <DraftInput
                  value={cfg.teams[t]}
                  maxLength={16}
                  placeholder={`Team ${t + 1}`}
                  autoCapitalize="words"
                  autoCorrect="off"
                  onCommit={(v) =>
                    upd({ teams: cfg.teams.map((n, i) => (i === t ? v : n)) })
                  }
                  style={{
                    width: "100%", background: C.panel2, border: `1px solid ${C.line}`,
                    borderRadius: 8, color: TEAM_COLORS[t], padding: "10px 12px",
                    fontWeight: 900, fontSize: 15, fontFamily: DISPLAY,
                  }}
                />
                <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>
                  {cfg.players.filter((p) => p.team === t).map((p) => p.name).join(" · ") || "No players"}
                </div>
              </div>
            </div>
          </Panel>
        ))}
        <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
          Names sync to every phone. Keep them short — they show up on the match tape and
          the standings table. Blank falls back to Team 1–4.
        </div>
      </Section>

      <Section id="handicaps" title="Players & course handicaps" open={open} setOpen={setOpen}>
        {cfg.players.map((p) => (
          <Panel key={p.id} style={{ marginBottom: 8 }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 900, color: TEAM_COLORS[p.team] }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.dim }}>{cfg.teams[p.team]}</div>
              </div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: 10, color: C.dim }}>INDEX</span>
                <DraftInput
                  type="number" inputMode="numeric" value={p.index}
                  onCommit={(v) => upd({ players: cfg.players.map((x) => x.id === p.id ? { ...x, index: Number(v) || 0 } : x) })}
                  style={{ width: 56, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 6, color: C.paper, padding: "6px 8px", fontFamily: MONO, fontWeight: 800, textAlign: "center" }}
                />
              </div>
            </div>
            <div className="flex" style={{ gap: 12, marginTop: 8, fontSize: 11, color: C.dim, fontFamily: MONO }}>
              {cfg.rounds.map((r) => (
                <span key={r.id}>{r.label.slice(0, 4)}: <b style={{ color: C.paper }}>{chFor(p, resolveCourse(r))}</b></span>
              ))}
            </div>
          </Panel>
        ))}
        <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
          Course handicap = index × slope ÷ 113 + (rating − par). Strokes fall on the
          lowest stroke-index holes first, and wrap for anyone over 18.
        </div>
      </Section>

      <Section id="matchups" title="Matchups" open={open} setOpen={setOpen}>
        {cfg.rounds.map((r) => (
          <Panel key={r.id} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{r.label}</div>
            {(cfg.matchups[r.id] || []).map((pair, mi) => (
              <div key={mi} className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                {[0, 1].map((side) => (
                  <select
                    key={side}
                    value={pair[side]}
                    onChange={(e) => {
                      const next = { ...cfg.matchups };
                      const arr = next[r.id].map((x) => [...x]);
                      arr[mi][side] = Number(e.target.value);
                      next[r.id] = arr;
                      upd({ matchups: next });
                    }}
                    style={{ flex: 1, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, color: TEAM_COLORS[pair[side]], padding: 10, fontWeight: 800 }}
                  >
                    {cfg.teams.map((t, i) => <option key={i} value={i} style={{ color: C.ink }}>{t}</option>)}
                  </select>
                ))}
              </div>
            ))}
          </Panel>
        ))}
      </Section>

      <Section id="points" title="Points" open={open} setOpen={setOpen}>
        <Panel>
          {[
            ["matchWin", "Win the overall 18-hole match"],
            ["nineWin", "Win a nine (front or back)"],
            ["aggregateWin", "Lowest four-team net aggregate"],
            ["beersbeeWin", "Win a beersbee match"],
            ["beanbagPerShot", "Bean bag — per made shot"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between" style={{ padding: "8px 0" }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <DraftInput type="number" inputMode="decimal" step="0.5" value={cfg.points[k]}
                onCommit={(v) => upd({ points: { ...cfg.points, [k]: Number(v) || 0 } })}
                style={{ width: 60, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 6, color: C.paper, padding: "6px 8px", fontFamily: MONO, fontWeight: 800, textAlign: "center" }} />
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.dim, marginTop: 10, lineHeight: 1.55 }}>
            Each pairing plays three matches a day — front, back and overall — at 1 pt
            each, so a pairing is worth 3 and the two pairings are worth 6. Add 3 for
            the low net round and a course is 9, or 27 across all three. Beersbee 6,
            bocce 6, bean bag 1 = 13. A team's ceiling is still 25.
          </div>
        </Panel>
      </Section>

      <Section id="connection" title="Connection" open={open} setOpen={setOpen}>
        <ConnectionPanel />
      </Section>

      <Section id="reset" title="Clear data" open={open} setOpen={setOpen}>
        <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6, marginBottom: 12 }}>
          Wipes the shared data on every phone, not just this one. Team names,
          courses, matchups and points settings are kept. Use this once you're
          done testing and the real thing is about to start.
        </div>
        <ResetButton label="Clear scores and games" onConfirm={() => resetData("scores")} />
        <ResetButton label="Clear reactions" onConfirm={() => resetData("emotes")} />
        <ResetButton label="Clear everything" tone={C.red} onConfirm={() => resetData("all")} />
      </Section>

      <Section id="scramble" title="Scramble allowance" open={open} setOpen={setOpen}>
        <Panel>
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            Team handicap = {Math.round(cfg.scrambleAllowance[0] * 100)}% of the low handicap +{" "}
            {Math.round(cfg.scrambleAllowance[1] * 100)}% of the high.
          </div>
          <div className="flex" style={{ gap: 8 }}>
            {[[0.7, 0.3], [0.6, 0.4], [0.5, 0.5], [0.35, 0.15]].map(([a, b], i) => (
              <Btn key={i} active={cfg.scrambleAllowance[0] === a && cfg.scrambleAllowance[1] === b}
                onClick={() => upd({ scrambleAllowance: [a, b] })} style={{ flex: 1, fontSize: 11, padding: "8px 2px" }}>
                {Math.round(a * 100)}/{Math.round(b * 100)}
              </Btn>
            ))}
          </div>
        </Panel>
      </Section>
    </div>
  );
}
