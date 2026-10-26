// ===== CONFIGURACIÓN (EDITAR) =====
// Número de WhatsApp en formato internacional, sin "+" ni espacios. Ej: "34600123456"
const WHATSAPP = "34622934029";
const WHATSAPP_MSG = "¡Hola Samuel! He visto tu web y me interesa una página para mi negocio.";

// Webs de ejemplo del escaparate de la portada: palabra del titular + dirección que se ve en el navegador
const SHOWCASE = [
  { word: "restaurante", url: "casaolivo.es" },
  { word: "peluquería", url: "studionova.es" },
  { word: "empresa", url: "reformasmartin.es" },
  { word: "clínica", url: "nucleofisio.es" },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ----- Enlaces de WhatsApp -----
const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
document.querySelectorAll(".js-whatsapp").forEach((a) => (a.href = waUrl));

// ----- Año del footer -----
document.getElementById("year").textContent = new Date().getFullYear();

// ----- Nav: fondo al hacer scroll, menú móvil y sección activa -----
const nav = document.getElementById("nav");
const navLinks = document.getElementById("navLinks");
const navToggle = document.getElementById("navToggle");

const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const setMenu = (open) => {
  navLinks.classList.toggle("open", open);
  nav.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
};
navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]:not(.btn)')];
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      sectionLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${e.target.id}`));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

// ----- Aparición al hacer scroll (con escalonado dentro de cada grupo) -----
const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
  revealer.observe(el);
});

// ----- Escaparate de la portada: rota las webs de ejemplo junto con la palabra del titular -----
const rotator = document.getElementById("rotator");
const showUrl = document.getElementById("showUrl");
const dots = [...document.querySelectorAll(".show-dots button")];
const browserSlides = [...document.querySelectorAll(".browser__screen .slide")];
const phoneSlides = [...document.querySelectorAll(".phone__screen .slide")];
let current = 0;
let timer;

// Las demos solo se cargan cuando van a mostrarse (la portada pesa mucho menos, sobre todo en el móvil)
const phone = document.querySelector(".phone");
const loadFrame = (f) => { if (f && f.dataset.src && !f.src) f.src = f.dataset.src; };
const loadSlide = (i) => {
  loadFrame(browserSlides[i]);
  if (phone.offsetParent) loadFrame(phoneSlides[i]);
};

const showSlide = (i) => {
  current = i;
  loadSlide(i);
  setTimeout(() => loadSlide((i + 1) % SHOWCASE.length), 1500); // precarga la siguiente
  [browserSlides, phoneSlides, dots].forEach((list) =>
    list.forEach((el, n) => el.classList.toggle("is-active", n === i))
  );
  showUrl.textContent = SHOWCASE[i].url;
  rotator.classList.add("out");
  setTimeout(() => {
    rotator.textContent = SHOWCASE[i].word;
    rotator.classList.remove("out");
  }, 350);
};
const startShow = () => {
  clearInterval(timer);
  if (!reduceMotion) timer = setInterval(() => showSlide((current + 1) % SHOWCASE.length), 4500);
};
const goTo = (i) => { showSlide((i + SHOWCASE.length) % SHOWCASE.length); startShow(); };
dots.forEach((d, n) => d.addEventListener("click", () => goTo(n)));
document.getElementById("showPrev").addEventListener("click", () => goTo(current - 1));
document.getElementById("showNext").addEventListener("click", () => goTo(current + 1));

// Deslizar (dedo o ratón) para pasar a la web siguiente o a la anterior
const showcase = document.querySelector(".showcase");
let swipe = null;
showcase.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
  if (e.pointerType === "mouse") showcase.classList.add("dragging");
});
const endSwipe = (e) => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  swipe = null;
  showcase.classList.remove("dragging");
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goTo(current + (dx < 0 ? 1 : -1));
};
window.addEventListener("pointerup", endSwipe);
window.addEventListener("pointercancel", () => { swipe = null; showcase.classList.remove("dragging"); });
showcase.addEventListener("dragstart", (e) => e.preventDefault());

// Arranca cuando la página ya ha cargado, y se pausa cuando la portada no está en pantalla
window.addEventListener("load", () => {
  loadSlide(0);
  setTimeout(() => loadSlide(1), 2500);
});
new IntersectionObserver(([e]) => (e.isIntersecting ? startShow() : clearInterval(timer))).observe(
  document.querySelector(".showcase")
);

// Escala las webs dentro del navegador y del móvil al tamaño de su pantalla
const fitScreen = (screen, baseWidth) => {
  const s = screen.clientWidth / baseWidth;
  screen.querySelectorAll("iframe").forEach((f) => {
    f.style.width = `${baseWidth}px`;
    f.style.height = `${screen.clientHeight / s}px`;
    f.style.transform = `scale(${s})`;
  });
};
const fitShowcase = () => {
  fitScreen(document.querySelector(".browser__screen"), 1280);
  fitScreen(document.querySelector(".phone__screen"), 390);
};

// ----- Contadores animados -----
const counter = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const dur = reduceMotion ? 0 : 1400;
      const tick = (now) => {
        const p = dur ? Math.min(Math.max((now - start) / dur, 0), 1) : 1; // el primer fotograma puede ser anterior a start
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counter.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll("[data-count]").forEach((el) => counter.observe(el));

// ----- Efectos de ratón (solo en dispositivos con puntero fino) -----
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  const root = document.documentElement;
  window.addEventListener("pointermove", (e) => {
    root.style.setProperty("--mx", `${e.clientX}px`);
    root.style.setProperty("--my", `${e.clientY}px`);
  }, { passive: true });

  // Inclinación 3D de tarjetas + brillo que sigue al ratón
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      card.style.setProperty("--cx", `${x * 100}%`);
      card.style.setProperty("--cy", `${y * 100}%`);
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });

  // Botón magnético
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
  });
}

// ----- Escalar las vistas previas de las demos al ancho de su tarjeta -----
const previews = document.querySelectorAll(".project__preview");
const fitPreviews = () => previews.forEach((p) => p.style.setProperty("--s", p.clientWidth / 1280));
const fitAll = () => { fitPreviews(); fitShowcase(); };
new ResizeObserver(fitAll).observe(document.body);
fitAll();

// ----- Carruseles del móvil (proyectos y paquetes): puntos y flechas siguen a la tarjeta visible -----
const carousel = (track, nav, start = 0) => {
  const cards = [...track.children];
  const dots = [...nav.querySelectorAll(".show-dots button")];
  const [prev, next] = nav.querySelectorAll(".show-arrow");
  let cur = 0, target = null;
  const offset = (i) => cards[i].offsetLeft - cards[0].offsetLeft;
  const mark = (i) => { cur = i; dots.forEach((d, n) => d.classList.toggle("is-active", n === i)); };
  const go = (i, smooth = !reduceMotion) => {
    i = Math.max(0, Math.min(cards.length - 1, i));
    target = i; // mientras dura el desplazamiento suave, las flechas parten de la tarjeta de destino
    mark(i);
    track.scrollTo({ left: offset(i), behavior: smooth ? "smooth" : "auto" });
  };
  track.addEventListener("scroll", () => {
    const i = Math.round(track.scrollLeft / (offset(1) || 1));
    if (target !== null) { if (i === target) target = null; return; }
    mark(Math.min(i, cards.length - 1));
  }, { passive: true });
  track.addEventListener("touchstart", () => (target = null), { passive: true });
  dots.forEach((d, n) => d.addEventListener("click", () => go(n)));
  prev.addEventListener("click", () => go(cur - 1));
  next.addEventListener("click", () => go(cur + 1));
  if (start && nav.offsetParent) go(start, false); // solo cuando el carrusel está activo (móvil)
};
carousel(document.querySelector(".projects"), document.getElementById("projNav"));
// Los paquetes empiezan en el "Más elegido"
carousel(document.querySelector(".pricing"), document.getElementById("planNav"), 1);

// ----- Botones "Lo quiero" de precios preseleccionan el plan -----
document.querySelectorAll("[data-plan]").forEach((btn) =>
  btn.addEventListener("click", () => (document.getElementById("f-plan").value = btn.dataset.plan))
);

// ----- Formulario: compone el mensaje y lo abre en WhatsApp o en el correo (no guarda ningún dato) -----
const EMAIL = "scarmar0110@gmail.com";
const form = document.getElementById("contactForm");
const buildMessage = () => {
  const d = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, v.trim()]));
  const intro = [`¡Hola Samuel! Soy ${d.nombre}.`];
  if (d.negocio) intro.push(`Mi negocio: ${d.negocio}`);
  intro.push(`Plan que me interesa: ${d.plan}`);
  return `${intro.join("\n")}\n\n${d.mensaje}`;
};
form.addEventListener("submit", (e) => {
  e.preventDefault();
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`, "_blank", "noopener");
});
document.getElementById("sendEmail").addEventListener("click", () => {
  if (!form.reportValidity()) return;
  const subject = encodeURIComponent("Presupuesto para mi web");
  location.href = `mailto:${EMAIL}?subject=${subject}&body=${encodeURIComponent(buildMessage())}`;
});
