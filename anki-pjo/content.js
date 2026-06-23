const MODEL_NAME = "Basic";
const ANKI_CONNECT_URL = "http://localhost:8765";
const LAST_DECK_KEY = "pjo-anki-last-deck";

// ── AnkiConnect helpers ──────────────────────────────────────────────────────
async function ankiRequest(action, params = {}) {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function fetchDecks() {
  const decks = await ankiRequest("deckNames");
  return decks.sort();
}

async function addToAnki(front, back, deckName) {
  return ankiRequest("addNote", {
    note: {
      deckName,
      modelName: MODEL_NAME,
      fields: { Front: front, Back: back },
      options: { allowDuplicate: false },
      tags: ["pjo"]
    }
  });
}

// ── Deck picker ──────────────────────────────────────────────────────────────
function showDeckPicker(btn, cardEl) {
  // Fecha picker existente no mesmo card
  const existing = cardEl.querySelector(".pjo-deck-picker");
  if (existing) { existing.remove(); return; }

  const front = cardEl.querySelector(".card-front")?.innerText?.trim();
  const back  = cardEl.querySelector(".card-back")?.innerText?.trim();

  if (!front || !back) {
    setButtonState(btn, "error", "Campo vazio");
    setTimeout(() => setButtonState(btn, "idle"), 3000);
    return;
  }

  const picker = document.createElement("div");
  picker.className = "pjo-deck-picker";
  picker.innerHTML = `
    <select class="pjo-deck-select" disabled>
      <option>Carregando decks…</option>
    </select>
    <div class="pjo-deck-actions">
      <button class="pjo-btn-cancel">✕</button>
      <button class="pjo-btn-send" disabled>Enviar</button>
    </div>
  `;

  const select   = picker.querySelector(".pjo-deck-select");
  const sendBtn  = picker.querySelector(".pjo-btn-send");
  const cancelBtn = picker.querySelector(".pjo-btn-cancel");

  cardEl.appendChild(picker);

  // Carrega decks
  fetchDecks().then(decks => {
    const lastDeck = localStorage.getItem(LAST_DECK_KEY);
    select.innerHTML = decks.map(d =>
      `<option value="${d}" ${d === lastDeck ? "selected" : ""}>${d}</option>`
    ).join("");
    select.disabled = false;
    sendBtn.disabled = false;
  }).catch(() => {
    select.innerHTML = `<option>Anki fechado ou CORS não configurado</option>`;
  });

  cancelBtn.addEventListener("click", () => picker.remove());

  sendBtn.addEventListener("click", async () => {
    const deckName = select.value;
    picker.remove();
    setButtonState(btn, "loading", "Enviando…");
    try {
      await addToAnki(front, back, deckName);
      localStorage.setItem(LAST_DECK_KEY, deckName);
      setButtonState(btn, "success", "Adicionado!");
      setTimeout(() => setButtonState(btn, "idle"), 3000);
    } catch (err) {
      const msg = err.message.includes("duplicate") ? "Duplicado" :
                  err.message.includes("Failed to fetch") ? "Anki fechado?" : "Erro";
      setButtonState(btn, "error", msg);
      setTimeout(() => setButtonState(btn, "idle"), 4000);
    }
  });
}

// ── Botão ────────────────────────────────────────────────────────────────────
function createAnkiButton(cardEl) {
  const btn = document.createElement("button");
  btn.className = "pjo-anki-btn";
  btn.title = "Enviar ao Anki";
  setButtonState(btn, "idle");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    showDeckPicker(btn, cardEl);
  });

  return btn;
}

function setButtonState(btn, state, label) {
  btn.dataset.state = state;

  const labels = {
    idle:    "Anki",
    loading: label || "Enviando…",
    success: label || "Adicionado!",
    error:   label || "Erro"
  };

  const icons = {
    idle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <path d="M12 2L2 7l10 5 10-5-10-5z"/>
             <path d="M2 17l10 5 10-5"/>
             <path d="M2 12l10 5 10-5"/>
           </svg>`,
    loading: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                   class="pjo-spin">
               <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
             </svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="20 6 9 17 4 12"/>
             </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="10"/>
             <line x1="12" y1="8" x2="12" y2="12"/>
             <line x1="12" y1="16" x2="12.01" y2="16"/>
           </svg>`
  };

  btn.innerHTML = `${icons[state]}<span>${labels[state]}</span>`;
}

// ── Observa cards abertos ────────────────────────────────────────────────────
function injectButtons() {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.style.display !== "none" && !card.querySelector(".pjo-anki-btn")) {
      card.appendChild(createAnkiButton(card));
    }
  });
}

const observer = new MutationObserver(() => injectButtons());
observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style"] });

injectButtons();
