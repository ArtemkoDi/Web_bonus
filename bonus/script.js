"use strict";

const PUZZLES = [
  [
    [0,0,0, 2,6,0, 7,0,1], [6,8,0, 0,7,0, 0,9,0], [1,9,0, 0,0,4, 5,0,0],
    [8,2,0, 1,0,0, 0,4,0], [0,0,4, 6,0,2, 9,0,0], [0,5,0, 0,0,3, 0,2,8],
    [0,0,9, 3,0,0, 0,7,4], [0,4,0, 0,5,0, 0,3,6], [7,0,3, 0,1,8, 0,0,0],
  ],
  [
    [0,0,0, 0,0,0, 0,0,1], [0,0,0, 0,7,0, 0,9,0], [1,9,0, 0,0,4, 5,0,0],
    [8,2,0, 0,0,0, 0,4,0], [0,0,4, 6,0,2, 9,0,0], [0,5,0, 0,0,0, 0,2,8],
    [0,0,9, 3,0,0, 0,7,4], [0,4,0, 0,5,0, 0,3,6], [7,0,3, 0,1,8, 0,0,0],
  ]
];

let gameBoard = [];
let initialBoard = [];
let pivot = null;

const clone = b => b.map(r => r.slice());

function randomPuzzle() {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

function boardToData() {
  const out = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      out.push({
        "Рядок": `R${r}`, 
        "Стовпець": `C${c}`, 
        "Значення": gameBoard[r][c] || 0 
      });
    }
  }
  return out;
}

function isValidMove(row, col, num) {
  for (let c = 0; c < 9; c++) if (c !== col && gameBoard[row][c] === num) return { ok: false, where: 'рядку' };
  for (let r = 0; r < 9; r++) if (r !== row && gameBoard[r][col] === num) return { ok: false, where: 'стовпці' };
  
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && gameBoard[r][c] === num) return { ok: false, where: 'квадраті 3x3' };
    }
  }
  return { ok: true };
}

function isComplete() {
  return gameBoard.every(row => row.every(v => v !== 0));
}

function handleInput(row, col, rawVal, inputEl) {
  if (rawVal === '' || rawVal == null) { 
      gameBoard[row][col] = 0; 
      return; 
  }

  if (!/^[1-9]$/.test(rawVal)) {
    inputEl.value = ''; 
    setTimeout(() => alert('Введіть цифру від 1 до 9.'), 10); 
    return;
  }

  const val = parseInt(rawVal, 10);
  const check = isValidMove(row, col, val);
  
  if (!check.ok) {
    inputEl.value = '';
    setTimeout(() => alert(`Помилка! Цифра ${val} вже є у цьому ${check.where}.`), 10);
    return;
  }
  
  gameBoard[row][col] = val;
  
  if (isComplete()) {
      setTimeout(() => {
          alert("Вітаємо! Ви перемогли!");
          startGame();
      }, 100);
  }
}

function handleKeyDown(e, row, col) {
  const map = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
  if (map[e.key]) {
    e.preventDefault();
    const nr = row + map[e.key][0], nc = col + map[e.key][1];
    if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
      const next = document.querySelector(`input.sudoku-input[data-r="${nr}"][data-c="${nc}"]`);
      if (next) next.focus();
    }
  }
}

function setupGridListeners() {
  const container = document.getElementById('wdr-component');
  
  container.addEventListener('input', (e) => {
    if (e.target.classList.contains('sudoku-input')) {
      const r = parseInt(e.target.dataset.r, 10);
      const c = parseInt(e.target.dataset.c, 10);
      handleInput(r, c, e.target.value, e.target);
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('sudoku-input')) e.target.select();
  });

  container.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('sudoku-input')) {
      const r = parseInt(e.target.dataset.r, 10);
      const c = parseInt(e.target.dataset.c, 10);
      handleKeyDown(e, r, c);
    }
  });
}

function renderGameCells(cellBuilder, cellData) {
  if (cellData.type === "value" && cellData.rows && cellData.columns && cellData.rows.length > 0 && cellData.columns.length > 0) {
      
      let r = parseInt(cellData.rows[0].caption.substring(1));
      let c = parseInt(cellData.columns[0].caption.substring(1));

      if (r < 0 || r > 8 || c < 0 || c > 8) return;

      const isGiven = initialBoard[r][c] !== 0;
      const val     = gameBoard[r][c];

      cellBuilder.addClass("sudoku-cell");

      if (c === 2 || c === 5) cellBuilder.addClass("border-r-thick");
      if (r === 2 || r === 5) cellBuilder.addClass("border-b-thick");

      if (c === 8) cellBuilder.addClass("border-r-none");
      if (r === 8) cellBuilder.addClass("border-b-none");

      if (isGiven) {
          cellBuilder.text = `<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-family: 'Georgia', serif; font-size: 24px; font-weight: bold; color: #1A1A2E;">${val}</div>`;
      } else {
          const display = val !== 0 ? val : '';
          cellBuilder.text = `<input
            class="sudoku-input"
            type="text" 
            inputmode="numeric" 
            pattern="[1-9]" 
            maxlength="1"
            data-r="${r}" data-c="${c}"
            value="${display}"
          />`;
      }
  }
}

function initPivot() {
  pivot = new WebDataRocks({
    container: '#wdr-component',
    toolbar: false,
    report: {
      dataSource: { data: boardToData() },
      slice: {
        rows: [{ uniqueName: "Рядок" }],
        columns: [{ uniqueName: "Стовпець" }],
        measures: [{ uniqueName: "Значення", aggregation: "sum" }]
      },
      options: {
        grid: {
          type: "classic",
          showHeaders: false,
          showTotals: "off",
          showGrandTotals: "off",
          showFilter: false
        },
        configuratorButton: false
      }
    },
    customizeCell: renderGameCells
  });
}

function startGame() {
  const puzzle = randomPuzzle();
  initialBoard = clone(puzzle); 
  gameBoard = clone(puzzle);
  
  if (pivot) pivot.updateData({ data: boardToData() });
  else initPivot();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('restart-btn').addEventListener('click', startGame);
  setupGridListeners();
  startGame();
});