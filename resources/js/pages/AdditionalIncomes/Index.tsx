import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Income {
    id: number;
    income_source: string;
    amount: string;
    date: string;
    description?: string;
    season: { id: number; name: string };
}

interface Props {
    incomes: {
        data: Income[];
        links: any[];
        current_page: number;
        last_page: number;
    };
    seasons: { id: number; name: string }[];
}

export default function Index({ incomes, seasons }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure?')) {
            router.delete(route('additional-incomes.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Additional Incomes" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">Additional Incomes</h1>
                                <Link
                                    href={route('additional-incomes.create')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Add Income
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {incomes.data.map((income) => (
                                            <tr key={income.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {income.income_source}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(income.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                                    ৳{income.amount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {income.season.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                                    <Link
                                                        href={route('additional-incomes.show', income.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <Link
                                                        href={route('additional-incomes.edit', income.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(income.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-6 flex justify-center">
                                <div className="flex space-x-2">
                                    {incomes.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-2 rounded-md text-sm ${
                                                link.active
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
