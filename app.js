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
