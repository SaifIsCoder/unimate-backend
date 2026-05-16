# UOS GPA / CGPA Calculation — Complete Implementation Reference
> Source: University of Sargodha Undergraduate Semester Regulations 2023 (HEC-approved)

---

## 1. Core Formulas

```
Quality Points (per course) = Grade Point (GP) × Credit Hours (CH)

Semester GPA = Σ(GP × CH) for all courses in semester
               ─────────────────────────────────────────
               Σ(CH) for all courses in semester

CGPA = Σ(GP × CH) for ALL courses across ALL semesters
       ───────────────────────────────────────────────────
       Σ(CH) for ALL courses across ALL semesters

Percentage (approx.) = CGPA × 25    [HEC Pakistan guideline]
```

---

## 2. Official Grading Scale

UOS uses an **Absolute Grading System** (HEC-mandated).
Grades depend on the student's own marks, not relative performance.

### Version A — Broad Band Scale (UOS Semester Regulations 2023, Table used in official docs)

| Marks (%) | Letter Grade | Grade Points (GP) | Status         |
|-----------|--------------|-------------------|----------------|
| 85 – 100  | A+           | 4.00              | Outstanding    |
| 80 – 84   | A            | 4.00              | Excellent      |
| 75 – 79   | B+           | 3.50              | Very Good      |
| 70 – 74   | B            | 3.00              | Good           |
| 65 – 69   | B−           | 2.67              | Above Average  |
| 60 – 64   | C+           | 2.33              | Average        |
| 55 – 59   | C            | 2.00              | Satisfactory   |
| 50 – 54   | C−           | 1.67              | Min Pass       |
| 40 – 49   | D            | 1.00              | Conditional    |
| 0  – 39   | F            | 0.00              | Fail           |

> **Minimum passing mark = 50%** (C− grade). D (40–49%) may appear but student is at risk.
> Students scoring below 40% receive F and must repeat the course.

### Version B — Fine-Grained Scale (used in some UOS-affiliated tools and calculators)

Some calculators use a narrower band with 10 grades:

| Marks (%) | Letter Grade | Grade Points (GP) |
|-----------|--------------|-------------------|
| 85 – 100  | A            | 4.0               |
| 80 – 84   | A−           | 3.7               |
| 75 – 79   | B+           | 3.3               |
| 70 – 74   | B            | 3.0               |
| 65 – 69   | B−           | 2.7               |
| 61 – 64   | C+           | 2.3               |
| 58 – 60   | C            | 2.0               |
| 55 – 57   | C−           | 1.7               |
| 50 – 54   | D            | 1.0               |
| Below 50  | F            | 0.0               |

> **Recommendation:** Use **Version A** for official compliance. Use Version B if your system needs finer GP resolution between grades.

---

## 3. Complete Marks → Grade Point Mapping (0–100)

Implement as a lookup table or range-check function.

### Using Version A (recommended for UOS 2023 compliance):

```
Marks 85–100  →  GP = 4.00  (Grade: A+)
Marks 80–84   →  GP = 4.00  (Grade: A)
Marks 75–79   →  GP = 3.50  (Grade: B+)
Marks 70–74   →  GP = 3.00  (Grade: B)
Marks 65–69   →  GP = 2.67  (Grade: B−)
Marks 60–64   →  GP = 2.33  (Grade: C+)
Marks 55–59   →  GP = 2.00  (Grade: C)
Marks 50–54   →  GP = 1.67  (Grade: C−)
Marks 40–49   →  GP = 1.00  (Grade: D)
Marks 0–39    →  GP = 0.00  (Grade: F)
```

### JavaScript implementation:

```javascript
function marksToGrade(marks) {
  // Marks are rounded UP before grading (e.g. 60.1 → 61)
  const m = Math.ceil(marks);

  if (m >= 85) return { grade: 'A+', gp: 4.00 };
  if (m >= 80) return { grade: 'A',  gp: 4.00 };
  if (m >= 75) return { grade: 'B+', gp: 3.50 };
  if (m >= 70) return { grade: 'B',  gp: 3.00 };
  if (m >= 65) return { grade: 'B−', gp: 2.67 };
  if (m >= 60) return { grade: 'C+', gp: 2.33 };
  if (m >= 55) return { grade: 'C',  gp: 2.00 };
  if (m >= 50) return { grade: 'C−', gp: 1.67 };
  if (m >= 40) return { grade: 'D',  gp: 1.00 };
  return           { grade: 'F',  gp: 0.00 };
}

function calcSemesterGPA(courses) {
  // courses = [{ marks: 78, creditHours: 3 }, ...]
  let totalQP = 0;
  let totalCH = 0;

  for (const course of courses) {
    const { gp } = marksToGrade(course.marks);
    totalQP += gp * course.creditHours;
    totalCH += course.creditHours;
  }

  return totalCH > 0 ? totalQP / totalCH : 0;
}

function calcCGPA(semesters) {
  // semesters = [[{marks, creditHours}, ...], ...]
  let totalQP = 0;
  let totalCH = 0;

  for (const sem of semesters) {
    for (const course of sem) {
      const { gp } = marksToGrade(course.marks);
      totalQP += gp * course.creditHours;
      totalCH += course.creditHours;
    }
  }

  return totalCH > 0 ? totalQP / totalCH : 0;
}
```

### Python implementation:

```python
import math

GRADE_SCALE = [
    (85, 'A+', 4.00),
    (80, 'A',  4.00),
    (75, 'B+', 3.50),
    (70, 'B',  3.00),
    (65, 'B-', 2.67),
    (60, 'C+', 2.33),
    (55, 'C',  2.00),
    (50, 'C-', 1.67),
    (40, 'D',  1.00),
    (0,  'F',  0.00),
]

def marks_to_grade(marks: float) -> dict:
    """Convert marks (0–100) to grade and grade points."""
    m = math.ceil(marks)  # UOS rounds marks UP
    for min_marks, grade, gp in GRADE_SCALE:
        if m >= min_marks:
            return {'grade': grade, 'gp': gp}
    return {'grade': 'F', 'gp': 0.00}

def calc_semester_gpa(courses: list[dict]) -> float:
    """
    courses: [{'marks': 78, 'credit_hours': 3}, ...]
    Returns semester GPA.
    """
    total_qp = sum(marks_to_grade(c['marks'])['gp'] * c['credit_hours'] for c in courses)
    total_ch = sum(c['credit_hours'] for c in courses)
    return total_qp / total_ch if total_ch > 0 else 0.0

def calc_cgpa(all_courses: list[dict]) -> float:
    """
    all_courses: flat list of all courses across all semesters
    [{'marks': 78, 'credit_hours': 3}, ...]
    Returns CGPA. Do NOT round this value.
    """
    total_qp = sum(marks_to_grade(c['marks'])['gp'] * c['credit_hours'] for c in all_courses)
    total_ch = sum(c['credit_hours'] for c in all_courses)
    return total_qp / total_ch if total_ch > 0 else 0.0
```

---

## 4. Evaluation Weightage (Marks Distribution per Course)

| Component       | Weightage |
|-----------------|-----------|
| Midterm Exam    | 30%       |
| Final Exam      | 50%       |
| Assignments/Quizzes/Practical | 20% |

> Total marks per course = 100 (scaled). Final exam passing is also mandatory separately in some departments.

---

## 5. Credit Hours Structure

| Course Type           | Typical Credit Hours |
|-----------------------|----------------------|
| Theory course         | 3 CH                 |
| Lab / Practical       | 1 CH                 |
| Theory + Lab combined | 4 CH                 |
| Seminar / Elective    | 2 CH                 |
| Non-credit (e.g. Quran) | 0 CH (appears on transcript, excluded from CGPA) |

> Standard semester load: 15–18 credit hours.
> Non-credit courses: include on transcript, exclude from all GPA/CGPA math.

---

## 6. Academic Standing Rules

### Minimum GPA thresholds per semester (to avoid Drop):

| Semester | Min GPA Required | Also Must Pass   |
|----------|-----------------|------------------|
| 1st      | 1.75            | ≥ 50% of courses |
| 2nd      | 1.75            | ≥ 50% of courses |
| 3rd+     | Per CGPA rules  | —                |

### CGPA-based standing (BS programs):

| CGPA Range     | Status                          |
|----------------|---------------------------------|
| ≥ 3.50         | Distinction / High achiever     |
| 2.50 – 3.49    | Good standing                   |
| 2.00 – 2.49    | Academic probation              |
| < 2.00         | Risk of dropout                 |

---

## 7. Degree Completion Requirements (Minimum CGPA)

| Program              | Minimum CGPA |
|----------------------|--------------|
| BS / BBA (4-year)    | 2.50         |
| Associate Degree     | 2.00         |
| MS / MPhil           | 2.50         |
| PhD                  | 3.00         |

---

## 8. Special Grade Rules

| Rule                        | Detail |
|-----------------------------|--------|
| Withdrawal (before week 4)  | Grade = W, no CGPA impact |
| Withdrawal (after week 4)   | Grade = F, counts in GPA |
| Grade improvement           | Better grade replaces old; course marked with * on transcript |
| Repeat course               | Only better grade counts in CGPA |
| Transfer credits            | Marked as TR; do NOT count in CGPA |
| Non-credit courses          | Appear on transcript; excluded from CGPA |
| Marks rounding              | Marks rounded UP (60.1 → 61) before grading |
| CGPA rounding               | CGPA is NOT rounded (show full decimal) |
| Attendance                  | Minimum 75% required to sit in exams |

---

## 9. Percentage Conversion

```
Percentage ≈ CGPA × 25
```

| CGPA | Approx. % | Division         |
|------|-----------|------------------|
| 4.00 | 100%      | First (Distinction) |
| 3.50 | 87.5%     | First            |
| 3.00 | 75%       | First            |
| 2.50 | 62.5%     | Second           |
| 2.00 | 50%       | Second (min)     |

---

## 10. Worked Examples

### Example 1 — Single Semester GPA

| Course          | Marks | Grade | GP   | CH | QP    |
|-----------------|-------|-------|------|----|-------|
| Calculus        | 82    | A     | 4.00 | 3  | 12.00 |
| English         | 67    | B−    | 2.67 | 3  | 8.01  |
| Programming     | 74    | B     | 3.00 | 4  | 12.00 |
| Physics         | 55    | C     | 2.00 | 3  | 6.00  |
| Lab             | 90    | A+    | 4.00 | 1  | 4.00  |
| **Total**       |       |       |      | **14** | **42.01** |

```
GPA = 42.01 / 14 = 3.00
```

### Example 2 — CGPA across 2 semesters

```
Semester 1: Total QP = 42.01, Total CH = 14
Semester 2: Total QP = 38.50, Total CH = 13

CGPA = (42.01 + 38.50) / (14 + 13)
     = 80.51 / 27
     = 2.982  (do NOT round)
```

---

## 11. Implementation Checklist

- [ ] Use `Math.ceil()` on raw marks before grading
- [ ] Store raw Quality Points and Credit Hours per course (not just GPA)
- [ ] Compute CGPA from raw totals across all semesters, never by averaging GPAs
- [ ] Exclude non-credit (CH=0) courses from all GPA math
- [ ] Show CGPA with full decimal precision (no rounding)
- [ ] Show percentage as `CGPA × 25`
- [ ] Flag probation if CGPA 2.00–2.49 (BS)
- [ ] Flag dropout risk if CGPA < 2.00
- [ ] Mark improved/repeated courses with `*` on transcript display
- [ ] Mark transfer credits as `TR` and exclude from CGPA
- [ ] Grade W (withdrawal before week 4) = excluded from CGPA
- [ ] Grade F (withdrawal after week 4) = included in GPA as 0.00

---

*Reference: UOS Undergraduate Semester Regulations 2023 | HEC Pakistan 4.0 GPA Scale*
