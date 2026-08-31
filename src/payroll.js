// Break-time & vacation-day → salary deduction policy.
// Edit these numbers to match your company's real policy.
export const POLICY = {
  workingDaysPerMonth: 22,
  workMinutesPerDay: 480, // 8-hour day
  freeBreakMinutesPerDay: 60, // 1 hour of break per day is free/paid
  freeVacationDaysPerMonth: 2, // first 2 vacation days per month are paid
  vacationDayDeduction: 300, // flat ৳ deducted per vacation day beyond that
};

function dayKey(iso) {
  return new Date(iso).toDateString();
}

function isSameMonth(iso, ref) {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

// Pairs each "break-start" with the following "break-end" for one employee
// and returns total completed break minutes, grouped by calendar day.
// An unmatched trailing "break-start" (still on break) is not counted yet.
export function breakMinutesByDay(employeeId, attendanceLog) {
  const mine = attendanceLog
    .filter((e) => e.employeeId === employeeId && (e.type === "break-start" || e.type === "break-end"))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const byDay = {};
  let openStart = null;

  mine.forEach((entry) => {
    if (entry.type === "break-start") {
      openStart = entry.timestamp;
    } else if (entry.type === "break-end" && openStart) {
      const minutes = Math.max(0, Math.round((new Date(entry.timestamp) - new Date(openStart)) / 60000));
      const key = dayKey(openStart);
      byDay[key] = (byDay[key] || 0) + minutes;
      openStart = null;
    }
  });

  return byDay;
}

// How many vacation days this employee has logged in the given month.
export function vacationDaysThisMonth(employeeId, leaveLog, referenceDate = new Date()) {
  return leaveLog.filter((e) => e.employeeId === employeeId && isSameMonth(e.date, referenceDate)).length;
}

// Computes this employee's break time, vacation days, deductions, and
// final salary for the given month (defaults to the current month).
export function computePayroll(employee, attendanceLog, leaveLog = [], referenceDate = new Date()) {
  const dayRate = employee.salary / POLICY.workingDaysPerMonth;
  const minuteRate = dayRate / POLICY.workMinutesPerDay;

  // --- break time ---
  const byDay = breakMinutesByDay(employee.id, attendanceLog);
  let breakMinutes = 0;
  let excessBreakMinutes = 0;
  Object.entries(byDay).forEach(([day, minutes]) => {
    if (!isSameMonth(day, referenceDate)) return;
    breakMinutes += minutes;
    excessBreakMinutes += Math.max(0, minutes - POLICY.freeBreakMinutesPerDay);
  });
  const breakDeduction = Math.round(excessBreakMinutes * minuteRate);

  // --- vacation days ---
  const vacationDays = vacationDaysThisMonth(employee.id, leaveLog, referenceDate);
  const excessVacationDays = Math.max(0, vacationDays - POLICY.freeVacationDaysPerMonth);
  const vacationDeduction = excessVacationDays * POLICY.vacationDayDeduction;

  const totalDeduction = breakDeduction + vacationDeduction;
  const finalSalary = Math.max(0, Math.round(employee.salary - totalDeduction));

  return {
    baseSalary: employee.salary,
    dayRate,
    minuteRate,
    breakMinutes,
    freeMinutesPerDay: POLICY.freeBreakMinutesPerDay,
    excessBreakMinutes,
    breakDeduction,
    vacationDays,
    freeVacationDays: POLICY.freeVacationDaysPerMonth,
    excessVacationDays,
    vacationDeduction,
    totalDeduction,
    finalSalary,
  };
}
