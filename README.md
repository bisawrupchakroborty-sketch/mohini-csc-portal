# MOHINI CSC CENTRE — Partner Processing Platform

**Established: 2017**

A professional partner processing portal for Mohini CSC Centre. Partners/operators submit customer service requests, and the Mohini CSC team processes them.

## Project Structure

```
mohini_csc_portal/
├── index.html          # Partner Portal
├── admin.html          # Admin Panel
├── logo.png            # Business logo
├── css/
│   ├── common.css      # Shared styles & design system
│   ├── partner.css     # Partner portal specific styles
│   └── admin.css       # Admin panel specific styles
├── js/
│   ├── partner.js      # Partner portal logic & demo data
│   └── admin.js        # Admin panel logic & demo data
└── assets/             # Static assets
```

## How to Run

1. Open `index.html` in your browser — **Partner Portal**
2. Open `admin.html` in your browser — **Admin Panel**

No server required for the frontend prototype.

## Features

### Partner Portal
- **Dashboard** — Stats, popular services, recent applications
- **Services** — Browse and start applications (Aadhaar, PAN, Ration, Bill Payment)
- **Multi-step Application Form** — Customer → Documents → Review → Payment
- **Declaration Checkbox** — Payment locked until declaration is checked
- **My Applications** — Search, filter, track application status
- **Wallet & Payments** — Balance, transaction history
- **Downloads** — Completed result files
- **Support** — Create tickets, view ticket status
- **Notifications** — Application status updates

### Admin Panel
- **Overview** — New apps, processing queue, revenue, correction requests
- **Applications** — Review, process, request correction, upload results
- **Partners** — Manage partner accounts, activate/deactivate
- **Services & Pricing** — Edit fees, enable/disable services, configure documents
- **Payments** — Transaction history with status filters
- **Documents** — Review uploaded documents, verify status
- **Reports** — Business analytics, service distribution
- **Settings** — Admin profile, system configuration

## Application Workflow

```
Partner selects service → Enters customer details → Uploads documents
→ Reviews all info → Checks declaration → Payment unlocked
→ Pays fee → Application submitted
→ Admin receives application → Reviews documents
→ Processes request → Uploads final result
→ Partner downloads result
```

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Inter font (Google Fonts)
- No frameworks — pure frontend prototype

## Next Steps (Production)

- Backend: Node.js / Python / PHP
- Database: PostgreSQL / Supabase
- Authentication: JWT / Session-based
- Payment Gateway: Razorpay / PayU
- File Storage: AWS S3 / Supabase Storage (private)
- Role-based access control
- Audit logging
- Email & SMS notifications
