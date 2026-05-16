/**
 * UOS official grading bands (Absolute Grading System)
 * Marks are rounded UP before lookup.
 */
const UOS_GRADE_SCALE = [
  { min: 85, grade: "A+", gp: 4.0 },
  { min: 80, grade: "A", gp: 4.0 },
  { min: 75, grade: "B+", gp: 3.5 },
  { min: 70, grade: "B", gp: 3.0 },
  { min: 65, grade: "B-", gp: 2.67 },
  { min: 60, grade: "C+", gp: 2.33 },
  { min: 55, grade: "C", gp: 2.0 },
  { min: 50, grade: "C-", gp: 1.67 },
  { min: 40, grade: "D", gp: 1.0 },
  { min: 0, grade: "F", gp: 0.0 },
];

/**
 * Calculates grade point and letter grade based on marks (0-100)
 * UOS Rule: Marks rounded UP (60.1 -> 61) before grading.
 */
export const getGradePointDetails = (marks) => {
  const roundedMarks = Math.ceil(marks);
  for (const band of UOS_GRADE_SCALE) {
    if (roundedMarks >= band.min) {
      return band;
    }
  }
  return { min: 0, grade: "F", gp: 0.0 };
};

/**
 * Backward compatibility for getGradePoint
 */
export const getGradePoint = (marks) => getGradePointDetails(marks).gp;

/**
 * Calculates raw marks based on component percentages and custom weights
 */
export const calculateRawMarks = (components, weights) => {
  const { midTerm, sessional, finalExam, practical } = components;
  const {
    mid_weight = 30,
    sessional_weight = 20,
    final_weight = 50,
    practical_weight = 0,
  } = weights;

  return (
    midTerm * (mid_weight / 100) +
    sessional * (sessional_weight / 100) +
    finalExam * (final_weight / 100) +
    (practical || 0) * (practical_weight / 100)
  );
};

/**
 * Calculates CGPA from total quality points and credit hours
 * UOS Rule: CGPA is NOT rounded (show full precision).
 */
export const calculateCGPA = (totalQualityPoints, totalCreditHours) => {
  if (totalCreditHours === 0) return 0;
  return totalQualityPoints / totalCreditHours;
};

/**
 * Calculates attendance statistics for a student
 */
export const calculateAttendanceStats = (
  totalLectures,
  presentCount,
  leaveCount,
) => {
  const leaves = parseInt(leaveCount, 10);
  const present = parseInt(presentCount, 10);

  // Adjusted Total = Total Lectures - Leaves
  const adjustedTotal = totalLectures - leaves;

  // If Adjusted Total = 0 -> Attendance % = 100
  let attendancePercentage = 100;
  if (adjustedTotal > 0) {
    attendancePercentage = (present / adjustedTotal) * 100;
  }

  // If Attendance % >= 75 -> Eligible
  const isEligible = attendancePercentage >= 75;

  return {
    leaves,
    adjustedTotal,
    attendancePercentage: Number(attendancePercentage.toFixed(2)),
    isEligible,
  };
};

/**
 * Groups raw grade data by offering and calculates totals for transcript
 */
export const transformTranscriptData = (rawData) => {
  const offeringsMap = {};

  rawData.forEach((row) => {
    if (!offeringsMap[row.offering_id]) {
      offeringsMap[row.offering_id] = {
        offering_id: row.offering_id,
        semester: row.semester,
        course_code: row.course_code,
        course_title: row.course_title,
        credit_hours: row.credit_hours,
        has_practical: row.has_practical,
        weights: {
          mid_weight: row.mid_weight,
          sessional_weight: row.sessional_weight,
          final_weight: row.final_weight,
          practical_weight: row.practical_weight,
        },
        grades: [],
      };
    }
    if (row.id) {
      offeringsMap[row.offering_id].grades.push(row);
    }
  });

  let totalCreditHours = 0;
  let totalQualityPoints = 0;

  const coursesResult = Object.values(offeringsMap).map((offering) => {
    let midScore = 0;
    let sessionalScore = 0;
    let sessionalMax = 0;
    let finalScore = 0;
    let practicalScore = 0;

    offering.grades.forEach((g) => {
      const percentage = (Number(g.score) / Number(g.max_score)) * 100;
      if (g.assessment_type === "midterm") midScore = percentage;
      else if (g.assessment_type === "final") finalScore = percentage;
      else if (g.assessment_type === "practical") practicalScore = percentage;
      else if (
        g.assessment_type === "sessional" ||
        g.assessment_type === "assignment" ||
        g.assessment_type === "quiz" ||
        g.assessment_type === "presentation" ||
        g.assessment_type === "project"
      ) {
        sessionalScore += Number(g.score);
        sessionalMax += Number(g.max_score);
      }
    });

    let sessionalPercentage = 0;
    if (sessionalMax > 0)
      sessionalPercentage = (sessionalScore / sessionalMax) * 100;

    const rawMarks = calculateRawMarks(
      {
        midTerm: midScore,
        sessional: sessionalPercentage,
        finalExam: finalScore,
        practical: practicalScore,
      },
      offering.weights
    );

    const finalMarks = Math.ceil(rawMarks);
    const { grade, gp } = getGradePointDetails(finalMarks);
    const qualityPoints = gp * offering.credit_hours;

    totalCreditHours += offering.credit_hours;
    totalQualityPoints += qualityPoints;

    return {
      offering_id: offering.offering_id,
      semester: offering.semester,
      course_code: offering.course_code,
      course: offering.course_title,
      credit_hours: offering.credit_hours,
      final_marks: finalMarks,
      letter_grade: grade,
      grade_point: gp,
      quality_points: qualityPoints,
    };
  });

  const cgpa = calculateCGPA(totalQualityPoints, totalCreditHours);

  return {
    cgpa,
    total_credit_hours: totalCreditHours,
    courses: coursesResult,
  };
};
