/* ============================================
   cgpa.js — cumulative CGPA page logic
   ============================================ */

const sealEl = document.getElementById("seal");
const sealValueEl = document.getElementById("sealValue");
const standingPillEl = document.getElementById("standingPill");
const totalsLineEl = document.getElementById("totalsLine");
const semesterListEl = document.getElementById("semesterList");

const targetCreditsInput = document.getElementById("targetCredits");
const targetGpaInput = document.getElementById("targetGpa");
const calcTargetBtn = document.getElementById("calcTargetBtn");
const targetResultEl = document.getElementById("targetResult");

function renderSemesterCard(semester) {
  const card = document.createElement("div");
  card.className = "semester-card";

  const courseCount = semester.courses.length;

  card.innerHTML = `
    <div>
      <h3 class="semester-name">${semester.name}</h3>
      <p class="semester-meta">${courseCount} course${courseCount === 1 ? "" : "s"} &middot; ${semester.totalCredits} credit hours</p>
    </div>
    <div style="display: flex; align-items: center; gap: 18px;">
      <div class="semester-gpa">
        ${semester.gpa.toFixed(2)}
        <span>GPA</span>
      </div>
      <button class="btn-danger" type="button" aria-label="Remove semester" title="Remove semester" data-id="${semester.id}">✕</button>
    </div>
  `;

  card.querySelector(".btn-danger").addEventListener("click", () => {
    const confirmed = confirm(`Remove "${semester.name}" from your cumulative record? This can't be undone.`);
    if (confirmed) {
      deleteSemester(semester.id);
      render();
    }
  });

  return card;
}

function render() {
  const semesters = getSavedSemesters();

  // Render list
  semesterListEl.innerHTML = "";
  if (semesters.length === 0) {
    semesterListEl.innerHTML = `
      <div class="empty-state">
        <p>No semesters saved yet.</p>
        <p style="font-family: var(--font-body); font-size: 0.9rem; margin-top: 8px;">
          Head to the <a href="calculator.html" style="color: var(--ink); font-weight: 600;">Semester GPA calculator</a>, enter your courses, and save it here.
        </p>
      </div>
    `;
  } else {
    // Most recently saved first
    semesters
      .slice()
      .reverse()
      .forEach((sem) => {
        semesterListEl.appendChild(renderSemesterCard(sem));
      });
  }

  // Render cumulative seal
  const { cgpa, totalCredits, totalQualityPoints } = calculateCGPA(semesters);
  renderSeal(sealEl, sealValueEl, standingPillEl, cgpa);

  if (totalCredits > 0) {
    totalsLineEl.textContent = `${semesters.length} semester${semesters.length === 1 ? "" : "s"} on record, ${totalCredits} total credit hours, ${totalQualityPoints.toFixed(2)} total quality points.`;
  } else {
    totalsLineEl.textContent = "Save a semester from the calculator to begin your cumulative record.";
  }
}

render();

/* ============================================
   Target GPA planning
   ============================================ */

function showTargetResult(html) {
  targetResultEl.innerHTML = html;
  targetResultEl.style.display = "block";
}

calcTargetBtn.addEventListener("click", () => {
  const N = parseFloat(targetCreditsInput.value);
  const T = parseFloat(targetGpaInput.value);

  if (isNaN(N) || N <= 0) {
    showTargetResult(`<p style="color: var(--rust); margin: 0; font-family: var(--font-body);">Enter how many upcoming credit hours you're planning (a number greater than 0).</p>`);
    return;
  }

  if (isNaN(T) || T < 0 || T > 4.0) {
    showTargetResult(`<p style="color: var(--rust); margin: 0; font-family: var(--font-body);">Enter a target CGPA between 0.00 and 4.00.</p>`);
    return;
  }

  const semesters = getSavedSemesters();
  const { totalCredits: C, totalQualityPoints: Q } = calculateCGPA(semesters);

  // Solve: (Q + N*x) / (C + N) = T  →  x = (T*(C+N) - Q) / N
  const requiredAvg = (T * (C + N) - Q) / N;

  let html = "";

  if (requiredAvg > 4.0) {
    html = `
      <p style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--rust); margin: 0 0 8px;">Not reachable</p>
      <p style="color: #4A4A42; font-size: 0.92rem; margin: 0; font-family: var(--font-body);">
        Even straight 4.00s across your next ${N} credit hour${N === 1 ? "" : "s"} would land you below a ${T.toFixed(2)} CGPA, given your current ${C} credit hours at ${C > 0 ? (Q / C).toFixed(2) : "0.00"}. You'd need more credit hours at a high grade point to get there, or a lower target.
      </p>
    `;
  } else if (requiredAvg <= 0) {
    html = `
      <p style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--green); margin: 0 0 8px;">Already secured</p>
      <p style="color: #4A4A42; font-size: 0.92rem; margin: 0; font-family: var(--font-body);">
        Your current record already puts you at or above a ${T.toFixed(2)} CGPA — even a 0.00 average across your next ${N} credit hour${N === 1 ? "" : "s"} wouldn't drop you below it. (Realistically you still need to pass your courses!)
      </p>
    `;
  } else {
    html = `
      <p style="font-family: var(--font-mono); font-size: 2.2rem; font-weight: 700; color: var(--ink); margin: 0 0 4px;">${requiredAvg.toFixed(2)}</p>
      <p style="font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--brass); margin: 0 0 14px;">Average grade point needed</p>
      <p style="color: #4A4A42; font-size: 0.92rem; margin: 0; font-family: var(--font-body);">
        Across your next ${N} credit hour${N === 1 ? "" : "s"}, averaging a <strong style="color: var(--ink);">${requiredAvg.toFixed(2)}</strong> grade point would bring your CGPA to ${T.toFixed(2)}, starting from your current ${C} credit hour${C === 1 ? "" : "s"} at ${C > 0 ? (Q / C).toFixed(2) : "0.00"}.
      </p>
    `;
  }

  showTargetResult(html);
});
