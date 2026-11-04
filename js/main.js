
import { startBoard } from "./game/board.js?v=combo-animation1";

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

const AVATARS = [
  { id: "homem", name: "Aventureiro", emoji: "👨🏻" },
  { id: "mulher", name: "Aventureira", emoji: "👩🏻" },
  { id: "menino", name: "Jovem aventureiro", emoji: "👦🏻" },
  { id: "menina", name: "Jovem aventureira", emoji: "👧🏻" }
];

let selectedAvatar = localStorage.getItem("fq_avatar") || "homem";
if (!AVATARS.some(avatar => avatar.id === selectedAvatar)) selectedAvatar = "homem";

function getSelectedAvatar() {
  return AVATARS.find(avatar => avatar.id === selectedAvatar) || AVATARS[0];
}

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

function renderCardArtwork(card) {
  if (card.id !== "bomba-colorida") return card.emoji;
  return `
    <svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Bomba colorida" style="overflow:visible;filter:drop-shadow(0 4px 3px #0008)">
      <path d="M39 13 C43 8 47 9 49 3" fill="none" stroke="#8b5a2b" stroke-width="4" stroke-linecap="round"/>
      <path d="M49 3 L54 1 M49 3 L51 8 M49 3 L46 0" fill="none" stroke="#ffd166" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M32 12 A22 22 0 0 1 53 43 L32 32Z" fill="#ff416c" stroke="#fff" stroke-width="1.5"/>
      <path d="M32 12 A22 22 0 0 0 11 43 L32 32Z" fill="#00b4d8" stroke="#fff" stroke-width="1.5"/>
      <path d="M11 43 A22 22 0 0 0 53 43 L32 32Z" fill="#ffbd24" stroke="#fff" stroke-width="1.5"/>
      <path d="M32 12 A22 22 0 0 1 53 43 A22 22 0 0 1 11 43 A22 22 0 0 1 32 12Z" fill="none" stroke="#fff" stroke-width="2"/>
      <ellipse cx="23" cy="22" rx="7" ry="4" fill="#fff" opacity=".65" transform="rotate(-35 23 22)"/>
      <circle cx="32" cy="32" r="3" fill="#fff" opacity=".8"/>
    </svg>`;
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
    const icon = isLocked ? "🔒" : isCurrent ? getSelectedAvatar().emoji : "🏆";
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
    <div class="map-account-progress"><span>NÍVEL ${player.level}</span><div class="map-account-track"><i style="width:${Math.min(player.xp,100)}%"></i></div><span>${player.xp}/100 XP</span></div>
  `;

  screen.querySelectorAll("[data-stage]").forEach(button => button.addEventListener("click", () => {
    const stage = Number(button.dataset.stage);
    if (stage > player.stage) return;
    selectedStage = stage;
    navigate("game");
  }));
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
      '<div style="font-size:43px;filter:' + (unlocked ? "none" : "grayscale(1)") + ';opacity:' + (unlocked ? "1" : ".35") + ';">' + (unlocked ? renderCardArtwork(card) : "❔") + '</div>' +
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
  const avatarCards = AVATARS.map(avatar => `
    <button class="avatar-choice ${selectedAvatar === avatar.id ? "selected" : ""}" data-avatar="${avatar.id}" aria-pressed="${selectedAvatar === avatar.id}">
      <span class="avatar-preview">${avatar.emoji}</span>
      <strong>${avatar.name}</strong>
      <small>${selectedAvatar === avatar.id ? "Selecionado" : "Escolher"}</small>
    </button>
  `).join("");

  screen.innerHTML = `
    <h2 class="section-title">⚙️ Ajustes</h2>
    <section class="avatar-panel">
      <div class="avatar-panel-heading">
        <div><h3>Escolha seu aventureiro</h3><p>Seu personagem aparecerá no mapa das fases.</p></div>
        <span class="avatar-heading-icon">${getSelectedAvatar().emoji}</span>
      </div>
      <div class="avatar-grid">${avatarCards}</div>
    </section>
    <div class="card-panel">
      <h3 style="margin-bottom:12px;">Configurações</h3>
      <p class="muted">Mais opções de som, música e preferências serão adicionadas aqui.</p>
    </div>
  `;

  screen.querySelectorAll("[data-avatar]").forEach(button => button.addEventListener("click", () => {
    selectedAvatar = button.dataset.avatar;
    localStorage.setItem("fq_avatar", selectedAvatar);
    renderSettings();
    showToast("Avatar atualizado!");
  }));
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
