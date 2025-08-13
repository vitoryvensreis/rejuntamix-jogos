// ../js/jogo-da-memoria.js
(() => {
  const faces = ['01.png','02.png','03.png','04.png','05.png','06.png','07.png','08.png'];

  document.addEventListener('DOMContentLoaded', async () => {
    await runSplash();   // intro
    initGame();          // inicia jogo
  });

  async function runSplash(){
    const splash = document.getElementById('splash');
    if (!splash) return;

    const urls = faces.map(f => `../img/cards/${f}`)
      .concat(['../img/cards/VERSO.png', '../img/logo.png']);
    await preload(urls);

    const finish = () => {
      splash.classList.add('is-done');
      splash.addEventListener('transitionend', () => splash.remove(), { once:true });
    };
    const skip = () => finish();

    document.addEventListener('click',  skip, { once:true });
    document.addEventListener('keydown', skip, { once:true });
    document.addEventListener('touchend', skip, { once:true });

    setTimeout(finish, 900);
  }

  function preload(urls){
    return Promise.all(urls.map(u => new Promise(res => {
      const i = new Image(); i.onload = i.onerror = res; i.src = u;
    })));
  }

  function initGame(){
    const gameEl     = document.getElementById('game');
    const tempoSpan  = document.querySelector('#cronometro span');
    const pontosSpan = document.querySelector('#pontos span');

    // elementos do modal
    const modal        = document.getElementById('resultado');
    const modalTitle   = modal.querySelector('#boxinf h1');
    const modalPoints  = modal.querySelector('#boxinf h2');
    const modalButton  = modal.querySelector('#boxinf a');
    modal.classList.remove('open');                // começa fechado

    // lógica do jogo
    let deck = shuffle([...faces, ...faces]);
    let first = null, lock = false, pontos = 0, paresFeitos = 0;
    let tempo = 60, timerId = null;

    pontosSpan.textContent = '0';
    updateTime();

    // monta cartas (flip 3D)
    gameEl.innerHTML = '';
    deck.forEach(face => {
      const card = document.createElement('div');
      card.className = 'card'; card.dataset.face = face;

      const inner = document.createElement('div');
      inner.className = 'card__inner';

      const front = document.createElement('div');
      front.className = 'card__face card__face--front';
      front.innerHTML = `<img src="../img/cards/${face}" alt="carta">`;

      const back = document.createElement('div');
      back.className = 'card__face card__face--back';
      back.innerHTML = `<img src="../img/cards/VERSO.png" alt="verso">`;

      inner.append(front, back);
      card.append(inner);
      gameEl.append(card);
      card.addEventListener('click', () => onFlip(card));
    });

    // timer
    timerId = setInterval(() => {
      tempo--; updateTime();
      if (tempo <= 0) endGame(false);
    }, 1000);

    function onFlip(card){
      if (lock || card.classList.contains('matched') || card === first || tempo <= 0) return;

      showFace(card);
      if (!first){ first = card; return; }

      lock = true;
      if (first.dataset.face === card.dataset.face){
        setTimeout(() => {
          first.classList.add('matched');
          card.classList.add('matched');
          pontos += 100; paresFeitos++;
          pontosSpan.textContent = String(pontos);
          resetTurn();
          if (paresFeitos === faces.length) endGame(true);
        }, 260);
      } else {
        setTimeout(() => {
          hideFace(first); hideFace(card);
          resetTurn();
        }, 650);
      }
    }

    function showFace(c){ c.classList.add('is-flipped'); }
    function hideFace(c){ c.classList.remove('is-flipped'); }
    function resetTurn(){ first = null; lock = false; }
    function updateTime(){
      const t = Math.max(0, tempo);
      tempoSpan.textContent = `00:${String(t).padStart(2,'0')}`;
    }

    function endGame(won){
      clearInterval(timerId);
      gameEl.style.pointerEvents = 'none';

      // Adiciona confete se ganhou
      if (won) {
        createConfetti();
        playSound('win');
      } else {
        playSound('lose');
      }

      // preenche e mostra o modal
      modalTitle.textContent  = won ? 'FIM DE JOGO!' : 'TEMPO ESGOTADO!';
      modalPoints.textContent = `${pontos} Pontos`;
      modal.classList.add('open');

      // botão Reiniciar: recarrega a página (ou ajusta o href que você preferir)
      modalButton.addEventListener('click', (e) => {
        // se seu <a> aponta para outra página, remove este preventDefault
        e.preventDefault();
        location.reload();
      }, { once:true });

      // Adiciona vibração em dispositivos móveis (se suportado)
      if ('vibrate' in navigator) {
        navigator.vibrate(won ? [200, 100, 200, 100, 200] : [500]);
      }
    }
  }

  // Funcionalidade de tela cheia
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Atualiza o estado do botão quando sai/entra em tela cheia
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
      // Entra em tela cheia
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      // Sai da tela cheia
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  function updateFullscreenButton() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                           document.mozFullScreenElement || document.msFullscreenElement);
    
    btn.textContent = isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia';
    btn.classList.toggle('is-active', isFullscreen);
  }

  // Fisher–Yates
  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Sistema de confete
  function createConfetti() {
    const colors = ['#f5811e', '#ff9a3c', '#965015', '#ffffff'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 6000);
      }, i * 50);
    }
  }

  // Sistema de sons
  function playSound(type) {
    // Cria contexto de áudio se não existir
    if (!window.audioContext) {
      try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio API não suportada');
        return;
      }
    }

    const ctx = window.audioContext;
    
    if (type === 'win') {
      // Som de vitória - sequência ascendente
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          playTone(ctx, freq, 0.3, 0.2);
        }, index * 150);
      });
    } else if (type === 'lose') {
      // Som de derrota - sequência descendente
      const frequencies = [440, 369.99, 329.63]; // A4, F#4, E4
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          playTone(ctx, freq, 0.4, 0.3);
        }, index * 200);
      });
    } else if (type === 'flip') {
      // Som de virar carta
      playTone(ctx, 800, 0.1, 0.05);
    } else if (type === 'match') {
      // Som de acerto
      playTone(ctx, 1200, 0.2, 0.1);
      setTimeout(() => playTone(ctx, 1500, 0.2, 0.1), 100);
    }
  }

  function playTone(ctx, frequency, volume, duration) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }
})();