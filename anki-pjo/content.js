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

// ── SVGs ─────────────────────────────────────────────────────────────────────
const SVG = {
  layers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>`,
  chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,
  spin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
      class="pjo-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`
};

// ── Deck picker ──────────────────────────────────────────────────────────────
function showDeckPicker(wrap, onSelect) {
  const existing = wrap.querySelector(".pjo-deck-picker");
  if (existing) { existing.remove(); return; }

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

  const select    = picker.querySelector(".pjo-deck-select");
  const sendBtn   = picker.querySelector(".pjo-btn-send");
  const cancelBtn = picker.querySelector(".pjo-btn-cancel");

  wrap.appendChild(picker);

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
  sendBtn.addEventListener("click", () => {
    const deck = select.value;
    picker.remove();
    onSelect(deck);
  });
}

// ── Cria o conjunto de botões ─────────────────────────────────────────────────
function createAnkiButton(cardEl) {
  const wrap = document.createElement("div");
  wrap.className = "pjo-anki-wrap";

  const mainBtn    = document.createElement("button");
  mainBtn.className = "pjo-anki-btn";

  const chevronBtn = document.createElement("button");
  chevronBtn.className = "pjo-anki-chevron";
  chevronBtn.title = "Trocar deck";
  chevronBtn.innerHTML = SVG.chevron;

  wrap.appendChild(mainBtn);
  wrap.appendChild(chevronBtn);

  const savedDeck = localStorage.getItem(LAST_DECK_KEY);
  if (savedDeck) {
    renderReady(mainBtn, savedDeck);
  } else {
    renderFirstUse(mainBtn);
  }

  // Clique no botão principal
  mainBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    const currentDeck = localStorage.getItem(LAST_DECK_KEY);

    // Sem deck salvo: abre picker
    if (!currentDeck) {
      showDeckPicker(wrap, (deck) => {
        localStorage.setItem(LAST_DECK_KEY, deck);
        renderReady(mainBtn, deck);
        sendCard(mainBtn, cardEl, deck);
      });
      return;
    }

    sendCard(mainBtn, cardEl, currentDeck);
  });

  // Clique no chevron: abre picker para trocar deck
  chevronBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showDeckPicker(wrap, (deck) => {
      localStorage.setItem(LAST_DECK_KEY, deck);
      renderReady(mainBtn, deck);
    });
  });

  return wrap;
}

function renderFirstUse(btn) {
  btn.dataset.state = "idle";
  btn.innerHTML = `${SVG.layers}<span>Anki</span>`;
  btn.title = "Clique para escolher um deck";
}

function renderReady(btn, deckName) {
  btn.dataset.state = "idle";
  btn.innerHTML = `${SVG.layers}<span>${deckName}</span>`;
  btn.title = `Enviar para "${deckName}"`;
}

async function sendCard(btn, cardEl, deckName) {
  const front = cardEl.querySelector(".card-front")?.innerText?.trim();
  const back  = cardEl.querySelector(".card-back")?.innerText?.trim();

  if (!front || !back) {
    btn.dataset.state = "error";
    btn.innerHTML = `${SVG.error}<span>Campo vazio</span>`;
    setTimeout(() => renderReady(btn, deckName), 3000);
    return;
  }

  btn.dataset.state = "loading";
  btn.innerHTML = `${SVG.spin}<span>Enviando…</span>`;

  try {
    await addToAnki(front, back, deckName);
    btn.dataset.state = "success";
    btn.innerHTML = `${SVG.check}<span>Adicionado!</span>`;
    setTimeout(() => renderReady(btn, deckName), 3000);
  } catch (err) {
    const msg = err.message.includes("duplicate") ? "Duplicado" :
                err.message.includes("Failed to fetch") ? "Anki fechado?" : "Erro";
    btn.dataset.state = "error";
    btn.innerHTML = `${SVG.error}<span>${msg}</span>`;
    setTimeout(() => renderReady(btn, deckName), 4000);
  }
}

// ── Injeta botões nos cards ──────────────────────────────────────────────────
function injectButtons() {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.style.display !== "none" && !card.querySelector(".pjo-anki-wrap")) {
      card.appendChild(createAnkiButton(card));
    }
  });
}

const observer = new MutationObserver(() => injectButtons());
observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style"] });

injectButtons();
