/* ============================================================
   TELA 1 · ANIMAÇÃO DOS PONTOS (Anime.js v4 — Enhanced Transforms)
   https://animejs.com/ — anima escala + translateY + opacidade de
   forma independente e sem conflito em cada nó do grafo de conexões.
   ============================================================ */
(function initNodeFieldAnimation(){
  if (typeof anime === 'undefined') return;
  const { animate, stagger } = anime;
  const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  animate('.node-field circle.pulse', {
    scale: [
      { to: 1.7, duration: 950, ease: 'inOutSine' },
      { to: 1, duration: 950, ease: 'inOutSine' }
    ],
    translateY: [
      { to: -3, duration: 950, ease: 'inOutSine' },
      { to: 0, duration: 950, ease: 'inOutSine' }
    ],
    opacity: [
      { to: .95, duration: 950, ease: 'inOutSine' },
      { to: .22, duration: 950, ease: 'inOutSine' }
    ],
    loop: true,
    delay: stagger(240, { from: 'center' })
  });

  animate('.node-field circle:not(.pulse)', {
    scale: [
      { to: 1.2, duration: 1400, ease: 'inOutSine' },
      { to: 1, duration: 1400, ease: 'inOutSine' }
    ],
    opacity: [
      { to: .62, duration: 1400, ease: 'inOutSine' },
      { to: .3, duration: 1400, ease: 'inOutSine' }
    ],
    loop: true,
    delay: stagger(320)
  });
})();
