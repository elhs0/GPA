/* ============================================
   calculator.js — semester GPA page logic
   ============================================ */

let rowCount = 0;

const courseRowsEl = document.getElementById("courseRows");
const addRowBtn = document.getElementById("addRowBtn");
const clearBtn = document.getElementById("clearBtn");
const saveSemesterBtn = document.getElementById("saveSemesterBtn");
const saveMsg = document.getElementById("saveMsg");
const semesterNameInput = document.getElementById("semesterName");

const sealEl = document.getElementById("seal");
const sealValueEl = document.getElementById("sealValue");
const standingPillEl = document.getElementById("standingPill");
const totalsLineEl = document.getElementById("totalsLine");
const footCreditsEl = document.getElementById("footCredits");
const footQPEl = document.getElementById("footQP");

function addRow(prefill) {
  rowCount += 1;
  const rowId = `row-${rowCount}`;
  const row = document.createElement("div");
  row.className = "ledger-row";
  row.id = rowId;

  row.innerHTML = `
    <input type="text" data-role="name" placeholder="e.g. Programming I" aria-label="Course name" value="${prefill && prefill.name ? prefill.name : ""}">
    <input type="number" data-role="credits" placeholder="3" min="1" max="6" step="1" aria-label="Credit hours" value="${prefill && prefill.credits ? prefill.credits : ""}">
    <input type="number" data-role="grade" placeholder="0.0–4.0" min="0" max="4" step="0.01" aria-label="Grade point" value="${prefill && prefill.grade ? prefill.grade : ""}">
    <button class="btn-danger" type="button" aria-label="Remove course" title="Remove course">✕</button>
  `;

  courseRowsEl.appendChild(row);

  // Wire up events
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", recalculate);
  });
  row.querySelector(".btn-danger").addEventListener("click", () => {
    row.remove();
    recalculate();
  });

  recalculate();
}

function getCoursesFromRows() {
  const rows = courseRowsEl.querySelectorAll(".ledger-row");
  const courses = [];
  rows.forEach((row) => {
    const name = row.querySelector('[data-role="name"]').value.trim();
    const credits = row.querySelector('[data-role="credits"]').value;
    const grade = row.querySelector('[data-role="grade"]').value;
    courses.push({ name, credits, grade });
  });
  return courses;
}

function recalculate() {
  const courses = getCoursesFromRows();
  const result = calculateGPA(courses);

  renderSeal(sealEl, sealValueEl, standingPillEl, result.gpa);

  footCreditsEl.textContent = result.totalCredits;
  footQPEl.textContent = result.totalQualityPoints.toFixed(2);

  if (result.totalCredits > 0) {
    totalsLineEl.textContent = `${result.totalCredits} credit hour${result.totalCredits === 1 ? "" : "s"} entered, ${result.totalQualityPoints.toFixed(2)} quality points earned.`;
  } else {
    totalsLineEl.textContent = "Add a course below to see your quality points and total credit hours.";
  }

  saveMsg.style.display = "none";
}

addRowBtn.addEventListener("click", () => addRow());

clearBtn.addEventListener("click", () => {
  if (courseRowsEl.children.length === 0) return;
  const confirmed = confirm("Clear all courses from this semester?");
  if (confirmed) {
    courseRowsEl.innerHTML = "";
    semesterNameInput.value = "";
    recalculate();
  }
});

saveSemesterBtn.addEventListener("click", () => {
  const allCourses = getCoursesFromRows();
  const courses = allCourses.filter(
    (c) => c.name && c.credits && c.grade !== ""
  );

  if (courses.length === 0) {
    alert("Add at least one complete course (name, credits, and grade) before saving.");
    return;
  }

  const invalidGrade = courses.find((c) => {
    const g = parseFloat(c.grade);
    return isNaN(g) || g < 0 || g > 4.0;
  });

  if (invalidGrade) {
    alert(`"${invalidGrade.name}" has a grade point outside the 0.0–4.0 range. Please fix it before saving.`);
    return;
  }

  let name = semesterNameInput.value.trim();
  if (!name) {
    name = `Semester ${getSavedSemesters().length + 1}`;
  }

  const result = calculateGPA(courses);

  const semester = {
    id: Date.now().toString(),
    name: name,
    courses: courses,
    gpa: result.gpa,
    totalCredits: result.totalCredits
  };

  saveSemester(semester);

  saveMsg.style.display = "inline";
  setTimeout(() => {
    saveMsg.style.display = "none";
  }, 3500);
});

// Start with two empty rows so the page doesn't look bare
addRow();
addRow();
