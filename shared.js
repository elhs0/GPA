/* ============================================
   GPA Ledger — Shared logic
   Used by both calculator.html and cgpa.html
   ============================================ */

const GRADE_POINTS = {
  "A": 4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B": 3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C": 2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D": 1.0,
  "F": 0.0
};

const STORAGE_KEY = "gpa_ledger_semesters";

/**
 * Calculate GPA from a list of courses.
 * Each course: { name, credits, grade } where grade is a numeric grade point (0.0–4.0)
 * Returns { gpa, totalCredits, totalQualityPoints }
 */
function calculateGPA(courses) {
  let totalCredits = 0;
  let totalQualityPoints = 0;

  courses.forEach((course) => {
    const credits = parseFloat(course.credits);
    const gradePoint = parseFloat(course.grade);
    if (!isNaN(credits) && credits > 0 && !isNaN(gradePoint) && gradePoint >= 0 && gradePoint <= 4.0) {
      totalCredits += credits;
      totalQualityPoints += credits * gradePoint;
    }
  });

  const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return {
    gpa: gpa,
    totalCredits: totalCredits,
    totalQualityPoints: totalQualityPoints
  };
}

/**
 * Determine academic standing label + css class from a GPA value.
 */
function getStanding(gpa) {
  if (gpa >= 3.3) {
    return { label: "Dean's List Range", className: "standing-good", seal: "#2D5A3D" };
  } else if (gpa >= 2.7) {
    return { label: "Good Standing", className: "standing-good", seal: "#2D5A3D" };
  } else if (gpa >= 2.0) {
    return { label: "Satisfactory", className: "standing-warn", seal: "#97732A" };
  } else if (gpa > 0) {
    return { label: "Academic Risk", className: "standing-low", seal: "#A8442E" };
  } else {
    return { label: "No data yet", className: "standing-warn", seal: "#B8945F" };
  }
}

/**
 * Update the seal visual (the circular GPA display) given a gpa value 0-4.
 */
function renderSeal(sealEl, valueEl, labelPillEl, gpa) {
  const pct = Math.min(100, (gpa / 4.0) * 100);
  const standing = getStanding(gpa);

  sealEl.style.setProperty("--seal-pct", pct.toFixed(1));
  sealEl.style.setProperty("--seal-color", standing.seal);
  valueEl.textContent = gpa > 0 ? gpa.toFixed(2) : "—";

  if (labelPillEl) {
    labelPillEl.textContent = standing.label;
    labelPillEl.className = "standing-pill " + standing.className;
  }
}

/* ============================================
   localStorage helpers for saved semesters
   Each semester: { id, name, courses: [...], gpa, totalCredits }
   ============================================ */

function getSavedSemesters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not read saved semesters:", e);
    return [];
  }
}

function saveSemester(semester) {
  const semesters = getSavedSemesters();
  semesters.push(semester);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(semesters));
  return semesters;
}

function deleteSemester(id) {
  const semesters = getSavedSemesters().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(semesters));
  return semesters;
}

function calculateCGPA(semesters) {
  let totalCredits = 0;
  let totalQualityPoints = 0;

  semesters.forEach((sem) => {
    sem.courses.forEach((course) => {
      const credits = parseFloat(course.credits);
      const gradePoint = parseFloat(course.grade);
      if (!isNaN(credits) && credits > 0 && !isNaN(gradePoint) && gradePoint >= 0 && gradePoint <= 4.0) {
        totalCredits += credits;
        totalQualityPoints += credits * gradePoint;
      }
    });
  });

  const cgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return { cgpa, totalCredits, totalQualityPoints };
}
