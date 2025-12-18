import {
    CurrencyDollarIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const features = [
    {
        name: 'Payment Processing',
        description: 'Auto-detects payments via M-Pesa and bank integrations (KES), automatically updating the entire system in real-time.',
        icon: CurrencyDollarIcon,
    },
    {
        name: 'Automated SMS',
        description: 'Send automated welcome messages, payment reminders, and receipts directly to tenants via SMS.',
        icon: ChatBubbleLeftRightIcon,
    },
    {
        name: 'Robust Record Keeping',
        description: 'Maintain a secure, transparent, and immutable history of all financial transactions and property events.',
        icon: DocumentTextIcon,
    },
    {
        name: 'Period Based Accounting',
        description: 'Flexible accounting periods tailored to your needs—generate reports monthly, quarterly, or annually.',
        icon: CalendarDaysIcon,
    },
    {
        name: 'Report Generation',
        description: 'Generate detailed PDF reports for properties, including revenue, arrears, and expense breakdowns in KES.',
        icon: ChartBarIcon,
    },
    {
        name: 'Running Costs Management',
        description: 'Track and categorize all property expenses to ensure clear net income visibility.',
        icon: ShieldCheckIcon,
    },
];

export default function Features() {
    return (
        <div className="bg-white py-24 sm:py-32" id="features">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Reliability and Automation
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        KodiPay empowers agents and landlords with tools designed to save time and provide exceptional customer service to clients and tenants alike.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-16 group hover:bg-gray-50 p-4 rounded-2xl transition-all duration-300">
                                <dt className="text-base font-semibold leading-7 text-gray-900">
                                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
                                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
