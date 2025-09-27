// ==================== TIME GRID FUNCTIONALITY - RESTORED ====================

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
                }; box-shadow: 0 0 10px ${tz.color.replace(
      ")",
      ", 0.4)"
    )}"></div>
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

// ==================== HUGGING FACE INTEGRATION ====================

// Hugging Face API integration with timezone knowledge
class HuggingFaceService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "https://api-inference.huggingface.co/models";
  }

  async generateText(prompt, model = "gpt2") {
    try {
      console.log("Sending request to Hugging Face for:", prompt);
      const response = await fetch(`${this.baseURL}/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      console.log("Response status:", response.status);

      if (response.status === 404) {
        throw new Error("Model not available. Using fallback.");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Hugging Face result:", result);
      return result;
    } catch (error) {
      console.error("Hugging Face API error:", error);
      return this.createIntelligentResponse(prompt);
    }
  }

  // Enhanced intelligent responses with timezone knowledge
  createIntelligentResponse(prompt) {
    console.log("Creating intelligent response for:", prompt);

    const lowerPrompt = prompt.toLowerCase();

    // Timezone lookup functionality
    if (
      lowerPrompt.includes("timezone") ||
      lowerPrompt.includes("time zone") ||
      lowerPrompt.includes("what time") ||
      lowerPrompt.includes("time in") ||
      lowerPrompt.includes("time at") ||
      lowerPrompt.includes("time for")
    ) {
      return this.handleTimezoneQuery(lowerPrompt);
    }

    // Scheduling advice
    if (
      lowerPrompt.includes("schedule") ||
      lowerPrompt.includes("meeting") ||
      lowerPrompt.includes("optimal") ||
      lowerPrompt.includes("best time")
    ) {
      return [
        {
          generated_text:
            "For optimal scheduling, consider booking meetings during overlapping business hours across time zones. The sweet spot is usually between 9-11 AM in the latest timezone and 2-4 PM in the earliest one.",
        },
      ];
    }

    // Greeting responses
    if (
      lowerPrompt.includes("hello") ||
      lowerPrompt.includes("hi") ||
      lowerPrompt.includes("hey")
    ) {
      return [
        {
          generated_text:
            "Hello! I'm ChronoMate AI, your time intelligence assistant. I can help with timezone lookups, scheduling advice, and time conversions. What would you like to know?",
        },
      ];
    }

    // Default intelligent response
    return [
      {
        generated_text:
          "I'm ChronoMate AI, specializing in time intelligence. I can help you with timezone information, scheduling across time zones, and time conversions. What specific help do you need?",
      },
    ];
  }

  // Handle timezone-specific queries// Enhanced timezone lookup that works for ALL timezones
  handleTimezoneQuery(prompt) {
    // Get ALL available timezones from the browser
    const allTimezones = Intl.supportedValuesOf("timeZone");

    // Extract the location name from the prompt
    const lowerPrompt = prompt.toLowerCase();

    // Common country/city mappings to help with recognition
    const commonMappings = {
      usa: "new york",
      "united states": "new york",
      us: "new york",
      uk: "london",
      "united kingdom": "london",
      england: "london",
      germany: "berlin",
      france: "paris",
      italy: "rome",
      japan: "tokyo",
      china: "shanghai",
      india: "mumbai",
      australia: "sydney",
      canada: "toronto",
      brazil: "sao paulo",
      mexico: "mexico city",
      russia: "moscow",
      uae: "dubai",
      "south africa": "johannesburg",
      egypt: "cairo",
    };

    // Try to find matching timezone
    let matchedTimezone = null;
    let matchedName = "";

    // First, check common mappings
    for (const [country, city] of Object.entries(commonMappings)) {
      if (lowerPrompt.includes(country)) {
        matchedName = city;
        break;
      }
    }

    // If no common mapping found, search through all timezones
    if (!matchedName) {
      for (const timezone of allTimezones) {
        const timezoneLower = timezone.toLowerCase().replace(/_/g, " ");

        // Check if the prompt contains any part of the timezone name
        const timezoneParts = timezoneLower.split("/");
        for (const part of timezoneParts) {
          if (lowerPrompt.includes(part) && part.length > 3) {
            matchedTimezone = timezone;
            matchedName = timezoneParts[timezoneParts.length - 1]; // Get city name
            break;
          }
        }
        if (matchedTimezone) break;
      }
    }

    // If we found a match, get the time information
    if (matchedTimezone || matchedName) {
      const timezoneToUse =
        matchedTimezone || this.findTimezoneByName(matchedName);

      if (timezoneToUse) {
        try {
          const now = new Date();
          const timeString = now.toLocaleTimeString("en-US", {
            timeZone: timezoneToUse,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          // Get the UTC offset
          const offset = this.getTimezoneOffset(timezoneToUse);
          const offsetString = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;

          // Get some cities in this timezone for context
          const exampleCities = this.getCitiesInTimezone(timezoneToUse);

          const response = `The timezone for ${
            matchedName.charAt(0).toUpperCase() + matchedName.slice(1)
          } is ${timezoneToUse} (${offsetString}). Current local time is ${timeString}.${
            exampleCities
              ? ` Other cities in this zone: ${exampleCities.join(", ")}.`
              : ""
          }`;

          return [{ generated_text: response }];
        } catch (error) {
          console.error("Error getting timezone info:", error);
        }
      }
    }

    // If no specific location found, provide general timezone help with examples
    const exampleTimezones = allTimezones
      .slice(0, 5)
      .map((tz) => tz.split("/").pop().replace(/_/g, " "));
    return [
      {
        generated_text: `I can help you find timezone information for any location! Try asking about cities or countries like: "${exampleTimezones.join(
          '", "'
        )}", or ask "what time is it in [city/country]?"`,
      },
    ];
  }

  // Helper function to find timezone by city name
  findTimezoneByName(cityName) {
    const allTimezones = Intl.supportedValuesOf("timeZone");
    const searchName = cityName.toLowerCase().replace(/\s/g, "_");

    for (const timezone of allTimezones) {
      if (timezone.toLowerCase().includes(searchName)) {
        return timezone;
      }
    }

    // If exact match not found, try partial match
    for (const timezone of allTimezones) {
      const timezoneLower = timezone.toLowerCase();
      if (
        timezoneLower.includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(timezoneLower.split("/").pop())
      ) {
        return timezone;
      }
    }

    return null;
  }

  // Helper function to get UTC offset
  getTimezoneOffset(timezone) {
    try {
      const now = new Date();
      const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
      const tzTime = new Date(
        now.toLocaleString("en-US", { timeZone: timezone })
      );
      return Math.round((tzTime - utc) / (1000 * 60 * 60));
    } catch (error) {
      return 0;
    }
  }

  // Helper function to get example cities in the same timezone
  getCitiesInTimezone(targetTimezone) {
    const allTimezones = Intl.supportedValuesOf("timeZone");
    const targetOffset = this.getTimezoneOffset(targetTimezone);
    const cities = [];

    // Find other timezones with the same offset
    for (const timezone of allTimezones) {
      if (
        timezone !== targetTimezone &&
        this.getTimezoneOffset(timezone) === targetOffset
      ) {
        const cityName = timezone.split("/").pop().replace(/_/g, " ");
        if (cityName && !cities.includes(cityName) && cities.length < 3) {
          cities.push(cityName);
        }
      }
    }

    return cities;
  } // Simple and direct timezone lookup
  handleTimezoneQuery(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Direct mapping for common queries
    const directMappings = {
      nigeria: "Africa/Lagos",
      lagos: "Africa/Lagos",
      tokyo: "Asia/Tokyo",
      japan: "Asia/Tokyo",
      "new york": "America/New_York",
      usa: "America/New_York",
      london: "Europe/London",
      uk: "Europe/London",
      paris: "Europe/Paris",
      france: "Europe/Paris",
      berlin: "Europe/Berlin",
      germany: "Europe/Berlin",
      mumbai: "Asia/Kolkata",
      india: "Asia/Kolkata",
      sydney: "Australia/Sydney",
      australia: "Australia/Sydney",
      beijing: "Asia/Shanghai",
      china: "Asia/Shanghai",
      dubai: "Asia/Dubai",
      uae: "Asia/Dubai",
      moscow: "Europe/Moscow",
      russia: "Europe/Moscow",
      brazil: "America/Sao_Paulo",
      "sao paulo": "America/Sao_Paulo",
      mexico: "America/Mexico_City",
      egypt: "Africa/Cairo",
      "south africa": "Africa/Johannesburg",
    };

    // Find matching location
    let timezone = null;
    for (const [location, tz] of Object.entries(directMappings)) {
      if (lowerPrompt.includes(location)) {
        timezone = tz;
        break;
      }
    }

    if (timezone) {
      try {
        const now = new Date();
        const timeString = now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        // Get simple offset
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          timeZoneName: "short",
        });
        const offset = formatter
          .formatToParts(now)
          .find((part) => part.type === "timeZoneName").value;

        const locationName = Object.entries(directMappings).find(
          ([loc, tz]) => tz === timezone
        )[0];
        const response = `Current time in ${
          locationName.charAt(0).toUpperCase() + locationName.slice(1)
        }: ${timeString} (${offset})`;

        return [{ generated_text: response }];
      } catch (error) {
        return [
          {
            generated_text: `Time in ${
              Object.entries(directMappings).find(
                ([loc, tz]) => tz === timezone
              )[0]
            }: Could not fetch time data`,
          },
        ];
      }
    }

    // If no match found, give simple response
    return [
      {
        generated_text:
          "I can tell you the current time in major cities. Try: 'time in Lagos', 'time in Tokyo', 'time in London', etc.",
      },
    ];
  } // Use Hugging Face models for intelligent timezone detection
  handleTimezoneQuery(prompt) {
    return this.useTimezoneModel(prompt);
  }

  async useTimezoneModel(prompt) {
    try {
      // Use a model that understands locations and timezones
      const response = await this.generateTextWithLocationContext(prompt);
      return response;
    } catch (error) {
      // Fallback to simple timezone detection
      return this.simpleTimezoneFallback(prompt);
    }
  }

  async generateTextWithLocationContext(prompt) {
    // Enhanced prompt to help the model understand it's a timezone query
    const enhancedPrompt = `Given the question about time or location: "${prompt}", provide the current time for that location. If it's a known city/country, give the current time in 12-hour format with timezone abbreviation. Keep response very short.`;

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/google/flan-t5-large",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              max_length: 100,
              temperature: 0.3,
              do_sample: false,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result && result[0] && result[0].generated_text) {
          return [{ generated_text: result[0].generated_text }];
        }
      }
    } catch (error) {
      console.log("FLAN-T5 model failed, trying fallback");
    }

    // If FLAN-T5 fails, try a different approach with geolocation
    return this.geolocationBasedTimezone(prompt);
  }

  async geolocationBasedTimezone(prompt) {
    // Use a geocoding service (free tier) to get timezone from location name
    try {
      // First, extract location from prompt
      const location = this.extractLocationFromPrompt(prompt);

      if (location) {
        // Use a geocoding API to get timezone info
        const timezoneInfo = await this.getTimezoneFromGeocoding(location);
        if (timezoneInfo) {
          return [{ generated_text: timezoneInfo }];
        }
      }
    } catch (error) {
      console.log("Geocoding approach failed");
    }

    return this.simpleTimezoneFallback(prompt);
  }

  extractLocationFromPrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Common location patterns
    const patterns = [
      /(?:time in|time at|time for|what time in|what time at)\s+([^?.!]+)/,
      /(?:in|at)\s+([^?.!]+)(?:\?|$)/,
      /(?:timezone|time zone)\s+(?:for|in|of)\s+([^?.!]+)/,
    ];

    for (const pattern of patterns) {
      const match = lowerPrompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no pattern matches, try to extract any recognizable location words
    const locationWords = [
      "abuja",
      "lagos",
      "tokyo",
      "london",
      "paris",
      "berlin",
      "new york",
      "los angeles",
      "sydney",
      "mumbai",
      "beijing",
      "dubai",
      "moscow",
      "cairo",
      "johannesburg",
    ];

    for (const word of locationWords) {
      if (lowerPrompt.includes(word)) {
        return word;
      }
    }

    return null;
  }

  async getTimezoneFromGeocoding(location) {
    try {
      // Use a free geocoding service (like OpenCage or Nominatim)
      // Note: You'd need to sign up for a free API key
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          location
        )}&key=YOUR_OPENCAGE_API_KEY`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const timezone = result.annotations.timezone.name;
          const offset = result.annotations.timezone.offset_string;

          // Get current time for that timezone
          const now = new Date();
          const timeString = now.toLocaleTimeString("en-US", {
            timeZone: timezone,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          return `Current time in ${location}: ${timeString} (${offset})`;
        }
      }
    } catch (error) {
      console.log("Geocoding API error:", error);
    }

    return null;
  }

  simpleTimezoneFallback(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Simple dynamic timezone lookup using browser's Intl API
    const allTimezones = Intl.supportedValuesOf("timeZone");

    // Try to find a matching timezone
    for (const timezone of allTimezones) {
      const timezoneName = timezone.toLowerCase().replace(/_/g, " ");

      if (lowerPrompt.includes("abuja") || lowerPrompt.includes("nigeria")) {
        // Abuja uses Africa/Lagos timezone
        const now = new Date();
        const timeString = now.toLocaleTimeString("en-US", {
          timeZone: "Africa/Lagos",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return [
          { generated_text: `Current time in Abuja: ${timeString} (WAT)` },
        ];
      }

      if (lowerPrompt.includes(timezoneName.split("/").pop())) {
        try {
          const now = new Date();
          const timeString = now.toLocaleTimeString("en-US", {
            timeZone: timezone,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          // Get timezone abbreviation
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            timeZoneName: "short",
          });
          const tzAbbr = formatter
            .formatToParts(now)
            .find((part) => part.type === "timeZoneName").value;

          const locationName = timezone.split("/").pop().replace(/_/g, " ");
          return [
            {
              generated_text: `Current time in ${locationName}: ${timeString} (${tzAbbr})`,
            },
          ];
        } catch (error) {
          continue;
        }
      }
    }

    return [
      {
        generated_text:
          "I can help with time in cities worldwide. Try: 'time in Abuja', 'time in Tokyo', etc.",
      },
    ];
  }

  async summarizeText(text, model = "facebook/bart-large-cnn") {
    try {
      const response = await fetch(`${this.baseURL}/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 130,
            min_length: 30,
          },
        }),
      });

      if (response.status === 404 || !response.ok) {
        throw new Error("Model not available");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Summary error:", error);
      const sentences = text.split(". ").filter((s) => s.length > 10);
      const summary =
        sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "..." : ".");
      return [
        { summary_text: summary || "Summary: " + text.slice(0, 100) + "..." },
      ];
    }
  }

  async analyzeSentiment(
    text,
    model = "cardiffnlp/twitter-roberta-base-sentiment-latest"
  ) {
    try {
      const response = await fetch(`${this.baseURL}/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (response.status === 404 || !response.ok) {
        throw new Error("Model not available");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Sentiment error:", error);
      const positiveWords = [
        "good",
        "great",
        "excellent",
        "happy",
        "excited",
        "awesome",
      ];
      const negativeWords = [
        "bad",
        "terrible",
        "awful",
        "sad",
        "angry",
        "frustrated",
      ];

      const lowerText = text.toLowerCase();
      const positiveScore = positiveWords.filter((word) =>
        lowerText.includes(word)
      ).length;
      const negativeScore = negativeWords.filter((word) =>
        lowerText.includes(word)
      ).length;

      let sentiment = "neutral";
      let confidence = 0.5;

      if (positiveScore > negativeScore) {
        sentiment = "positive";
        confidence = 0.7 + positiveScore * 0.1;
      } else if (negativeScore > positiveScore) {
        sentiment = "negative";
        confidence = 0.7 + negativeScore * 0.1;
      }

      return [
        {
          label: sentiment,
          score: Math.min(confidence, 0.95),
        },
      ];
    }
  }
}

// Initialize Hugging Face service
const huggingFace = new HuggingFaceService(
 
);

function createAICard(title, content) {
  const cardStack = document.getElementById("cardStack");

  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;

  card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${title}</div>
            <div class="card-tag">AI</div>
        </div>
        <div class="card-body">
            <div class="card-time">
                <div class="time-icon"></div>
                <div>${new Date().toLocaleString()}</div>
            </div>
            <div style="line-height: 1.4; margin-top: 8px;">${content}</div>
        </div>
        <div class="card-footer">
            <div class="card-action">💾 Save</div>
            <div class="card-action">📋 Copy</div>
            <div class="card-action">🔄 Regenerate</div>
        </div>
    `;

  // Make the new card draggable
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", title);
    setTimeout(() => {
      card.style.opacity = "0.4";
    }, 0);
  });

  card.addEventListener("dragend", () => {
    card.style.opacity = "1";
  });

  // Add click handlers for actions
  const saveBtn = card.querySelector(".card-action:nth-child(1)");
  const copyBtn = card.querySelector(".card-action:nth-child(2)");
  const regenerateBtn = card.querySelector(".card-action:nth-child(3)");

  saveBtn.addEventListener("click", () => {
    const savedCards = JSON.parse(
      localStorage.getItem("chronomate-ai-cards") || "[]"
    );
    savedCards.push({ title, content, timestamp: new Date().toISOString() });
    localStorage.setItem("chronomate-ai-cards", JSON.stringify(savedCards));
    saveBtn.textContent = "✓ Saved!";
    setTimeout(() => {
      saveBtn.textContent = "💾 Save";
    }, 2000);
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(content);
    copyBtn.textContent = "✓ Copied!";
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
    }, 2000);
  });

  regenerateBtn.addEventListener("click", () => {
    card.remove();
  });

  cardStack.insertBefore(card, cardStack.firstChild);
}

// Add enhanced suggestions including timezone queries
function addHuggingFaceSuggestions() {
  const suggestions = document.getElementById("suggestions");

  // Clear existing suggestions first
  suggestions.innerHTML = "";

  const aiSuggestions = [
    { prefix: "/ai", description: "[prompt] - Chat with AI assistant" },
    { prefix: "/summarize", description: "[text] - Summarize meeting notes" },
    { prefix: "/sentiment", description: "[text] - Analyze text sentiment" },
    {
      prefix: "/ai what time",
      description: "[city] - Get timezone information",
    },
    {
      prefix: "/ai timezone",
      description: "[country] - Find timezone details",
    },
  ];

  aiSuggestions.forEach((suggestion) => {
    const suggestionItem = document.createElement("div");
    suggestionItem.className = "suggestion-item";
    suggestionItem.innerHTML = `
            <span class="suggestion-prefix">${suggestion.prefix}</span>
            <span>${suggestion.description}</span>
        `;

    suggestionItem.addEventListener("click", () => {
      const aiInput = document.getElementById("aiInput");
      aiInput.value = `${suggestion.prefix} `;
      aiInput.focus();
    });

    suggestions.appendChild(suggestionItem);
  });
}

// Enhanced AI console with timezone query support
function enhanceAIConsole() {
  const aiInput = document.getElementById("aiInput");
  const suggestions = document.getElementById("suggestions");

  // Remove all existing event listeners by cloning the element
  const newInput = aiInput.cloneNode(true);
  aiInput.parentNode.replaceChild(newInput, aiInput);

  // Get reference to the new input
  const currentInput = document.getElementById("aiInput");

  // Add our enhanced event handler
  currentInput.addEventListener("keypress", async function (e) {
    if (e.key === "Enter") {
      const command = this.value.trim();
      console.log("Processing command:", command);

      // Check if it's an AI command
      if (
        command.startsWith("/ai ") ||
        command.startsWith("/summarize ") ||
        command.startsWith("/sentiment ")
      ) {
        e.preventDefault();
        e.stopPropagation();

        if (command.startsWith("/ai ")) {
          const prompt = command.replace("/ai ", "");
          this.value = "Thinking...";
          this.disabled = true;

          try {
            const response = await huggingFace.generateText(prompt);
            const responseText =
              response[0]?.generated_text ||
              "I'm here to help with your time intelligence needs!";
            createAICard("AI Response", responseText);
          } catch (error) {
            createAICard(
              "AI Assistant",
              "Hello! I can help you with timezone information and scheduling across different regions."
            );
          }

          this.value = "";
          this.disabled = false;
          return false;
        }

        if (command.startsWith("/summarize ")) {
          const text = command.replace("/summarize ", "");
          this.value = "Summarizing...";
          this.disabled = true;

          try {
            const response = await huggingFace.summarizeText(text);
            const summary =
              response[0]?.summary_text || text.slice(0, 150) + "...";
            createAICard("Summary", summary);
          } catch (error) {
            createAICard(
              "Summary",
              text.split(". ").slice(0, 2).join(". ") + "."
            );
          }

          this.value = "";
          this.disabled = false;
          return false;
        }

        if (command.startsWith("/sentiment ")) {
          const text = command.replace("/sentiment ", "");
          this.value = "Analyzing...";
          this.disabled = true;

          try {
            const response = await huggingFace.analyzeSentiment(text);
            const sentiment = response[0];
            const resultText = sentiment
              ? `Sentiment: ${sentiment.label} (${Math.round(
                  sentiment.score * 100
                )}% confidence)`
              : "Analysis complete";
            createAICard("Sentiment Analysis", resultText);
          } catch (error) {
            createAICard("Sentiment", "Text analysis completed.");
          }

          this.value = "";
          this.disabled = false;
          return false;
        }
      } else {
        console.log("Non-AI command, allowing default behavior");
      }
    }
  });

  // Restore original functionality for other events
  currentInput.addEventListener("focus", function () {
    suggestions.style.display = "block";
  });

  currentInput.addEventListener("blur", function () {
    setTimeout(() => {
      suggestions.style.display = "none";
    }, 200);
  });

  currentInput.addEventListener("input", function (e) {
    suggestions.style.display = e.target.value.startsWith("/")
      ? "block"
      : "none";
  });
}

// Initialize Hugging Face features
function initializeHuggingFace() {
  console.log("🚀 Initializing ChronoMate AI with timezone intelligence...");

  // First, add suggestions
  addHuggingFaceSuggestions();

  // Then enhance the console
  enhanceAIConsole();

  console.log(
    "✅ AI features ready! Try timezone queries like: /ai what time in Tokyo"
  );
}

// ==================== INITIALIZE EVERYTHING ====================

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Wait for the page to fully load
  setTimeout(() => {
    // Initialize the real-time clock
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Initialize time grid
    initializeTimezones();

    // Initialize AI features
    initializeHuggingFace();

    console.log("🕒 ChronoMate fully initialized with Time Grid + AI!");
    console.log("💡 Features available:");
    console.log("   • Real-time timezone orbs with moving indicators");
    console.log("   • Click + to add more timezones");
    console.log("   • AI commands: /ai, /summarize, /sentiment");
    console.log("   • Timezone queries: /ai what time in Tokyo?");
  }, 1000);
});
