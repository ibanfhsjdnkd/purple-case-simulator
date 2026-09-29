const CASES = [
  {
    id: "neon",
    name: "Neon Rush",
    price: 120,
    icon: "💜",
    description: "Яркие неоновые предметы для начала коллекции.",
    items: [
      { name: "Violet Pulse", rarity: "common", value: 70, icon: "💜" },
      { name: "Neon Blade", rarity: "rare", value: 150, icon: "🔮" },
      { name: "Purple Storm", rarity: "epic", value: 300, icon: "✨" },
      { name: "Royal Eclipse", rarity: "legendary", value: 650, icon: "💎" }
    ]
  },
  {
    id: "cosmic",
    name: "Cosmic Drop",
    price: 280,
    icon: "🌌",
    description: "Космическая коллекция с более дорогими предметами.",
    items: [
      { name: "Moon Dust", rarity: "common", value: 130, icon: "🌌" },
      { name: "Star Hunter", rarity: "rare", value: 320, icon: "✨" },
      { name: "Galaxy Fang", rarity: "epic", value: 700, icon: "🔮" },
      { name: "Astral Crown", rarity: "legendary", value: 1500, icon: "👑" }
    ]
  },
  {
    id: "royal",
    name: "Royal Vault",
    price: 650,
    icon: "👑",
    description: "Премиальный кейс с шансом на очень дорогой предмет.",
    items: [
      { name: "Royal Gem", rarity: "common", value: 350, icon: "💎" },
      { name: "Purple Crown", rarity: "rare", value: 750, icon: "👑" },
      { name: "Emperor", rarity: "epic", value: 1500, icon: "✨" },
      { name: "Void Monarch", rarity: "legendary", value: 4000, icon: "🔮" }
    ]
  }
];

const RARITY_WEIGHTS = {
  common: 0.52,
  rare: 0.30,
  epic: 0.14,
  legendary: 0.04
};

const RARITY_NAMES = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY"
};

const STORAGE_KEY = "purpleCasesState";

let state = loadState();

let selectedFrom = null;
let selectedTo = null;

function defaultState() {
  return {
    balance: 1000,
    inventory: [],
    history: [],
    opened: 0,
    dailyClaimed: false
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultState();
    }

    return {
      ...defaultState(),
      ...JSON.parse(saved)
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function format(value) {
  return Math.round(value).toLocaleString("ru-RU");
}

function randomId() {
  return Date.now() + Math.random().toString(16).slice(2);
}

function weightedItem(items) {
  const roll = Math.random();
  let current = 0;

  const sorted = items.slice().sort((a, b) => {
    return RARITY_WEIGHTS[a.rarity] - RARITY_WEIGHTS[b.rarity];
  });

  for (const item of sorted) {
    current += RARITY_WEIGHTS[item.rarity];

    if (roll <= current) {
      return item;
    }
  }

  return items[items.length - 1];
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function updateStats() {
  document.getElementById("balance").textContent = format(state.balance);
  document.getElementById("balanceStat").textContent = format(state.balance);

  document.getElementById("inventoryCount").textContent =
    state.inventory.length;

  document.getElementById("openedCount").textContent =
    state.opened;

  const total = state.inventory.reduce(
    (sum, item) => sum + item.value,
    0
  );

  document.getElementById("inventoryValue").textContent =
    format(total);
}

function renderCases() {
  const grid = document.getElementById("casesGrid");

  grid.innerHTML = CASES.map(item => `
    <article class="case-card">
      <div class="case-icon">${item.icon}</div>

      <h3>${item.name}</h3>

      <p>${item.description}</p>

      <div class="case-bottom">
        <span class="case-price">
          ${format(item.price)} 💜
        </span>

        <button
          class="btn primary"
          onclick="openCase('${item.id}')"
        >
          Открыть
        </button>
      </div>
    </article>
  `).join("");
}

function renderInventory() {
  const grid = document.getElementById("inventoryGrid");

  if (!state.inventory.length) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎒</div>
        <h3>Инвентарь пуст</h3>
        <p>Открой первый кейс, чтобы получить предмет.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = state.inventory.map(item => {
    const fromSelected = selectedFrom === item.id;
    const toSelected = selectedTo === item.id;

    return `
      <div
        class="item-card ${fromSelected || toSelected ? "selected" : ""}"
        onclick="selectInventoryItem('${item.id}')"
      >
        <div class="item-icon">${item.icon}</div>

        <div class="item-name">${item.name}</div>

        <div class="rarity ${item.rarity}">
          ${RARITY_NAMES[item.rarity]}
        </div>

        <div class="item-meta">
          <span>${format(item.value)} 💜</span>
          <span>${fromSelected ? "Риск" : toSelected ? "Цель" : "Выбрать"}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const container = document.getElementById("historyList");

  if (!state.history.length) {
    container.innerHTML = `
      <div class="empty small-empty">
        История пока пуста.
      </div>
    `;

    return;
  }

  container.innerHTML = state.history
    .slice(0, 15)
    .map(item => `
      <div class="history-row">
        <div class="history-icon">${item.icon}</div>

        <div class="history-info">
          <strong>${item.name}</strong>
          <span>
            ${item.caseName} • ${item.rarity}
          </span>
        </div>

        <div class="history-value">
          +${format(item.value)} 💜
        </div>
      </div>
    `)
    .join("");
}

function updateUpgrade() {
  const from = state.inventory.find(item => item.id === selectedFrom);
  const to = state.inventory.find(item => item.id === selectedTo);

  const fromElement = document.getElementById("upgradeFrom");
  const toElement = document.getElementById("upgradeTo");
  const chanceElement = document.getElementById("upgradeChance");
  const button = document.getElementById("upgradeButton");

  if (from) {
    fromElement.innerHTML = `
      <div class="slot-icon">${from.icon}</div>
      <strong>${from.name}</strong>
      <span>${format(from.value)} 💜</span>
    `;
  } else {
    fromElement.innerHTML = `
      <div class="slot-icon">?</div>
      <span>Твой предмет</span>
    `;
  }

  if (to) {
    toElement.innerHTML = `
      <div class="slot-icon">${to.icon}</div>
      <strong>${to.name}</strong>
      <span>${format(to.value)} 💜</span>
    `;
  } else {
    toElement.innerHTML = `
      <div class="slot-icon">?</div>
      <span>Целевой предмет</span>
    `;
  }

  if (from && to) {
    const chance = Math.min(
      0.95,
      Math.max(0.03, from.value / to.value)
    );

    chanceElement.textContent =
      Math.round(chance * 100) + "%";

    button.disabled = false;
  } else {
    chanceElement.textContent = "—";
    button.disabled = true;
  }
}

function selectInventoryItem(id) {
  if (!selectedFrom) {
    selectedFrom = id;
  } else if (selectedFrom === id) {
    selectedFrom = null;
  } else if (!selectedTo) {
    selectedTo = id;
  } else if (selectedTo === id) {
    selectedTo = null;
  } else {
    selectedFrom = id;
    selectedTo = null;
  }

  renderInventory();
  updateUpgrade();
}

window.selectInventoryItem = selectInventoryItem;

function openCase(caseId) {
  const currentCase = CASES.find(item => item.id === caseId);

  if (!currentCase) {
    return;
  }

  if (state.balance < currentCase.price) {
    showToast("Недостаточно 💜 для открытия кейса.");
    return;
  }

  state.balance -= currentCase.price;
  state.opened++;

  const item = weightedItem(currentCase.items);

  const inventoryItem = {
    ...item,
    id: randomId(),
    caseName: currentCase.name
  };

  state.inventory.unshift(inventoryItem);

  state.history.unshift({
    id: randomId(),
    name: item.name,
    icon: item.icon,
    value: item.value,
    rarity: RARITY_NAMES[item.rarity],
    caseName: currentCase.name
  });

  saveState();
  refresh();

  showResult(inventoryItem);
}

window.openCase = openCase;

function showResult(item) {
  document.getElementById("resultIcon").textContent =
    item.icon;

  document.getElementById("resultName").textContent =
    item.name;

  const rarity = document.getElementById("resultRarity");

  rarity.textContent = RARITY_NAMES[item.rarity];
  rarity.className = `rarity ${item.rarity}`;

  document.getElementById("resultValue").textContent =
    `${format(item.value)} 💜`;

  document.getElementById("resultModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("resultModal").classList.add("hidden");
}

document.getElementById("closeModal")
  .addEventListener("click", closeModal);

document.getElementById("modalButton")
  .addEventListener("click", closeModal);

document.querySelector(".modal-overlay")
  .addEventListener("click", closeModal);

function upgrade() {
  const fromIndex = state.inventory.findIndex(
    item => item.id === selectedFrom
  );

  const toIndex = state.inventory.findIndex(
    item => item.id === selectedTo
  );

  if (fromIndex === -1 || toIndex === -1) {
    return;
  }

  if (fromIndex === toIndex) {
    showToast("Нельзя выбрать один предмет дважды.");
    return;
  }

  const from = state.inventory[fromIndex];
  const to = state.inventory[toIndex];

  const chance = Math.min(
    0.95,
    Math.max(0.03, from.value / to.value)
  );

  const success = Math.random() < chance;

  if (success) {
    state.inventory.splice(
      Math.max(fromIndex, toIndex),
      1
    );

    state.inventory.splice(
      Math.min(fromIndex, toIndex),
      1
    );

    state.inventory.unshift({
      ...to,
      id: randomId()
    });

    showToast(`Успех! Ты получил ${to.name} 🎉`);
  } else {
    state.inventory.splice(
      Math.max(fromIndex, toIndex),
      1
    );

    state.inventory.splice(
      Math.min(fromIndex, toIndex),
      1
    );

    showToast("Апгрейд не удался. Предметы сгорели.");
  }

  selectedFrom = null;
  selectedTo = null;

  saveState();
  refresh();
}

document.getElementById("upgradeButton")
  .addEventListener("click", upgrade);

document.getElementById("addFunds")
  .addEventListener("click", () => {
    state.balance += 500;

    saveState();
    refresh();

    showToast("+500 💜 добавлено на баланс.");
  });

document.getElementById("dailyBonus")
  .addEventListener("click", () => {
    if (state.dailyClaimed) {
      showToast("Ежедневный бонус уже получен.");
      return;
    }

    state.balance += 250;
    state.dailyClaimed = true;

    saveState();
    refresh();

    showToast("Ты получил +250 💜!");
  });

document.getElementById("sellAll")
  .addEventListener("click", () => {
    if (!state.inventory.length) {
      showToast("Инвентарь уже пуст.");
      return;
    }

    const total = state.inventory.reduce(
      (sum, item) => sum + item.value,
      0
    );

    state.balance += total;
    state.inventory = [];

    selectedFrom = null;
    selectedTo = null;

    saveState();
    refresh();

    showToast(`Продано предметов на ${format(total)} 💜.`);
  });

function refresh() {
  updateStats();
  renderCases();
  renderInventory();
  renderHistory();
  updateUpgrade();
}

refresh();
