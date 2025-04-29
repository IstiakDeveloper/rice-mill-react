// resources/js/Pages/SackTypes/Index.tsx
import { useState, FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, SackType } from '@/types';
import { formatCurrency } from '@/utils';

interface SackTypesProps extends PageProps {
    sackTypes: SackType[];
}

export default function Index({ auth, sackTypes }: SackTypesProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSackType, setEditingSackType] = useState<SackType | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        price: '',
    });

    function closeModal() {
        setIsModalOpen(false);
        setEditingSackType(null);
        reset();
    }

    function openCreateModal() {
        setEditingSackType(null);
        reset();
        setIsModalOpen(true);
    }

    function openEditModal(sackType: SackType) {
        setEditingSackType(sackType);
        setData({
            name: sackType.name,
            price: sackType.price.toString(),
        });
        setIsModalOpen(true);
    }

    function confirmDelete(sackTypeId: number) {
        setDeleteConfirmationId(sackTypeId);
    }

    function cancelDelete() {
        setDeleteConfirmationId(null);
    }

    function deleteSackType(sackTypeId: number) {
        window.axios
            .delete(route('sack-types.destroy', sackTypeId))
            .then(() => {
                window.location.reload();
            })
            .catch((error) => {
                console.error('Error deleting sack type:', error);
                setDeleteConfirmationId(null);
            });
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (editingSackType) {
            post(route('sack-types.update', editingSackType.id), {
                onSuccess: () => closeModal(),
                preserveScroll: true,
                _method: 'PUT',
            });
        } else {
            post(route('sack-types.store'), {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">বস্তার ধরন</h2>}
        >
            <Head title="বস্তার ধরন" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">বস্তার ধরন</h2>
                                <button
                                    onClick={openCreateModal}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                    নতুন ধরন যোগ করুন
                                </button>
                            </div>

                            <div className="overflow-x-auto mt-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                বস্তার ধরন
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                মূল্য
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                কার্যক্রম
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sackTypes.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    কোন বস্তার ধরন যোগ করা হয়নি
                                                </td>
                                            </tr>
                                        ) : (
                                            sackTypes.map((sackType) => (
                                                <tr key={sackType.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{sackType.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{formatCurrency(sackType.price)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openEditModal(sackType)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            সম্পাদনা
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(sackType.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            মুছুন
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingSackType ? 'বস্তার ধরন সম্পাদনা করুন' : 'নতুন বস্তার ধরন যোগ করুন'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        বস্তার ধরন
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        মূল্য
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        required
                                    />
                                    {errors.price && <div className="text-red-500 text-sm mt-1">{errors.price}</div>}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    {processing ? 'অপেক্ষা করুন...' : editingSackType ? 'আপডেট করুন' : 'যোগ করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmationId !== null && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">বস্তার ধরন মুছে ফেলার নিশ্চিতকরণ</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            আপনি কি নিশ্চিত যে আপনি এই বস্তার ধরন মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={cancelDelete}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                            >
                                বাতিল করুন
                            </button>
                            <button
                                onClick={() => deleteSackType(deleteConfirmationId)}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                মুছে ফেলুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
