import type { Course } from "../types";
import { formatDate, statusClass } from "../utils";

interface CategorySectionProps {
  category: string;
  courses: Course[];
}

export default function CategorySection({ category, courses }: CategorySectionProps): JSX.Element {
  return (
    <section className="category">
      <h2>{category}</h2>
      <div className="table-card">
        <div className="table-scroll">
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
              {courses.map((course) => (
                <tr key={course.name}>
                  <td>
                    <div className="course-name">{course.name}</div>
                    <div className="course-platform">{course.platform}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass(course.status)}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="muted">{formatDate(course.lastCompleted)}</td>
                  <td className="time">{course.timeToComplete}</td>
                  <td>
                    <a href={course.link} target="_blank" rel="noopener noreferrer">
                      View source →
                    </a>
                  </td>
                  <td className="notes">{course.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
