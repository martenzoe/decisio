import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import EvaluateTeamDecision from "./EvaluateTeamDecision";
import TeamCriterionWeighting from "../components/TeamCriterionWeighting";


export default function EditTeamDecision() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { user, token } = useAuthStore();


 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [success, setSuccess] = useState(null);
 const [reload, setReload] = useState(0);


 const [name, setName] = useState("");
 const [description, setDescription] = useState("");
 const [options, setOptions] = useState([]);
 const [criteria, setCriteria] = useState([]);
 const [userRole, setUserRole] = useState("viewer");
 const [evaluations, setEvaluations] = useState([]);
 const [weights, setWeights] = useState([]);
 const [deadline, setDeadline] = useState("");
 const [mode, setMode] = useState("manual");
 const [aiEvaluated, setAiEvaluated] = useState(false);
 const [aiLoading, setAiLoading] = useState(false);


 const deadlineInputRef = useRef(null);
 const deadlineDate = deadline ? new Date(deadline) : null;
 const now = new Date();
 const disable = (deadlineDate && now > deadlineDate) || aiEvaluated;


 useEffect(() => {
   async function fetchAll() {
     setLoading(true);
     try {
       const res = await fetch(`/api/decision/${id}/details`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       const json = await res.json();
       if (!res.ok) throw new Error(json.error || "Fehler beim Laden");


       setName(json.decision?.name ?? "");
       setDescription(json.decision?.description ?? "");
       setOptions(Array.isArray(json.options) ? json.options : []);
       setCriteria(
         Array.isArray(json.criteria)
           ? json.criteria.map((c) => ({
               ...c,
               importance: typeof c.importance === "number" ? c.importance : Number(c.importance) || 0,
             }))
           : []
       );
       setUserRole(json.userRole ?? "viewer");
       setDeadline(json.timer ?? "");
       setMode(json.decision?.mode ?? "manual");
       setAiEvaluated(json.evaluations?.some((e) => e.generated_by === "ai") || false);
       if (json.weightsByUser && user?.id) {
         setWeights(json.weightsByUser[user.id] ?? []);
       } else {
         setWeights([]);
       }
       if (user && Array.isArray(json.evaluations)) {
         const userEvals = json.evaluations.filter((e) => String(e.user_id) === String(user.id));
         if (userEvals.length === 0 && json.options.length && json.criteria.length) {
           let blanks = [];
           for (const o of json.options) {
             for (const c of json.criteria) {
               blanks.push({ option_id: o.id, criterion_id: c.id, value: "" });
             }
           }
           setEvaluations(blanks);
         } else {
           setEvaluations(userEvals);
         }
       }
       setSuccess(null);
       setError(null);
     } catch (e) {
       setError(e.message);
     } finally {
       setLoading(false);
     }
   }
   if (user && id && token) fetchAll();
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user, id, token, reload]);


 function isDuplicate(arr, key, value, idx) {
   if (!value || typeof value !== "string") return false;
   return arr.some((item, i) => i !== idx && item[key]?.trim().toLowerCase() === value.trim().toLowerCase());
 }


 function dupClass(obj) {
   return obj._dup ? "border-2 border-red-600 bg-red-700 text-red-100" : "";
 }


 const handleOptionChange = (idx, val) => {
   const v = val.trimStart();
   setOptions((opts) =>
     opts.map((o, i) => (i === idx ? { ...o, name: v, _dup: isDuplicate(opts, "name", v, idx) } : { ...o, _dup: false }))
   );
 };


 const addOption = () =>
   setOptions((opts) => [...opts, { name: "", id: `opt-new-${Date.now()}-${Math.random()}`, _dup: false }]);
 const removeOption = (idx) => setOptions((opts) => opts.filter((_, i) => i !== idx));


 const handleCriterionChange = (idx, key, val) => {
   const v = typeof val === "string" ? val.trimStart() : val;
   setCriteria((crits) =>
     crits.map((c, i) => (i === idx ? { ...c, [key]: v, _dup: isDuplicate(crits, "name", v, idx) } : { ...c, _dup: false }))
   );
 };


 const addCriterion = () =>
   setCriteria((crits) => [...crits, { name: "", importance: "", id: `crit-new-${Date.now()}-${Math.random()}`, _dup: false }]);
 const removeCriterion = (idx) => setCriteria((crits) => crits.filter((_, i) => i !== idx));


 const getMinDeadline = () => new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);


 async function handleDeadlineChange(newDeadline) {
   if (newDeadline === deadline) return;
   setDeadline(newDeadline);
   try {
     setError(null);
     setSuccess(null);
     const res = await fetch(`/api/decision/${id}/timer`, {
       method: "PATCH",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify({ timer: newDeadline || null }),
     });
     if (!res.ok) throw new Error("Fehler beim Speichern");
     setSuccess("Deadline gespeichert");
     setTimeout(() => setSuccess(null), 4000);
     setReload((r) => r + 1);
   } catch (e) {
     setError(e.message);
   }
 }


 async function handleModeChange(e) {
   const v = e.target.value;
   if (aiEvaluated) return;
   setMode(v);
   try {
     setError(null);
     setSuccess(null);
     const res = await fetch(`/api/decision/${id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify({
         name,
         description,
         mode: v,
         type: "team",
         options: options.filter((o) => o.name && !o._dup).map(({ name }) => ({ name })),
         criteria: criteria.filter((c) => c.name && !c._dup).map(({ name, importance }) => ({ name, importance })),
       }),
     });
     if (!res.ok) throw new Error("Fehler beim Ändern");
     setSuccess("Modus geändert");
     setTimeout(() => setSuccess(null), 3000);
     setReload((r) => r + 1);
   } catch (e) {
     setError(e.message);
   }
 }


 // NEU: handleSaveAll gibt true/false zurück
 async function handleSaveAll() {
   if (aiEvaluated) return true; // Blockiert weiteres Speichern bei abgeschlossener KI.
   try {
     setError(null);
     setSuccess(null);
     setLoading(true);
     const cleanOptions = options.filter((o) => o.name && !o._dup).map(({ name }) => ({ name }));
     const cleanCriteria = criteria
       .filter((c) => c.name && !c._dup)
       .map(({ name, importance }) => ({ name, importance: Number(importance) || 0 }));
     const res = await fetch(`/api/decision/${id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify({ name, description, mode, type: "team", options: cleanOptions, criteria: cleanCriteria }),
     });
     if (!res.ok) throw new Error("Fehler beim Speichern");


     await fetch(`/api/decision/${id}/weights`, {
       method: "POST",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify({ weights }),
     });


     await fetch(`/api/decision/${id}/evaluate`, {
       method: "POST",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify({
         evaluations: evaluations
           .filter((ev) => ev.value !== "" && !isNaN(ev.value))
           .map(({ option_id, criterion_id, value }) => ({ option_id, criterion_id, value: Number(value) })),
       }),
     });


     setSuccess("Gespeichert");
     setTimeout(() => setSuccess(null), 4000);
     setReload((r) => r + 1);
     return true;
   } catch (e) {
     setError(e.message || "Fehler beim Speichern");
     return false;
   } finally {
     setLoading(false);
   }
 }


 // NEU: Automatisch speichern vor KI-Start!
 async function handleStartAI() {
   try {
     setError(null);
     setSuccess(null);
     setAiLoading(true);


     // Vorher speichern!
     const saveOK = await handleSaveAll();
     if (!saveOK) {
       setError("Speichern fehlgeschlagen");
       return;
     }


     // Dann KI-Auswertung anstoßen
     const res = await fetch(`/api/team-ai/recommendation/${id}`, {
       method: "POST",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify({ decisionName: name, description, options, criteria }),
     });
     const data = await res.json();
     if (!res.ok) throw new Error(data.error || "Fehler bei KI");
     setSuccess("KI-Auswertung erfolgreich");
     setTimeout(() => navigate(`/team-decision/${id}`), 1200);
     setReload((r) => r + 1);
   } catch (e) {
     setError(e.message);
   } finally {
     setAiLoading(false);
   }
 }


 const titleId = "title-input";
 const descId = "desc-input";
 const deadlineId = "deadline-input";


 if (loading)
   return (
     <div className="p-8 text-center text-gray-500" aria-busy="true" aria-live="polite">
       ⏳ loading …
     </div>
   );
 if (error)
   return (
     <div
       className="max-w-xl mx-auto p-8 text-center text-red-600"
       role="alert"
       aria-live="assertive"
       aria-atomic="true"
     >
       {error}
     </div>
   );


 if (userRole === "viewer")
   return (
     <main className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
       <h1 className="text-3xl mb-8 text-gray-900 dark:text-gray-100">Teamentscheidung ansehen</h1>
       <section className="mb-10">
         <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Optionen</h2>
         <ul className="pl-6 list-disc text-gray-800 dark:text-gray-200">
           {options.map((o) => (
             <li key={o.id}>{o.name}</li>
           ))}
         </ul>
       </section>
       <section>
         <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Kriterien</h2>
         <ul className="pl-6 list-disc text-gray-800 dark:text-gray-200">
           {criteria.map((o) => (
             <li key={o.id}>{o.name}</li>
           ))}
         </ul>
       </section>
     </main>
   );


 return (
   <main className="min-h-screen bg-transparent p-6 text-gray-900 dark:text-gray-100">
     <div className="max-w-4xl mx-auto">
       <h1 className="text-4xl font-semibold mb-10">Edit Team Decision</h1>


       {(success || error) && (
         <div
           className={`max-w-xl mx-auto mb-6 p-4 rounded ${
             success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
           }`}
           role="alert"
           aria-live="assertive"
           aria-atomic="true"
         >
           {success || error}
         </div>
       )}
       <section
         className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-10"
         aria-label="Entscheidungsdaten und Einstellungen"
       >
         {/* Modus */}
         {(userRole === "admin" || userRole === "owner") && (
           <div>
             <label htmlFor="mode-select" className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
               Modus
             </label>
             <select
               id="mode-select"
               className="w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
               disabled={disable}
               value={mode}
               onChange={handleModeChange}
             >
               <option value="manual">Manual</option>
               <option value="ai">AI (Auto)</option>
             </select>
             {aiEvaluated && <p className="mt-2 text-indigo-600 dark:text-indigo-400">This decision has been completed by AI and is no longer editable.</p>}
           </div>
         )}


         {/* Basisinfos */}
         <div className="space-y-6">
           <div>
             <label htmlFor={titleId} className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
               Titel
             </label>
             <input
               id={titleId}
               className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
               type="text"
               value={name}
               onChange={(e) => setName(e.target.value)}
               disabled={disable}
             />
           </div>
           <div>
             <label htmlFor={descId} className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
               Description
             </label>
             <textarea
               id={descId}
               rows={3}
               className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               disabled={disable}
             />
           </div>
         </div>


         {/* Deadline */}
         {(userRole === "admin" || userRole === "owner") && (
           <div className="mt-6 max-w-sm">
             <label htmlFor="deadline-input" className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
               Deadline (optional)
             </label>
             <div className="relative">
               <input
                 id="deadline-input"
                 ref={deadlineInputRef}
                 type="datetime-local"
                 className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-10 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                 value={deadline ? deadline.slice(0, 16) : ""}
                 min={getMinDeadline()}
                 onChange={(e) => handleDeadlineChange(e.target.value)}
                 disabled={disable}
                 onClick={() => deadlineInputRef.current?.showPicker()}
                 aria-disabled={disable}
               />
               <button
                 type="button"
                 onClick={() => {
                   deadlineInputRef.current?.focus();
                   deadlineInputRef.current?.showPicker();
                 }}
                 disabled={disable}
                 aria-label="Datum auswählen"
                 className="absolute left-3 top-1/2 -translate-y-1/2 rounded bg-transparent p-0 text-gray-400 dark:text-gray-500 hover:text-indigo-600 focus:outline-none"
               >
                 <svg
                   xmlns="http://www.w3.org/2000/svg"
                   className="w-5 h-5"
                   fill="none"
                   viewBox="0 0 24 24"
                   stroke="currentColor"
                   strokeWidth={1.5}
                 >
                   <rect x={3} y={4} width={18} height={18} rx={2} />
                   <line x1={16} y1={2} x2={16} y2={6} />
                   <line x1={8} y1={2} x2={8} y2={6} />
                   <line x1={3} y1={10} x2={21} y2={10} />
                 </svg>
               </button>
             </div>
             <div className="mt-2 flex flex-wrap gap-4 items-center text-sm text-gray-600 dark:text-gray-400">
               <button
                 type="button"
                 onClick={() => handleDeadlineChange("")}
                 disabled={disable || !deadline}
                 className="underline disabled:opacity-50"
               >
                 Clear deadline
               </button>
                <span>{deadline ? `Current: ${new Date(deadline).toLocaleString()}` : "No deadline set"}</span>
               {disable && (
                 <span className="text-red-500 dark:text-red-400">Deadline expired – editing disabled</span>
               )}
             </div>
           </div>
         )}


         {/* Optionen */}
         <section>
           <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
             Options <span className="text-sm text-gray-500">(No duplicates)</span>
           </h3>
           {options.map((option, i) => (
             <div key={option.id} className="flex items-center space-x-3 mb-3">
               <input
                 className={`flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${dupClass(
                   option
                 )}`}
                 type="text"
                 value={option.name}
                 placeholder={`Option ${i + 1}`}
                 onChange={(e) => handleOptionChange(i, e.target.value)}
                 disabled={disable}
                 aria-invalid={option._dup}
               />
               {option._dup && (
                 <span className="text-red-600" aria-label="Duplikat" role="alert">
                   ⚠
                 </span>
               )}
               <button
                 onClick={() => removeOption(i)}
                 disabled={disable}
                 aria-label={`Option ${i + 1} löschen`}
                 className="text-red-600 hover:text-red-700 disabled:opacity-50"
               >
                 ×
               </button>
             </div>
           ))}
           <button
             onClick={addOption}
             disabled={disable}
             className="bg-indigo-600 text-white px-5 py-3 rounded hover:bg-indigo-700 disabled:opacity-50"
           >
             + Add Option
           </button>
         </section>


         {/* Kriterien */}
         <section className="mt-10">
           <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
             Criteria <span className="text-sm text-gray-500">(No duplicates, no weighting)</span>
           </h3>
           {criteria.map((criterion, i) => (
             <div key={criterion.id} className="flex items-center space-x-3 mb-3">
               <input
                 className={`flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${dupClass(
                   criterion
                 )}`}
                 type="text"
                 value={criterion.name}
                 placeholder={`Kriterium ${i + 1}`}
                 onChange={(e) => handleCriterionChange(i, "name", e.target.value)}
                 disabled={disable}
                 aria-invalid={criterion._dup}
               />
               {criterion._dup && (
                 <span className="text-red-600" aria-label="Duplikat" role="alert">
                   ⚠
                 </span>
               )}
               <button
                 onClick={() => removeCriterion(i)}
                 disabled={disable}
                 aria-label={`Kriterium ${i + 1} löschen`}
                 className="text-red-600 hover:text-red-700 disabled:opacity-50"
               >
                 ×
               </button>
             </div>
           ))}
           <button
             onClick={addCriterion}
             disabled={disable}
             className="bg-indigo-600 text-white px-5 py-3 rounded hover:bg-indigo-700 disabled:opacity-50"
           >
             + Add Criterion
           </button>
         </section>
       </section>


       {/* Gewichtung */}
       <section className="max-w-4xl mx-auto mt-12">
         <TeamCriterionWeighting
           weights={weights}
           setWeights={setWeights}
           criteria={criteria}
           userRole={userRole}
           disabled={disable}
         />
       </section>


       {/* Bewertung */}
       {mode === "manual" && !aiEvaluated && (
         <section className="max-w-6xl mx-auto mt-12">
           <EvaluateTeamDecision
             evaluations={evaluations}
             setEvaluations={setEvaluations}
             options={options}
             criteria={criteria}
             userRole={userRole}
             disabled={disable}
           />
         </section>
       )}


       {/* SPEICHERN: IMMER sichtbar solange keine KI-Auswertung */}
       {!aiEvaluated && (
         <section className="max-w-6xl mx-auto mt-12 flex justify-end">
           <button
             onClick={handleSaveAll}
             disabled={disable || options.some((o) => o._dup) || criteria.some((c) => c._dup) || loading}
             className="bg-indigo-600 py-3 px-8 rounded text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
           >
             {loading ? "Saving..." : "Save"}
           </button>
         </section>
       )}


       {/* KI-AUSWERTEN: kleiner und dezent */}
       {mode === "ai" && !aiEvaluated && (userRole === "admin" || userRole === "owner") && (
         <section className="max-w-6xl mx-auto mt-8 flex justify-end">
           <button
             onClick={handleStartAI}
             disabled={disable || aiLoading}
             className="bg-indigo-700 py-2 px-6 rounded text-white text-base font-semibold hover:bg-indigo-800 disabled:opacity-50 transition"
             style={{ minWidth: 220 }}
           >
             {aiLoading ? "AI evaluation running…" : "Start AI evaluation"}
           </button>
         </section>
       )}


       {/* KI-Abschluss Hinweis */}
       {aiEvaluated && (
         <section className="max-w-6xl mx-auto mt-12 text-center text-gray-500">
           This decision has been completed by AI and is no longer editable.
         </section>
       )}
     </div>
   </main>
 );
}


