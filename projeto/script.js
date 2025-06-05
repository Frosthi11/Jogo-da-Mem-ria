// Variáveis globais
let cards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchesFound = 0;
let gamesPlayed = 0;
let currentDifficulty = 'easy';
let gameTimer = null;
let startTime = null;
let elapsedTime = 0;
let moves = 0;
let score = 0;
let soundEnabled = true;

// Configurações de dificuldade
const difficulties = {
  easy: {
    rows: 2,
    cols: 3,
    pairs: 6,
    fruits: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍍'],
    timeBonus: 500,
    baseScore: 100
  },
  medium: {
    rows: 3,
    cols: 4,
    pairs: 12,
    fruits: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍍', '🥝', '🍑', '🍊', '🥭', '🍒', '🍈'],
    timeBonus: 300,
    baseScore: 150
  },
  hard: {
    rows: 4,
    cols: 5,
    pairs: 20,
    fruits: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍍', '🥝', '🍑', '🍊', '🥭', '🍒', '🍈', '🥥', '🍐', '🍋', '🥑', '🫐', '🍅', '🌶️', '🌽'],
    timeBonus: 200,
    baseScore: 200
  }
};

// Controle de som
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
  if (!soundEnabled) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playFlipSound() {
  playSound(800, 0.1);
}

function playMatchSound() {
  playSound(1200, 0.2);
  setTimeout(() => playSound(1600, 0.2), 100);
}

function playVictorySound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((note, index) => {
    setTimeout(() => playSound(note, 0.3), index * 150);
  });
}

function playErrorSound() {
  playSound(200, 0.3, 'sawtooth');
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
}

// Seleção de dificuldade
function selectDifficulty(difficulty) {
  currentDifficulty = difficulty;
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  event.target.classList.add('selected');
}

// Iniciar jogo
function startGame() {
  gamesPlayed = gamesPlayed === 0 ? 1 : gamesPlayed;
  updateGameCounter();
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  
  resetGameStats();
  createGameBoard();
  startTimer();
}

// Criar tabuleiro baseado na dificuldade
function createGameBoard() {
  const gameBoard = document.getElementById('game-board');
  const config = difficulties[currentDifficulty];
  
  gameBoard.className = `memory-game ${currentDifficulty}`;
  gameBoard.innerHTML = '';
  
  // Criar array de cartas
  const cardData = [];
  for (let i = 0; i < config.pairs; i++) {
    cardData.push(config.fruits[i], config.fruits[i]);
  }
  
  // Embaralhar
  shuffleArray(cardData);
  
  // Criar elementos HTML das cartas
  cardData.forEach((fruit, index) => {
    const card = document.createElement('div');
    card.className = `card ${currentDifficulty}`;
    card.dataset.fruit = fruit;
    card.innerHTML = `
      <div class="front">?</div>
      <div class="back">${fruit}</div>
    `;
    card.addEventListener('click', flipCard);
    gameBoard.appendChild(card);
  });
  
  cards = document.querySelectorAll('.card');
}

// Embaralhar array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Timer
function startTimer() {
  startTime = Date.now();
  gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  elapsedTime = Date.now() - startTime;
  const seconds = Math.floor(elapsedTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  document.getElementById('time-display').textContent = 
    `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

// Virar carta
function flipCard() {
  if (lockBoard || this === firstCard || this.classList.contains('matched')) return;

  playFlipSound();
  this.classList.add('flip');
  moves++;
  updateMoves();

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
    return;
  }

  secondCard = this;
  checkForMatch();
}

// Verificar combinação
function checkForMatch() {
  const isMatch = firstCard.dataset.fruit === secondCard.dataset.fruit;
  
  if (isMatch) {
    disableCards();
    playMatchSound();
  } else {
    unflipCards();
    playErrorSound();
  }
}

// Desabilitar cartas combinadas
function disableCards() {
  firstCard.classList.add('matched', 'match-animation');
  secondCard.classList.add('matched', 'match-animation');
  
  // Remover animação após um tempo
  setTimeout(() => {
    firstCard.classList.remove('match-animation');
    secondCard.classList.remove('match-animation');
  }, 600);
  
  matchesFound++;
  updateScore();

  if (matchesFound === difficulties[currentDifficulty].pairs) {
    setTimeout(() => {
      endGame();
    }, 1000);
  }

  resetBoard();
}

// Desvirar cartas não combinadas
function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.classList.remove('flip');
    secondCard.classList.remove('flip');
    resetBoard();
  }, 1000);
}

// Resetar tabuleiro
function resetBoard() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

// Atualizar pontuação
function updateScore() {
  const config = difficulties[currentDifficulty];
  const timeBonus = Math.max(0, config.timeBonus - Math.floor(elapsedTime / 1000));
  const matchBonus = config.baseScore;
  const efficiency = Math.max(0, 100 - (moves - matchesFound * 2) * 5);
  
  score += matchBonus + timeBonus + efficiency;
  document.getElementById('score-display').textContent = score;
}

// Atualizar jogadas
function updateMoves() {
  document.getElementById('moves-display').textContent = moves;
}

// Atualizar contador de partidas
function updateGameCounter() {
  document.getElementById('games-count').textContent = gamesPlayed;
}

// Resetar estatísticas
function resetGameStats() {
  matchesFound = 0;
  moves = 0;
  score = 0;
  elapsedTime = 0;
  
  document.getElementById('score-display').textContent = '0';
  document.getElementById('moves-display').textContent = '0';
  document.getElementById('time-display').textContent = '00:00';
}

// Finalizar jogo
function endGame() {
  stopTimer();
  playVictorySound();
  
  // Calcular estatísticas finais
  const totalPairs = difficulties[currentDifficulty].pairs;
  const perfectMoves = totalPairs * 2;
  const accuracy = Math.round((perfectMoves / moves) * 100);
  
  // Atualizar display final
  const finalTime = document.getElementById('time-display').textContent;
  document.getElementById('final-time').textContent = finalTime;
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-moves').textContent = moves;
  document.getElementById('accuracy').textContent = accuracy + '%';
  
  // Mostrar mensagem de vitória
  document.getElementById('victory-message').classList.remove('hidden');
  document.getElementById('victory-message').classList.add('show');
}

// Reiniciar jogo
function restartGame() {
  document.getElementById('victory-message').classList.add('hidden');
  document.getElementById('victory-message').classList.remove('show');
  
  gamesPlayed++;
  updateGameCounter();
  resetGameStats();
  createGameBoard();
  startTimer();
}

// Voltar ao início
function backToStart() {
  document.getElementById('victory-message').classList.add('hidden');
  document.getElementById('victory-message').classList.remove('show');
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('start-screen').style.display = 'block';
  
  stopTimer();
  gamesPlayed = 0;
  resetGameStats();
}

// Desistir da partida
function quitGame() {
  if (confirm('Tem certeza que deseja desistir da partida atual?')) {
    stopTimer();
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    resetGameStats();
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Ativar contexto de áudio no primeiro clique
  document.addEventListener('click', function() {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, { once: true });
});
