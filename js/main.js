
import { startBoard } from "./game/board.js?v=ice-obstacles1";

const header = document.getElementById("header");
const screen = document.getElementById("screen");
const navigation = document.getElementById("navigation");

const player = {
  coins: Number(localStorage.getItem("fq_coins")) || 500,
  level: Number(localStorage.getItem("fq_level")) || 1,
  xp: Number(localStorage.getItem("fq_xp")) || 0,
  stage: Number(localStorage.getItem("fq_stage")) || 1
};

let currentScreen = "home";
let selectedStage = player.stage;

const CARD_CATALOG = [
  { id: "gema-azul", name: "Gema Azul", emoji: "🔵", rarity: "Comum", description: "Uma peça clássica do tabuleiro." },
  { id: "gema-verde", name: "Gema Verde", emoji: "🟢", rarity: "Comum", description: "Energia verde para suas combinações." },
  { id: "gema-amarela", name: "Gema Dourada", emoji: "🟡", rarity: "Comum", description: "Brilha a cada combinação." },
  { id: "gema-vermelha", name: "Gema Rubi", emoji: "🔴", rarity: "Rara", description: "Uma joia de grande valor." },
  { id: "gema-roxa", name: "Gema Violeta", emoji: "🟣", rarity: "Rara", description: "Uma peça rara do tabuleiro." },
  { id: "gema-diamante", name: "Diamante Supremo", emoji: "💎", rarity: "Épica", description: "A joia mais preciosa do Fusion Quest." },
  { id: "foguete", name: "Foguete Explosivo", emoji: "🚀", rarity: "Épica", description: "Limpa uma linha ou coluna inteira." },
  { id: "bomba-colorida", name: "Bomba Colorida", emoji: "💣", rarity: "Lendária", description: "Elimina todas as peças de uma cor." }
];

let ownedCards = [];

try {
  const savedCards = JSON.parse(localStorage.getItem("fq_cards") || "[]");
  ownedCards = Array.isArray(savedCards) ? savedCards : [];
} catch {
  ownedCards = [];
}

function grantCard() {
  const availableCards = CARD_CATALOG.filter(item => !ownedCards.includes(item.id));
  const card = availableCards.length
    ? availableCards[Math.floor(Math.random() * availableCards.length)]
    : null;

  if (!card) {
    player.coins += 50;
    return { duplicate: true, coins: 50 };
  }

  ownedCards.push(card.id);
  localStorage.setItem("fq_cards", JSON.stringify(ownedCards));
  return { duplicate: false, card };
}

const screens = {
  home: { title: "Início", icon: "🏠" },
  game: { title: "Jogar", icon: "🎮" },
  collection: { title: "Cartas", icon: "🃏" },
  rewards: { title: "Prêmios", icon: "🎁" },
  settings: { title: "Ajustes", icon: "⚙️" }
};

function savePlayer() {
  localStorage.setItem("fq_coins", player.coins);
  localStorage.setItem("fq_level", player.level);
  localStorage.setItem("fq_xp", player.xp);
  localStorage.setItem("fq_stage", player.stage);
}

function renderHeader() {
  header.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <h2 style="font-size:23px;">✨ Fusion Quest</h2>
        <p class="muted" style="margin-top:5px;">Nível ${player.level}</p>
      </div>
      <div style="background:#28345c;padding:10px 14px;border-radius:14px;">
        🪙 ${player.coins}
      </div>
    </div>
  `;
}

function renderNavigation() {
  navigation.innerHTML = Object.entries(screens).map(([id, item]) => `
    <button class="nav-button ${currentScreen === id ? "active" : ""}"
      data-screen="${id}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.title}</span>
    </button>
  `).join("");

  navigation.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", () => {
      navigate(button.dataset.screen);
    });
  });
}

function getStageMapInfo(stage) {
  const position = ((stage - 1) % 10) + 1;
  const insane = stage % 50 === 0;
  const hard = !insane && stage % 10 === 0;
  const easy = [1, 2, 3, 6, 7, 8].includes(position);
  const difficulty = insane ? {name:"INSANO",stars:5,className:"insano",bonus:80}
    : hard ? {name:"DIFÍCIL",stars:3,className:"dificil",bonus:60}
    : easy ? {name:"FÁCIL",stars:1,className:"facil",bonus:0}
    : {name:"NORMAL",stars:2,className:"normal",bonus:40};
  return {...difficulty,target:250+Math.floor((stage-1)/10)*100+difficulty.bonus};
}

function renderHome() {
  const world = Math.ceil(player.stage / 10);
  const worldStart = (world - 1) * 10 + 1;
  const worldEnd = world * 10;
  const firstVisible = Math.max(worldStart, Math.min(player.stage - 1, worldEnd - 2));
  const visibleStages = [firstVisible, firstVisible + 1, firstVisible + 2].filter(stage => stage <= worldEnd);
  const completedInWorld = Math.max(0, Math.min(10, player.stage - worldStart));

  const stagesHTML = visibleStages.map((stage, index) => {
    const info = getStageMapInfo(stage);
    const isCompleted = stage < player.stage;
    const isCurrent = stage === player.stage;
    const isLocked = stage > player.stage;
    const stars = "★".repeat(info.stars) + "☆".repeat(5 - info.stars);
    const icon = isLocked ? "🔒" : isCurrent ? "🧙" : "🏆";
    return `
      <div class="quest-stop stop-${index} ${isCompleted ? "done" : ""} ${isCurrent ? "active" : ""} ${isLocked ? "locked" : ""}">
        <button class="quest-node" data-stage="${stage}" ${isLocked ? "disabled" : ""} aria-label="Fase ${stage}">
          <span class="quest-node-icon">${icon}</span>
          <strong>${stage}</strong>
        </button>
        <div class="quest-card">
          <div class="quest-card-top"><strong>FASE ${stage}</strong><span class="quest-status">${isCompleted ? "CONCLUÍDA" : isCurrent ? "ATUAL" : "BLOQUEADA"}</span></div>
          <div class="quest-stars">${stars}</div>
          <div class="quest-difficulty ${info.className}">${info.name}</div>
          <div class="quest-goal">🎯 Meta: <b>${info.target.toLocaleString("pt-BR")} pontos</b></div>
        </div>
      </div>`;
  }).join("");

  screen.innerHTML = `
    <section class="world-banner">
      <div class="world-banner-glow"></div>
      <div class="world-banner-copy">
        <span class="map-eyebrow">SUA AVENTURA</span>
        <h2>MUNDO ${world}</h2>
        <p>Trilha das Gemas</p>
      </div>
      <div class="world-emblem">🏰</div>
      <div class="world-banner-foot"><span>⭐ ${completedInWorld}/10 fases</span><span>🪙 ${player.coins}</span></div>
    </section>

    <div class="map-section-heading"><div><strong>Sua jornada</strong><small>Avance pelo caminho e desbloqueie novas fases</small></div><span>🌿</span></div>
    <section class="quest-map">
      <div class="quest-land quest-land-one"></div><div class="quest-land quest-land-two"></div>
      <svg class="quest-route" viewBox="0 0 340 510" preserveAspectRatio="none" aria-hidden="true">
        <path d="M170 70 C170 135 65 125 65 220 S275 285 275 365 S170 425 170 475" />
      </svg>
      ${stagesHTML}
      <div class="map-more-hint">✨ Continue vencendo para revelar o próximo trecho do caminho</div>
    </section>

    <section class="map-bottom-card">
      <div class="map-bottom-icon">🧭</div>
      <div class="map-bottom-copy"><strong>Seu próximo desafio</strong><span>Fase ${player.stage} • ${getStageMapInfo(player.stage).name}</span></div>
      <button id="map-play-current">JOGAR <span>›</span></button>
    </section>
    <div class="map-account-progress"><span>NÍVEL ${player.level}</span><div class="map-account-track"><i style="width:${Math.min(player.xp,100)}%"></i></div><span>${player.xp}/100 XP</span></div>
  `;

  screen.querySelectorAll("[data-stage]").forEach(button => button.addEventListener("click", () => {
    const stage = Number(button.dataset.stage);
    if (stage > player.stage) return;
    selectedStage = stage;
    navigate("game");
  }));
  document.getElementById("map-play-current").addEventListener("click", () => {
    selectedStage = player.stage;
    navigate("game");
  });
}
function renderGame() {
  screen.innerHTML = `
    <h2 class="section-title">🎮 Fase ${selectedStage}</h2>
    <div id="board-container"></div>
  `;

  const boardContainer = document.getElementById("board-container");

  startBoard(boardContainer, (score) => {
    if (selectedStage < player.stage) {
      navigate("home");
      showToast("Fase " + selectedStage + " concluída novamente!");
      return;
    }
    const earnedCoins = 100;
    const earnedXP = 50;
    player.coins += earnedCoins;
    player.xp += earnedXP;
    player.stage++;
    selectedStage = player.stage;
    const cardReward = grantCard();

    let leveledUp = false;
    while (player.xp >= 100) {
      player.xp -= 100;
      player.level++;
      leveledUp = true;
    }

    if (leveledUp) {
      showToast("🎉 Você subiu de nível!");
    }

    savePlayer();

    selectedStage = player.stage;
    navigate("home");

    if (cardReward.duplicate) {
      showToast("Fase concluída! +" + earnedCoins + " moedas e coleção completa.");
    } else {
      showToast("Nova carta: " + cardReward.card.name + "! Recompensas adicionadas.");
    }
  }, selectedStage, () => {
    selectedStage = player.stage;
    navigate("home");
  });
}

function renderCollection() {
  const rarityColors = { "Comum": "#8c9bad", "Rara": "#38bdf8", "Épica": "#b56cff", "Lendária": "#ffd166" };
  const unlockedCount = CARD_CATALOG.filter(card => ownedCards.includes(card.id)).length;
  const cardsHTML = CARD_CATALOG.map(card => {
    const unlocked = ownedCards.includes(card.id);
    const color = rarityColors[card.rarity];
    return '<div style="background:#1b2342;border:1px solid ' + (unlocked ? color : "#303b63") + ';border-radius:16px;padding:16px 10px;text-align:center;min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
      '<div style="font-size:43px;filter:' + (unlocked ? "none" : "grayscale(1)") + ';opacity:' + (unlocked ? "1" : ".35") + ';">' + (unlocked ? card.emoji : "❔") + '</div>' +
      '<strong style="font-size:14px;margin-top:9px;">' + (unlocked ? card.name : "Carta bloqueada") + '</strong>' +
      '<span style="font-size:11px;color:' + (unlocked ? color : "#aab3d0") + ';margin-top:6px;">' + (unlocked ? card.rarity : "Não descoberta") + '</span>' +
      (unlocked ? '<span style="font-size:11px;color:#aab3d0;margin-top:7px;">' + card.description + '</span>' : '') + '</div>';
  }).join("");
  screen.innerHTML = '<h2 class="section-title">🃏 Coleção de cartas</h2>' +
    '<div class="card-panel"><div style="display:flex;justify-content:space-between;"><strong>Cartas desbloqueadas</strong><strong style="color:#20d9c2;">' + unlockedCount + '/' + CARD_CATALOG.length + '</strong></div>' +
    '<div style="height:10px;background:#10152b;border-radius:20px;overflow:hidden;margin-top:12px;"><div style="height:100%;width:' + (unlockedCount / CARD_CATALOG.length * 100) + '%;background:#20d9c2;border-radius:20px;"></div></div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' + cardsHTML + '</div>' +
    '<p class="muted" style="font-size:12px;text-align:center;margin-top:16px;">Conclua fases para desbloquear cartas. Depois de completar a coleção, cartas repetidas viram moedas.</p>';
}

function renderRewards() {
  screen.innerHTML = `
    <h2 class="section-title">🎁 Recompensas</h2>
    <div class="card-panel">
      <h3 style="margin-bottom:12px;">Bônus de boas-vindas</h3>
      <p class="muted">Você recebeu 500 moedas para começar sua jornada!</p>
      <div style="font-size:35px;margin-top:15px;">🪙</div>
    </div>
  `;
}

function renderSettings() {
  screen.innerHTML = `
    <h2 class="section-title">⚙️ Ajustes</h2>
    <div class="card-panel">
      <h3 style="margin-bottom:12px;">Configurações</h3>
      <p class="muted">As opções de som, música e preferências serão adicionadas aqui.</p>
    </div>
  `;
}

function navigate(destination) {
  if (!screens[destination]) return;

  currentScreen = destination;

  const renderers = {
    home: renderHome,
    game: renderGame,
    collection: renderCollection,
    rewards: renderRewards,
    settings: renderSettings
  };

  renderHeader();
  renderNavigation();
  renderers[destination]();
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

navigate("home");
