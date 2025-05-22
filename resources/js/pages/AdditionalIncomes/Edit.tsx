import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    income: {
        id: number;
        income_source: string;
        season_id: number;
        date: string;
        amount: string;
        description?: string;
    };
    seasons: { id: number; name: string }[];
}

export default function Edit({ income, seasons }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        income_source: income.income_source,
        season_id: income.season_id,
        date: income.date,
        amount: income.amount,
        description: income.description || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('additional-incomes.update', income.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Additional Income" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <Link
                                    href={route('additional-incomes.index')}
                                    className="text-green-600 hover:text-green-700"
                                >
                                    <ArrowLeft size={24} />
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Additional Income</h1>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Income Source *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.income_source}
                                        onChange={(e) => setData('income_source', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    {errors.income_source && <p className="text-red-500 text-sm mt-1">{errors.income_source}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Season *
                                    </label>
                                    <select
                                        value={data.season_id}
                                        onChange={(e) => setData('season_id', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Select Season</option>
                                        {seasons.map((season) => (
                                            <option key={season.id} value={season.id}>
                                                {season.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.season_id && <p className="text-red-500 text-sm mt-1">{errors.season_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {processing ? 'Updating...' : 'Update Income'}
                                    </button>
                                    <Link
                                        href={route('additional-incomes.index')}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
