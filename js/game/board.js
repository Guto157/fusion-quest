
const SIZE = 7;
const TYPES = ["💎", "🔵", "🟣", "🟢", "🟡", "🔴"];
const MAX_MOVES = 20;

export function startBoard(container, onComplete, stage = 1, onHome = () => {}) {
  const TARGET = 250 + (stage - 1) * 50;

  let board = [];
  let moves = MAX_MOVES;
  let score = 0;
  let dragStart = null;
  let busy = false;
  let clearing = new Set();
  let message = "Combine 3 ou mais peças iguais!";

  function randomPiece() {
    return Math.floor(Math.random() * TYPES.length);
  }

  function isSpecial(piece) {
    return piece !== null && typeof piece === "object";
  }

  function displayPiece(piece) {
    if (piece === null) return "";
    if (piece.type === "rocket") return "🚀";
    if (piece.type === "rainbow") {
      return `
        <svg viewBox="0 0 32 32" width="1em" height="1em"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Bomba colorida"
          style="vertical-align:middle;overflow:visible;">
          <path d="M18 8 C20 5 23 5 24 2"
            fill="none" stroke="#754c24" stroke-width="2.5"
            stroke-linecap="round"/>
          <path d="M24 2 L26 0 M24 2 L28 3 M24 2 L23 0"
            fill="none" stroke="#ffd166" stroke-width="2"
            stroke-linecap="round"/>
          <path d="M16 6 A11 11 0 0 1 26 22 L16 17 Z"
            fill="#ff4d6d" stroke="#fff" stroke-width=".7"/>
          <path d="M16 6 A11 11 0 0 0 6 22 L16 17 Z"
            fill="#00b4d8" stroke="#fff" stroke-width=".7"/>
          <path d="M6 22 A11 11 0 0 0 26 22 L16 17 Z"
            fill="#ffbe0b" stroke="#fff" stroke-width=".7"/>
          <circle cx="16" cy="17" r="11"
            fill="none" stroke="#fff" stroke-width="1.2"/>
          <ellipse cx="12" cy="11" rx="3" ry="1.8"
            fill="#fff" opacity=".65"/>
        </svg>
      `;
    }
    return TYPES[piece];
  }

  function createBoard() {
    board = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, randomPiece)
    );

    while (findMatches().length > 0) {
      removeMatches(findMatches());
    }

    score = 0;

    if (!hasPossibleMove()) {
      shuffleBoard();
    }
  }

  function getMatchData() {
    const matches = new Set();
    const groups = [];

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE - 2; col++) {
        const piece = board[row][col];

        if (
          typeof piece !== "number" ||
          piece !== board[row][col + 1] ||
          piece !== board[row][col + 2]
        ) {
          continue;
        }

        let end = col + 2;

        while (
          end + 1 < SIZE &&
          board[row][end + 1] === piece
        ) {
          end++;
        }

        const group = [];

        for (let c = col; c <= end; c++) {
          matches.add(`${row},${c}`);
          group.push([row, c]);
        }

        groups.push({
          positions: group,
          length: group.length,
          direction: "row"
        });

        col = end;
      }
    }

    for (let col = 0; col < SIZE; col++) {
      for (let row = 0; row < SIZE - 2; row++) {
        const piece = board[row][col];

        if (
          typeof piece !== "number" ||
          piece !== board[row + 1][col] ||
          piece !== board[row + 2][col]
        ) {
          continue;
        }

        let end = row + 2;

        while (
          end + 1 < SIZE &&
          board[end + 1][col] === piece
        ) {
          end++;
        }

        const group = [];

        for (let r = row; r <= end; r++) {
          matches.add(`${r},${col}`);
          group.push([r, col]);
        }

        groups.push({
          positions: group,
          length: group.length,
          direction: "column"
        });

        row = end;
      }
    }

    return {
      matches: [...matches].map(position =>
        position.split(",").map(Number)
      ),
      groups
    };
  }

  function getMatchComponents(matches) {
    const remaining = new Set(
      matches.map(([row, col]) => `${row},${col}`)
    );

    const components = [];

    while (remaining.size > 0) {
      const first = remaining.values().next().value;
      const [startRow, startCol] = first.split(",").map(Number);

      const component = [];
      const queue = [[startRow, startCol]];

      remaining.delete(first);

      while (queue.length > 0) {
        const [row, col] = queue.shift();
        component.push([row, col]);

        const neighbors = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1]
        ];

        for (const [nextRow, nextCol] of neighbors) {
          const key = `${nextRow},${nextCol}`;

          if (remaining.has(key)) {
            remaining.delete(key);
            queue.push([nextRow, nextCol]);
          }
        }
      }

      components.push(component);
    }

    return components;
  }

  function findMatches() {
    return getMatchData().matches;
  }

  function hasPossibleMove() {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const neighbors = [
          [row, col + 1],
          [row + 1, col]
        ];

        for (const [nextRow, nextCol] of neighbors) {
          if (nextRow >= SIZE || nextCol >= SIZE) continue;

          if (
            isSpecial(board[row][col]) ||
            isSpecial(board[nextRow][nextCol])
          ) {
            return true;
          }

          const temp = board[row][col];
          board[row][col] = board[nextRow][nextCol];
          board[nextRow][nextCol] = temp;

          const possible = findMatches().length > 0;

          board[nextRow][nextCol] = board[row][col];
          board[row][col] = temp;

          if (possible) return true;
        }
      }
    }

    return false;
  }

  function compactBoard() {
    for (let col = 0; col < SIZE; col++) {
      let start = 0;

      for (let row = 0; row <= SIZE; row++) {
        if (
          row === SIZE ||
          isSpecial(board[row][col])
        ) {
          const remaining = [];

          for (let r = row - 1; r >= start; r--) {
            if (board[r][col] !== null) {
              remaining.push(board[r][col]);
            }
          }

          while (remaining.length < row - start) {
            remaining.push(randomPiece());
          }

          for (let r = row - 1; r >= start; r--) {
            board[r][col] = remaining[row - 1 - r];
          }

          start = row + 1;
        }
      }
    }
  }

  function shuffleBoard() {
    message = "Sem jogadas possíveis! Embaralhando...";

    const pieces = board.flat();
    let attempts = 0;

    while (attempts < 1000) {
      const shuffled = [...pieces];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      board = Array.from({ length: SIZE }, (_, row) =>
        shuffled.slice(row * SIZE, (row + 1) * SIZE)
      );

      if (
        findMatches().length === 0 &&
        hasPossibleMove()
      ) {
        message = "Tabuleiro renovado! Continue jogando.";
        return;
      }

      attempts++;
    }

    do {
      board = Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, randomPiece)
      );
    } while (
      findMatches().length > 0 ||
      !hasPossibleMove()
    );

    message = "Tabuleiro renovado! Continue jogando.";
  }

  function removeMatches(matches, keep = null, special = null) {
    if (matches.length === 0) return;

    matches.forEach(([row, col]) => {
      if (
        keep &&
        keep.row === row &&
        keep.col === col
      ) {
        return;
      }

      board[row][col] = null;
    });

    score += matches.length * 10;

    if (keep && special) {
      board[keep.row][keep.col] = special;
    }

    compactBoard();
  }

  function render() {
    container.innerHTML = `
      <div class="board-info">
        <div class="board-stat">
          <span>PONTOS</span>
          <strong>${score}</strong>
        </div>

        <div class="board-stat">
          <span>MOVIMENTOS</span>
          <strong>${moves}</strong>
        </div>

        <div class="board-stat">
          <span>META</span>
          <strong>${TARGET}</strong>
        </div>
      </div>

      <div class="game-board">
        ${board.map((line, row) =>
          line.map((piece, col) => `
            <button
              class="game-piece
                ${clearing.has(`${row},${col}`) ? "clearing" : ""}"
              data-row="${row}"
              data-col="${col}"
              aria-label="Peça ${row + 1}, ${col + 1}"
              ${clearing.has(`${row},${col}`) ? "disabled" : ""}
            >
              ${displayPiece(piece)}
            </button>
          `).join("")
        ).join("")}
      </div>

      <p class="board-message">
        ${message}
      </p>
    `;

    const gameBoard = container.querySelector(".game-board");

    gameBoard.addEventListener("pointerdown", event => {
      const piece = event.target.closest(".game-piece");

      if (!piece || busy || moves <= 0 || score >= TARGET) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      dragStart = {
        row: Number(piece.dataset.row),
        col: Number(piece.dataset.col),
        x: event.clientX,
        y: event.clientY,
        element: piece
      };

      piece.style.transition = "none";
      piece.style.willChange = "transform";
      piece.style.zIndex = "10";
      piece.style.filter = "brightness(1.25)";
      gameBoard.setPointerCapture(event.pointerId);
    });

    gameBoard.addEventListener("pointermove", event => {
      if (!dragStart || busy) return;

      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      const piece = dragStart.element;

      piece.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;

      const rect = gameBoard.getBoundingClientRect();
      const cellWidth = rect.width / SIZE;
      const cellHeight = rect.height / SIZE;

      let row = dragStart.row;
      let col = dragStart.col;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) < cellWidth * 0.35) return;
        col += dx > 0 ? 1 : -1;
      } else {
        if (Math.abs(dy) < cellHeight * 0.35) return;
        row += dy > 0 ? 1 : -1;
      }

      if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;

      const start = dragStart;
      dragStart = null;
      piece.style.transform = "";
      piece.style.transition = "";
      piece.style.willChange = "";
      piece.style.zIndex = "";
      piece.style.filter = "";
      swap(start.row, start.col, row, col);
    });

    function finishDrag() {
      if (dragStart?.element) {
        dragStart.element.style.transform = "";
        dragStart.element.style.transition = "";
        dragStart.element.style.willChange = "";
        dragStart.element.style.zIndex = "";
        dragStart.element.style.filter = "";
      }
      dragStart = null;
    }

    gameBoard.addEventListener("pointerup", finishDrag);
    gameBoard.addEventListener("pointercancel", finishDrag);
  }

  function animateSwap(row1, col1, row2, col2, reverse = false) {
    const first = container.querySelector(
      `[data-row="${row1}"][data-col="${col1}"]`
    );

    const second = container.querySelector(
      `[data-row="${row2}"][data-col="${col2}"]`
    );

    if (!first || !second) {
      return Promise.resolve();
    }

    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();

    const dx = secondRect.left - firstRect.left;
    const dy = secondRect.top - firstRect.top;

    const firstAnimation = first.animate(
      reverse
        ? [
            { transform: `translate3d(${dx}px, ${dy}px, 0)` },
            { transform: "translate3d(0, 0, 0)" }
          ]
        : [
            { transform: "translate3d(0, 0, 0)" },
            { transform: `translate3d(${dx}px, ${dy}px, 0)` }
          ],
      {
        duration: 190,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
      }
    );

    const secondAnimation = second.animate(
      reverse
        ? [
            { transform: `translate3d(${-dx}px, ${-dy}px, 0)` },
            { transform: "translate3d(0, 0, 0)" }
          ]
        : [
            { transform: "translate3d(0, 0, 0)" },
            { transform: `translate3d(${-dx}px, ${-dy}px, 0)` }
          ],
      {
        duration: 190,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    );

    return Promise.all([
      firstAnimation.finished.catch(() => {}),
      secondAnimation.finished.catch(() => {})
    ]);
  }

  function swap(row1, col1, row2, col2) {
    if (busy) return;

    const firstPiece = board[row1][col1];
    const secondPiece = board[row2][col2];

    const hasSpecial =
      isSpecial(firstPiece) ||
      isSpecial(secondPiece);

    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;

    busy = true;

    if (hasSpecial) {
      moves--;

      animateSwap(row1, col1, row2, col2)
        .then(() => {
          const targets = new Set();

          if (isSpecial(firstPiece)) {
            addSpecialTargets(
              targets,
              firstPiece,
              row2,
              col2,
              secondPiece
            );
          }

          if (isSpecial(secondPiece)) {
            addSpecialTargets(
              targets,
              secondPiece,
              row1,
              col1,
              firstPiece
            );
          }

          activateTargets(targets);
        });

      return;
    }

    if (findMatches().length === 0) {
      animateSwap(row1, col1, row2, col2)
        .then(() => {
          const reverse = board[row1][col1];
          board[row1][col1] = board[row2][col2];
          board[row2][col2] = reverse;

          return animateSwap(row1, col1, row2, col2, true);
        })
        .then(() => {
          busy = false;
          render();
        });

      return;
    }

    moves--;
    message = "Combine 3 ou mais peças iguais!";

    animateSwap(row1, col1, row2, col2)
      .then(() => {
        render();
        processMatches({ row: row2, col: col2 });
      });
  }

  function addSpecialTargets(targets, special, row, col, targetPiece) {
    if (special.type === "rocket") {
      if (special.direction === "row") {
        for (let c = 0; c < SIZE; c++) {
          targets.add(`${row},${c}`);
        }
      } else {
        for (let r = 0; r < SIZE; r++) {
          targets.add(`${r},${col}`);
        }
      }
    }

    if (special.type === "rainbow") {
      const color = typeof targetPiece === "number"
        ? targetPiece
        : randomPiece();

      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (board[r][c] === color) {
            targets.add(`${r},${c}`);
          }
        }
      }

      targets.add(`${row},${col}`);
    }
  }

  function activateTargets(targets) {
    clearing = targets;
    message = "BOOSTER ATIVADO!";
    render();

    setTimeout(() => {
      let removed = 0;

      targets.forEach(position => {
        const [row, col] = position.split(",").map(Number);

        if (board[row][col] !== null) {
          board[row][col] = null;
          removed++;
        }
      });

      score += removed * 10;
      clearing.clear();
      compactBoard();
      render();

      setTimeout(() => {
        if (findMatches().length > 0) {
          processMatches();
        } else {
          finishTurn();
        }
      }, 180);
    }, 600);
  }

  function processMatches(anchor = null) {
    const data = getMatchData();
    const matches = data.matches;

    if (matches.length === 0) {
      finishTurn();
      return;
    }

    const components = getMatchComponents(matches);

    const rainbowComponent = components
      .filter(component => component.length >= 5)
      .sort((a, b) => b.length - a.length)[0];

    const specialGroup = data.groups
      .filter(group => group.length >= 4)
      .sort((a, b) => b.length - a.length)[0];

    let keep = null;
    let special = null;

    if (rainbowComponent) {
      const anchorInComponent = anchor &&
        rainbowComponent.some(([row, col]) =>
          row === anchor.row && col === anchor.col
        );

      const position = anchorInComponent
        ? [anchor.row, anchor.col]
        : rainbowComponent[
            Math.floor(rainbowComponent.length / 2)
          ];

      keep = {
        row: position[0],
        col: position[1]
      };

      special = { type: "rainbow" };
      message = "💣 Bomba colorida criada!";

    } else if (specialGroup) {
      const anchorInGroup = anchor &&
        specialGroup.positions.some(([row, col]) =>
          row === anchor.row && col === anchor.col
        );

      const position = anchorInGroup
        ? [anchor.row, anchor.col]
        : specialGroup.positions[
            Math.floor(specialGroup.positions.length / 2)
          ];

      keep = {
        row: position[0],
        col: position[1]
      };

      special = {
        type: "rocket",
        direction: specialGroup.direction
      };

      message = "🚀 Foguete criado!";

    } else {
      message = "Combinação realizada!";
    }

    clearing = new Set(
      matches
        .filter(([row, col]) =>
          !keep ||
          row !== keep.row ||
          col !== keep.col
        )
        .map(([row, col]) => `${row},${col}`)
    );

    render();

    setTimeout(() => {
      removeMatches(matches, keep, special);
      clearing.clear();
      render();

      setTimeout(() => {
        if (findMatches().length > 0) {
          processMatches();
        } else {
          finishTurn();
        }
      }, 180);
    }, 600);
  }

  function finishTurn() {
    clearing.clear();

    if (
      score < TARGET &&
      moves > 0 &&
      !hasPossibleMove()
    ) {
      shuffleBoard();
    }

    busy = false;
    render();

    if (score >= TARGET) {
      container.innerHTML += `
        <div class="board-result">
          <h2>🏆 FASE CONCLUÍDA!</h2>
          <p>Você conseguiu ${score} pontos!</p>
          <div class="board-result-actions">
            <button class="primary-button" id="next-level">
              CONTINUAR
            </button>
            <button class="secondary-button" id="home-level">
              INÍCIO
            </button>
          </div>
        </div>
      `;

      container.querySelector("#next-level").addEventListener("click", () => {
        onComplete(score);
      });

      container.querySelector("#home-level").addEventListener("click", () => {
        onHome();
      });

    } else if (moves <= 0) {
      container.innerHTML += `
        <div class="board-result">
          <h2>😅 Fim dos movimentos!</h2>
          <p>Pontuação: ${score}</p>
          <button class="primary-button" id="retry-level">
            TENTAR NOVAMENTE
          </button>
        </div>
      `;

      container.querySelector("#retry-level").addEventListener("click", () => {
        startBoard(container, onComplete, stage);
      });
    }
  }

  createBoard();
  render();
}
