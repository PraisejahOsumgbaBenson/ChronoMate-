// Update current time with AM/PM
function updateCurrentTime() {
  const now = new Date();
  const options = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const timeString = now.toLocaleTimeString("en-US", options);
  document.getElementById("currentTime").textContent = `${timeString} • Berlin`;
}

// Initialize time immediately
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Load timezones from localStorage or use defaults
function loadTimezones() {
  const savedTimezones = localStorage.getItem("chronomate-timezones");
  if (savedTimezones) {
    return JSON.parse(savedTimezones);
  } else {
    // Default timezones
    return [
      { name: "San Francisco", offset: -7, color: "var(--accent-purple)" },
      { name: "New York", offset: -4, color: "var(--accent-blue)" },
      { name: "London", offset: 1, color: "var(--accent-blue)" },
      { name: "Lagos", offset: 1, color: "var(--accent-orange)" },
      { name: "Berlin", offset: 2, color: "var(--accent-blue)" },
      { name: "Tokyo", offset: 9, color: "var(--accent-orange)" },
    ];
  }
}

// Save timezones to localStorage
function saveTimezones() {
  localStorage.setItem("chronomate-timezones", JSON.stringify(timezones));
}

// Timezone orbs
let timezones = loadTimezones();
const timezoneList = document.getElementById("timezoneList");
let lastMinute = -1; // Track when we need full update

// Create initial timezone elements
let timezoneElements = [];

function initializeTimezones() {
  // Clear existing
  timezoneList.innerHTML = "";
  timezoneElements = [];

  // Rebuild with current timezones
  timezones.forEach((tz) => {
    const timezoneItem = document.createElement("div");
    timezoneItem.className = "timezone-item";
    timezoneItem.dataset.name = tz.name;

    timezoneItem.innerHTML = `
      <div class="timezone-label">
        <span class="tz-name">${tz.name}</span>
        <div style="display: flex; align-items: center;">
          <span class="tz-time"></span>
          <button class="delete-timezone" title="Remove timezone">×</button>
        </div>
      </div>
      <div class="time-track">
        <div class="time-orb" style="background: ${
          tz.color
        }; box-shadow: 0 0 10px ${tz.color.replace(")", ", 0.4)")}"></div>
      </div>
    `;

    // Add delete functionality
    const deleteBtn = timezoneItem.querySelector(".delete-timezone");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTimezone(tz.name);
    });

    timezoneList.appendChild(timezoneItem);

    timezoneElements.push({
      element: timezoneItem,
      name: tz.name,
      offset: tz.offset,
      color: tz.color,
      orb: timezoneItem.querySelector(".time-orb"),
      timeSpan: timezoneItem.querySelector(".tz-time"),
      deleteBtn: deleteBtn,
    });
  });

  // Force immediate update
  lastMinute = -1;
  updateAllTimezones();
}

function removeTimezone(name) {
  // Find the index of the timezone to remove
  const index = timezones.findIndex((tz) => tz.name === name);

  if (index !== -1) {
    // Remove from the array
    timezones.splice(index, 1);

    // Save to localStorage
    saveTimezones();

    // Rebuild the display
    initializeTimezones();
  }
}

function updateAllTimezones() {
  const now = new Date();
  const currentMinute = now.getMinutes();

  // Only do full DOM update when minute changes
  if (currentMinute !== lastMinute) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;

    timezoneElements.forEach((tz) => {
      const tzTime = new Date(utc + 3600000 * tz.offset);
      const hours = tzTime.getHours();
      const minutes = tzTime.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;

      // Update time display
      tz.timeSpan.textContent = `${displayHours}:${minutes
        .toString()
        .padStart(2, "0")} ${ampm}`;

      // Calculate orb position (0-100%)
      const percentage = ((hours * 60 + minutes) / (24 * 60)) * 100;
      tz.orb.style.left = `${percentage}%`;
    });

    lastMinute = currentMinute;
  }

  // Smooth orb movement between minutes
  const seconds = now.getSeconds();
  const interMinutePercentage = (seconds / 60) * 100;
  timezoneElements.forEach((tz) => {
    tz.orb.style.transition = `left ${seconds === 0 ? "0s" : "0.5s"} linear`;
  });
}

// Initialize immediately
initializeTimezones();

// Update every second for smooth movement
setInterval(updateAllTimezones, 1000);

// Timezone modal functionality
const timeActions = document.querySelector(".time-actions");
timeActions.addEventListener("click", showTimezoneModal);

function showTimezoneModal() {
  // Create modal container
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.className = "timezone-modal";

  // Create modal header
  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const modalTitle = document.createElement("h3");
  modalTitle.className = "modal-title";
  modalTitle.textContent = "Add Timezone";

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "×";

  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);

  // Create search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "modal-search";
  searchInput.placeholder = "Search timezones...";
  searchInput.autofocus = true;

  // Create timezone list container
  const timezoneResults = document.createElement("div");
  timezoneResults.className = "timezone-results";

  // Get all available timezones
  const allTimezones = Intl.supportedValuesOf("timeZone").map((tz) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(
      (part) => part.type === "timeZoneName"
    ).value;

    return {
      name: tz,
      display: `${tz.replace(/_/g, " ")} (${timeZoneName})`,
      offset: getTimezoneOffset(tz),
    };
  });

  function getTimezoneOffset(timezone) {
    const now = new Date();
    const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzTime = new Date(
      now.toLocaleString("en-US", { timeZone: timezone })
    );
    return (tzTime - utc) / (1000 * 60 * 60);
  }

  // Populate timezone list
  function populateTimezoneList(filter = "") {
    timezoneResults.innerHTML = "";

    const filtered = allTimezones.filter((tz) =>
      tz.display.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "timezone-result";
      noResults.textContent = "No matching timezones found";
      noResults.style.color = "var(--text-secondary)";
      noResults.style.textAlign = "center";
      timezoneResults.appendChild(noResults);
      return;
    }

    filtered.forEach((tz) => {
      const tzItem = document.createElement("div");
      tzItem.className = "timezone-result";

      const tzInfo = document.createElement("div");
      tzInfo.className = "timezone-info";

      const tzName = document.createElement("div");
      tzName.className = "timezone-name";
      tzName.textContent = tz.display.split(" (")[0];

      const tzOffset = document.createElement("div");
      tzOffset.className = "timezone-offset";
      tzOffset.textContent = tz.display.split(" (")[1].replace(")", "");

      tzInfo.appendChild(tzName);
      tzInfo.appendChild(tzOffset);

      const tzTime = document.createElement("div");
      tzTime.className = "timezone-current";

      tzItem.appendChild(tzInfo);
      tzItem.appendChild(tzTime);

      // Calculate current time for this timezone
      updateTimezoneItemTime(tzItem, tz.name);

      tzItem.addEventListener("click", () => {
        const cityName = tz.name.split("/").pop().replace(/_/g, " ");
        if (!timezones.some((existing) => existing.name === cityName)) {
          timezones.push({
            name: cityName,
            offset: tz.offset,
            color: getRandomColor(),
          });

          // Save to localStorage
          saveTimezones();

          // Rebuild the timezone display
          initializeTimezones();
        }
        document.body.removeChild(modal);
      });

      timezoneResults.appendChild(tzItem);
    });
  }

  function updateTimezoneItemTime(element, timezone) {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    element.querySelector(".timezone-current").textContent = timeString;
  }

  function getRandomColor() {
    const colors = [
      "var(--accent-blue)",
      "var(--accent-orange)",
      "var(--accent-purple)",
      "#10b981", // emerald
      "#f43f5e", // rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Initial population
  populateTimezoneList();

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    populateTimezoneList(e.target.value);
  });

  // Close functionality
  function closeModal() {
    document.body.removeChild(modal);
  }

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Add elements to modal
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(searchInput);
  modalContent.appendChild(timezoneResults);

  // Add footer with close button
  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-button";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", closeModal);

  modalFooter.appendChild(closeBtn);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// Time dial interaction
const timeDial = document.getElementById("timeDial");
const dialHand = document.getElementById("dialHand");
let isDragging = false;

timeDial.addEventListener("mousedown", (e) => {
  isDragging = true;
  updateDialHand(e);
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    updateDialHand(e);
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

function updateDialHand(e) {
  const rect = timeDial.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle =
    Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
  dialHand.style.transform = `rotate(${angle}deg)`;
}

// AI Console suggestions
const aiInput = document.getElementById("aiInput");
const suggestions = document.getElementById("suggestions");

aiInput.addEventListener("focus", () => {
  suggestions.style.display = "block";
});

aiInput.addEventListener("blur", () => {
  setTimeout(() => {
    suggestions.style.display = "none";
  }, 200);
});

aiInput.addEventListener("input", (e) => {
  if (e.target.value.startsWith("/")) {
    suggestions.style.display = "block";
  } else {
    suggestions.style.display = "none";
  }
});

// Make cards draggable
const cards = document.querySelectorAll(".card");
const cardStack = document.getElementById("cardStack");

cards.forEach((card) => {
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData(
      "text/plain",
      card.querySelector(".card-title").textContent
    );
    setTimeout(() => {
      card.style.opacity = "0.4";
    }, 0);
  });

  card.addEventListener("dragend", () => {
    card.style.opacity = "1";
  });
});

// Dynamic time-based color scheme
function updateTimeBasedColors() {
  const now = new Date();
  const hours = now.getHours();
  const root = document.documentElement;

  if (hours >= 6 && hours < 18) {
    // Daytime - warmer colors
    root.style.setProperty("--primary-bg", "#0f172a");
    root.style.setProperty("--accent-orange", "#fb923c");
    root.style.setProperty("--glow-orange", "rgba(251, 146, 60, 0.4)");
  } else {
    // Nighttime - cooler colors
    root.style.setProperty("--primary-bg", "#020617");
    root.style.setProperty("--accent-orange", "#38bdf8");
    root.style.setProperty("--glow-orange", "rgba(56, 189, 248, 0.4)");
  }
}

updateTimeBasedColors();
setInterval(updateTimeBasedColors, 60000);
