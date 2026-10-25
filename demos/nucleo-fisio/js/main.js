// ===== Núcleo · lógica propia =====
const { $, $$, iso, longDate, slots, euros, showMessage } = Demo;

// Horario en minutos (0 = domingo)
const OPEN = { 0: [], 1: [[510, 1260]], 2: [[510, 1260]], 3: [[510, 1260]], 4: [[510, 1260]], 5: [[510, 1260]], 6: [[540, 780]] };
const busy = (dateStr, time) => [...(dateStr + time)].reduce((a, c) => a + c.charCodeAt(0), 0) % 3 === 0;

// ----- Mapa del cuerpo -----
const ZONES = {
  cuello: { t: "Cuello", tags: ["Cervicalgia", "Tensión", "Dolor de cabeza"], p: "Las molestias cervicales suelen venir de la postura y el estrés. Con terapia manual y ejercicios de movilidad se nota mejoría desde la primera semana.", r: "Fisioterapia + pilates espalda sana" },
  hombro: { t: "Hombro", tags: ["Tendinopatía", "Hombro congelado", "Sobrecarga"], p: "Trabajamos la movilidad y la fuerza del manguito rotador para que vuelvas a levantar el brazo sin dolor.", r: "Fisioterapia + ejercicio terapéutico" },
  lumbar: { t: "Zona lumbar", tags: ["Lumbalgia", "Ciática", "Hernia discal"], p: "Es el motivo de consulta más frecuente. Combinamos tratamiento manual con ejercicio para que el dolor no vuelva.", r: "Fisioterapia + pilates terapéutico" },
  muneca: { t: "Muñeca y mano", tags: ["Túnel carpiano", "Tendinitis", "Esguince"], p: "Muy habitual si trabajas con ordenador o haces deporte de raqueta. Te enseñamos también pautas ergonómicas.", r: "Fisioterapia" },
  rodilla: { t: "Rodilla", tags: ["Menisco", "Ligamentos", "Postoperatorio"], p: "Tanto si vienes de una lesión deportiva como de una operación, diseñamos un plan de readaptación por fases.", r: "Fisioterapia deportiva + readaptación" },
  tobillo: { t: "Tobillo y pie", tags: ["Esguince", "Fascitis plantar", "Tendón de Aquiles"], p: "Recuperamos la estabilidad y la fuerza para evitar recaídas, algo clave en esguinces de repetición.", r: "Fisioterapia deportiva" },
};
const card = $("#zoneCard");
if (card) {
  const show = (key) => {
    const z = ZONES[key];
    $$(".spot").forEach((s) => s.classList.toggle("active", s.dataset.zone === key));
    card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
    card.innerHTML = `<h3>${z.t}</h3><div class="tags">${z.tags.map((t) => `<span>${t}</span>`).join("")}</div><p>${z.p}</p><p><b>Te recomendamos:</b> ${z.r}</p><a class="btn btn--primary" href="cita.html">Pedir valoración gratis</a>`;
  };
  $$(".spot").forEach((s) => s.addEventListener("click", () => show(s.dataset.zone)));
  show("lumbar");
}

// ----- Próxima hora libre (portada) -----
const freeToday = $("#freeToday");
if (freeToday) {
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  for (let d = 0; d < 8; d++) {
    const day = new Date(now.getTime() + d * 86400000), ds = iso(day);
    const free = slots(OPEN[day.getDay()], 30, 50).filter((t) => {
      const [h, m] = t.split(":").map(Number);
      return !busy(ds, t) && (d > 0 || h * 60 + m > nowMin + 30);
    });
    if (free.length) {
      const name = longDate(ds).split(",")[0];
      freeToday.textContent = `${d === 0 ? "Hoy" : d === 1 ? "Mañana" : name[0].toUpperCase() + name.slice(1)} · ${free[0]}`;
      break;
    }
  }
}

// ----- Bonos: precio por sesión y ahorro -----
const BONOS = { fisio: { base: 45, 1: 45, 5: 200, 10: 380 }, pilates: { base: 18, 1: 18, 5: 80, 10: 150 } };
const plans = $$("[data-plan]");
if (plans.length) {
  const render = (mode) => {
    $$(".toggle button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    plans.forEach((p) => {
      const n = Number(p.dataset.plan), price = BONOS[mode][n], full = BONOS[mode].base * n;
      $("[data-price]", p).textContent = euros(price);
      $("[data-unit]", p).textContent = n === 1 ? "/ sesión" : `· ${euros(Math.round(price / n))}/sesión`;
      $("[data-save]", p).textContent = n === 1 ? "" : `Ahorras ${euros(full - price)}`;
    });
  };
  $$(".toggle button").forEach((b) => b.addEventListener("click", () => render(b.dataset.mode)));
  render("fisio");
}

// ----- Reserva -----
const form = $("#bookForm");
if (form) {
  const date = $("#date"), slotBox = $("#slots"), today = new Date();
  date.min = iso(today);
  let first = new Date(today.getTime() + 86400000);
  while (!OPEN[first.getDay()].length) first = new Date(first.getTime() + 86400000);
  date.value = iso(first);

  const session = () => $('input[name="tipo"]:checked');
  const fillSlots = () => {
    const d = new Date(date.value + "T12:00"), prev = $('input[name="hora"]:checked')?.value;
    const dur = Number(session().dataset.min);
    const list = slots(OPEN[d.getDay()] || [], 30, dur);
    slotBox.innerHTML = list.length
      ? list.map((t) => `<label><input type="radio" name="hora" value="${t}" ${busy(date.value, t) ? "disabled" : ""} ${t === prev && !busy(date.value, t) ? "checked" : ""}><span>${t}</span></label>`).join("")
      : `<p class="muted" style="margin:0">Los domingos el centro está cerrado. Elige otro día.</p>`;
    update();
  };
  const update = () => {
    const s = session(), hour = $('input[name="hora"]:checked');
    const zones = $$('input[name="zona"]:checked').map((z) => z.value);
    $("#sTipo").textContent = s.value;
    $("#sDur").textContent = `${s.dataset.min} min`;
    $("#sZona").textContent = zones.length ? zones.join(", ") : "—";
    $("#sPro").textContent = $("#pro").value;
    $("#sDate").textContent = date.value ? longDate(date.value) : "—";
    $("#sTime").textContent = hour ? hour.value : "—";
    $("#sPrice").textContent = Number(s.dataset.price) ? euros(Number(s.dataset.price)) : "Gratis";
    $("#painOut").textContent = $("#pain").value;
    $("#submit").disabled = !hour;
  };
  form.addEventListener("input", (e) => (e.target === date || e.target.name === "tipo" ? fillSlots() : update()));
  form.addEventListener("change", (e) => e.target.name === "hora" && update());
  fillSlots();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form), zones = d.getAll("zona");
    showMessage(
      `¡Hola! Quiero pedir cita en Núcleo.\n👤 ${d.get("nombre")} · ${d.get("telefono")}\n🩺 ${d.get("tipo")} (${$("#sPrice").textContent})` +
        (zones.length ? `\n📍 Molestia en: ${zones.join(", ")} · dolor ${d.get("dolor")}/10` : "") +
        `\n👩‍⚕️ ${d.get("pro")}\n📅 ${longDate(d.get("fecha"))} a las ${d.get("hora")}` +
        (d.get("seguro") ? `\n🏥 Seguro: ${d.get("seguro")}` : "")
    );
  });
}
