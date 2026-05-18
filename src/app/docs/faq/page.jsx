'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, BookOpen, MessageCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    "All",
    "Getting Started",
    "Properties, Units & Tenants",
    "Rent Collection & Payments",
    "Utility Billing",
    "SMS & Communication",
    "User Accounts & Permissions",
    "Reports & Analytics",
    "Billing, Subscriptions & Pricing",
    "Security & Data"
  ];

  const faqs = [
    // Getting Started
    {
      cat: "Getting Started",
      q: "What is KodiPay?",
      a: "KodiPay is a cloud-based property management system designed for landlords and real estate agencies in Kenya. It allows you to manage your properties, units, and tenants in one place, automate rent collection through M-Pesa, send SMS reminders, track utility bills, and generate financial reports — all from your phone or computer."
    },
    {
      cat: "Getting Started",
      q: "Who is KodiPay built for?",
      a: "KodiPay is built for property managers, landlords, and real estate agencies of any size — from a single landlord managing five units to a full agency managing hundreds of units across multiple properties. It is designed to be simple enough for non-technical users while powerful enough for professional agencies."
    },
    {
      cat: "Getting Started",
      q: "Do I need to install anything to use KodiPay?",
      a: "The KodiPay web dashboard works directly in your browser — no installation required. For on-the-go management, you can download the KodiPay Android app as an APK from the KodiPay website. Simply visit www.kodipay.co.ke, download the APK, and install it on your Android phone."
    },
    {
      cat: "Getting Started",
      q: "How do I create a KodiPay account?",
      a: "To get started, visit www.kodipay.co.ke and select the plan that suits your portfolio size. After completing the checkout, you will receive an email with your login credentials and a link to set your password. You can then log in immediately and begin adding your properties."
    },
    {
      cat: "Getting Started",
      q: "Is KodiPay available on iPhone?",
      a: "Currently KodiPay's mobile app is available on Android devices only. iPhone users can access the full KodiPay dashboard through the browser on their phone by visiting app.kodipay.co.ke. An iOS app is planned for a future release."
    },
    {
      cat: "Getting Started",
      q: "Can I try KodiPay before paying?",
      a: "Yes. KodiPay offers a free sampling plan that gives you full access to all core features for 14 days with no payment required upfront. You only need to provide a payment method before the trial begins. If you do not wish to continue after the trial, you can cancel and no charge is made."
    },
    {
      cat: "Getting Started",
      q: "What information do I need to register my agency on KodiPay?",
      a: "You will need your agency or business name, your email address, your phone number, and a payment method for the subscription. If you are registering as a company rather than an individual, having your business registration details on hand will help during the setup process."
    },

    // Properties, Units & Tenants
    {
      cat: "Properties, Units & Tenants",
      q: "How do I add a property on KodiPay?",
      a: "Log in to your KodiPay dashboard and click Add Property. A step-by-step guide will walk you through entering the property name, type (residential, commercial, or mixed use), address, and an optional cover photo. The whole process takes less than two minutes."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "Can I manage both residential and commercial properties on KodiPay?",
      a: "Yes. KodiPay supports residential units such as bedsitters, studios, and one, two, and three-bedroom apartments, as well as commercial units such as shops, offices, and warehouses. You can have a mix of both types within a single property."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "How do I add units to a property?",
      a: "After creating a property, you are guided to add units one at a time. For each unit you enter the unit name or number, the unit type, the monthly rent, and optionally the security deposit amount and recurring utility fees. You can add as many units as needed before moving on."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "Can I edit a unit name after it has been created?",
      a: "Yes. KodiPay supports universal unit name editing, which means you can update a unit's name from any screen where it appears in the application and the change will reflect everywhere instantly. You do not need to go to a special settings page to rename a unit."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "How do I assign a tenant to a unit?",
      a: "During the property setup or from the unit detail page, click Assign Tenant. Enter the tenant's full name, phone number, national ID number (optional), and move-in date. The tenant is immediately linked to that unit and their account is ready to receive bills and payments."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "What happens when a tenant moves out?",
      a: "When a tenant vacates, you mark them as moved out from their profile page. KodiPay records the move-out date, preserves their full payment history, and changes the unit status to Vacant so it appears on your dashboard as available. You can assign a new tenant to the unit at any time."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "Can I transfer a tenant from one unit to another?",
      a: "Yes. From the tenant's profile, you can transfer them to a different unit within the same property or a different property. Their payment history moves with them and the previous unit is marked as Vacant."
    },
    {
      cat: "Properties, Units & Tenants",
      q: "Is there a limit to how many properties or units I can add?",
      a: "The number of properties and units you can manage depends on your subscription plan. The sampling plan has a limit to help you evaluate the system. The standard and premium plans support larger portfolios. Contact the KodiPay team if you need a custom limit for a very large portfolio."
    },

    // Rent Collection & Payments
    {
      cat: "Rent Collection & Payments",
      q: "How does M-Pesa integration work on KodiPay?",
      a: "KodiPay is integrated with M-Pesa via a webhook. When a tenant sends money to your agency's M-Pesa Paybill number and enters their unit account code as the reference, KodiPay receives the payment notification in real time, matches it to the correct tenant, and records it automatically. The tenant receives an SMS receipt immediately."
    },
    {
      cat: "Rent Collection & Payments",
      q: "What if a tenant pays cash or via bank transfer?",
      a: "KodiPay has a manual payment recording option. Go to the tenant's account, click Record Payment, select the payment method (cash, bank transfer, or cheque), enter the amount, date, and reference number. The system updates the tenant's balance and generates a receipt instantly."
    },
    {
      cat: "Rent Collection & Payments",
      q: "What happens if a tenant overpays?",
      a: "KodiPay tracks overpayments automatically. The excess amount is recorded as a credit on the tenant's account and can be applied to future months through the Excess Application feature. The admin receives a notification whenever an overpayment occurs."
    },
    {
      cat: "Rent Collection & Payments",
      q: "Can KodiPay handle partial payments?",
      a: "Yes. If a tenant pays an amount less than their total balance, KodiPay records the partial payment and shows the remaining outstanding amount clearly on their account. The outstanding balance carries forward automatically to the following month."
    },
    {
      cat: "Rent Collection & Payments",
      q: "How are payments allocated when a tenant owes multiple amounts?",
      a: "KodiPay uses an intelligent fund allocation system. When a payment is received, it is applied in this order: security deposit first (for new move-ins), then monthly rent, then standard utility fees such as garbage and security, then water and electricity bills, and finally any outstanding arrears from previous months."
    },
    {
      cat: "Rent Collection & Payments",
      q: "Can I generate a receipt for a tenant after recording a payment?",
      a: "Yes. Every payment recorded on KodiPay — whether M-Pesa, cash, or bank — automatically generates a receipt. The receipt includes the agency name, tenant name, unit, property, amount paid, payment method, reference number, and a unique receipt serial number. It can be downloaded as a PDF or sent to the tenant via SMS."
    },
    {
      cat: "Rent Collection & Payments",
      q: "How do I view the full payment history for a tenant?",
      a: "Go to the tenant's profile and select the Transactions or History tab. You will see a complete ledger of every payment, allocation change, and balance adjustment since the tenant was onboarded, with dates and amounts. This history is preserved even after a tenant moves out."
    },

    // Utility Billing
    {
      cat: "Utility Billing",
      q: "Does KodiPay support electricity billing?",
      a: "Yes. KodiPay includes a full electricity billing module. You enter the previous and current meter readings for each unit, and the system automatically calculates the number of units consumed, applies your configured rate per unit, and adds the charge to the tenant's monthly bill."
    },
    {
      cat: "Utility Billing",
      q: "Does KodiPay support water billing?",
      a: "Yes. Water billing works the same way as electricity billing. You enter the previous and current water meter readings, and KodiPay calculates the consumption and generates a water bill that is added to the tenant's statement alongside rent."
    },
    {
      cat: "Utility Billing",
      q: "Can I set different electricity and water rates for different properties?",
      a: "Yes. Utility rates are configured at the property level, so you can set different rates for each property to match the tariff from the utility provider serving that property. Rates can be updated at any time and the new rate applies from the next billing cycle."
    },
    {
      cat: "Utility Billing",
      q: "Are utility bills shown separately from rent on the tenant's statement?",
      a: "Yes. KodiPay itemises all charges on the tenant's statement: rent, electricity, water, garbage, security, cleaning, and any penalties appear as separate line items. This makes it easy for tenants to understand exactly what they are paying for and reduces billing disputes."
    },
    {
      cat: "Utility Billing",
      q: "Can I pay electricity and water separately from rent?",
      a: "Yes. KodiPay allows each charge type to be marked as paid independently. A tenant who pays rent in full but delays their utility bills can have their rent status updated to Paid while utility bills remain outstanding."
    },

    // SMS & Communication
    {
      cat: "SMS & Communication",
      q: "How does KodiPay send SMS messages to tenants?",
      a: "KodiPay uses the TextSMS API to send messages. All SMS messages are sent from the KodiPay branded sender name so tenants immediately recognise the source. Messages are sent automatically based on the reminders you configure, or manually when you choose to send a custom message."
    },
    {
      cat: "SMS & Communication",
      q: "What types of SMS messages does KodiPay send automatically?",
      a: "KodiPay sends automated SMS reminders before rent is due, on the due date if payment has not been received, after the due date as a follow-up, payment receipts when a payment is recorded, utility bill notifications when a new bill is raised, and penalty notices when a penalty is applied to a tenant's account."
    },
    {
      cat: "SMS & Communication",
      q: "How many SMS messages are included in my plan?",
      a: "Every KodiPay subscription includes 2,000 SMS messages per calendar month. The SMS counter on your dashboard shows how many messages have been sent and how many remain for the current month."
    },
    {
      cat: "SMS & Communication",
      q: "What happens when I use up my 2,000 SMS messages?",
      a: "When your monthly SMS allocation runs out, outgoing messages are paused until you purchase an SMS bundle. You can buy 1,000 additional messages for KSh 500 or 3,000 messages for KSh 1,300 directly from your dashboard. Bundle messages are added to your account immediately after purchase."
    },
    {
      cat: "SMS & Communication",
      q: "Can I customise the SMS messages sent to my tenants?",
      a: "Yes. In the Settings section under SMS Templates, you can edit the default message templates for reminders, receipts, and utility bills. You can use template variables such as tenant name, unit number, amount due, and due date which are automatically filled in when the message is sent."
    },
    {
      cat: "SMS & Communication",
      q: "What is the Mini Phone feature?",
      a: "The Mini Phone is an in-app SMS preview tool. When you are composing or editing a message template, the Mini Phone shows you exactly how the message will appear on a tenant's phone before you send it. It also shows the character count and how many SMS parts the message will use, so you can stay within one message where possible."
    },
    {
      cat: "SMS & Communication",
      q: "Can I send a one-off message to a specific tenant?",
      a: "Yes. From any tenant's profile page, you can send a custom SMS directly to that tenant. The message is sent immediately, logged in the communication history, and counted against your monthly SMS balance."
    },

    // User Accounts & Permissions
    {
      cat: "User Accounts & Permissions",
      q: "What is the difference between an Admin and a Subagent?",
      a: "The Admin is the highest level of user in an agency. They have access to all properties, all financial data, all settings, and can create and manage Subagent accounts. A Subagent only sees the properties they have been assigned to by the Admin. They can perform day-to-day tasks like recording payments and checking tenant balances, but cannot access agency-wide settings or other agents' properties."
    },
    {
      cat: "User Accounts & Permissions",
      q: "How do I create a Subagent account?",
      a: "Go to the Staff section on your Admin dashboard and click Add Subagent. Enter the subagent's name, email address, and phone number. The system sends them an email invitation to set their password. You then assign the properties they should manage from the property list."
    },
    {
      cat: "User Accounts & Permissions",
      q: "Can a Subagent see financial reports?",
      a: "A Subagent can view reports and metrics for the properties they have been assigned to. They cannot see data from other properties or agency-wide financial summaries. All report data in a Subagent's session is automatically filtered to their assigned portfolio."
    },
    {
      cat: "User Accounts & Permissions",
      q: "Can I have multiple agencies on the same KodiPay platform?",
      a: "Yes. KodiPay is built on a multi-agency architecture, meaning multiple independent agencies can operate on the same platform completely separately. Each agency's data is fully isolated. Agency A cannot see Agency B's properties, tenants, or financial data under any circumstance."
    },
    {
      cat: "User Accounts & Permissions",
      q: "How do I deactivate a Subagent who has left?",
      a: "Go to the Staff section, find the Subagent, and click Deactivate. Their access to the dashboard is revoked immediately. All the properties they were managing remain intact and can be reassigned to another Subagent or managed directly by the Admin."
    },

    // Reports & Analytics
    {
      cat: "Reports & Analytics",
      q: "What reports can I generate on KodiPay?",
      a: "KodiPay offers several report types: a management dashboard with key performance indicators, portfolio performance comparisons across properties, detailed property reports showing unit-by-unit financial health, individual tenant statements, and full transaction history exports. All reports can be downloaded as PDF or CSV files."
    },
    {
      cat: "Reports & Analytics",
      q: "Can I generate reports covering multiple months?",
      a: "Yes. The reports section includes a custom date range picker that lets you select any start and end date up to 24 months back. The system fetches all payment, utility, and occupancy data for the selected period and presents it in a summary and a detailed transactions table."
    },
    {
      cat: "Reports & Analytics",
      q: "Can I export my data from KodiPay?",
      a: "Yes. All reports can be exported as PDF or CSV. The PDF export is professionally formatted with your agency name, the date range, and KodiPay branding. The CSV export can be opened in Excel or Google Sheets for further analysis or accounting purposes."
    },

    // Billing, Subscriptions & Pricing
    {
      cat: "Billing, Subscriptions & Pricing",
      q: "How much does KodiPay cost?",
      a: "KodiPay offers tiered subscription plans starting with a free 14-day sampling plan. Paid plans are billed monthly and priced based on the size of your portfolio. Visit www.kodipay.co.ke to view current pricing or contact the KodiPay team for a custom quote for large portfolios."
    },
    {
      cat: "Billing, Subscriptions & Pricing",
      q: "How do I pay for my KodiPay subscription?",
      a: "Subscriptions can be paid via M-Pesa Paybill or by card through the KodiPay checkout. After payment is confirmed, your account is activated or renewed immediately without any manual processing."
    },
    {
      cat: "Billing, Subscriptions & Pricing",
      q: "What happens if my subscription expires?",
      a: "If your subscription lapses, your account enters a 7-day grace period during which you can still log in and view your data but cannot send SMS messages or add new tenants. After 7 days the account is suspended. Your data is never deleted and is fully restored when you renew."
    },
    {
      cat: "Billing, Subscriptions & Pricing",
      q: "Can I upgrade or downgrade my subscription plan?",
      a: "Yes. You can change your plan at any time from the Subscription section on your dashboard. Upgrades take effect immediately. Downgrades take effect at the start of the next billing cycle."
    },

    // Security & Data
    {
      cat: "Security & Data",
      q: "Is my data safe on KodiPay?",
      a: "Yes. KodiPay stores all data on Google Cloud Firestore, one of the most secure and reliable cloud databases available. All data is encrypted in transit using HTTPS and at rest using Google's default encryption. Access to each agency's data is protected by Firebase Authentication and strict Firestore security rules that are enforced at the database level."
    },
    {
      cat: "Security & Data",
      q: "Can KodiPay staff see my tenants' data?",
      a: "KodiPay staff have access to platform-level administrative tools for support and maintenance purposes only. They do not have routine access to your tenant records, payment histories, or financial data. Access is logged and audited."
    },
    {
      cat: "Security & Data",
      q: "What happens to my data if I cancel my subscription?",
      a: "Your data is retained for 90 days after cancellation. During this period you can contact the KodiPay team to request a full export of all your agency's data in CSV format. After 90 days, data is permanently deleted from the platform."
    },
    {
      cat: "Security & Data",
      q: "Does KodiPay comply with Kenyan data protection regulations?",
      a: "KodiPay is designed to comply with the Kenya Data Protection Act 2019. Tenant personal information is collected only for the purpose of property management, stored securely, and not shared with third parties without consent. Tenants can request access to or deletion of their personal data by contacting your agency admin."
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || faq.cat === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-8">

        {/* Navigation */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[var(--color-primary)] transition-colors mb-8">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-100 text-[var(--color-primary)] mb-6 shadow-sm">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Help & FAQ</h1>
          <p className="text-slate-500 text-lg">50 Questions & Answers about the KodiPay System</p>
        </div>

        {/* Search and Filters */}
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-slate-100 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search questions or keywords..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategory === cat
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Grid */}
        <div className="space-y-12">
          {categories.filter(c => c !== 'All' && (activeCategory === 'All' || activeCategory === c)).map(cat => {
            const catFaqs = filteredFaqs.filter(f => f.cat === cat);
            if (catFaqs.length === 0) return null;

            return (
              <div key={cat} className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-l-4 border-[var(--color-primary)] pl-4">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catFaqs.map((faq, idx) => (
                    <FAQItem key={idx} faq={faq} />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="py-24 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900">No matching questions found</h3>
              <p className="text-slate-500">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>

        {/* Support Card */}
        <div className="mt-24 bg-[var(--color-primary)] rounded-[3rem] p-12 text-white shadow-2xl shadow-[var(--color-primary)]/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-3xl font-bold mb-4">Still need help?</h3>
            <p className="text-sky-100 text-lg">Our support team is available 24/7 to assist you with any technical issues or specific portfolio needs.</p>
          </div>
          <button className="whitespace-nowrap px-8 py-4 bg-white text-[var(--color-primary)] font-bold rounded-2xl hover:bg-sky-50 transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 text-lg">
            <MessageCircle size={24} />
            Contact Support
          </button>
        </div>

        <div className="mt-12 text-center text-slate-400 text-sm font-medium">
          www.kodipay.co.ke • Confidential — Internal & Client Use
        </div>

      </div>
    </div>
  );
}

function FAQItem({ faq }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`bg-white rounded-3xl p-6 transition-all border ${isOpen ? 'border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/5' : 'border-slate-100 shadow-sm hover:border-slate-200'
        }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <h3 className="text-[15px] font-bold text-slate-900 leading-tight flex items-start gap-3">
          <span className="text-[var(--color-primary)] mt-0.5"><BookOpen size={18} /></span>
          {faq.q}
        </h3>
        <span className="text-slate-300 mt-1">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] mt-4' : 'max-h-0'}`}>
        <p className="text-slate-600 text-[14px] leading-relaxed pl-8 border-t border-slate-50 pt-4">
          {faq.a}
        </p>
      </div>
    </div>
  );
}
