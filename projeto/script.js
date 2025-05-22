const cards = document.querySelectorAll('.card');
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchesFound = 0;
let gamesPlayed = 0;

function startGame() {
  gamesPlayed = 1;
  updateGameCounter();
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  shuffle();
}

function backToStart() {
  // Ocultar a mensagem de vitória
  document.getElementById('victory-message').classList.add('hidden');
  document.getElementById('victory-message').classList.remove('show');
  
  // Trocar as telas
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('start-screen').style.display = 'block';
  
  // Reset completo do jogo e contador
  gamesPlayed = 0;
  resetGame();
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add('flip');

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
    return;
  }

  secondCard = this;
  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;

  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);
  matchesFound++;

  if (matchesFound === 6) {
    setTimeout(() => {
      showVictoryMessage();
    }, 500);
  }

  resetBoard();
}

function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.classList.remove('flip');
    secondCard.classList.remove('flip');
    resetBoard();
  }, 1000);
}

function resetBoard() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

function showVictoryMessage() {
  document.getElementById('victory-message').classList.add('show');
  document.getElementById('victory-message').classList.remove('hidden');
}

function restartGame() {
  document.getElementById('victory-message').classList.add('hidden');
  document.getElementById('victory-message').classList.remove('show');
  gamesPlayed++;
  updateGameCounter();
  resetGame();
  shuffle();
}

function resetGame() {
  matchesFound = 0;
  resetBoard();
  
  cards.forEach(card => {
    card.classList.remove('flip');
    card.addEventListener('click', flipCard);
  });
}

function updateGameCounter() {
  document.getElementById('games-count').textContent = gamesPlayed;
}

function shuffle() {
  cards.forEach(card => {
    let randomPos = Math.floor(Math.random() * 12);
    card.style.order = randomPos;
  });
}

// Inicializar event listeners
cards.forEach(card => card.addEventListener('click', flipCard));