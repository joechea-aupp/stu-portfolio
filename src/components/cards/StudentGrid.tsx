import type { Student } from "@/types/student";
import { StudentCard } from "@/components/cards/StudentCard";

interface StudentGridProps {
  students: Student[];
  portfolioViews: Record<string, number>;
  kudos: Record<string, number>;
  kudoedStudentIds: Set<string>;
  onViewPortfolio: (studentId: string) => void;
  onGiveKudo: (studentId: string) => void;
}

export function StudentGrid({
  students,
  portfolioViews,
  kudos,
  kudoedStudentIds,
  onViewPortfolio,
  onGiveKudo,
}: StudentGridProps) {
  return (
    <section className="pt-8 pb-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            portfolioViews={portfolioViews[student.id] ?? 0}
            kudoCount={kudos[student.id] ?? 0}
            hasKudoed={kudoedStudentIds.has(student.id)}
            onViewPortfolio={onViewPortfolio}
            onGiveKudo={onGiveKudo}
          />
        ))}
      </div>
    </section>
  );
}
