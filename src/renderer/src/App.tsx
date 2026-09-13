import { useMemo } from "react";
import Header from "./components/Header";
import Summary from "./components/Summary";
import CategorySection from "./components/CategorySection";
import { NORTHSTAR_GOAL, NORTHSTAR_COURSES } from "./data";

export default function App(): JSX.Element {
  const categories = useMemo(
    () => [...new Set(NORTHSTAR_COURSES.map((c) => c.category))],
    []
  );

  return (
    <div className="page">
      <Header goal={NORTHSTAR_GOAL} />
      <Summary courses={NORTHSTAR_COURSES} />
      <main>
        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            courses={NORTHSTAR_COURSES.filter((c) => c.category === category)}
          />
        ))}
      </main>
      <p className="footer-note">Seeded with sample data · v1</p>
    </div>
  );
}
