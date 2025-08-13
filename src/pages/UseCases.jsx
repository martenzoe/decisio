// src/pages/UseCases.jsx
import { useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";

/** Helpers */
function normalizeWeights(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + Number(b || 0), 0);
  if (!sum) return Object.fromEntries(Object.keys(weights).map(k => [k, 0]));
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Number(v || 0) / sum]));
}
function weightedScore(ratingsByCrit, normWeights) {
  return Object.keys(normWeights).reduce((acc, crit) => acc + (Number(ratingsByCrit[crit] || 0) * normWeights[crit]), 0);
}

/** Mini Calculator (Private) */
function MiniCalculatorPrivate() {
  const { t } = useTranslation();

  const [weights, setWeights] = useState({
    [t("useCases.calcPrivate.criteria.usability")]: 40,
    [t("useCases.calcPrivate.criteria.integrations")]: 30,
    [t("useCases.calcPrivate.criteria.security")]: 20,
    [t("useCases.calcPrivate.criteria.costs")]: 10
  });

  const [optA, setOptA] = useState({
    [t("useCases.calcPrivate.criteria.usability")]: 7,
    [t("useCases.calcPrivate.criteria.integrations")]: 6,
    [t("useCases.calcPrivate.criteria.security")]: 8,
    [t("useCases.calcPrivate.criteria.costs")]: 6
  });
  const [optB, setOptB] = useState({
    [t("useCases.calcPrivate.criteria.usability")]: 8,
    [t("useCases.calcPrivate.criteria.integrations")]: 7,
    [t("useCases.calcPrivate.criteria.security")]: 9,
    [t("useCases.calcPrivate.criteria.costs")]: 6
  });
  const [optC, setOptC] = useState({
    [t("useCases.calcPrivate.criteria.usability")]: 6,
    [t("useCases.calcPrivate.criteria.integrations")]: 8,
    [t("useCases.calcPrivate.criteria.security")]: 7,
    [t("useCases.calcPrivate.criteria.costs")]: 8
  });

  // Rebuild state when language changes (simple approach)
  const allCriteria = useMemo(() => Object.keys(weights), [weights]);

  const norm = useMemo(() => normalizeWeights(weights), [weights]);
  const scoreA = useMemo(() => weightedScore(optA, norm), [optA, norm]);
  const scoreB = useMemo(() => weightedScore(optB, norm), [optB, norm]);
  const scoreC = useMemo(() => weightedScore(optC, norm), [optC, norm]);

  const ranked = useMemo(
    () =>
      [
        { name: t("useCases.calcPrivate.optionA"), score: scoreA },
        { name: t("useCases.calcPrivate.optionB"), score: scoreB },
        { name: t("useCases.calcPrivate.optionC"), score: scoreC }
      ].sort((x, y) => y.score - x.score),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoreA, scoreB, scoreC, t] // re-rank on locale change
  );

  const renderNumber = (v) => (Math.round(v * 100) / 100).toFixed(2);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold">{t("useCases.calcPrivate.title")}</h3>

      {/* Step 1: Weights */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Trans i18nKey="useCases.calcPrivate.step1" components={{ b: <b /> }} />
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
                onChange={(e) => setWeights({ ...weights, [c]: Number(e.target.value) })}
                aria-label={t("useCases.calcPrivate.weightAria", { criterion: c })}
              />
              <div className="text-xs text-gray-500 mt-1">
                {t("useCases.calcPrivate.normalized", { value: renderNumber(norm[c]) })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Ratings */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Trans i18nKey="useCases.calcPrivate.step2" components={{ b: <b /> }} />
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border px-3 py-2 text-left">{t("useCases.table.optionVsCriterion")}</th>
                {allCriteria.map((c) => (
                  <th key={c} className="border px-3 py-2 text-left">
                    {c}
                  </th>
                ))}
                <th className="border px-3 py-2 text-left">{t("useCases.table.weightedScore")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: t("useCases.calcPrivate.optionA"), state: optA, set: setOptA },
                { label: t("useCases.calcPrivate.optionB"), state: optB, set: setOptB },
                { label: t("useCases.calcPrivate.optionC"), state: optC, set: setOptC }
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
                          onChange={(e) => row.set({ ...row.state, [c]: Number(e.target.value) })}
                          aria-label={t("useCases.calcPrivate.ratingAria", { option: row.label, criterion: c })}
                        />
                      </td>
                    ))}
                    <td className="border px-3 py-2 font-semibold">{renderNumber(score)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rankings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded p-4">
        <p className="text-sm mb-2">
          <b>{t("useCases.calcPrivate.step3")}</b>
        </p>
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
    t("useCases.calcTeam.criteria.price"),
    t("useCases.calcTeam.criteria.quality"),
    t("useCases.calcTeam.criteria.delivery"),
    t("useCases.calcTeam.criteria.sla")
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
        { name: t("useCases.calcTeam.supplierA"), score: team1 },
        { name: t("useCases.calcTeam.supplierB"), score: team2 }
      ].sort((x, y) => y.score - x.score),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [team1, team2, t]
  );

  const renderNumber = (v) => (Math.round(v * 100) / 100).toFixed(2);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold">{t("useCases.calcTeam.title")}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t("useCases.calcTeam.subtitle")}</p>

      {/* Weights per person */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: t("useCases.calcTeam.personA"), w: wA, setW: setWA, n: nA },
          { label: t("useCases.calcTeam.personB"), w: wB, setW: setWB, n: nB }
        ].map((p) => (
          <div key={p.label} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">{t("useCases.calcTeam.weightsFor", { person: p.label })}</h4>
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
                    aria-label={t("useCases.calcTeam.weightAria", { person: p.label, criterion: c })}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {t("useCases.calcPrivate.normalized", { value: renderNumber(p.n[c]) })}
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
          { label: t("useCases.calcTeam.personA"), opt1: opt1A, set1: setOpt1A, opt2: opt2A, set2: setOpt2A },
          { label: t("useCases.calcTeam.personB"), opt1: opt1B, set1: setOpt1B, opt2: opt2B, set2: setOpt2B }
        ].map((p) => (
          <div key={p.label} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">{t("useCases.calcTeam.ratingsFor", { person: p.label })}</h4>
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="border px-3 py-2 text-left">{t("useCases.table.criterion")}</th>
                  <th className="border px-3 py-2 text-left">{t("useCases.calcTeam.supplierA")}</th>
                  <th className="border px-3 py-2 text-left">{t("useCases.calcTeam.supplierB")}</th>
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
                        aria-label={t("useCases.calcTeam.ratingAria", { person: p.label, supplier: t("useCases.calcTeam.supplierA"), criterion: c })}
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
                        aria-label={t("useCases.calcTeam.ratingAria", { person: p.label, supplier: t("useCases.calcTeam.supplierB"), criterion: c })}
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
        <p className="font-medium">{t("useCases.calcTeam.personScores")}</p>
        <div className="text-sm">
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personA"),
            supplier: t("useCases.calcTeam.supplierA"),
            score: renderNumber(s1A)
          })}
          ,{" "}
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personA"),
            supplier: t("useCases.calcTeam.supplierB"),
            score: renderNumber(s2A)
          })}
        </div>
        <div className="text-sm">
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personB"),
            supplier: t("useCases.calcTeam.supplierA"),
            score: renderNumber(s1B)
          })}
          ,{" "}
          {t("useCases.calcTeam.personScoreLine", {
            person: t("useCases.calcTeam.personB"),
            supplier: t("useCases.calcTeam.supplierB"),
            score: renderNumber(s2B)
          })}
        </div>
        <p className="font-medium mt-2">{t("useCases.calcTeam.teamScores")}</p>
        <div className="text-sm">
          {t("useCases.calcTeam.teamScoreLine", {
            supplier: t("useCases.calcTeam.supplierA"),
            score: renderNumber(team1)
          })}
          ,{" "}
          {t("useCases.calcTeam.teamScoreLine", {
            supplier: t("useCases.calcTeam.supplierB"),
            score: renderNumber(team2)
          })}
        </div>
        <p className="font-medium mt-2">{t("useCases.calcTeam.ranking")}</p>
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
        <h1 className="text-3xl font-bold">{t("useCases.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t("useCases.intro")}</p>
      </header>

      {/* How it works */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">{t("useCases.how.title")}</h2>
        <ol className="list-decimal pl-6 space-y-1 text-gray-800 dark:text-gray-200">
          <li><Trans i18nKey="useCases.how.l1" components={{ b: <b /> }} /></li>
          <li><Trans i18nKey="useCases.how.l2" components={{ b: <b /> }} /></li>
          <li><Trans i18nKey="useCases.how.l3" components={{ code: <code /> }} /></li>
          <li><Trans i18nKey="useCases.how.l4" components={{ code: <code /> }} /></li>
          <li><Trans i18nKey="useCases.how.l5" components={{ b: <b /> }} /></li>
          <li><Trans i18nKey="useCases.how.l6" components={{ b: <b /> }} /></li>
        </ol>
      </section>

      {/* Static mini example */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">{t("useCases.miniExample.title")}</h2>
        <p className="text-gray-700 dark:text-gray-300">{t("useCases.miniExample.text")}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border px-3 py-2 text-left">{t("useCases.table.optionVsCriterion")}</th>
                <th className="border px-3 py-2 text-left">{t("useCases.miniExample.head1")}</th>
                <th className="border px-3 py-2 text-left">{t("useCases.miniExample.head2")}</th>
                <th className="border px-3 py-2 text-left">{t("useCases.miniExample.head3")}</th>
                <th className="border px-3 py-2 text-left">{t("useCases.miniExample.head4")}</th>
                <th className="border px-3 py-2 text-left">{t("useCases.table.score")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 font-medium">{t("useCases.calcPrivate.optionB")}</td>
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
        <h2 className="text-2xl font-semibold">{t("useCases.uc.title")}</h2>

        <div>
          <h3 className="text-lg font-semibold">{t("useCases.uc.uc1.title")}</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc1.l1")}</li>
            <li>{t("useCases.uc.uc1.l2")}</li>
            <li>{t("useCases.uc.uc1.l3")}</li>
            <li>{t("useCases.uc.uc1.l4")}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">{t("useCases.uc.uc2.title")}</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc2.l1")}</li>
            <li>{t("useCases.uc.uc2.l2")}</li>
            <li>{t("useCases.uc.uc2.l3")}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">{t("useCases.uc.uc3.title")}</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc3.l1")}</li>
            <li>{t("useCases.uc.uc3.l2")}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">{t("useCases.uc.uc4.title")}</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>{t("useCases.uc.uc4.l1")}</li>
            <li>{t("useCases.uc.uc4.l2")}</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">{t("useCases.faq.title")}</h2>
        <ul className="space-y-2 text-gray-800 dark:text-gray-200">
          <li><b>{t("useCases.faq.q1.q")}</b> {t("useCases.faq.q1.a")}</li>
          <li><b>{t("useCases.faq.q2.q")}</b> {t("useCases.faq.q2.a")}</li>
          <li><b>{t("useCases.faq.q3.q")}</b> {t("useCases.faq.q3.a")}</li>
          <li><b>{t("useCases.faq.q4.q")}</b> {t("useCases.faq.q4.a")}</li>
          <li><b>{t("useCases.faq.q5.q")}</b> {t("useCases.faq.q5.a")}</li>
        </ul>
      </section>
    </main>
  );
}
