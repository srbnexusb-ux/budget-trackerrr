import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const SUPABASE_URL = 'https://iggerytxqfuhuiguetsh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AopIbi5NDdaxj6aUgWNrwQ_xB7P4dlS';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const EXPENSE_CATS = [
  'Housing',
  'Utilities',
  'Groceries',
  'Dining Out',
  'Transport',
  'Health',
  'Insurance',
  'Entertainment',
  'Clothing',
  'Personal Care',
  'Education',
  'Subscriptions',
  'Gifts',
  'Misc',
];
const INCOME_CATS = ['Primary Job', 'Side Income', 'Investments', 'Other'];
const SAVINGS_CATS = [
  'Emergency Fund',
  'Retirement',
  'Vacation',
  'Other Savings',
];

const P = {
  bg: '#F6F4D2',
  panel: '#ffffff',
  card: '#ffffff',
  sage: '#D4E09B',
  mint: '#CBDFBD',
  salmon: '#F19C79',
  terra: '#A44A3F',
  text: '#3d2b27',
  muted: '#7a6a5a',
  border: '#CBDFBD',
  input: '#F6F4D2',
  positive: '#5a7a3a',
  negative: '#A44A3F',
  tabBg: '#ede9b8',
};
const CHART_COLORS = [
  '#A44A3F',
  '#D4E09B',
  '#F19C79',
  '#CBDFBD',
  '#c17f24',
  '#7a9e5a',
  '#e8b89a',
  '#8fad6e',
  '#d4735a',
  '#b5cc85',
  '#f0a882',
  '#6b9e7a',
  '#bf6a60',
  '#d9e8a0',
];
const fmt = (v) =>
  v == null || v === ''
    ? ''
    : `$${parseFloat(v || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
const num = (v) => parseFloat(v) || 0;
const card = (extra = {}) => ({
  background: P.card,
  borderRadius: 12,
  padding: '14px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  ...extra,
});
const tooltipStyle = {
  background: P.panel,
  border: `1px solid ${P.border}`,
  borderRadius: 8,
  fontSize: 11,
  color: P.text,
};

const defaultAnnualBudget = () => ({
  income: INCOME_CATS.map((c) => ({
    cat: c,
    ...Object.fromEntries(MONTHS.map((m) => [m, 0])),
  })),
  expenses: EXPENSE_CATS.map((c) => ({
    cat: c,
    ...Object.fromEntries(MONTHS.map((m) => [m, 0])),
  })),
  savings: SAVINGS_CATS.map((c) => ({
    cat: c,
    ...Object.fromEntries(MONTHS.map((m) => [m, 0])),
  })),
});
const defaultMonthActuals = () => ({
  income: INCOME_CATS.map((c) => ({ cat: c, amount: 0, note: '' })),
  expenses: EXPENSE_CATS.map((c) => ({ cat: c, amount: 0, note: '' })),
  savings: SAVINGS_CATS.map((c) => ({ cat: c, amount: 0, note: '' })),
});
const defaultActuals = () =>
  Object.fromEntries(MONTHS.map((m) => [m, defaultMonthActuals()]));

async function dbGet(id) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/budget?id=eq.${id}&select=data`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const rows = await r.json();
  return rows?.[0]?.data || null;
}

async function dbSet(id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/budget?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('annual-plan');
  const [annualBudget, setAnnualBudget] = useState(defaultAnnualBudget);
  const [actuals, setActuals] = useState(defaultActuals);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // "saved" | "saving" | "unsaved"
  const saveTimer = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const [budgetData, actualsData] = await Promise.all([
          dbGet('annual'),
          dbGet('actuals'),
        ]);
        if (budgetData && Object.keys(budgetData).length > 0) {
          // Merge saved data with defaults to handle new categories
          const merged = defaultAnnualBudget();
          ['income', 'expenses', 'savings'].forEach((sec) => {
            merged[sec] = merged[sec].map((row) => {
              const saved = budgetData[sec]?.find((r) => r.cat === row.cat);
              return saved ? { ...row, ...saved } : row;
            });
          });
          setAnnualBudget(merged);
        }
        if (actualsData && Object.keys(actualsData).length > 0) {
          const mergedAct = defaultActuals();
          MONTHS.forEach((m) => {
            if (actualsData[m]) {
              ['income', 'expenses', 'savings'].forEach((sec) => {
                mergedAct[m][sec] = mergedAct[m][sec].map((row) => {
                  const saved = actualsData[m][sec]?.find(
                    (r) => r.cat === row.cat
                  );
                  return saved ? { ...row, ...saved } : row;
                });
              });
            }
          });
          setActuals(mergedAct);
        }
      } catch (e) {
        console.error('Load error', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Debounced auto-save
  const scheduleSave = useCallback((newBudget, newActuals) => {
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await Promise.all([
          dbSet('annual', newBudget),
          dbSet('actuals', newActuals),
        ]);
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('unsaved');
      }
    }, 1200);
  }, []);

  const updateBudget = (section, ri, month, val) => {
    setAnnualBudget((prev) => {
      const next = {
        ...prev,
        [section]: prev[section].map((r, i) =>
          i === ri ? { ...r, [month]: val } : r
        ),
      };
      scheduleSave(next, actuals);
      return next;
    });
  };

  const updateActual = (month, section, ri, field, val) => {
    setActuals((prev) => {
      const next = {
        ...prev,
        [month]: {
          ...prev[month],
          [section]: prev[month][section].map((r, i) =>
            i === ri ? { ...r, [field]: val } : r
          ),
        },
      };
      scheduleSave(annualBudget, next);
      return next;
    });
  };

  const monthlyBudgetTotals = (m) => ({
    income: annualBudget.income.reduce((s, r) => s + num(r[m]), 0),
    expenses: annualBudget.expenses.reduce((s, r) => s + num(r[m]), 0),
    savings: annualBudget.savings.reduce((s, r) => s + num(r[m]), 0),
  });
  const monthlyActualTotals = (m) => ({
    income: actuals[m].income.reduce((s, r) => s + num(r.amount), 0),
    expenses: actuals[m].expenses.reduce((s, r) => s + num(r.amount), 0),
    savings: actuals[m].savings.reduce((s, r) => s + num(r.amount), 0),
  });

  const tabs = [
    { id: 'annual-plan', label: '📋 Annual Plan' },
    { id: 'annual-summary', label: '📊 Summary' },
    ...MONTHS.map((m) => ({ id: `month-${m}`, label: m })),
  ];

  const statusColor =
    saveStatus === 'saved'
      ? P.positive
      : saveStatus === 'saving'
      ? '#c17f24'
      : P.terra;
  const statusLabel =
    saveStatus === 'saved'
      ? '✓ Saved'
      : saveStatus === 'saving'
      ? '⏳ Saving…'
      : '● Unsaved';

  if (loading)
    return (
      <div
        style={{
          background: P.bg,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter,sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
          <div style={{ color: P.muted, fontSize: 14 }}>
            Loading your budget…
          </div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        fontFamily: "'Inter',-apple-system,sans-serif",
        background: P.bg,
        minHeight: '100vh',
        color: P.text,
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg,${P.mint},${P.sage})`,
          padding: '14px 16px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{ margin: 0, fontSize: 19, fontWeight: 700, color: P.terra }}
          >
            💰 Budget Tracker
          </h1>
          <p style={{ margin: '1px 0 0', fontSize: 11, color: P.muted }}>
            Annual planning & monthly spending
          </p>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            background: 'rgba(255,255,255,0.6)',
            padding: '4px 10px',
            borderRadius: 20,
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          background: P.tabBg,
          borderBottom: `1px solid ${P.border}`,
          padding: '0 4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 12px',
              border: 'none',
              background: 'none',
              color: activeTab === t.id ? P.terra : P.muted,
              borderBottom:
                activeTab === t.id
                  ? `2px solid ${P.terra}`
                  : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === t.id ? 700 : 400,
              whiteSpace: 'nowrap',
              transition: 'color 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 14, maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'annual-plan' && (
          <AnnualPlanTab
            annualBudget={annualBudget}
            updateBudget={updateBudget}
            monthlyBudgetTotals={monthlyBudgetTotals}
          />
        )}
        {activeTab === 'annual-summary' && (
          <AnnualSummaryTab
            annualBudget={annualBudget}
            actuals={actuals}
            monthlyActualTotals={monthlyActualTotals}
            monthlyBudgetTotals={monthlyBudgetTotals}
          />
        )}
        {MONTHS.map(
          (m, i) =>
            activeTab === `month-${m}` && (
              <MonthTab
                key={m}
                month={m}
                monthFull={MONTH_FULL[i]}
                annualBudget={annualBudget}
                actuals={actuals[m]}
                updateActual={(s, ri, f, v) => updateActual(m, s, ri, f, v)}
                budgetTotals={monthlyBudgetTotals(m)}
                actualTotals={monthlyActualTotals(m)}
              />
            )
        )}
      </div>
    </div>
  );
}

function AnnualPlanTab({ annualBudget, updateBudget, monthlyBudgetTotals }) {
  const sectionTotals = (sk) =>
    MONTHS.map((m) => annualBudget[sk].reduce((s, r) => s + num(r[m]), 0));
  const rowTotal = (row) => MONTHS.reduce((s, m) => s + num(row[m]), 0);
  const netByMonth = MONTHS.map((m) => {
    const t = monthlyBudgetTotals(m);
    return { month: m, ...t, net: t.income - t.expenses - t.savings };
  });
  const grand = netByMonth.reduce(
    (a, r) => ({
      income: a.income + r.income,
      expenses: a.expenses + r.expenses,
      savings: a.savings + r.savings,
      net: a.net + r.net,
    }),
    { income: 0, expenses: 0, savings: 0, net: 0 }
  );
  const inputStyle = {
    width: '100%',
    background: P.input,
    border: `1px solid ${P.border}`,
    borderRadius: 5,
    color: P.text,
    padding: '4px 5px',
    fontSize: 11,
    textAlign: 'right',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };

  const Section = ({ title, sectionKey, color, emoji }) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 8px', color, fontSize: 13, fontWeight: 700 }}>
        {emoji} {title}
      </h3>
      <div
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 11,
            background: P.panel,
          }}
        >
          <thead>
            <tr style={{ background: P.mint }}>
              <th
                style={{
                  padding: '7px 10px',
                  textAlign: 'left',
                  color: P.text,
                  width: 110,
                  position: 'sticky',
                  left: 0,
                  background: P.mint,
                  fontWeight: 600,
                }}
              >
                Category
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  style={{
                    padding: '7px 5px',
                    textAlign: 'right',
                    color: P.text,
                    minWidth: 70,
                    fontWeight: 600,
                  }}
                >
                  {m}
                </th>
              ))}
              <th
                style={{
                  padding: '7px 8px',
                  textAlign: 'right',
                  color: P.text,
                  minWidth: 82,
                  fontWeight: 600,
                }}
              >
                Annual
              </th>
            </tr>
          </thead>
          <tbody>
            {annualBudget[sectionKey].map((row, ri) => (
              <tr key={row.cat} style={{ borderBottom: `1px solid ${P.bg}` }}>
                <td
                  style={{
                    padding: '5px 10px',
                    color: P.text,
                    background: P.panel,
                    position: 'sticky',
                    left: 0,
                    fontWeight: 500,
                  }}
                >
                  {row.cat}
                </td>
                {MONTHS.map((m) => (
                  <td key={m} style={{ padding: '3px 3px' }}>
                    <input
                      type="number"
                      min="0"
                      value={row[m] || ''}
                      placeholder="0"
                      onChange={(e) =>
                        updateBudget(sectionKey, ri, m, e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>
                ))}
                <td
                  style={{
                    padding: '5px 8px',
                    textAlign: 'right',
                    color,
                    fontWeight: 700,
                  }}
                >
                  {fmt(rowTotal(row))}
                </td>
              </tr>
            ))}
            <tr style={{ background: P.sage, fontWeight: 700 }}>
              <td
                style={{
                  padding: '6px 10px',
                  color: P.terra,
                  position: 'sticky',
                  left: 0,
                  background: P.sage,
                }}
              >
                Total
              </td>
              {sectionTotals(sectionKey).map((t, i) => (
                <td
                  key={i}
                  style={{
                    padding: '6px 5px',
                    textAlign: 'right',
                    color: P.terra,
                  }}
                >
                  {fmt(t)}
                </td>
              ))}
              <td
                style={{
                  padding: '6px 8px',
                  textAlign: 'right',
                  color: P.terra,
                }}
              >
                {fmt(sectionTotals(sectionKey).reduce((a, b) => a + b, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}
      >
        {[
          { l: 'Annual Income', v: grand.income, c: P.positive, b: P.mint },
          { l: 'Annual Expenses', v: grand.expenses, c: P.terra, b: P.salmon },
          { l: 'Annual Savings', v: grand.savings, c: '#7a6a2a', b: P.sage },
          {
            l: 'Annual Net',
            v: grand.net,
            c: grand.net >= 0 ? P.positive : P.terra,
            b: P.border,
          },
        ].map((x) => (
          <div
            key={x.l}
            style={{
              ...card({
                flex: '1 1 130px',
                borderLeft: `3px solid ${x.c}`,
                background: x.b,
              }),
            }}
          >
            <div style={{ fontSize: 10, color: P.muted, marginBottom: 2 }}>
              {x.l}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: x.c }}>
              {fmt(x.v)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...card({ marginBottom: 20 }) }}>
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            color: P.muted,
            fontWeight: 600,
          }}
        >
          📈 MONTHLY BUDGET OVERVIEW
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={netByMonth}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
            <XAxis dataKey="month" tick={{ fill: P.muted, fontSize: 10 }} />
            <YAxis
              tick={{ fill: P.muted, fontSize: 10 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={42}
            />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar
              dataKey="income"
              fill={P.mint}
              name="Income"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill={P.salmon}
              name="Expenses"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="savings"
              fill={P.sage}
              name="Savings"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Section
        title="Income"
        sectionKey="income"
        color={P.positive}
        emoji="💵"
      />
      <Section
        title="Expenses"
        sectionKey="expenses"
        color={P.terra}
        emoji="💸"
      />
      <Section
        title="Savings"
        sectionKey="savings"
        color="#7a6a2a"
        emoji="🏦"
      />
    </div>
  );
}

function AnnualSummaryTab({
  annualBudget,
  actuals,
  monthlyActualTotals,
  monthlyBudgetTotals,
}) {
  const ytdData = MONTHS.map((m) => {
    const b = monthlyBudgetTotals(m),
      a = monthlyActualTotals(m);
    return {
      month: m,
      budgetIncome: b.income,
      actualIncome: a.income,
      budgetExp: b.expenses,
      actualExp: a.expenses,
      budgetSav: b.savings,
      actualSav: a.savings,
    };
  });
  const totals = ytdData.reduce(
    (acc, r) => ({
      budgetIncome: acc.budgetIncome + r.budgetIncome,
      actualIncome: acc.actualIncome + r.actualIncome,
      budgetExp: acc.budgetExp + r.budgetExp,
      actualExp: acc.actualExp + r.actualExp,
      budgetSav: acc.budgetSav + r.budgetSav,
      actualSav: acc.actualSav + r.actualSav,
    }),
    {
      budgetIncome: 0,
      actualIncome: 0,
      budgetExp: 0,
      actualExp: 0,
      budgetSav: 0,
      actualSav: 0,
    }
  );
  const expByCategory = EXPENSE_CATS.map((cat) => {
    const actual = MONTHS.reduce(
      (s, m) => s + num(actuals[m].expenses.find((r) => r.cat === cat)?.amount),
      0
    );
    const budget = MONTHS.reduce(
      (s, m) => s + num(annualBudget.expenses.find((r) => r.cat === cat)?.[m]),
      0
    );
    return { cat, actual, budget };
  }).filter((r) => r.actual > 0 || r.budget > 0);
  const pieData = expByCategory
    .filter((r) => r.actual > 0)
    .map((r) => ({ name: r.cat, value: r.actual }));

  return (
    <div>
      <div
        style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
      >
        {[
          {
            l: 'Budgeted Income',
            v: totals.budgetIncome,
            c: P.positive,
            bg: P.mint,
          },
          {
            l: 'Actual Income',
            v: totals.actualIncome,
            c: P.positive,
            bg: '#e8f0d4',
          },
          {
            l: 'Budgeted Expenses',
            v: totals.budgetExp,
            c: P.terra,
            bg: '#fde8dc',
          },
          {
            l: 'Actual Expenses',
            v: totals.actualExp,
            c: P.terra,
            bg: P.salmon,
          },
          {
            l: 'Budgeted Savings',
            v: totals.budgetSav,
            c: '#7a6a2a',
            bg: P.sage,
          },
          {
            l: 'Actual Savings',
            v: totals.actualSav,
            c: '#7a6a2a',
            bg: '#e8edba',
          },
        ].map((x) => (
          <div
            key={x.l}
            style={{ ...card({ flex: '1 1 120px', background: x.bg }) }}
          >
            <div style={{ fontSize: 10, color: P.muted, marginBottom: 2 }}>
              {x.l}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: x.c }}>
              {fmt(x.v)}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={card()}>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 12,
              color: P.muted,
              fontWeight: 600,
            }}
          >
            📊 BUDGET VS ACTUAL
          </h3>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart
              data={ytdData}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
              <XAxis dataKey="month" tick={{ fill: P.muted, fontSize: 9 }} />
              <YAxis
                tick={{ fill: P.muted, fontSize: 9 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={38}
              />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar
                dataKey="budgetIncome"
                fill={P.mint}
                name="Budg Inc"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="actualIncome"
                fill="#7aa85a"
                name="Act Inc"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="budgetExp"
                fill="#f7c5aa"
                name="Budg Exp"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="actualExp"
                fill={P.terra}
                name="Act Exp"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 12,
              color: P.muted,
              fontWeight: 600,
            }}
          >
            🥧 SPENDING BY CATEGORY
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={195}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={8}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </div>
      </div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 12,
            color: P.muted,
            fontWeight: 600,
          }}
        >
          📉 EXPENSES: BUDGET VS ACTUAL BY CATEGORY
        </h3>
        {expByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={expByCategory}
              margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
              <XAxis
                dataKey="cat"
                tick={{ fill: P.muted, fontSize: 9 }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis
                tick={{ fill: P.muted, fontSize: 9 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={38}
              />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="budget"
                fill={P.sage}
                name="Budget"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="actual"
                fill={P.terra}
                name="Actual"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </div>
      <div style={card()}>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 12,
            color: P.muted,
            fontWeight: 600,
          }}
        >
          📋 ANNUAL TABLE
        </h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}
          >
            <thead>
              <tr style={{ background: P.mint }}>
                {[
                  'Month',
                  'Budg Inc',
                  'Act Inc',
                  'Var',
                  'Budg Exp',
                  'Act Exp',
                  'Var',
                  'Budg Sav',
                  'Act Sav',
                  'Var',
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '6px 7px',
                      textAlign: i === 0 ? 'left' : 'right',
                      color: P.text,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ytdData.map((r, i) => {
                const iV = r.actualIncome - r.budgetIncome,
                  eV = r.budgetExp - r.actualExp,
                  sV = r.actualSav - r.budgetSav;
                return (
                  <tr
                    key={r.month}
                    style={{
                      borderBottom: `1px solid ${P.border}`,
                      background: i % 2 === 0 ? P.bg : P.panel,
                    }}
                  >
                    <td
                      style={{
                        padding: '5px 7px',
                        color: P.text,
                        fontWeight: 600,
                      }}
                    >
                      {r.month}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: P.muted,
                      }}
                    >
                      {fmt(r.budgetIncome)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: P.positive,
                      }}
                    >
                      {fmt(r.actualIncome)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: iV >= 0 ? P.positive : P.terra,
                        fontWeight: 600,
                      }}
                    >
                      {iV >= 0 ? '+' : ''}
                      {fmt(iV)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: P.muted,
                      }}
                    >
                      {fmt(r.budgetExp)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: P.terra,
                      }}
                    >
                      {fmt(r.actualExp)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: eV >= 0 ? P.positive : P.terra,
                        fontWeight: 600,
                      }}
                    >
                      {eV >= 0 ? '+' : ''}
                      {fmt(eV)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: P.muted,
                      }}
                    >
                      {fmt(r.budgetSav)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: '#7a6a2a',
                      }}
                    >
                      {fmt(r.actualSav)}
                    </td>
                    <td
                      style={{
                        padding: '5px 7px',
                        textAlign: 'right',
                        color: sV >= 0 ? P.positive : P.terra,
                        fontWeight: 600,
                      }}
                    >
                      {sV >= 0 ? '+' : ''}
                      {fmt(sV)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MonthTab({
  month,
  monthFull,
  annualBudget,
  actuals,
  updateActual,
  budgetTotals,
  actualTotals,
}) {
  const pieData = actuals.expenses
    .filter((r) => num(r.amount) > 0)
    .map((r) => ({ name: r.cat, value: num(r.amount) }));
  const vsData = [
    {
      name: 'Income',
      budget: budgetTotals.income,
      actual: actualTotals.income,
    },
    {
      name: 'Expenses',
      budget: budgetTotals.expenses,
      actual: actualTotals.expenses,
    },
    {
      name: 'Savings',
      budget: budgetTotals.savings,
      actual: actualTotals.savings,
    },
  ];
  const netBudget =
    budgetTotals.income - budgetTotals.expenses - budgetTotals.savings;
  const netActual =
    actualTotals.income - actualTotals.expenses - actualTotals.savings;
  const inputStyle = {
    width: '100%',
    background: P.input,
    border: `1px solid ${P.border}`,
    borderRadius: 5,
    color: P.text,
    padding: '5px 7px',
    fontSize: 12,
    textAlign: 'right',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };
  const noteStyle = {
    ...inputStyle,
    textAlign: 'left',
    color: P.muted,
    fontSize: 11,
  };

  const Section = ({ title, sectionKey, color, emoji, budgetRows }) => (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: '0 0 7px', color, fontSize: 13, fontWeight: 700 }}>
        {emoji} {title}
      </h3>
      <div
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
            background: P.panel,
          }}
        >
          <thead>
            <tr style={{ background: P.mint }}>
              {['Category', 'Budgeted', 'Actual', 'Variance', 'Note'].map(
                (h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 8px',
                      textAlign: i === 0 || i === 4 ? 'left' : 'right',
                      color: P.text,
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {actuals[sectionKey].map((row, ri) => {
              const budgeted = num(
                budgetRows.find((r) => r.cat === row.cat)?.[month]
              );
              const actual = num(row.amount);
              const variance =
                sectionKey === 'expenses'
                  ? budgeted - actual
                  : actual - budgeted;
              return (
                <tr key={row.cat} style={{ borderBottom: `1px solid ${P.bg}` }}>
                  <td
                    style={{
                      padding: '5px 8px',
                      color: P.text,
                      fontWeight: 500,
                    }}
                  >
                    {row.cat}
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      color: P.muted,
                    }}
                  >
                    {fmt(budgeted)}
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <input
                      type="number"
                      min="0"
                      value={row.amount || ''}
                      placeholder="0"
                      onChange={(e) =>
                        updateActual(sectionKey, ri, 'amount', e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      color: variance >= 0 ? P.positive : P.terra,
                      fontWeight: 600,
                    }}
                  >
                    {budgeted === 0 && actual === 0
                      ? '—'
                      : `${variance >= 0 ? '+' : ''}${fmt(variance)}`}
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <input
                      type="text"
                      value={row.note || ''}
                      placeholder="Note..."
                      onChange={(e) =>
                        updateActual(sectionKey, ri, 'note', e.target.value)
                      }
                      style={noteStyle}
                    />
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: P.sage, fontWeight: 700 }}>
              <td style={{ padding: '6px 8px', color: P.terra }}>Total</td>
              <td
                style={{
                  padding: '6px 8px',
                  textAlign: 'right',
                  color: P.muted,
                }}
              >
                {fmt(
                  actuals[sectionKey].reduce((_, r) => {
                    const b = budgetRows.find((x) => x.cat === r.cat);
                    return _ + num(b?.[month]);
                  }, 0)
                )}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color }}>
                {fmt(
                  actuals[sectionKey].reduce((s, r) => s + num(r.amount), 0)
                )}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <h2
        style={{
          margin: '0 0 12px',
          fontSize: 20,
          color: P.terra,
          fontWeight: 700,
        }}
      >
        {monthFull}
      </h2>
      <div
        style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
      >
        {[
          {
            l: 'Income',
            b: budgetTotals.income,
            a: actualTotals.income,
            c: P.positive,
            bg: P.mint,
          },
          {
            l: 'Expenses',
            b: budgetTotals.expenses,
            a: actualTotals.expenses,
            c: P.terra,
            bg: '#fde8dc',
          },
          {
            l: 'Savings',
            b: budgetTotals.savings,
            a: actualTotals.savings,
            c: '#7a6a2a',
            bg: P.sage,
          },
          {
            l: 'Net Flow',
            b: netBudget,
            a: netActual,
            c: netActual >= 0 ? P.positive : P.terra,
            bg: P.border,
          },
        ].map((x) => (
          <div
            key={x.l}
            style={{ ...card({ flex: '1 1 120px', background: x.bg }) }}
          >
            <div
              style={{
                fontSize: 10,
                color: P.muted,
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              {x.l}
            </div>
            <div style={{ fontSize: 11, color: P.muted }}>
              Budget:{' '}
              <span style={{ color: P.text, fontWeight: 600 }}>{fmt(x.b)}</span>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: x.c,
                marginTop: 2,
              }}
            >
              Actual: {fmt(x.a)}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={card()}>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 12,
              color: P.muted,
              fontWeight: 600,
            }}
          >
            📊 BUDGET VS ACTUAL
          </h3>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart
              data={vsData}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
              <XAxis dataKey="name" tick={{ fill: P.muted, fontSize: 10 }} />
              <YAxis
                tick={{ fill: P.muted, fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={38}
              />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="budget"
                fill={P.sage}
                name="Budget"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="actual"
                fill={P.terra}
                name="Actual"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 12,
              color: P.muted,
              fontWeight: 600,
            }}
          >
            🥧 SPENDING
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={185}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={68}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={8}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </div>
      </div>
      <div style={card()}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 12,
            color: P.muted,
            fontWeight: 600,
          }}
        >
          ✏️ ENTER ACTUALS
        </h3>
        <Section
          title="Income"
          sectionKey="income"
          color={P.positive}
          emoji="💵"
          budgetRows={annualBudget.income}
        />
        <Section
          title="Expenses"
          sectionKey="expenses"
          color={P.terra}
          emoji="💸"
          budgetRows={annualBudget.expenses}
        />
        <Section
          title="Savings"
          sectionKey="savings"
          color="#7a6a2a"
          emoji="🏦"
          budgetRows={annualBudget.savings}
        />
      </div>
    </div>
  );
}

const Empty = () => (
  <div
    style={{
      height: 185,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: P.border,
      fontSize: 12,
    }}
  >
    Enter data to see chart
  </div>
);
