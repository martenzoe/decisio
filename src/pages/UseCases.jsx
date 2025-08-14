// src/pages/UseCases.jsx
import { useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";

/** Helpers */
function normalizeWeights(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + Number(b || 0), 0);
  if (!sum) return Object.fromEntries(Object.keys(weights).map((k) => [k, 0]));
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, Number(v || 0) / sum])
  );
}
function weightedScore(ratingsByCrit, normWeights) {
  return Object.keys(normWeights).reduce(
    (acc, crit) => acc + Number(ratingsByCrit[crit] || 0) * normWeights[crit],
    0
  );
}

/** Mini Calculator (Private) */
function MiniCalculatorPrivate() {
  const { t } = useTranslation();

  const cUsa = t("useCases.calcPrivate.criteria.usability", "Usability");
  const cInt = t("useCases.calcPrivate.criteria.integrations", "Integrations");
  const cSec = t("useCases.calcPrivate.criteria.security", "Security");
  const cCost = t("useCases.calcPrivate.criteria.costs", "Cost");

  const [weights, setWeights] = useState({
    [cUsa]: 40,
    [cInt]: 30,
    [cSec]: 20,
    [cCost]: 10,
  });

  const [optA, setOptA] = useState({ [cUsa]: 7, [cInt]: 6, [cSec]: 8, [cCost]: 6 });
  const [optB, setOptB] = useState({ [cUsa]: 8, [cInt]: 7, [cSec]: 9, [cCost]: 6 });
  const [optC, setOptC] = useState({ [cUsa]: 6, [cInt]: 8, [cSec]: 7, [cCost]: 8 });

  // take current keys (rebuilds when labels change)
  const allCriteria = useMemo(() => Object.keys(weights), [weights]);

  const norm = useMemo(() => normalizeWeights(weights), [weights]);
  const scoreA = useMemo(() => weightedScore(optA, norm), [optA, norm]);
  const scoreB = useMemo(() => weightedScore(optB, norm), [optB, norm]);
  const scoreC = useMemo(() => weightedScore(optC, norm), [optC, norm]);

  const ranked = useMemo(
    () =>
      [
        { name: t("useCases.calcPrivate.optionA", "Option A"), score: scoreA },
        { name: t("useCases.calcPrivate.optionB", "Option B"), score: scoreB },
        { name: t("useCases.calcPrivate.optionC", "Option C"), score: scoreC },
      ].sort((x, y) => y.score - x.score),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoreA, scoreB, scoreC, t]
  );

  const renderNumber = (v) => (Math.round(v * 100) / 100).toFixed(2);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold">
        {t("useCases.calcPrivate.title", "Interactive Mini-Calculator (Private)")}
      </h3>

      {/* Step 1: Weights */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Trans
            i18nKey="useCases.calcPrivate.step1"
            defaultValue="<b>1) Weights:</b> Give each criterion an importance. We normalize automatically to 100%."
            components={{ b: <b /> }}
          />
        </p>
        <div className="grid md:grid-cols-4 gap-3">
          {allCriteria.map((c) => (
            <div key={c}>
              <label className="block text-sm mb-1">{c}</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={weights[c]}
                onChange={(e) =>
                  setWeights({ ...weights, [c]: Number(e.target.value) })
                }
                aria-label={t("useCases.calcPrivate.weightAria", {
                  criterion: c,
                  defaultValue: `Weight for ${c}`,
                })}
              />
              <div className="text-xs text-gray-500 mt-1">
                {t("useCases.calcPrivate.normalized", {
                  value: renderNumber(norm[c]),
                  defaultValue: `normalized: ${renderNumber(norm[c])}`,
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Ratings */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Trans
            i18nKey="useCases.calcPrivate.step2"
            defaultValue="<b>2) Ratings:</b> Scale 1–10 (10 = great)."
            components={{ b: <b /> }}
          />
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border px-3 py-2 text-left">
                  {t("useCases.table.optionVsCriterion", "Option \\ Criterion")}
                </th>
                {allCriteria.map((c) => (
                  <th key={c} className="border px-3 py-2 text-left">
                    {c}
                  </th>
                ))}
                <th className="border px-3 py-2 text-left">
                  {t("useCases.table.weightedScore", "Weighted score")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: t("useCases.calcPrivate.optionA", "Option A"), state: optA, set: setOptA },
                { label: t("useCases.calcPrivate.optionB", "Option B"), state: optB, set: setOptB },
                { label: t("useCases.calcPrivate.optionC", "Option C"), state: optC, set: setOptC },
              ].map((row) => {
                const score = weightedScore(row.state, norm);
                return (
                  <tr key={row.label}>
                    <td className="border px-3 py-2 font-medium">{row.label}</td>
                    {allCriteria.map((c) => (
                      <td key={c} className="border px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="w-20 border rounded px-2 py-1"
                          value={row.state[c]}
                          onChange={(e) =>
                            row.set({ ...row.state, [c]: Number(e.target.value) })
                          }
                          aria-label={t("useCases.calcPrivate.ratingAria", {
                            option: row.label,
                            criterion: c,
                            defaultValue: `Rating for ${row.label} on ${c}`,
                          })}
                        />
                      </td>
                    ))}
                    <td className="border px-3 py-2 font-semibold">
                      {renderNumber(score)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 3: Result & ranking */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 space-y-3">
        <p className="text-sm">
          <b>{t("useCases.calcPrivate.step3", "3) Result:")}</b>{" "}
          {t(
            "useCases.calcPrivate.resultText",
            "For each option we do rating × (weight in %) per criterion, add everything up and compare the totals."
          )}
        </p>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {t(
            "useCases.calcPrivate.exampleLine",
            "Example: Usability (40%) × 7 + Integrations (30%) × 6 + Security (20%) × 8 + Cost (10%) × 6 = 7.10"
          )}
        </div>
        <ol className="list-decimal pl-6 space-y-1">
          {ranked.map((r, i) => (
            <li key={r.name}>
              {i === 0 && <span className="mr-1">🏆</span>}
              {r.name}: <b>{renderNumber(r.score)}</b>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Mini Calculator (Team) */
function MiniCalculatorTeam() {
  const { t } = useTranslation();

  const crits = [
    t("useCases.calcTeam.criteria.price", "Price"),
    t("useCases.calcTeam.criteria.quality", "Quality"),
    t("useCases.calcTeam.criteria.delivery", "Delivery"),
    t("useCases.calcTeam.criteria.sla", "SLA"),
  ];

  const [wA, setWA] = useState({ [crits[0]]: 30, [crits[1]]: 40, [crits[2]]: 20, [crits[3]]: 10 });
  const [wB, setWB] = useState({ [crits[0]]: 50, [crits[1]]: 20, [crits[2]]: 20, [crits[3]]: 10 });

  const [opt1A, setOpt1A] = useState({ [crits[0]]: 8, [crits[1]]: 7, [crits[2]]: 6, [crits[3]]: 7 });
  const [opt2A, setOpt2A] = useState({ [crits[0]]: 7, [crits[1]]: 9, [crits[2]]: 8, [crits[3]]: 8 });
  const [opt1B, setOpt1B] = useState({ [crits[0]]: 9, [crits[1]]: 6, [crits[2]]: 7, [crits[3]]: 6 });
  const [opt2B, setOpt2B] = useState({ [crits[0]]: 6, [crits[1]]: 8, [crits[2]]: 9, [crits[3]]: 8 });

  const nA = useMemo(() => normalizeWeights(wA), [wA]);
  const nB = useMemo(() => normalizeWeights(wB), [wB]);

  const s1A = useMemo(() => weightedScore(opt1A, nA), [opt1A, nA]);
  const s2A = useMemo(() => weightedScore(opt2A, nA), [opt2A, nA]);
  const s1B = useMemo(() => weightedScore(opt1B, nB), [opt1B, nB]);
  const s2B = useMemo(() => weightedScore(opt2B, nB), [opt2B, nB]);

  const team1 = useMemo(() => (s1A + s1B) / 2, [s1A, s1B]);
  const team2 = useMemo(() => (s2A + s2B) / 2, [s2A, s2B]);

  const ranked = useMemo(
    () =>
      [
        { name: t("useCases.calcTeam.supplierA", "Supplier A"), score: team1 },
        { name: t("useCases.calcTeam.supplierB", "Supplier B"), score: team2 },
      ].sort((x, y) => y.score - x.score),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [team1, team2, t]
  );

  const renderNumber = (v) => (Math.round(v * 100) / 100).toFixed(2);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold">
        {t("useCases.calcTeam.title", "Interactive Mini-Calculator (Team)")}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t(
          "useCases.calcTeam.subtitle",
          "Each person has their own weights and ratings. We average the person scores into the team result."
        )}
      </p>

      {/* Weights per person */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: t("useCases.calcTeam.personA", "Person A"), w: wA, setW: setWA, n: nA },
          { label: t("useCases.calcTeam.personB", "Person B"), w: wB, setW: setWB, n: nB },
        ].map((p) => (
          <div key={p.label} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">
              {t("useCases.calcTeam.weightsFor", { person: p.label, defaultValue: `Weights for ${p.label}` })}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {crits.map((c) => (
                <div key={c}>
                  <label className="block text-sm mb-1">{c}</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded px-3 py-2"
                    value={p.w[c]}
                    onChange={(e) => p.setW({ ...p.w, [c]: Number(e.target.value) })}
                    aria-label={t("useCases.calcTeam.weightAria", {
                      person: p.label,
                      criterion: c,
                      defaultValue: `Weight for ${c} (${p.label})`,
                    })}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {t("useCases.calcPrivate.normalized", {
                      value: renderNumber(p.n[c]),
                      defaultValue: `normalized: ${renderNumber(p.n[c])}`,
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ratings per person */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: t("useCases.calcTeam.personA", "Person A"), opt1: opt1A, set1: setOpt1A, opt2: opt2A, set2: setOpt2A },
          { label: t("useCases.calcTeam.personB", "Person B"), opt1: opt1B, set1: setOpt1B, opt2: opt2B, set2: setOpt2B },
        ].map((p) => (
          <div key={p.label} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">
              {t("useCases.calcTeam.ratingsFor", { person: p.label, defaultValue: `Ratings for ${p.label}` })}
            </h4>
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="border px-3 py-2 text-left">
                    {t("useCases.table.criterion", "Criterion")}
                  </th>
                  <th className="border px-3 py-2 text-left">
                    {t("useCases.calcTeam.supplierA", "Supplier A")}
                  </th>
                  <th className="border px-3 py-2 text-left">
                    {t("useCases.calcTeam.supplierB", "Supplier B")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {crits.map((c) => (
                  <tr key={c}>
                    <td className="border px-3 py-2 font-medium">{c}</td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        className="w-20 border rounded px-2 py-1"
                        value={p.opt1[c]}
                        onChange={(e) => p.set1({ ...p.opt1, [c]: Number(e.target.value) })}
                        aria-label={t("useCases.calcTeam.ratingAria", {
                          person: p.label,
                          supplier: t("useCases.calcTeam.supplierA", "Supplier A"),
                          criterion: c,
                          defaultValue: `Rating ${t("useCases.calcTeam.supplierA", "Supplier A")} on ${c} by ${p.label}`,
                        })}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        className="w-20 border rounded px-2 py-1"
                        value={p.opt2[c]}
                        onChange={(e) => p.set2({ ...p.opt2, [c]: Number(e.target.value) })}
                        aria-label={t("useCases.calcTeam.ratingAria", {
                          person: p.label,
                          supplier: t("useCases.calcTeam.supplierB", "Supplier B"),
                          criterion: c,
                          defaultValue: `Rating ${t("useCases.calcTeam.supplierB", "Supplier B")} on ${c} by ${p.label}`,
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Scores */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 space-y-2">
        <p className="font-medium">
          {t("useCases.calcTeam.personScores", "Person scores")}
        </p>
        <div className="text-sm">
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personA", "Person A"),
            supplier: t("useCases.calcTeam.supplierA", "Supplier A"),
            score: renderNumber(s1A),
            defaultValue: "Person A – Supplier A: {{score}}",
          })}{" "}
          ,{" "}
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personA", "Person A"),
            supplier: t("useCases.calcTeam.supplierB", "Supplier B"),
            score: renderNumber(s2A),
            defaultValue: "Person A – Supplier B: {{score}}",
          })}
        </div>
        <div className="text-sm">
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personB", "Person B"),
            supplier: t("useCases.calcTeam.supplierA", "Supplier A"),
            score: renderNumber(s1B),
            defaultValue: "Person B – Supplier A: {{score}}",
          })}{" "}
          ,{" "}
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personB", "Person B"),
            supplier: t("useCases.calcTeam.supplierB", "Supplier B"),
            score: renderNumber(s2B),
            defaultValue: "Person B – Supplier B: {{score}}",
          })}
        </div>
        <p className="font-medium mt-2">
          {t("useCases.calcTeam.teamScores", "Team scores")}
        </p>
        <div className="text-sm">
          {t("useCases.calcTeam.teamScoreLine", {
            supplier: t("useCases.calcTeam.supplierA", "Supplier A"),
            score: renderNumber(team1),
            defaultValue: "Supplier A: {{score}}",
          })}{" "}
          ,{" "}
          {t("useCases.calcTeam.teamScoreLine", {
            supplier: t("useCases.calcTeam.supplierB", "Supplier B"),
            score: renderNumber(team2),
            defaultValue: "Supplier B: {{score}}",
          })}
        </div>
        <p className="font-medium mt-2">
          {t("useCases.calcTeam.ranking", "Ranking")}
        </p>
        <ol className="list-decimal pl-6">
          {ranked.map((r, i) => (
            <li key={r.name}>
              {i === 0 && <span className="mr-1">🏆</span>}
              {r.name}: <b>{renderNumber(r.score)}</b>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function UseCases() {
  const { t } = useTranslation();

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-10 text-gray-900 dark:text-gray-100">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">
          {t("useCases.title", "Use Cases & How Decisia Scores")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            "useCases.intro",
            "Decisia structures decisions — solo or as a team. Define options, criteria, and weights, score each option per criterion, and get a transparent ranking. If you like, AI can pre-score for you."
          )}
        </p>
      </header>

      {/* How it works – simple, no formulas */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">
          {t("useCases.how.title", "How the scoring works")}
        </h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-800 dark:text-gray-200">
          <li>
            {t(
              "useCases.how.simple1",
              "Set weights: Private — give each criterion an importance (e.g. 40/30/20/10). Team — everyone sets their own weights. We normalize to 100%."
            )}
          </li>
          <li>
            {t(
              "useCases.how.simple2",
              "Add ratings: Private 1–10, Team 0–10 (0 = neutral / not met)."
            )}
          </li>
          <li>
            {t(
              "useCases.how.simple3",
              "Private result: per criterion do Rating × (Weight in %) and add everything up — that is the option score."
            )}
          </li>
          <li>
            {t(
              "useCases.how.simple4",
              "Team result: everyone calculates their option score as above; then we take the average across all people."
            )}
          </li>
          <li>
            {t(
              "useCases.how.simple5",
              "AI mode: Private — AI fills the 1–10 matrix with explanations (you can edit). Team — owner/admin can run AI; AI scores are saved and the decision is locked (AI-lock)."
            )}
          </li>
          <li>
            {t(
              "useCases.how.simple6",
              "Deadline (Team): after the deadline, inputs are locked."
            )}
          </li>
        </ol>
      </section>

      {/* Static mini example */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">
          {t("useCases.miniExample.title", "Mini example (Private)")}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          {t(
            "useCases.miniExample.text",
            "Criteria & importance: Usability 40, Integrations 30, Security 20, Cost 10 → weights w = 0.4 / 0.3 / 0.2 / 0.1"
          )}
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border px-3 py-2 text-left">
                  {t("useCases.table.optionVsCriterion", "Option \\ Criterion")}
                </th>
                <th className="border px-3 py-2 text-left">
                  {t("useCases.miniExample.head1", "Usability (w=0.4)")}
                </th>
                <th className="border px-3 py-2 text-left">
                  {t("useCases.miniExample.head2", "Integrations (w=0.3)")}
                </th>
                <th className="border px-3 py-2 text-left">
                  {t("useCases.miniExample.head3", "Security (w=0.2)")}
                </th>
                <th className="border px-3 py-2 text-left">
                  {t("useCases.miniExample.head4", "Cost (w=0.1)")}
                </th>
                <th className="border px-3 py-2 text-left">
                  {t("useCases.table.score", "Score")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 font-medium">
                  {t("useCases.calcPrivate.optionB", "Tool B")}
                </td>
                <td className="border px-3 py-2">8</td>
                <td className="border px-3 py-2">7</td>
                <td className="border px-3 py-2">9</td>
                <td className="border px-3 py-2">6</td>
                <td className="border px-3 py-2 font-semibold">7.70</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive demos */}
      <MiniCalculatorPrivate />
      <MiniCalculatorTeam />

      {/* Use case cards */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
        <h2 className="text-2xl font-semibold">
          {t("useCases.uc.title", "Popular use cases")}
        </h2>

        <div>
          <h3 className="text-lg font-semibold">
            {t("useCases.uc.uc1.title", "Choose a new job")}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc1.l1", "List job offers as options")}</li>
            <li>{t("useCases.uc.uc1.l2", "Criteria: salary, culture, growth, commute…")}</li>
            <li>{t("useCases.uc.uc1.l3", "Weight what matters to you")}</li>
            <li>{t("useCases.uc.uc1.l4", "Score 1–10 or ask AI")}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            {t("useCases.uc.uc2.title", "Compare SaaS tools")}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc2.l1", "Options: Tool A/B/C")}</li>
            <li>{t("useCases.uc.uc2.l2", "Criteria: features, integrations, security, price")}</li>
            <li>{t("useCases.uc.uc2.l3", "Use team mode to include colleagues")}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            {t("useCases.uc.uc3.title", "Vendor selection (team)")}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc3.l1", "Each person weights criteria individually")}</li>
            <li>{t("useCases.uc.uc3.l2", "Team result is the average of person scores")}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            {t("useCases.uc.uc4.title", "Hiring decision")}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc4.l1", "Options: candidates")}</li>
            <li>{t("useCases.uc.uc4.l2", "Criteria: skills, culture fit, potential, references")}</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">{t("useCases.faq.title", "FAQ")}</h2>
        <ul className="space-y-2 text-gray-800 dark:text-gray-200">
          <li>
            <b>{t("useCases.faq.q1.q", "What is Decisia?")}</b>{" "}
            {t(
              "useCases.faq.q1.a",
              "A structured way to make decisions — with optional AI-assisted scoring."
            )}
          </li>
          <li>
            <b>{t("useCases.faq.q2.q", "How does AI scoring work?")}</b>{" "}
            {t(
              "useCases.faq.q2.a",
              "We prompt GPT with your options & criteria. It fills ratings (1–10) and explanations. You can edit them."
            )}
          </li>
          <li>
            <b>{t("useCases.faq.q3.q", "Do I need an account?")}</b>{" "}
            {t("useCases.faq.q3.a", "Yes, to create and save decisions.")}
          </li>
          <li>
            <b>{t("useCases.faq.q4.q", "Private & business use?")}</b>{" "}
            {t("useCases.faq.q4.a", "Yes — built for both.")}
          </li>
          <li>
            <b>{t("useCases.faq.q5.q", "Is my data safe?")}</b>{" "}
            {t("useCases.faq.q5.a", "We use modern auth and never sell your data.")}
          </li>
        </ul>
      </section>
    </main>
  );
}
