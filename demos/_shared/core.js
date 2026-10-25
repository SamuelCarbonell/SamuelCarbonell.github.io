// ===== Interacciones comunes de las demos =====
const Demo = (() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Navegación: fondo al bajar y menú móvil
  const nav = $(".nav");
  if (nav && nav.classList.contains("nav--over")) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  $(".burger")?.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    $(".burger").setAttribute("aria-expanded", String(open));
  });

  // Transición suave entre páginas de la misma demo
  const fade = document.createElement("div");
  fade.className = "page-fade";
  document.body.append(fade);
  $$('a[href$=".html"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (a.target || href.startsWith("http") || href.startsWith("../")) return;
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || reduce) return;
      e.preventDefault();
      fade.classList.add("on");
      setTimeout(() => (location.href = a.href), 320);
    });
  });
  window.addEventListener("pageshow", () => fade.classList.remove("on"));

  // Titulares que aparecen palabra a palabra
  $$(".split").forEach((el) => {
    let i = 0;
    const wrap = (node) => {
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
        } else if (child.nodeType === 1 && child.tagName !== "BR") wrap(child);
      });
    };
    wrap(el);
  });

  // Aparición al hacer scroll (escalonada dentro de cada grupo)
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
  $$(".rv, .rv-img, .split").forEach((el) => {
    const group = el.parentElement ? $$(":scope > .rv", el.parentElement) : [];
    if (group.length > 1) el.style.setProperty("--d", `${Math.min(group.indexOf(el), 5) * 0.1}s`);
    io.observe(el);
  });

  // Parallax ligero
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

  // Contadores
  const counters = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, to = Number(el.dataset.count), t0 = performance.now(), dur = reduce ? 0 : 1600;
    const suffix = el.dataset.suffix || "";
    const step = (now) => {
      const p = dur ? Math.min(Math.max((now - t0) / dur, 0), 1) : 1; // el primer fotograma puede ser anterior a t0
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toLocaleString("es-ES") + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    counters.unobserve(el);
  }), { threshold: 0.6 });
  $$("[data-count]").forEach((el) => counters.observe(el));

  // Carruseles que se arrastran
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

  // Galería: filtros + visor
  $$("[data-filters]").forEach((bar) => {
    const items = $$(`#${bar.dataset.filters} [data-cat]`);
    $$("button", bar).forEach((b) => b.addEventListener("click", () => {
      $$("button", bar).forEach((x) => x.classList.toggle("active", x === b));
      items.forEach((it) => it.classList.toggle("is-hidden", b.dataset.f !== "all" && !it.dataset.cat.split(" ").includes(b.dataset.f)));
    }));
  });
  const lb = $(".lightbox");
  if (lb) {
    const img = $("img", lb), cap = $("p", lb);
    $$(".gallery button").forEach((b) => b.addEventListener("click", () => {
      img.src = $("img", b).src;
      img.alt = $("img", b).alt;
      cap.textContent = b.dataset.caption || "";
      lb.classList.add("open");
    }));
    const close = () => lb.classList.remove("open");
    lb.addEventListener("click", (e) => e.target !== img && close());
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  // Opiniones rotatorias
  $$(".quotes").forEach((box) => {
    const quotes = $$(".quote", box);
    const dots = box.nextElementSibling?.classList.contains("quote-dots") ? box.nextElementSibling : null;
    if (!quotes.length || !dots) return;
    let qi = 0, qt;
    const show = (n) => {
      qi = n;
      quotes.forEach((q, k) => q.classList.toggle("active", k === n));
      $$("button", dots).forEach((d, k) => d.classList.toggle("active", k === n));
    };
    const start = () => { clearInterval(qt); if (!reduce) qt = setInterval(() => show((qi + 1) % quotes.length), 5500); };
    quotes.forEach((_, n) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `Opinión ${n + 1}`);
      b.addEventListener("click", () => { show(n); start(); });
      dots.append(b);
    });
    show(0); start();
  });

  // Pestañas que siguen la sección visible
  const tabs = $$(".tabs a");
  if (tabs.length) {
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      tabs.forEach((t) => {
        const on = t.getAttribute("href") === `#${e.target.id}`;
        t.classList.toggle("active", on);
        if (on) t.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
      });
    }), { rootMargin: "-35% 0px -60% 0px" });
    $$(".tab-section").forEach((c) => spy.observe(c));
  }

  // Comparador antes / después
  $$(".ba").forEach((ba) => {
    let drag = false;
    const move = (x) => {
      const r = ba.getBoundingClientRect();
      ba.style.setProperty("--pos", `${Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))}%`);
    };
    ba.addEventListener("pointerdown", (e) => { drag = true; ba.setPointerCapture(e.pointerId); move(e.clientX); });
    ba.addEventListener("pointermove", (e) => drag && move(e.clientX));
    ba.addEventListener("pointerup", () => (drag = false));
    ba.addEventListener("keydown", (e) => {
      const cur = parseFloat(getComputedStyle(ba).getPropertyValue("--pos")) || 50;
      if (e.key === "ArrowLeft") ba.style.setProperty("--pos", `${Math.max(0, cur - 5)}%`);
      if (e.key === "ArrowRight") ba.style.setProperty("--pos", `${Math.min(100, cur + 5)}%`);
    });
  });

  // Ventana de confirmación con el mensaje que recibiría el negocio
  const modal = $(".modal");
  modal && $$("[data-close]", modal).forEach((b) => b.addEventListener("click", () => modal.classList.remove("open")));
  const showMessage = (text) => {
    $(".bubble", modal).textContent = text;
    modal.classList.add("open");
  };

  // Fechas y franjas horarias
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const longDate = (value) => new Date(value + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const slots = (ranges, step = 30, last = 30) => {
    const out = [];
    ranges.forEach(([a, b]) => { for (let m = a; m <= b - last; m += step) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`); });
    return out;
  };
  // Siempre con punto de miles (toLocaleString no lo pone en cifras de 4 dígitos)
  const euros = (n) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  return { $, $$, reduce, showMessage, iso, longDate, slots, euros };
})();
