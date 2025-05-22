import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    categories: { id: number; name: string; description?: string }[];
    seasons: { id: number; name: string }[];
}

export default function Create({ categories, seasons }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [categoryList, setCategoryList] = useState(categories);

    const { data, setData, post, processing, errors } = useForm({
        expense_category_id: '',
        season_id: '',
        expense_date: '',
        amount: '',
        description: ''
    });

    // Category create form
    const { data: categoryData, setData: setCategoryData, post: postCategory, processing: categoryProcessing, errors: categoryErrors, reset: resetCategory } = useForm({
        name: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('expenses.store'));
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCategory(route('expense-categories.store'), {
            onSuccess: (page) => {
                // Add new category to list
                const newCategory = page.props.category;
                setCategoryList([...categoryList, newCategory]);
                setData('expense_category_id', newCategory.id);
                setShowModal(false);
                resetCategory();
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Add Expense" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <Link
                                    href={route('expenses.index')}
                                    className="text-green-600 hover:text-green-700"
                                >
                                    <ArrowLeft size={24} />
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={data.expense_category_id}
                                            onChange={(e) => setData('expense_category_id', e.target.value)}
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="">Select Category</option>
                                            {categoryList.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center gap-1"
                                        >
                                            <Plus size={16} />
                                            Add
                                        </button>
                                    </div>
                                    {errors.expense_category_id && <p className="text-red-500 text-sm mt-1">{errors.expense_category_id}</p>}
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
                                        value={data.expense_date}
                                        onChange={(e) => setData('expense_date', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    {errors.expense_date && <p className="text-red-500 text-sm mt-1">{errors.expense_date}</p>}
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
                                        placeholder="0.00"
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
                                        placeholder="Optional description"
                                    />
                                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {processing ? 'Saving...' : 'Save Expense'}
                                    </button>
                                    <Link
                                        href={route('expenses.index')}
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

            {/* Category Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Add New Category</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={categoryData.name}
                                    onChange={(e) => setCategoryData('name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter category name"
                                />
                                {categoryErrors.name && <p className="text-red-500 text-sm mt-1">{categoryErrors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={categoryData.description}
                                    onChange={(e) => setCategoryData('description', e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Optional description"
                                />
                                {categoryErrors.description && <p className="text-red-500 text-sm mt-1">{categoryErrors.description}</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={categoryProcessing}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                                >
                                    {categoryProcessing ? 'Saving...' : 'Save Category'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
