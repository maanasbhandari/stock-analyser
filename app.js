// Works with multiple proxy fallbacks so one failure doesn't break everything

const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

const PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(ticker) {
  const targetUrl = `${YF_BASE}${ticker}?interval=1d&range=1d`;

  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(targetUrl), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();
      // allorigins wraps in { contents: "..." }
      let json;
      try { json = JSON.parse(text); } catch { continue; }
      if (json.contents) {
        try { json = JSON.parse(json.contents); } catch { continue; }
      }
      return json;
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function fetchFundamentals(ticker) {
  const modules = "defaultKeyStatistics,financialData,summaryDetail,price";
  const targetUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`;

  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(targetUrl), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { continue; }
      if (json.contents) {
        try { json = JSON.parse(json.contents); } catch { continue; }
      }
      const result = json?.quoteSummary?.result;
      if (result && result.length > 0) return result[0];
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function analyzeStock() {
  const raw = document.getElementById("stockInput").value.trim().toUpperCase();
  if (!raw) {
    alert("Please enter a stock ticker symbol first.");
    return;
  }

  showSection("loading");
  document.getElementById("loadingTicker").textContent = raw;

  try {
    const s = await fetchFundamentals(raw);

    if (!s) {
      throw new Error(
        `Could not fetch data for "${raw}".\n\n` +
        `Tips:\n• For Indian stocks use suffix: RELIANCE.NS, INFY.NS, TCS.NS\n` +
        `• For US stocks just use: AAPL, TSLA, MSFT\n` +
        `• Check your internet connection`
      );
    }

    const fin  = s.financialData          || {};
    const stat = s.defaultKeyStatistics   || {};
    const summ = s.summaryDetail          || {};
    const price = s.price                 || {};

    const data = {
      trailingPE:     fin.trailingPE?.raw      ?? summ.trailingPE?.raw,
      debtToEquity:   fin.debtToEquity?.raw,
      returnOnEquity: fin.returnOnEquity?.raw,
      profitMargins:  fin.profitMargins?.raw,
      revenueGrowth:  fin.revenueGrowth?.raw,
      currentRatio:   fin.currentRatio?.raw,
      priceToBook:    stat.priceToBook?.raw,
      trailingEps:    stat.trailingEps?.raw,
      dividendYield:  summ.dividendYield?.raw,
      beta:           summ.beta?.raw           ?? stat.beta?.raw,
      companyName:    price.longName           || price.shortName || raw,
      currency:       price.currency           || "USD",
    };

    renderResults(raw, data);
    showSection("result");

  } catch (err) {
    document.getElementById("errorMsg").textContent = err.message;
    showSection("error");
  }
}

function renderResults(ticker, data) {
  const results = PARAMETERS.map(p => ({ ...p, result: p.evaluate(data) }));

  const passes = results.filter(r => r.result.status === "pass").length;
  const fails  = results.filter(r => r.result.status === "fail").length;
  const total  = results.filter(r => r.result.status !== "na").length;
  const score  = total > 0 ? Math.round((passes / total) * 100) : 0;

  const card  = document.getElementById("verdictCard");
  const vText = document.getElementById("verdictText");
  const vSub  = document.getElementById("verdictSub");
  const fill  = document.getElementById("scoreFill");
  const lbl   = document.getElementById("scoreLabel");

  card.className = "verdict-card";
  if (score >= 60) {
    card.classList.add("invest");
    vText.textContent = "✅ Invest";
    vSub.textContent  = `${data.companyName} (${ticker}) passes ${passes}/${total} parameters.`;
    fill.style.background = "#16a34a";
  } else if (score >= 40) {
    card.classList.add("neutral");
    vText.textContent = "⚠️ Proceed with Caution";
    vSub.textContent  = `${data.companyName} (${ticker}) shows mixed signals.`;
    fill.style.background = "#d97706";
  } else {
    card.classList.add("skip");
    vText.textContent = "❌ Skip";
    vSub.textContent  = `${data.companyName} (${ticker}) fails ${fails}/${total} parameters.`;
    fill.style.background = "#dc2626";
  }

  fill.style.width = "0%";
  setTimeout(() => fill.style.width = score + "%", 100);
  lbl.textContent = `Score: ${score}% (${passes} pass, ${fails} fail)`;

  const grid = document.getElementById("parametersGrid");
  grid.innerHTML = results.map(p => {
    const r = p.result;
    const badgeClass = { pass: "badge-pass", fail: "badge-fail", warn: "badge-warn", na: "badge-na" }[r.status];
    const badgeText  = { pass: "Pass", fail: "Fail", warn: "Caution", na: "N/A" }[r.status];
    return `
      <div class="param-card">
        <div class="param-header">
          <span class="param-name">${p.name}</span>
          <span class="param-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="param-value">${r.display}</div>
        <div class="param-desc">${r.note} — ${p.description}</div>
      </div>
    `;
  }).join("");
}

function showSection(name) {
  ["result", "loading", "error"].forEach(s => {
    document.getElementById(s + "Section").classList.add("hidden");
  });
  document.getElementById(name + "Section").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("stockInput").addEventListener("keydown", e => {
    if (e.key === "Enter") analyzeStock();
  });
});