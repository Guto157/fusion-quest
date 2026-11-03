
import { startBoard } from "./game/board.js";

const header = document.getElementById("header");
const screen = document.getElementById("screen");
const navigation = document.getElementById("navigation");

const player = {
  coins: Number(localStorage.getItem("fq_coins")) || 500,
  level: Number(localStorage.getItem("fq_level")) || 1,
  xp: Number(localStorage.getItem("fq_xp")) || 0
};

let currentScreen = "home";

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
    <h2 class="section-title">🎮 Fase ${player.level}</h2>
    <div id="board-container"></div>
  `;

  const boardContainer = document.getElementById("board-container");

  startBoard(boardContainer, (score) => {
    const earnedCoins = 100;
    const earnedXP = 50;

    player.coins += earnedCoins;
    player.xp += earnedXP;

    if (player.xp >= 100) {
      player.xp -= 100;
      player.level++;
      showToast("🎉 Você subiu de nível!");
    }

    savePlayer();

    screen.innerHTML = `
      <div class="card-panel" style="text-align:center;padding:30px 18px;">
        <div style="font-size:65px;">🏆</div>
        <h2 style="margin:15px 0;">Fase concluída!</h2>
        <p class="muted">Pontuação: ${score}</p>
        <p style="margin-top:15px;color:#ffd166;">🪙 +${earnedCoins} moedas</p>
        <p style="margin-top:8px;color:#20d9c2;">⭐ +${earnedXP} XP</p>
        <button class="primary-button" id="home-button" style="margin-top:25px;">
          CONTINUAR
        </button>
      </div>
    `;

    document.getElementById("home-button").addEventListener("click", () => {
      navigate("home");
      showToast("Recompensas adicionadas!");
    });
  });
}

function renderCollection() {
  screen.innerHTML = `
    <h2 class="section-title">🃏 Coleção de cartas</h2>
    <div class="card-panel" style="text-align:center;padding:35px 18px;">
      <div style="font-size:60px;">🌟</div>
      <h3 style="margin:15px 0;">Sua coleção começa aqui!</h3>
      <p class="muted">Conquiste cartas de diferentes raridades durante sua aventura.</p>
    </div>
  `;
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
