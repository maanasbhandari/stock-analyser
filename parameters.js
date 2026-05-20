// The 10 investment parameters with their evaluation logic
const PARAMETERS = [
  {
    id: "pe_ratio",
    name: "P/E Ratio",
    description: "Price relative to earnings. Lower is generally better.",
    evaluate: (data) => {
      const v = data.trailingPE;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      if (v > 0 && v < 15)  return { status: "pass", display: v.toFixed(1), note: "Undervalued range" };
      if (v >= 15 && v < 30) return { status: "warn", display: v.toFixed(1), note: "Moderate valuation" };
      return { status: "fail", display: v.toFixed(1), note: "High valuation" };
    }
  },
  {
    id: "debt_equity",
    name: "Debt / Equity",
    description: "How much debt vs equity the company carries.",
    evaluate: (data) => {
      const v = data.debtToEquity;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      if (v < 50)   return { status: "pass", display: v.toFixed(1) + "%", note: "Low debt" };
      if (v < 150)  return { status: "warn", display: v.toFixed(1) + "%", note: "Moderate debt" };
      return { status: "fail", display: v.toFixed(1) + "%", note: "High debt load" };
    }
  },
  {
    id: "roe",
    name: "Return on Equity",
    description: "How efficiently the company uses shareholder equity.",
    evaluate: (data) => {
      const v = data.returnOnEquity;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      const pct = (v * 100).toFixed(1);
      if (v >= 0.15) return { status: "pass", display: pct + "%", note: "Strong returns" };
      if (v >= 0.08) return { status: "warn", display: pct + "%", note: "Adequate returns" };
      return { status: "fail", display: pct + "%", note: "Weak returns" };
    }
  },
  {
    id: "profit_margin",
    name: "Profit Margin",
    description: "Net profit as a percentage of revenue.",
    evaluate: (data) => {
      const v = data.profitMargins;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      const pct = (v * 100).toFixed(1);
      if (v >= 0.15) return { status: "pass", display: pct + "%", note: "Healthy margins" };
      if (v >= 0.05) return { status: "warn", display: pct + "%", note: "Thin margins" };
      return { status: "fail", display: pct + "%", note: "Low/negative margin" };
    }
  },
  {
    id: "revenue_growth",
    name: "Revenue Growth",
    description: "Year-over-year revenue growth rate.",
    evaluate: (data) => {
      const v = data.revenueGrowth;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      const pct = (v * 100).toFixed(1);
      if (v >= 0.10) return { status: "pass", display: pct + "%", note: "Strong growth" };
      if (v >= 0)    return { status: "warn", display: pct + "%", note: "Slow growth" };
      return { status: "fail", display: pct + "%", note: "Declining revenue" };
    }
  },
  {
    id: "current_ratio",
    name: "Current Ratio",
    description: "Ability to cover short-term liabilities with assets.",
    evaluate: (data) => {
      const v = data.currentRatio;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      if (v >= 1.5)  return { status: "pass", display: v.toFixed(2), note: "Good liquidity" };
      if (v >= 1.0)  return { status: "warn", display: v.toFixed(2), note: "Adequate liquidity" };
      return { status: "fail", display: v.toFixed(2), note: "Liquidity concern" };
    }
  },
  {
    id: "pb_ratio",
    name: "Price / Book",
    description: "Market price relative to book value.",
    evaluate: (data) => {
      const v = data.priceToBook;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      if (v > 0 && v < 1.5)  return { status: "pass", display: v.toFixed(2), note: "Potentially undervalued" };
      if (v >= 1.5 && v < 5) return { status: "warn", display: v.toFixed(2), note: "Fair value range" };
      return { status: "fail", display: v.toFixed(2), note: "Premium valuation" };
    }
  },
  {
    id: "eps",
    name: "EPS (Trailing)",
    description: "Earnings per share over the last 12 months.",
    evaluate: (data) => {
      const v = data.trailingEps;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      if (v > 5)   return { status: "pass", display: "₹" + v.toFixed(2), note: "Strong earnings" };
      if (v > 0)   return { status: "warn", display: "₹" + v.toFixed(2), note: "Positive earnings" };
      return { status: "fail", display: "₹" + v.toFixed(2), note: "Loss-making" };
    }
  },
  {
    id: "dividend",
    name: "Dividend Yield",
    description: "Annual dividend as a percent of stock price.",
    evaluate: (data) => {
      const v = data.dividendYield;
      if (v == null || v === 0) return { status: "warn", display: "0%", note: "No dividend" };
      const pct = (v * 100).toFixed(2);
      if (v >= 0.02) return { status: "pass", display: pct + "%", note: "Income-generating" };
      return { status: "warn", display: pct + "%", note: "Low yield" };
    }
  },
  {
    id: "beta",
    name: "Beta (Volatility)",
    description: "How much the stock moves vs the market.",
    evaluate: (data) => {
      const v = data.beta;
      if (v == null) return { status: "na", display: "N/A", note: "Not available" };
      if (v >= 0.5 && v <= 1.2) return { status: "pass", display: v.toFixed(2), note: "Stable stock" };
      if (v > 1.2 && v <= 1.8)  return { status: "warn", display: v.toFixed(2), note: "Moderately volatile" };
      return { status: "fail", display: v.toFixed(2), note: "High volatility" };
    }
  }
];