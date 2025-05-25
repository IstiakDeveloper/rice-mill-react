import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Expense {
    id: number;
    amount: string;
    expense_date: string;
    description?: string;
    category: { id: number; name: string };
    season: { id: number; name: string };
    created_at: string;
    updated_at: string;
}

interface Props {
    expense: Expense;
}

export default function Show({ expense }: Props) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this expense?')) {
            router.delete(route('expenses.destroy', expense.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Expense Details" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <Link
                                        href={route('expenses.index')}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        <ArrowLeft size={20} />
                                    </Link>
                                    <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={route('expenses.edit', expense.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Edit size={16} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Expense Information Card */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Category</label>
                                        <p className="mt-1 text-lg text-gray-900">{expense.category.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Season</label>
                                        <p className="mt-1 text-lg text-gray-900">{expense.season.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Expense Date</label>
                                        <p className="mt-1 text-lg text-gray-900">
                                            {new Date(expense.expense_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Amount</label>
                                        <p className="mt-1 text-2xl font-bold text-red-600">৳{expense.amount}</p>
                                    </div>
                                </div>

                                {expense.description && (
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-500">Description</label>
                                        <p className="mt-1 text-gray-900 bg-white p-3 rounded border">
                                            {expense.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Meta Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-md font-medium text-gray-900 mb-3">Record Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Created:</span>
                                        <span className="ml-2 text-gray-900">
                                            {new Date(expense.created_at).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Last Updated:</span>
                                        <span className="ml-2 text-gray-900">
                                            {new Date(expense.updated_at).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <Link
                                        href={route('expenses.index')}
                                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                                    >
                                        <ArrowLeft size={16} />
                                        Back to Expenses List
                                    </Link>

                                    <div className="flex gap-2">
                                        <Link
                                            href={route('expenses.create')}
                                            className="text-green-600 hover:text-green-700"
                                        >
                                            Add New Expense
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
