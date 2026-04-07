# Splitly — 分帳好簡單

A LINE Mini App for splitting bills with friends and groups.
透過 LINE 輕鬆記帳、分帳、結算的 Mini App。

## Tech Stack

- **Frontend / Backend**: Next.js 15 (App Router) on Vercel
- **Database**: Supabase (PostgreSQL)
- **Auth**: LINE LIFF + LINE Login

---

## Domain Glossary / 名詞對照表

| English | 中文 | Description |
|---|---|---|
| Group | 群組 | A shared space where members track expenses together |
| Member | 成員 | A LINE user who has joined a group |
| Virtual Member | 虛擬成員 | A placeholder member without a LINE account; can be claimed by a real user on join |
| Invite Code | 邀請碼 | A short code used to join a group via link |
| Expense | 支出 | A bill or payment recorded in a group |
| Payer | 付款人 | The member who paid the expense upfront |
| Split | 分帳 | How an expense is divided among members |
| Equal Split | 均分 | Each included member pays an equal share |
| Custom Split | 自訂金額 | Each member's share is set manually |
| Expense Split | 分帳明細 | Each member's individual share of a specific expense |
| Receipt / Photo | 收據照片 | An optional photo attached to an expense |
| Happened Date | 消費日期 | The date the expense actually occurred (may differ from entry date) |
| Balance | 餘額 | A member's net position — positive means others owe them, negative means they owe others |
| Settlement | 結算 | The process of paying back debts between members |
| Transfer | 轉帳建議 | A suggested payment from one member to another to settle debts with minimum transactions |
| Settle | 清帳 | Marking a transfer as completed |
| Statistics | 消費統計 | A personal summary of how much a member has spent across the group |
| Activity | 活動紀錄 | The chronological list of expenses in a group |

---

## Features / 功能列表

- **Group management** — Create groups, invite members via LINE share or link, rename groups
- **Virtual members** — Add placeholder members; new joiners can claim a virtual member as themselves
- **Expense tracking** — Record expenses with description, amount, date, and optional photo
- **Bill splitting** — Equal split or custom amounts per member
- **Balances** — Real-time per-member balance calculation
- **Settlement** — Minimum-transaction algorithm to suggest the fewest transfers needed to clear all debts; mark transfers as settled
- **Statistics** — Personal spend summary with monthly trend chart and date-grouped expense list

---

## URLs

| Environment | URL |
|---|---|
| Production | https://splitly-sable.vercel.app |
| LINE LIFF ID | `2009642396-F09XC1jt` |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

> LIFF will not initialise on localhost (URL mismatch with the registered endpoint).
> To test LIFF features, open the production URL inside LINE.
