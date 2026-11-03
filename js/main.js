
import { startBoard } from "./game/board.js?v=stage-difficulty2";

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

function renderHome() {
  screen.innerHTML = `
    <div class="card-panel" style="text-align:center;padding:28px 18px;">
      <div style="font-size:55px;margin-bottom:12px;">💎</div>
      <h2 style="font-size:26px;margin-bottom:10px;">Fusion Quest</h2>
      <p class="muted">Combine peças, complete desafios e conquiste recompensas!</p>
      <div style="margin-top:24px;">
        <button class="primary-button" id="play-button">
          JOGAR AGORA
        </button>
      </div>
    </div>

    <div class="card-panel">
      <h3 class="section-title">📊 Seu progresso</h3>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span>Nível ${player.level}</span>
        <span>${player.xp}/100 XP</span>
      </div>
      <div style="height:12px;background:#10152b;border-radius:20px;overflow:hidden;">
        <div style="height:100%;width:${Math.min(player.xp, 100)}%;background:#20d9c2;border-radius:20px;"></div>
      </div>
    </div>

    <div class="card-panel">
      <h3 class="section-title">🎯 Sua missão</h3>
      <p class="muted">Complete fases para ganhar moedas e experiência!</p>
    </div>
  `;

  document.getElementById("play-button").addEventListener("click", () => {
    navigate("game");
  });
}

function renderGame() {
  screen.innerHTML = `
    <h2 class="section-title">🎮 Fase ${player.stage}</h2>
    <div id="board-container"></div>
  `;

  const boardContainer = document.getElementById("board-container");

  startBoard(boardContainer, (score) => {
    const earnedCoins = 100;
    const earnedXP = 50;

    player.coins += earnedCoins;
    player.xp += earnedXP;
    player.stage++;

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

    navigate("game");

    if (cardReward.duplicate) {
      showToast("Fase concluída! +" + earnedCoins + " moedas e coleção completa.");
    } else {
      showToast("Nova carta: " + cardReward.card.name + "! Recompensas adicionadas.");
    }
  }, player.stage, () => {
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
