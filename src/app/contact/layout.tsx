import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Tallymate team for support, feature requests, or bug reports.",
  openGraph: {
    title: "Contact Us | Tallymate",
    description: "Get in touch with the Tallymate team for support, feature requests, or bug reports.",
    url: "https://tallymate.alltracker.online/contact",
  },
  alternates: {
    canonical: "https://tallymate.alltracker.online/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
