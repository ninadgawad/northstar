function statusClass(status) {
  if (status === "Completed") return "completed";
  if (status === "In Progress") return "in-progress";
  return "not-started";
}

function formatDate(isoDate) {
  if (!isoDate) return "\u2014";
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseHours(timeToComplete) {
  const hoursMatch = timeToComplete.match(/(\d+)\s*h/);
  const minutesMatch = timeToComplete.match(/(\d+)\s*m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours + minutes / 60;
}

function renderSummary(courses) {
  const completed = courses.filter((c) => c.status === "Completed");
  const inProgress = courses.filter((c) => c.status === "In Progress");
  const totalHours = courses.reduce((sum, c) => sum + parseHours(c.timeToComplete), 0);
  const completedHours = completed.reduce((sum, c) => sum + parseHours(c.timeToComplete), 0);
  const remainingHours = totalHours - completedHours;

  const stats = [
    { value: `${completed.length} / ${courses.length}`, label: "Courses completed" },
    { value: inProgress.length, label: "In progress" },
    { value: `${Math.round(completedHours)}h`, label: "Hours logged" },
    { value: `${Math.round(remainingHours)}h`, label: "Hours remaining" },
  ];

  const summary = document.getElementById("summary");
  summary.innerHTML = stats
    .map(
      (s) => `
      <div class="stat">
        <div class="value">${s.value}</div>
        <div class="label">${s.label}</div>
      </div>`
    )
    .join("");
}

function renderCategories(courses) {
  const categories = [...new Set(courses.map((c) => c.category))];
  const container = document.getElementById("categories");

  container.innerHTML = categories
    .map((category) => {
      const rows = courses
        .filter((c) => c.category === category)
        .map(
          (c) => `
          <tr>
            <td>
              <div class="course-name">${c.name}</div>
              <div class="course-platform">${c.platform}</div>
            </td>
            <td><span class="status-badge ${statusClass(c.status)}">${c.status}</span></td>
            <td class="muted">${formatDate(c.lastCompleted)}</td>
            <td class="time">${c.timeToComplete}</td>
            <td><a href="${c.link}" target="_blank" rel="noopener noreferrer">View source \u2192</a></td>
            <td class="notes">${c.notes}</td>
          </tr>`
        )
        .join("");

      return `
        <section class="category">
          <h2>${category}</h2>
          <div class="table-card">
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Last Completed</th>
                    <th>Time to Complete</th>
                    <th>Link</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </div>
        </section>`;
    })
    .join("");
}

document.getElementById("goal-text").textContent = NORTHSTAR_GOAL;
renderSummary(NORTHSTAR_COURSES);
renderCategories(NORTHSTAR_COURSES);