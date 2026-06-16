import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation – Tallymate",
  description: "Learn how to use Tallymate: track expenses, split bills with groups, set budgets, create savings goals, and manage your complete financial life.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
