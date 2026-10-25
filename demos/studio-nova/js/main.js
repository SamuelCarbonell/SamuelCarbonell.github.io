// ===== Studio Nova · lógica propia =====
const { $, $$, iso, longDate, slots, euros, showMessage } = Demo;

// Horario en minutos (0 = domingo)
const OPEN = { 0: [], 1: [], 2: [[600, 1200]], 3: [[600, 1200]], 4: [[600, 1200]], 5: [[600, 1200]], 6: [[600, 840]] };

// Huecos "ocupados" de ejemplo, siempre los mismos para un mismo día
const busy = (dateStr, time) => {
  const seed = [...(dateStr + time)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 3 === 0;
};

// Portada: próximo hueco libre
const next = $("#nextSlot");
if (next) {
  const now = new Date();
  for (let d = 0; d < 8; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    const ds = iso(day);
    const free = slots(OPEN[day.getDay()]).filter((t) => {
      if (busy(ds, t)) return false;
      if (d > 0) return true;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m > now.getHours() * 60 + now.getMinutes() + 30;
    });
    if (free.length) {
      const dayName = longDate(ds).split(",")[0];
      next.textContent = `${d === 0 ? "Hoy" : d === 1 ? "Mañana" : dayName[0].toUpperCase() + dayName.slice(1)} · ${free[0]}`;
      break;
    }
  }
}

// Reserva de cita
const form = $("#bookForm");
if (form) {
  const date = $("#date"), slotBox = $("#slots");
  const today = new Date();
  date.min = iso(today);
  // Primer día abierto a partir de mañana
  let first = new Date(today.getTime() + 86400000);
  while (!OPEN[first.getDay()].length) first = new Date(first.getTime() + 86400000);
  date.value = iso(first);

  const totalMinutes = () => $$('input[name="svc"]:checked').reduce((a, i) => a + Number(i.dataset.min), 0);

  // Solo se ofrecen horas en las que la cita completa termina antes del cierre
  const fillSlots = () => {
    const d = new Date(date.value + "T12:00");
    const prev = $('input[name="hora"]:checked')?.value;
    const list = slots(OPEN[d.getDay()] || [], 30, Math.max(30, totalMinutes()));
    slotBox.innerHTML = list.length
      ? list.map((t) => `<label><input type="radio" name="hora" value="${t}" ${busy(date.value, t) ? "disabled" : ""} ${t === prev && !busy(date.value, t) ? "checked" : ""}><span>${t}</span></label>`).join("")
      : `<p class="muted" style="margin:0">${(OPEN[d.getDay()] || []).length ? "No hay huecos suficientes ese día para todo lo que has elegido. Prueba otro día." : "Ese día el salón está cerrado. Elige de martes a sábado."}</p>`;
    update();
  };

  const update = () => {
    const picked = $$('input[name="svc"]:checked');
    $("#sumList").innerHTML = picked.length
      ? picked.map((i) => `<li><span>${i.value}</span><b>${i.dataset.price} €</b></li>`).join("")
      : `<li class="empty">Elige al menos un servicio</li>`;
    const total = picked.reduce((a, i) => a + Number(i.dataset.price), 0);
    const mins = picked.reduce((a, i) => a + Number(i.dataset.min), 0);
    $("#sumTotal").textContent = euros(total);
    $("#sumDur").textContent = mins ? `${Math.floor(mins / 60) ? Math.floor(mins / 60) + " h " : ""}${mins % 60 ? (mins % 60) + " min" : ""}` : "—";
    $("#sumPro").textContent = $('input[name="pro"]:checked').value;
    $("#sumDate").textContent = date.value ? longDate(date.value) : "—";
    const hour = $('input[name="hora"]:checked');
    $("#sumTime").textContent = hour ? hour.value : "—";
    $("#submit").disabled = !(picked.length && hour);
  };

  form.addEventListener("change", (e) => (e.target === date || e.target.name === "svc" ? fillSlots() : update()));
  fillSlots();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const svcs = d.getAll("svc").join(", ");
    showMessage(
      `¡Hola! Quiero pedir cita en Studio Nova.\n👤 ${d.get("nombre")} · ${d.get("telefono")}\n💇 ${svcs}\n✨ Con: ${d.get("pro")}\n📅 ${longDate(d.get("fecha"))} a las ${d.get("hora")}\n💶 ${$("#sumTotal").textContent}` +
        (d.get("notas") ? `\n📝 ${d.get("notas")}` : "")
    );
  });
}
