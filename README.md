# Anesu Invoice - Invoice Management System

A modern, full-featured invoice management application built with React, TypeScript, Vite, and Supabase.

## 🚀 Live Demo

**Deployed on Vercel**: [Coming Soon - Deploy Instructions Below]

## ✨ Features

- 🔐 **User Authentication** - Secure signup/login with Supabase Auth
- 🏢 **Multi-tenant Companies** - Each user can manage multiple companies
- 👥 **Client Management** - Store and organize client information
- 📦 **Product Catalog** - Manage your products and services
- 📄 **Invoice Creation** - Generate professional invoices
- 🔄 **Recurring Invoices** - Automate recurring billing
- 📊 **Dashboard Analytics** - Track revenue and invoice status
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Row Level Security** - Data isolation with Supabase RLS

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Routing**: React Router DOM
- **Styling**: Custom CSS with utility classes
- **Security**: hCaptcha integration for bot protection
- **Deployment**: Vercel
- **Database**: PostgreSQL with Row Level Security

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anesuzues/anesu-invoice.git
   cd anesu-invoice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
   ```

4. **Set up hCaptcha (Required for Registration)**
   - Create account at [hCaptcha.com](https://www.hcaptcha.com/)
   - Get your Site Key and Secret Key
   - Add Site Key to `.env` file
   - Configure Secret Key in Supabase Auth settings
   - See [CAPTCHA_SETUP.md](./CAPTCHA_SETUP.md) for detailed instructions

5. **Set up the database**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and run the SQL from `supabase/migrations/20260312212728_create_tables.sql`

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Anesuzues/anesu-invoice)

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Steps:**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 📁 Project Structure

```
anesu-invoice/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.tsx
│   │   └── CompanyContext.tsx
│   ├── lib/            # Utilities and configurations
│   │   ├── supabase.ts
│   │   └── database.types.ts
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Invoices.tsx
│   │   ├── Clients.tsx
│   │   ├── Products.tsx
│   │   └── Settings.tsx
│   └── utils/          # Helper functions
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge Functions
├── public/             # Static assets
└── index.html          # Entry point
```

## 🔒 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **JWT Authentication** - Secure token-based authentication
- **Environment Variables** - Sensitive data stored securely
- **HTTPS** - Enabled by default on Vercel
- **Input Validation** - Client and server-side validation

## 📊 Database Schema

Main tables:
- **companies** - Company/business information
- **clients** - Customer data
- **products** - Product/service catalog
- **invoices** - Invoice records
- **invoice_items** - Line items for invoices
- **recurring_invoices** - Recurring billing templates

All tables include RLS policies for data security.

## 🎯 Usage

### Creating Your First Invoice

1. **Sign up** for an account
2. **Set up your company** in Settings
3. **Add clients** in the Clients page
4. **Add products/services** in the Products page
5. **Create an invoice** in the Invoices page
6. **Track payments** in the Dashboard

### Setting Up Recurring Invoices

1. Go to Invoices → Recurring
2. Select a client and frequency
3. Set the amount and payment terms
4. The system will automatically generate invoices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/Anesuzues/anesu-invoice/issues)
- 💬 [Discussions](https://github.com/Anesuzues/anesu-invoice/discussions)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Vite](https://vitejs.dev) - Build tool
- [React](https://react.dev) - UI framework
- [Vercel](https://vercel.com) - Hosting platform

## 📧 Contact

Anesu - [@Anesuzues](https://github.com/Anesuzues)

Project Link: [https://github.com/Anesuzues/anesu-invoice](https://github.com/Anesuzues/anesu-invoice)

---

Made with ❤️ by Anesu
