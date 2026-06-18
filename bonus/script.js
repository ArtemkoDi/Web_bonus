"use strict";


let gameBoard = [];
let initialBoard = [];
let pivot = null;
let timerInterval;
let seconds = 0;

const clone = b => b.map(r => r.slice());

function isSafe(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) {
      return false; 
    }
  }
  let startRow = Math.floor(row / 3) * 3;
  let startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) {
        return false;
      }
    }
  }
  return true;
}

function fillBoard(board) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
            let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (let num of nums) {
                if (isSafe(board, i, j, num)) {
                board[i][j] = num; 
                if (fillBoard(board)) {
                return true; 
            }
            board[i][j] = 0; 
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle() {
  let board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  let cellsToRemove = 48;
  while (cellsToRemove > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      cellsToRemove--;
    }
  }
  return board;
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
    gameBoard[row][col] = 0;
    setTimeout(() => alert('Введіть цифру від 1 до 9.'), 10); 
    return;
  }

  const val = parseInt(rawVal, 10);
  const check = isValidMove(row, col, val);
  
  if (!check.ok) {
    inputEl.value = '';
    gameBoard[row][col] = 0;
    setTimeout(() => alert(`Помилка! Цифра ${val} вже є у цьому ${check.where}.`), 10);
    return;
  }
  
  gameBoard[row][col] = val;
  
  if (isComplete()) {
    const finalTime = stopTimer();
    setTimeout(() => {
        alert(`Вітаємо! Ви перемогли! Ваш час: ${finalTime}`);
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

function updateTimer() {
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    
    if (m < 10) m = "0" + m;
    if (s < 10) s = "0" + s;
    
    document.getElementById('timer').textContent = `⏱ ${m}:${s}`;
}

function startTimer() {
    clearInterval(timerInterval); 
    seconds = 0;    
    updateTimer();  
    
    timerInterval = setInterval(() => {
        seconds++;
        updateTimer();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    return document.getElementById('timer').textContent; 
}

function startGame() {
  const puzzle = generatePuzzle();
  initialBoard = clone(puzzle); 
  gameBoard = clone(puzzle);
  
  if (pivot) pivot.updateData({ data: boardToData() });
  else initPivot();
  startTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('restart-btn').addEventListener('click', startGame);
  setupGridListeners();
  startGame();
});