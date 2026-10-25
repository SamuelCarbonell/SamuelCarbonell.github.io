// ===== Reformas Martín · calculadora de presupuesto =====
const { $, $$, euros, showMessage } = Demo;

// Precios orientativos por m² (con IVA), plazo en semanas y límites de superficie
const TYPES = {
  cocina: { name: "Cocina", m2: 450, base: 3200, min: 6, max: 40, def: 12, weeks: (m) => 2 + m / 12, hint: "Una cocina media tiene entre 8 y 15 m²." },
  bano: { name: "Baño", m2: 650, base: 2400, min: 3, max: 20, def: 5, weeks: (m) => 1 + m / 10, hint: "Un baño medio tiene entre 4 y 7 m²." },
  integral: { name: "Piso completo", m2: 520, base: 3000, min: 30, max: 200, def: 85, weeks: (m) => 4 + m / 20, hint: "Indica los m² útiles de la vivienda." },
  pintura: { name: "Pintura", m2: 26, base: 250, min: 10, max: 200, def: 80, weeks: (m) => 0.5 + m / 120, hint: "Indica los m² de suelo de la vivienda." },
};
const QUALITY = { basica: { name: "Esencial", k: 0.85 }, media: { name: "Confort", k: 1 }, premium: { name: "Premium", k: 1.45 } };

const form = $("#calcForm");
if (form) {
  const m2 = $("#m2");
  let lastType = "cocina";

  const calc = () => {
    const tipo = $('input[name="tipo"]:checked').value;
    const t = TYPES[tipo];
    // Al cambiar de tipo de obra, el deslizador se adapta a superficies razonables
    if (tipo !== lastType) {
      m2.min = t.min; m2.max = t.max; m2.value = t.def;
      lastType = tipo;
    }
    const s = Number(m2.value);
    const q = QUALITY[$('input[name="calidad"]:checked').value];
    let total = (t.base + t.m2 * s) * q.k;
    $$('input[name="extra"]:checked').forEach((x) => (total += Number(x.dataset.fixed || 0) + Number(x.dataset.m2 || 0) * s));
    const low = Math.round((total * 0.9) / 100) * 100;
    const high = Math.round((total * 1.12) / 100) * 100;
    const weeks = t.weeks(s);

    $("#m2Out").textContent = `${s} m²`;
    $("#m2Hint").textContent = t.hint;
    const amount = $("#amount");
    amount.innerHTML = `${euros(low)} – ${euros(high)} <small>precio orientativo con IVA</small>`;
    amount.classList.remove("bump"); void amount.offsetWidth; amount.classList.add("bump");
    $("#rTipo").textContent = t.name;
    $("#rM2").textContent = `${s} m²`;
    $("#rCal").textContent = q.name;
    $("#rPlazo").textContent = weeks < 1.5 ? `${Math.max(2, Math.round(weeks * 5))} días laborables` : `${Math.round(weeks)} semanas aprox.`;
    return { t, s, q, low, high };
  };

  form.addEventListener("input", calc);
  calc();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const r = calc();
    const d = new FormData(form);
    const extras = $$('input[name="extra"]:checked').map((x) => x.nextSibling.textContent.trim());
    showMessage(
      `¡Hola! Quiero pedir visita para una reforma.\n👤 ${d.get("nombre")} · ${d.get("telefono")}\n📍 ${d.get("municipio")}\n🏗 ${r.t.name} · ${r.s} m² · ${r.q.name}` +
        (extras.length ? `\n➕ ${extras.join(", ")}` : "") +
        `\n💶 Estimación web: ${euros(r.low)} – ${euros(r.high)}\n📅 ${d.get("cuando")}`
    );
  });
}

// Pequeña animación inicial en los comparadores para indicar que se pueden arrastrar
if (!Demo.reduce) {
  const hintIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    hintIO.unobserve(e.target);
    const ba = e.target, t0 = performance.now();
    const step = (now) => {
      const p = Math.max(0, (now - t0) / 1600);
      if (p >= 1) return ba.style.setProperty("--pos", "50%");
      ba.style.setProperty("--pos", `${50 + Math.sin(p * Math.PI * 2) * 18}%`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$(".ba").forEach((b) => hintIO.observe(b));
}
