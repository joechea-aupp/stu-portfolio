import type { Student } from "@/types/student";
import { StudentCard } from "@/components/cards/StudentCard";
import { SubmitPortfolioCard } from "@/components/cards/SubmitPortfolioCard";

interface StudentGridProps {
  students: Student[];
}

export function StudentGrid({ students }: StudentGridProps) {
  return (
    <section className="pt-8 pb-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {students.slice(0, 5).map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
        <SubmitPortfolioCard />
      </div>
    </section>
  );
}
