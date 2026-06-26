import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center & Documentation",
  description: "Learn how to use Tallymate: track expenses, split bills with groups, set budgets, create savings goals, and manage your complete financial life.",
  openGraph: {
    title: "Help Center & Documentation | Tallymate",
    description: "Learn how to use Tallymate: track expenses, split bills with groups, set budgets, create savings goals, and manage your complete financial life.",
    url: "https://tallymate.app/docs",
  },
  alternates: {
    canonical: "https://tallymate.app/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
