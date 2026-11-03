
const SIZE = 7;
const TYPES = ["💎", "🔵", "🟣", "🟢", "🟡", "🔴"];
const TARGET = 25;
const MAX_MOVES = 20;

export function startBoard(container, onComplete) {
  let board = [];
  let moves = MAX_MOVES;
  let score = 0;
  let selected = null;
  let busy = false;
  let clearing = new Set();
  let message = "Combine 3 ou mais peças iguais!";

  function randomPiece() {
    return Math.floor(Math.random() * TYPES.length);
  }

  function createBoard() {
    board = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, randomPiece)
    );

    while (findMatches().length > 0) {
      removeMatches();
    }

    score = 0;

    if (!hasPossibleMove()) {
      shuffleBoard();
    }
  }

  function findMatches() {
    const matches = new Set();

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE - 2; col++) {
        const piece = board[row][col];

        if (
          piece === board[row][col + 1] &&
          piece === board[row][col + 2]
        ) {
          matches.add(`${row},${col}`);
          matches.add(`${row},${col + 1}`);
          matches.add(`${row},${col + 2}`);
        }
      }
    }

    for (let col = 0; col < SIZE; col++) {
      for (let row = 0; row < SIZE - 2; row++) {
        const piece = board[row][col];

        if (
          piece === board[row + 1][col] &&
          piece === board[row + 2][col]
        ) {
          matches.add(`${row},${col}`);
          matches.add(`${row + 1},${col}`);
          matches.add(`${row + 2},${col}`);
        }
      }
    }

    return [...matches].map(position =>
      position.split(",").map(Number)
    );
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

  function removeMatches() {
    const matches = findMatches();

    if (matches.length === 0) return 0;

    matches.forEach(([row, col]) => {
      board[row][col] = null;
    });

    score += matches.length * 10;

    for (let col = 0; col < SIZE; col++) {
      const remaining = [];

      for (let row = SIZE - 1; row >= 0; row--) {
        if (board[row][col] !== null) {
          remaining.push(board[row][col]);
        }
      }

      while (remaining.length < SIZE) {
        remaining.push(randomPiece());
      }

      for (let row = SIZE - 1; row >= 0; row--) {
        board[row][col] = remaining[SIZE - 1 - row];
      }
    }

    return matches.length;
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
          <strong>${TARGET * 10}</strong>
        </div>
      </div>

      <div class="game-board">
        ${board.map((line, row) =>
          line.map((piece, col) => `
            <button
              class="game-piece
                ${selected && selected.row === row && selected.col === col ? "selected" : ""}
                ${clearing.has(`${row},${col}`) ? "clearing" : ""}"
              data-row="${row}"
              data-col="${col}"
              aria-label="Peça ${row + 1}, ${col + 1}"
              ${clearing.has(`${row},${col}`) ? "disabled" : ""}
            >
              ${TYPES[piece]}
            </button>
          `).join("")
        ).join("")}
      </div>

      <p class="board-message">
        ${message}
      </p>
    `;

    container.querySelectorAll(".game-piece").forEach(button => {
      button.addEventListener("click", () => {
        handleSelection(
          Number(button.dataset.row),
          Number(button.dataset.col)
        );
      });
    });
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
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" }
          ]
        : [
            { transform: "translate(0, 0)" },
            { transform: `translate(${dx}px, ${dy}px)` }
          ],
      {
        duration: 280,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    );

    const secondAnimation = second.animate(
      reverse
        ? [
            { transform: `translate(${-dx}px, ${-dy}px)` },
            { transform: "translate(0, 0)" }
          ]
        : [
            { transform: "translate(0, 0)" },
            { transform: `translate(${-dx}px, ${-dy}px)` }
          ],
      {
        duration: 280,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    );

    return Promise.all([
      firstAnimation.finished.catch(() => {}),
      secondAnimation.finished.catch(() => {})
    ]);
  }

  function handleSelection(row, col) {
    if (busy || moves <= 0 || score >= TARGET * 10) return;

    if (!selected) {
      selected = { row, col };
      render();
      return;
    }

    const distance =
      Math.abs(selected.row - row) +
      Math.abs(selected.col - col);

    if (distance !== 1) {
      selected = { row, col };
      render();
      return;
    }

    const first = selected;
    selected = null;

    swap(first.row, first.col, row, col);
  }

  function swap(row1, col1, row2, col2) {
    if (busy) return;

    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;

    busy = true;

    if (findMatches().length === 0) {
      animateSwap(row1, col1, row2, col2)
        .then(() => {
          const reverse = board[row1][col1];
          board[row1][col1] = board[row2][col2];
          board[row2][col2] = reverse;

          return animateSwap(row1, col1, row2, col2, true);
        })
        .then(() => {
          selected = null;
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
        processMatches();
      });
  }

  function processMatches() {
    const matches = findMatches();

    if (matches.length === 0) {
      finishTurn();
      return;
    }

    clearing = new Set(
      matches.map(([row, col]) => `${row},${col}`)
    );

    render();

    setTimeout(() => {
      clearing.clear();
      removeMatches();
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
      score < TARGET * 10 &&
      moves > 0 &&
      !hasPossibleMove()
    ) {
      shuffleBoard();
    }

    busy = false;
    render();

    if (score >= TARGET * 10) {
      container.innerHTML += `
        <div class="board-result">
          <h2>🏆 FASE CONCLUÍDA!</h2>
          <p>Você conseguiu ${score} pontos!</p>
          <button class="primary-button" id="next-level">
            CONTINUAR
          </button>
        </div>
      `;

      container.querySelector("#next-level").addEventListener("click", () => {
        onComplete(score);
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
        startBoard(container, onComplete);
      });
    }
  }

  createBoard();
  render();
}
