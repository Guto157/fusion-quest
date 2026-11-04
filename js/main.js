
import { startBoard } from "./game/board.js?v=boosters2";

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

const STORE_ITEMS = [
  { id: "hammer", name: "Martelo", emoji: "🔨", description: "Remove uma peça escolhida do tabuleiro.", price: 150 },
  { id: "rocket", name: "Foguete", emoji: "🚀", description: "Dispara uma linha inteira de peças.", price: 250 },
  { id: "rainbow", name: "Bomba colorida", emoji: "💣", description: "Elimina todas as peças de uma mesma cor.", price: 350 },
  { id: "extra-moves", name: "+5 movimentos", emoji: "➕", description: "Adiciona cinco movimentos à sua partida.", price: 200 }
];

let inventory = {};
try {
  const savedInventory = JSON.parse(localStorage.getItem("fq_inventory") || "{}");
  inventory = savedInventory && typeof savedInventory === "object" ? savedInventory : {};
} catch {
  inventory = {};
}
STORE_ITEMS.forEach(item => {
  inventory[item.id] = Math.max(0, Number(inventory[item.id]) || 0);
});

function saveInventory() {
  localStorage.setItem("fq_inventory", JSON.stringify(inventory));
}

function buyStoreItem(itemId) {
  const item = STORE_ITEMS.find(entry => entry.id === itemId);
  if (!item) return;
  if (player.coins < item.price) {
    showToast("Moedas insuficientes para comprar este item.");
    return;
  }
  player.coins -= item.price;
  inventory[item.id] = (inventory[item.id] || 0) + 1;
  savePlayer();
  saveInventory();
  renderHeader();
  renderStore();
  showToast(item.name + " adicionado à sua mochila!");
}

function renderStore() {
  const cards = STORE_ITEMS.map(item => {
    const quantity = inventory[item.id] || 0;
    return `
      <article class="store-item">
        <div class="store-item-art">${item.emoji}</div>
        <div class="store-item-info">
          <strong>${item.name}</strong>
          <p>${item.description}</p>
          <small>Na mochila: <b>${quantity}</b></small>
        </div>
        <div class="store-item-actions">
          <button class="store-buy-coins" data-buy-item="${item.id}">🪙 ${item.price}</button>
          <button class="store-buy-ad" disabled title="Disponível na versão Android">▶ Anúncio</button>
        </div>
      </article>
    `;
  }).join("");

  screen.innerHTML = `
    <h2 class="section-title">🛒 Loja do aventureiro</h2>
    <div class="store-intro card-panel">
      <div><strong>Prepare-se para as fases!</strong><p>Compre itens usando as moedas que você ganha jogando.</p></div>
      <span>🪙 ${player.coins}</span>
    </div>
    <div class="store-list">${cards}</div>
    <p class="store-ad-note">Os anúncios recompensados serão ativados na versão Android, após a integração com o Google AdMob.</p>
  `;

  screen.querySelectorAll("[data-buy-item]").forEach(button => {
    button.addEventListener("click", () => buyStoreItem(button.dataset.buyItem));
  });
}

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

const CARD_RARITIES = [
  { id: "common", name: "Comum", className: "common", color: "#7ee68b", chance: 70 },
  { id: "rare", name: "Rara", className: "rare", color: "#45c8ff", chance: 20 },
  { id: "epic", name: "Épica", className: "epic", color: "#bd79ff", chance: 7 },
  { id: "legendary", name: "Lendária", className: "legendary", color: "#ffd166", chance: 2.9 },
  { id: "ultimate", name: "Ultimate", className: "ultimate", color: "#ff62d5", chance: 0.1 }
];

let ownedCards = [];
try {
  const savedCards = JSON.parse(localStorage.getItem("fq_cards") || "[]");
  // Migração: cartas antigas ficam preservadas como Comuns, sem apagar coleção.
  ownedCards = Array.isArray(savedCards) ? savedCards.map(entry => {
    if (typeof entry === "string") return { id: entry, rarity: "common" };
    if (entry && typeof entry.id === "string") {
      return { id: entry.id, rarity: CARD_RARITIES.some(r => r.id === entry.rarity) ? entry.rarity : "common" };
    }
    return null;
  }).filter(Boolean) : [];
} catch {
  ownedCards = [];
}

let cardPacks = Math.max(0, Number(localStorage.getItem("fq_card_packs") || 0));
function saveCardProgress() {
  localStorage.setItem("fq_cards", JSON.stringify(ownedCards));
  localStorage.setItem("fq_card_packs", String(cardPacks));
}

function renderCardArtwork(card, rarity) {
  const palette = {
    "gema-azul": ["#d9f8ff","#31baff","#0757cb"],
    "gema-verde": ["#e1ffd7","#6bff58","#087b36"],
    "gema-amarela": ["#fff6c7","#ffd84d","#c87908"],
    "gema-vermelha": ["#ffe0e8","#ff4568","#9e103a"],
    "gema-roxa": ["#f2d8ff","#bd62ff","#5510a8"],
    "gema-diamante": ["#ffffff","#a9f6ff","#4275df"]
  };
  if (card.id === "foguete") {
    return '<svg viewBox="0 0 100 100" role="img" aria-label="Foguete Explosivo"><defs><linearGradient id="rocketMetal" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#a9d9ff"/><stop offset="1" stop-color="#4264a8"/></linearGradient><linearGradient id="rocketFire" x2="0" y2="1"><stop stop-color="#fff6a0"/><stop offset=".45" stop-color="#ff9c28"/><stop offset="1" stop-color="#f12c52"/></linearGradient></defs><path d="M37 67 C22 77 25 89 15 94 C34 95 48 86 51 73Z" fill="url(#rocketFire)"/><path d="M50 74 C40 85 46 94 41 99 C59 92 67 81 64 68Z" fill="#ffcf4a"/><path d="M32 62 L15 70 L28 44 L42 48Z" fill="#e43e61" stroke="#fff" stroke-width="2"/><path d="M60 62 L79 70 L68 43 L53 47Z" fill="#e43e61" stroke="#fff" stroke-width="2"/><path d="M26 55 C26 31 44 11 70 5 C76 31 65 56 43 70Z" fill="url(#rocketMetal)" stroke="#fff" stroke-width="3"/><circle cx="54" cy="36" r="9" fill="#1764b5" stroke="#eafaff" stroke-width="4"/><path d="M59 17 Q68 20 69 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';
  }
  if (card.id === "bomba-colorida") {
    return '<svg viewBox="0 0 100 100" role="img" aria-label="Bomba Colorida"><defs><radialGradient id="bombBody" cx=".3" cy=".2"><stop stop-color="#fff"/><stop offset=".25" stop-color="#c9a5ff"/><stop offset="1" stop-color="#38215e"/></radialGradient></defs><path d="M59 22 Q68 9 82 12" fill="none" stroke="#b7a0a0" stroke-width="7" stroke-linecap="round"/><path d="M80 12 L87 4 M80 12 L91 14 M80 12 L77 2" stroke="#ffe16a" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="57" r="34" fill="url(#bombBody)" stroke="#fff" stroke-width="3"/><path d="M48 23 A34 34 0 0 1 80 68 L48 57Z" fill="#ff4b78" opacity=".9"/><path d="M17 68 A34 34 0 0 1 48 23 L48 57Z" fill="#28c9ff" opacity=".9"/><path d="M17 68 A34 34 0 0 0 80 68 L48 57Z" fill="#ffd23f" opacity=".9"/><circle cx="48" cy="57" r="34" fill="none" stroke="#fff" stroke-width="3"/><path d="M35 50 L61 50 L61 64 Q48 74 35 64Z" fill="#14172c"/><circle cx="41" cy="55" r="3" fill="#fff"/><circle cx="55" cy="55" r="3" fill="#fff"/><path d="M43 64 L48 59 L53 64" fill="none" stroke="#fff" stroke-width="2.5"/></svg>';
  }
  const colors = palette[card.id] || palette["gema-azul"];
  const id = card.id.replace(/[^a-z0-9]/gi, "");
  return '<svg viewBox="0 0 100 100" role="img" aria-label="' + card.name + '">' +
    '<defs><linearGradient id="gem' + id + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' + colors[0] + '"/><stop offset=".48" stop-color="' + colors[1] + '"/><stop offset="1" stop-color="' + colors[2] + '"/></linearGradient><linearGradient id="facet' + id + '" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="' + colors[1] + '" stop-opacity=".15"/></linearGradient></defs>' +
    '<path d="M50 5 L84 25 L94 57 L50 94 L6 57 L16 25Z" fill="url(#gem' + id + ')" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M16 25 L50 5 L50 48 L6 57Z" fill="url(#facet' + id + ')"/><path d="M50 5 L84 25 L94 57 L50 48Z" fill="#fff" opacity=".28"/><path d="M6 57 L50 48 L50 94Z" fill="' + colors[2] + '" opacity=".52"/><path d="M94 57 L50 48 L50 94Z" fill="' + colors[1] + '" opacity=".62"/><path d="M16 25 L84 25 M50 5 L50 48 M6 57 L50 48 L94 57" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/><path d="M25 27 L43 17" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/></svg>';
}

function rollCardRarity() {
  const roll = Math.random() * 100;
  let edge = 0;
  for (const rarity of CARD_RARITIES) {
    edge += rarity.chance;
    if (roll < edge) return rarity;
  }
  return CARD_RARITIES[CARD_RARITIES.length - 1];
}

function drawOneCard() {
  const card = CARD_CATALOG[Math.floor(Math.random() * CARD_CATALOG.length)];
  const rarity = rollCardRarity();
  const found = { id: card.id, rarity: rarity.id };
  ownedCards.push(found);
  return { card, rarity };
}

function grantCard() {
  // Ao concluir uma fase: 15% de chance de encontrar um pacote, caso contrário uma carta.
  if (Math.random() < 0.15) {
    cardPacks += 1;
    saveCardProgress();
    return { type: "pack" };
  }
  const found = drawOneCard();
  saveCardProgress();
  return { type: "card", ...found };
}

function openCardPack() {
  if (cardPacks <= 0) return;
  cardPacks -= 1;
  const foundCards = [drawOneCard(), drawOneCard(), drawOneCard()];
  saveCardProgress();
  renderCollection();
  const summary = foundCards.map(found => found.card.name + " (" + found.rarity.name + ")").join(", ");
  showToast("Pacote aberto! " + summary);
}

const screens = {
  home: { title: "Início", icon: "🏠" },
  game: { title: "Jogar", icon: "🎮" },
  collection: { title: "Cartas", icon: "🃏" },
  rewards: { title: "Prêmios", icon: "🎁" },
  store: { title: "Loja", icon: "🛒" },
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
  const lastVisibleStage = Math.max(10, player.stage + 10);
  const visibleStages = Array.from({ length: lastVisibleStage }, (_, index) => index + 1);

  const stagesHTML = visibleStages.map((stage, index) => {
    const info = getStageMapInfo(stage);
    const isCompleted = stage < player.stage;
    const isCurrent = stage === player.stage;
    const isLocked = stage > player.stage;
    const stars = "★".repeat(info.stars) + "☆".repeat(5 - info.stars);
    const icon = isLocked ? "🔒" : isCurrent ? getSelectedAvatar().emoji : "🏆";
    const side = index % 2 === 0 ? "left" : "right";
    return `
      <div class="quest-stop ${side} ${isCompleted ? "done" : ""} ${isCurrent ? "active" : ""} ${isLocked ? "locked" : ""}" data-stage-row="${stage}">
        ${index < visibleStages.length - 1 ? '<div class="quest-stone-trail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' : ''}
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
    <div class="map-section-heading"><div><strong>Sua jornada</strong><small>Deslize para cima e para baixo para explorar as fases</small></div><span>🌿</span></div>
    <section class="quest-map" aria-label="Mapa de fases">
      <div class="quest-land quest-land-one"></div><div class="quest-land quest-land-two"></div>
      ${stagesHTML}
    </section>
    <div class="map-account-progress"><span>NÍVEL ${player.level}</span><div class="map-account-track"><i style="width:${Math.min(player.xp,100)}%"></i></div><span>${player.xp}/100 XP</span></div>
  `;

  const map = screen.querySelector(".quest-map");
  const currentRow = map.querySelector('[data-stage-row="' + player.stage + '"]');
  if (currentRow) {
    map.scrollTop = Math.max(0, currentRow.offsetTop - (map.clientHeight / 2) + (currentRow.offsetHeight / 2));
  }

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

    if (cardReward.type === "pack") {
      showToast("🎁 Você encontrou um pacote de cartas! Abra na sua coleção.");
    } else {
      showToast("🃏 Carta encontrada: " + cardReward.card.name + " • " + cardReward.rarity.name + "!");
    }
  }, selectedStage, () => {
    selectedStage = player.stage;
    navigate("home");
  }, inventory, (itemId, quantity) => {
    inventory[itemId] = quantity;
    saveInventory();
  });
}

function renderCollection() {
  const totalCards = CARD_CATALOG.length * CARD_RARITIES.length;
  const uniqueFound = CARD_CATALOG.reduce((total, card) =>
    total + CARD_RARITIES.filter(rarity => ownedCards.some(entry => entry.id === card.id && entry.rarity === rarity.id)).length, 0);

  const cardsHTML = CARD_CATALOG.flatMap(card => CARD_RARITIES.map(rarity => {
    const count = ownedCards.filter(entry => entry.id === card.id && entry.rarity === rarity.id).length;
    const className = count > 0 ? rarity.className : "locked " + rarity.className;
    return '<article class="fusion-card ' + className + '">' +
      '<div class="fusion-card-rarity">' + rarity.name + '</div>' +
      '<div class="fusion-card-art">' + renderCardArtwork(card, rarity) + '</div>' +
      '<strong class="fusion-card-name">' + card.name + '</strong>' +
      '<span class="fusion-card-description">' + (count > 0 ? "Encontrada" : "Ainda não encontrada") + '</span>' +
      '<span class="fusion-card-count">' + (count > 0 ? "×" + count : "—") + '</span>' +
    '</article>';
  })).join("");

  screen.innerHTML = '<h2 class="section-title">🃏 Coleção de cartas</h2>' +
    '<div class="card-panel collection-progress"><div><strong>Cartas encontradas</strong><b>' + uniqueFound + '/' + totalCards + '</b></div>' +
    '<div class="collection-progress-track"><i style="width:' + (uniqueFound / totalCards * 100) + '%"></i></div>' +
    '<small>Pacotes disponíveis: ' + cardPacks + ' • Cada pacote contém 3 cartas</small>' +
    '<button class="open-card-pack" id="open-card-pack" ' + (cardPacks > 0 ? "" : "disabled") + '>🎁 Abrir pacote (' + cardPacks + ')</button></div>' +
    '<div class="fusion-card-grid">' + cardsHTML + '</div>' +
    '<p class="collection-tip">Cada carta pode ser encontrada em cinco raridades. Repetidas contam como cópias extras, sem alterar a raridade.</p>';

  const openButton = document.getElementById("open-card-pack");
  if (openButton) openButton.addEventListener("click", openCardPack);
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
    store: renderStore,
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
