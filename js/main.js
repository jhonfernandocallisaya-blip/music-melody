// Frecuencias (en Hz) de cada nota, correspondientes a las teclas del piano
const frecuencias = {
  C4: 261.63,
  Db4: 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Gb4: 369.99,
  G4: 392.00,
  Ab4: 415.30,
  A4: 440.00,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25
};

// Contexto de audio (se crea una sola vez)
let contextoAudio = null;

function obtenerContextoAudio() {
  if (!contextoAudio) {
    contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
  }
  return contextoAudio;
}

// Reproduce una nota durante un tiempo corto, con un ataque y caída suaves
function reproducirNota(nota) {
  const frecuencia = frecuencias[nota];
  if (!frecuencia) return;

  const ctx = obtenerContextoAudio();
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();

  oscilador.type = 'triangle'; // tipo de onda, suena más suave que 'square'
  oscilador.frequency.value = frecuencia;

  // Envolvente de volumen: sube rápido y baja gradualmente (como una nota de piano)
  const ahora = ctx.currentTime;
  ganancia.gain.setValueAtTime(0, ahora);
  ganancia.gain.linearRampToValueAtTime(0.3, ahora + 0.02);
  ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 1);

  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);

  oscilador.start(ahora);
  oscilador.stop(ahora + 1);
}

// Conecta el sonido a cada tecla del piano (si existe en la página)
const teclas = document.querySelectorAll('.tecla');

teclas.forEach(tecla => {
  tecla.addEventListener('mousedown', () => {
    const nota = tecla.dataset.nota;
    reproducirNota(nota);
    tecla.classList.add('tecla-activa');
  });

  tecla.addEventListener('mouseup', () => {
    tecla.classList.remove('tecla-activa');
  });

  tecla.addEventListener('mouseleave', () => {
    tecla.classList.remove('tecla-activa');
  });
});

// Frecuencias de las 6 cuerdas al aire (afinación estándar)
const frecuenciasCuerdas = {
  E2: 82.41,
  A2: 110.00,
  D3: 146.83,
  G3: 196.00,
  B3: 246.94,
  E4: 329.63
};

function reproducirCuerda(nota) {
  const frecuencia = frecuenciasCuerdas[nota];
  if (!frecuencia) return;

  const ctx = obtenerContextoAudio();
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();

  oscilador.type = 'sawtooth'; // onda más brillante, parecida a una cuerda punteada
  oscilador.frequency.value = frecuencia;

  const ahora = ctx.currentTime;
  ganancia.gain.setValueAtTime(0.25, ahora);
  ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 1.5); // caída larga, como una cuerda vibrando

  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);

  oscilador.start(ahora);
  oscilador.stop(ahora + 1.5);
}

const cuerdas = document.querySelectorAll('.cuerda');

cuerdas.forEach(cuerda => {
  cuerda.addEventListener('click', () => {
    const nota = cuerda.dataset.nota;
    reproducirCuerda(nota);
    cuerda.classList.add('cuerda-activa');
    setTimeout(() => cuerda.classList.remove('cuerda-activa'), 300);
  });
});

// Genera un golpe de percusión usando ruido blanco filtrado (no un tono puro)
function reproducirPercusion(tipo) {
  const ctx = obtenerContextoAudio();
  const ahora = ctx.currentTime;

  // Buffer de ruido blanco
  const duracionRuido = tipo === 'kick' ? 0.5 : 0.3;
  const bufferSize = ctx.sampleRate * duracionRuido;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    datos[i] = Math.random() * 2 - 1;
  }

  const fuenteRuido = ctx.createBufferSource();
  fuenteRuido.buffer = buffer;

  const filtro = ctx.createBiquadFilter();
  const ganancia = ctx.createGain();

  // Cada pieza usa un tipo de filtro y frecuencia distinta para sonar diferente
  const configuraciones = {
    hihat:  { tipoFiltro: 'highpass', frecuencia: 8000, volumen: 0.2, caida: 0.1 },
    crash:  { tipoFiltro: 'highpass', frecuencia: 5000, volumen: 0.25, caida: 0.8 },
    tom1:   { tipoFiltro: 'lowpass',  frecuencia: 400,  volumen: 0.4, caida: 0.3 },
    tom2:   { tipoFiltro: 'lowpass',  frecuencia: 250,  volumen: 0.4, caida: 0.35 },
    snare:  { tipoFiltro: 'bandpass', frecuencia: 1800, volumen: 0.5, caida: 0.2 },
    kick:   { tipoFiltro: 'lowpass',  frecuencia: 120,  volumen: 0.7, caida: 0.4 }
  };

  const config = configuraciones[tipo] || configuraciones.snare;

  filtro.type = config.tipoFiltro;
  filtro.frequency.value = config.frecuencia;

  ganancia.gain.setValueAtTime(config.volumen, ahora);
  ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + config.caida);

  fuenteRuido.connect(filtro);
  filtro.connect(ganancia);
  ganancia.connect(ctx.destination);

  fuenteRuido.start(ahora);
  fuenteRuido.stop(ahora + config.caida);
}

// Conecta el sonido a cada pieza al hacer clic
const piezasBateria = document.querySelectorAll('.pieza');

piezasBateria.forEach(pieza => {
  pieza.addEventListener('mousedown', () => {
    reproducirPercusion(pieza.dataset.sonido);
    pieza.classList.add('pieza-activa');
  });
  pieza.addEventListener('mouseup', () => pieza.classList.remove('pieza-activa'));
  pieza.addEventListener('mouseleave', () => pieza.classList.remove('pieza-activa'));
});

// Además, permite tocar la batería con el teclado (Q W E A S D)
document.addEventListener('keydown', (evento) => {
  const pieza = document.querySelector(`[data-tecla="${evento.key.toUpperCase()}"]`);
  if (pieza && !evento.repeat) {
    reproducirPercusion(pieza.dataset.sonido);
    pieza.classList.add('pieza-activa');
  }
});

document.addEventListener('keyup', (evento) => {
  const pieza = document.querySelector(`[data-tecla="${evento.key.toUpperCase()}"]`);
  if (pieza) {
    pieza.classList.remove('pieza-activa');
  }
});