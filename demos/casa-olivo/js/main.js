// ===== Casa Olivo · interacciones compartidas =====
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Horario (0 = domingo). null = cerrado
const HOURS = [
  { day: "Domingo", open: "12:30 – 16:30", ranges: [[750, 990]] },
  { day: "Lunes", open: "Cerrado", ranges: [] },
  { day: "Martes", open: "12:30 – 16:30 · 20:00 – 23:30", ranges: [[750, 990], [1200, 1410]] },
  { day: "Miércoles", open: "12:30 – 16:30 · 20:00 – 23:30", ranges: [[750, 990], [1200, 1410]] },
  { day: "Jueves", open: "12:30 – 16:30 · 20:00 – 23:30", ranges: [[750, 990], [1200, 1410]] },
  { day: "Viernes", open: "12:30 – 17:00 · 20:00 – 00:30", ranges: [[750, 1020], [1200, 1470]] },
  { day: "Sábado", open: "12:30 – 17:00 · 20:00 – 00:30", ranges: [[750, 1020], [1200, 1470]] },
];

// ----- Navegación -----
const nav = $(".nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
if (nav.classList.contains("nav--over")) {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
$(".burger").addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  $(".burger").setAttribute("aria-expanded", String(open));
});

// ----- Transición suave entre páginas de la demo -----
const fade = document.createElement("div");
fade.className = "page-fade";
document.body.append(fade);
$$('a[href$=".html"]').forEach((a) => {
  if (a.target || a.getAttribute("href").startsWith("http") || a.getAttribute("href").startsWith("../")) return;
  a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || reduce) return;
    e.preventDefault();
    fade.classList.add("on");
    setTimeout(() => (location.href = a.href), 320);
  });
});
window.addEventListener("pageshow", () => fade.classList.remove("on"));

// ----- Titulares que aparecen palabra a palabra -----
$$(".split").forEach((el) => {
  let i = 0;
  const wrapWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) return frag.append(part);
          const w = document.createElement("span");
          w.className = "w";
          w.innerHTML = `<span style="--i:${i++}">${part}</span>`;
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        wrapWords(child);
      }
    });
  };
  wrapWords(el);
});

// ----- Aparición al hacer scroll -----
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }),
  { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
);
$$(".rv, .rv-img, .split").forEach((el) => {
  const group = el.parentElement ? $$(":scope > .rv", el.parentElement) : [];
  if (group.length > 1) el.style.setProperty("--d", `${Math.min(group.indexOf(el), 5) * 0.1}s`);
  io.observe(el);
});

// ----- Parallax ligero -----
const parallax = $$("[data-parallax]");
if (parallax.length && !reduce) {
  const tick = () => {
    parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.transform = `translate3d(0, ${p * -Number(el.dataset.parallax)}px, 0)`;
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ----- Línea de tiempo que se va rellenando al bajar -----
const timeline = $("#timeline");
if (timeline) {
  const fill = () => {
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    timeline.style.setProperty("--p", `${p * 100}%`);
  };
  window.addEventListener("scroll", fill, { passive: true });
  fill();
}

// ----- Contadores -----
const counters = new IntersectionObserver((entries) =>
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, to = Number(el.dataset.count), t0 = performance.now(), dur = reduce ? 0 : 1600;
    const step = (now) => {
      const p = dur ? Math.min(Math.max((now - t0) / dur, 0), 1) : 1; // el primer fotograma puede ser anterior a t0
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toLocaleString("es-ES");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    counters.unobserve(el);
  }), { threshold: 0.6 });
$$("[data-count]").forEach((el) => counters.observe(el));

// ----- Horario: marca el día de hoy y si está abierto ahora -----
const now = new Date();
const today = now.getDay();
const minutes = now.getHours() * 60 + now.getMinutes();
const isOpen = HOURS[today].ranges.some(([a, b]) => minutes >= a && minutes < b);
$$("[data-hours]").forEach((ul) => {
  const order = [2, 3, 4, 5, 6, 0, 1]; // de martes a lunes
  ul.innerHTML = order.map((d) => `<li class="${d === today ? "today" : ""}"><span>${HOURS[d].day}</span><span>${HOURS[d].open}</span></li>`).join("");
});
// Versión resumida por grupos de días (tarjeta de la portada)
const GROUPS = [
  { label: "Martes a jueves", days: [2, 3, 4], text: "12:30 – 16:30 · 20:00 – 23:30" },
  { label: "Viernes y sábado", days: [5, 6], text: "12:30 – 17:00 · 20:00 – 00:30" },
  { label: "Domingo", days: [0], text: "12:30 – 16:30" },
  { label: "Lunes", days: [1], text: "Descanso" },
];
$$("[data-hours-compact]").forEach((ul) => {
  ul.innerHTML = GROUPS.map((g) => `<li class="${g.days.includes(today) ? "today" : ""}"><b>${g.label}</b><span>${g.text}</span></li>`).join("");
});
$$("[data-open]").forEach((el) => {
  el.classList.toggle("closed", !isOpen);
  el.lastChild.textContent = isOpen ? " Abierto ahora" : " Cerrado ahora";
});

// ----- Carrusel de platos (arrastrar y flechas) -----
$$(".rail").forEach((rail) => {
  let down = false, startX = 0, startLeft = 0, moved = false;
  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
  });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) { moved = true; rail.classList.add("dragging"); }
    rail.scrollLeft = startLeft - dx;
  });
  window.addEventListener("pointerup", () => { down = false; rail.classList.remove("dragging"); });
  rail.addEventListener("click", (e) => moved && e.preventDefault(), true);
  const ctrl = $(`[data-rail="${rail.id}"]`);
  if (ctrl) {
    const by = () => rail.firstElementChild.getBoundingClientRect().width + 22;
    $("[data-prev]", ctrl).addEventListener("click", () => rail.scrollBy({ left: -by(), behavior: "smooth" }));
    $("[data-next]", ctrl).addEventListener("click", () => rail.scrollBy({ left: by(), behavior: "smooth" }));
  }
});

// ----- Galería con visor -----
const lb = $(".lightbox");
if (lb) {
  const img = $("img", lb), cap = $("p", lb);
  $$(".gallery button").forEach((b) =>
    b.addEventListener("click", () => {
      img.src = b.dataset.full || $("img", b).src;
      img.alt = $("img", b).alt;
      cap.textContent = b.dataset.caption || "";
      lb.classList.add("open");
    })
  );
  const close = () => lb.classList.remove("open");
  lb.addEventListener("click", (e) => e.target !== img && close());
  document.addEventListener("keydown", (e) => e.key === "Escape" && close());
}

// ----- Opiniones rotatorias -----
const quotes = $$(".quote");
if (quotes.length) {
  const dots = $(".quote-dots");
  let qi = 0, qt;
  quotes.forEach((_, n) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Opinión ${n + 1}`);
    b.addEventListener("click", () => { show(n); start(); });
    dots.append(b);
  });
  const show = (n) => {
    qi = n;
    quotes.forEach((q, k) => q.classList.toggle("active", k === n));
    $$("button", dots).forEach((d, k) => d.classList.toggle("active", k === n));
  };
  const start = () => { clearInterval(qt); if (!reduce) qt = setInterval(() => show((qi + 1) % quotes.length), 5500); };
  show(0); start();
}

// ----- Carta: pestaña activa según la sección visible -----
const tabs = $$(".menu-tabs a");
if (tabs.length) {
  const spy = new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      tabs.forEach((t) => {
        const on = t.getAttribute("href") === `#${e.target.id}`;
        t.classList.toggle("active", on);
        if (on) t.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
      });
    }), { rootMargin: "-35% 0px -60% 0px" });
  $$(".menu-cat").forEach((c) => spy.observe(c));
}

// ----- Reservas -----
const form = $("#bookingForm");
if (form) {
  const date = $("#b-date");
  const iso = (d) => d.toISOString().slice(0, 10);
  date.min = iso(now);
  date.value = iso(new Date(now.getTime() + 86400000));

  // Personas
  const out = $("#b-people-out"), hidden = $("#b-people");
  $$("[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      const v = Math.min(20, Math.max(1, Number(hidden.value) + Number(b.dataset.step)));
      hidden.value = v;
      out.textContent = v;
    })
  );

  // Horas disponibles según el día elegido
  const time = $("#b-time");
  const fillTimes = () => {
    const d = new Date(date.value + "T12:00").getDay();
    const slots = [];
    HOURS[d].ranges.forEach(([a, b]) => { for (let m = a; m <= b - 60; m += 30) slots.push(m); });
    time.innerHTML = slots.length
      ? slots.map((m) => { const t = `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; return `<option>${t}</option>`; }).join("")
      : "<option value=''>Ese día cerramos</option>";
    time.disabled = !slots.length;
  };
  date.addEventListener("change", fillTimes);
  fillTimes();

  // En la demo no se envía nada: se muestra cómo le llegaría la reserva al restaurante
  const modal = $(".modal");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const fecha = new Date(d.fecha + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    $(".bubble", modal).textContent =
      `¡Hola! Quiero reservar mesa en Casa Olivo.\n👤 ${d.nombre}\n📅 ${fecha} a las ${d.hora}\n👥 ${d.personas} ${d.personas === "1" ? "persona" : "personas"} · ${d.zona}` +
      (d.notas ? `\n📝 ${d.notas}` : "");
    modal.classList.add("open");
  });
  $$("[data-close]", modal).forEach((b) => b.addEventListener("click", () => modal.classList.remove("open")));
}

// Año del pie
$$("[data-year]").forEach((el) => (el.textContent = now.getFullYear()));
