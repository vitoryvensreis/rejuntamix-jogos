(() => {
  // 6 setores iguais (60°). Ordem mapeada do TOPO, sentido horário.
  const SECTORS = [
    { label: 'BRINDE ESPECIAL', type: 'brinde' },
    { label: 'TENTE OUTRA VEZ', type: 'tente'   },
    { label: 'BRINDE ESPECIAL', type: 'brinde2' },
    { label: 'PASSOU A VEZ',    type: 'passou' },
    { label: 'TENTE OUTRA VEZ', type: 'tente'  },
    { label: 'PASSOU A VEZ',    type: 'passou' }
  ];
  const N = SECTORS.length;
  const SEG_ANGLE = 360 / N;
  // Índices proibidos (0 = setor do topo, sentido horário). Ajuste conforme seu layout.
  const FORBIDDEN = new Set([0, 3]);

  function pickAllowedIndex() {
    const allowed = [];
    for (let i = 0; i < N; i++) if (!FORBIDDEN.has(i)) allowed.push(i);
    return allowed[Math.floor(Math.random() * allowed.length)];
  }

  const wheel   = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const status  = document.getElementById('status');

  const modal     = document.getElementById('resultado');
  const resTitulo = document.getElementById('res-titulo');
  const resTexto  = document.getElementById('res-texto');
  const resBtn    = document.getElementById('res-btn');
  const resimg  = document.getElementById('imgres');

  let spinning = false;
  let currentRotation = 0;

  document.addEventListener('DOMContentLoaded', async () => {
    // desabilita o botão até a intro terminar
    spinBtn.disabled = true;
    await runSplash();
    spinBtn.disabled = false;
  });

  function rand(min, max){ return Math.random() * (max - min) + min; }
  function randInt(min, max){ return Math.floor(rand(min, max + 1)); }

  spinBtn.addEventListener('click', () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    status.textContent = 'Girando...';

    const targetIndex = pickAllowedIndex(); // <— nunca sorteia os proibidos
    const turns = randInt(5, 8) * 360;
    const jitter = rand(-(SEG_ANGLE/2 - 2), (SEG_ANGLE/2 - 2));
    const targetRotation = turns - (targetIndex * SEG_ANGLE) + jitter;

    currentRotation += targetRotation;
    wheel.style.transform = `rotate(${currentRotation}deg)`;

    wheel.addEventListener('transitionend', () => {
      const final = ((-currentRotation % 360) + 360) % 360;
      const idx   = Math.floor((final + SEG_ANGLE/2) / SEG_ANGLE) % N;
      const result = SECTORS[idx];

      status.textContent = `Resultado: ${result.label}`;
      
      // Adiciona efeitos baseados no resultado
      if (result.type === 'brinde' || result.type === 'brinde2') {
        createConfetti();
        playSound('win');
      } else {
        playSound('neutral');
      }
      
      //POP RESULTADO
      if(result.label == "BRINDE ESPECIAL" && result.type == "brinde"){
        resimg.src = "../img/02.png";
      }else if(result.label == "TENTE OUTRA VEZ" || result.label == "PASSOU A VEZ"){
        resimg.src = "../img/06.png";
      }else{
        resimg.src = "../img/05.png";
      }
      resTitulo.textContent = 'Resultado';
      resTexto.textContent  = result.label;
      modal.classList.add('open');

      const close = (e) => {
        e && e.preventDefault();
        modal.classList.remove('open');
        spinBtn.disabled = false;
        spinning = false;
        resBtn.removeEventListener('click', close);
      };
      resBtn.addEventListener('click', close);

      // Adiciona vibração em dispositivos móveis (se suportado)
      if ('vibrate' in navigator) {
        if (result.type === 'brinde' || result.type === 'brinde2') {
          navigator.vibrate([200, 100, 200, 100, 200, 100, 200]); // Vibração de sucesso
        } else {
          navigator.vibrate([150, 50, 150]); // Vibração neutra
        }
      }
    }, { once:true });
  });

  // ===== Splash =====
  async function runSplash(){
    const splash = document.getElementById('splash');
    if (!splash) return;

    // pré-carrega imagens
    await preload(['../img/roleta.png','../img/logo.png','../img/icon.png']);

    const finish = () => {
      splash.classList.add('is-done');
      splash.addEventListener('transitionend', () => splash.remove(), { once:true });
    };

    // permitir "pular" por interação
    const skip = () => finish();
    document.addEventListener('click',  skip, { once:true });
    document.addEventListener('keydown', skip, { once:true });
    document.addEventListener('touchend', skip, { once:true });

    // fecha automático rapidinho
    setTimeout(finish, 900);
  }

  function preload(urls){
    return Promise.all(urls.map(u => new Promise(res => {
      const i = new Image(); i.onload = i.onerror = res; i.src = u;
    })));
  }

  // Sistema de confete
  function createConfetti() {
    const colors = ['#f5811e', '#ff9a3c', '#965015', '#ffffff'];
    const confettiCount = 40;
    
    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 5000);
      }, i * 40);
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
    } else if (type === 'neutral') {
      // Som neutro
      playTone(ctx, 600, 0.2, 0.3);
    } else if (type === 'spin') {
      // Som de girar
      playTone(ctx, 400, 0.1, 0.1);
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
