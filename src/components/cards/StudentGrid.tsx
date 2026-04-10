import type { Student } from "@/types/student";
import { StudentCard } from "@/components/cards/StudentCard";

interface StudentGridProps {
  students: Student[];
  portfolioViews: Record<string, number>;
  maxPortfolioViews: number;
  onViewPortfolio: (studentId: string) => void;
}

export function StudentGrid({
  students,
  portfolioViews,
  maxPortfolioViews,
  onViewPortfolio,
}: StudentGridProps) {
  return (
    <section className="pt-8 pb-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            portfolioViews={portfolioViews[student.id] ?? 0}
            maxPortfolioViews={maxPortfolioViews}
            onViewPortfolio={onViewPortfolio}
          />
        ))}
      </div>
    </section>
  );
}
