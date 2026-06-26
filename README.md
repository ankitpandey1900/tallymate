# Tallymate

**Tallymate** is a next-generation, unified personal finance and bill-splitting application designed to seamlessly bridge the gap between individual budget tracking and shared group expenses.

Built with performance and premium aesthetics in mind, Tallymate operates as a Progressive Web App (PWA) with sub-second response times, offering a native-app-like experience directly in the browser.

---

## 🎯 What does this web app do?
Tallymate is a financial command center. It allows users to:
1. **Track Personal Finances:** Log daily incomes, expenses, and manage multiple accounts (Cash, Bank, Credit Cards, UPI).
2. **Set & Monitor Budgets:** Create strict monthly budgets for specific categories (e.g., Dining, Subscriptions) and monitor real-time spending progress.
3. **Save for Financial Goals:** Track progress toward long-term savings goals with satisfying micro-interactions and celebration animations.
4. **Split Bills Seamlessly:** Create groups (e.g., "Roommates", "Trip to Bali") and effortlessly split shared expenses. The app handles the complex math of "who owes who" and tracks settlements.

## 💡 Why is it needed & What problems does it solve?
Historically, people have had to use **two completely separate apps** to manage their money:
1. An app for personal budgeting (like Mint, YNAB, or a spreadsheet).
2. An app for splitting bills with friends (like Splitwise).

**The Problem:** When you go out to dinner and pay a $100 bill on behalf of 4 friends, your personal budgeting app records a $100 expense, ruining your monthly budget analytics. You then have to manually track the $75 your friends owe you in Splitwise. It's disconnected, manual, and stressful.

**The Solution:** Tallymate solves this by unifying both ecosystems. When you record that $100 shared expense in Tallymate, the app is smart enough to log a $25 personal expense against your "Dining" budget, while simultaneously logging a $75 pending receivable in your "Friends" group. One transaction, perfectly balanced across personal budgets and group ledgers.

## 🚀 Why is it different from other tools?
- **True Unification:** It completely eliminates the need for both Splitwise and YNAB. Personal ledgers and group ledgers talk to each other natively.
- **Enterprise-Grade Performance:** Built on Next.js App Router with Server Actions, Prisma, and connection pooling. UI interactions are optimistic, backed by global transition loaders, ensuring zero perceived latency.
- **Premium Design System:** Moves away from the boring, sterile interfaces of traditional banking apps or chaotic AI-generated interfaces. It features a curated, minimalist SaaS aesthetic with glassmorphism, micro-animations (like confetti on goal completion), and perfect alignment.
- **Seamless Authentication:** Integrates BetterAuth for secure, instant Google OAuth and Email/Password sign-ins, tightly coupled with the database.

## 🛠️ Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Actions)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Neon/Supabase)
- **ORM:** Prisma
- **Authentication:** BetterAuth
- **Styling:** Tailwind CSS + Lucide Icons
- **Performance:** `nextjs-toploader` for instant navigation feedback

