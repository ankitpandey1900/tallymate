# Tallymate - Expense Tracker 🚀

Hey! This is my full-stack expense tracker app that I built. It's basically a mix of a personal finance manager and a Splitwise clone. I built it because I wanted a clean, Apple-inspired way to track my budgets, split bills with friends, and see where my money goes without using clunky apps.

## What it does
- **Dashboard:** Shows your total balance and expenses in cool charts.
- **Transactions:** Add, edit, and delete your daily expenses or incomes.
- **Splitwise Groups:** Create groups with friends, add shared expenses, and the app's split-engine automatically calculates who owes who! (figuring out the math for this part was pretty tricky lol)
- **Budgets:** Set monthly limits for categories so you don't overspend.
- **Savings Goals:** Track money for things you want to buy (like a new laptop or a trip).

## Tech Stack
I used some modern tools that I wanted to get better at:
- **Next.js** (App router)
- **Tailwind CSS** (for all the styling, dark mode works out of the box)
- **Prisma ORM** (makes writing database queries way easier)
- **Better-Auth** (for handling user login securely)
- **PostgreSQL** (I hosted my DB on Supabase)

## How to run it locally

If you want to run this on your own machine, just follow these steps:

1. Clone this repo
2. Run `npm install` to get all the packages
3. Make a copy of `.env.example`, rename it to `.env`, and put your own Postgres Database URL inside.
4. Run `npx prisma db push` so Prisma can create all the tables in your database.
5. Run `npm run dev` and open `http://localhost:3000` in your browser.


---
Hope you like it! Feel free to use the code or let me know if you find any bugs.
