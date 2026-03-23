document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const numberFormatter = new Intl.NumberFormat("en-IN");

  const noteCards = [
    { denomination: 2000, inputId: "et2000", outputId: "txt2000" },
    { denomination: 500, inputId: "et500", outputId: "txt500" },
    { denomination: 200, inputId: "et200", outputId: "txt200" },
    { denomination: 100, inputId: "et100", outputId: "txt100" },
    { denomination: 50, inputId: "et50", outputId: "txt50" },
    { denomination: 20, inputId: "et20", outputId: "txt20" },
    { denomination: 10, inputId: "et10", outputId: "txt10" },
    { denomination: 5, inputId: "et5", outputId: "txt5" },
    { denomination: 2, inputId: "et2", outputId: "txt2" },
    { denomination: 1, inputId: "et1", outputId: "txt1" }
  ].map((item) => ({
    ...item,
    card: document.querySelector(`[data-denomination="${item.denomination}"]`),
    input: document.getElementById(item.inputId),
    output: document.getElementById(item.outputId)
  }));

  const txtFinalCash = document.getElementById("txtFinalCash");
  const txtFinalCashInWords = document.getElementById("txtFinalCashInWords");
  const btnReset = document.getElementById("btnReset");
  const heroTotal = document.getElementById("heroTotal");
  const heroNotes = document.getElementById("heroNotes");
  const activeDenominations = document.getElementById("activeDenominations");
  const resultPanel = document.getElementById("resultPanel");

  let displayedTotal = 0;
  let totalAnimationFrame = null;

  noteCards.forEach((note) => {
    note.input.addEventListener("input", () => {
      sanitizeInput(note.input);
      updateRow(note);
      updateSummary();
    });
  });

  btnReset.addEventListener("click", () => {
    noteCards.forEach((note) => {
      note.input.value = "";
      updateRow(note);
    });

    updateSummary(false);
  });

  noteCards.forEach(updateRow);
  updateSummary(false);

  function sanitizeInput(input) {
    const value = Number.parseInt(input.value, 10);

    if (input.value === "") {
      return;
    }

    if (Number.isNaN(value) || value < 0) {
      input.value = "";
      return;
    }

    input.value = String(value);
  }

  function updateRow(note) {
    const count = getCount(note.input);
    const rowTotal = count * note.denomination;

    note.output.textContent = formatCurrency(rowTotal);
    note.card.classList.toggle("is-active", count > 0);
  }

  function updateSummary(shouldPulse = true) {
    const summary = noteCards.reduce(
      (totals, note) => {
        const count = getCount(note.input);

        totals.cash += count * note.denomination;
        totals.notes += count;
        totals.active += count > 0 ? 1 : 0;

        return totals;
      },
      { cash: 0, notes: 0, active: 0 }
    );

    animateTotal(summary.cash);
    heroNotes.textContent = numberFormatter.format(summary.notes);
    activeDenominations.textContent = `${summary.active}/${noteCards.length}`;
    txtFinalCashInWords.textContent = `In words: ${convertToWords(summary.cash)} only`;

    if (shouldPulse) {
      flashResultPanel();
    }
  }

  function getCount(input) {
    const value = Number.parseInt(input.value, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function animateTotal(nextTotal) {
    if (totalAnimationFrame) {
      cancelAnimationFrame(totalAnimationFrame);
    }

    if (prefersReducedMotion || displayedTotal === nextTotal) {
      displayedTotal = nextTotal;
      setDisplayedTotal(nextTotal);
      return;
    }

    const startTotal = displayedTotal;
    const change = nextTotal - startTotal;
    const duration = 500;
    const startTime = performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startTotal + change * eased);

      displayedTotal = currentValue;
      setDisplayedTotal(currentValue);

      if (progress < 1) {
        totalAnimationFrame = requestAnimationFrame(tick);
      } else {
        displayedTotal = nextTotal;
        setDisplayedTotal(nextTotal);
        totalAnimationFrame = null;
      }
    };

    totalAnimationFrame = requestAnimationFrame(tick);
  }

  function setDisplayedTotal(total) {
    const formattedValue = formatCurrency(total);
    txtFinalCash.textContent = formattedValue;
    heroTotal.textContent = formattedValue;
  }

  function flashResultPanel() {
    if (prefersReducedMotion) {
      return;
    }

    resultPanel.classList.remove("is-updated");
    void resultPanel.offsetWidth;
    resultPanel.classList.add("is-updated");
  }

  function formatCurrency(value) {
    return `Rs. ${numberFormatter.format(value)}`;
  }

  function convertToWords(number) {
    if (number === 0) {
      return "Zero";
    }

    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const toWordsBelowHundred = (value) => {
      if (value < 10) {
        return units[value];
      }

      if (value < 20) {
        return teens[value - 10];
      }

      const tenPart = tens[Math.floor(value / 10)];
      const unitPart = units[value % 10];
      return unitPart ? `${tenPart} ${unitPart}` : tenPart;
    };

    const segments = [
      { value: 10000000, label: "Crore" },
      { value: 100000, label: "Lakh" },
      { value: 1000, label: "Thousand" },
      { value: 100, label: "Hundred" }
    ];

    let remaining = number;
    let words = [];

    segments.forEach((segment) => {
      if (remaining >= segment.value) {
        const count = Math.floor(remaining / segment.value);
        remaining %= segment.value;

        words.push(`${convertToWords(count)} ${segment.label}`);
      }
    });

    if (remaining > 0) {
      if (number > 100 && remaining < 100 && words.length > 0) {
        words.push(`and ${toWordsBelowHundred(remaining)}`);
      } else {
        words.push(toWordsBelowHundred(remaining));
      }
    }

    return words.join(" ").trim();
  }
});
