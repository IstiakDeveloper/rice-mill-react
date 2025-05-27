import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Transaction } from '@/types';
import { formatCurrency, formatDate, getPaymentStatusText, getPaymentStatusClass } from '@/utils';
import { Eye, Edit, Trash2, CreditCard } from 'lucide-react';

interface TransactionsIndexProps extends PageProps {
  transactions: {
    data: Transaction[];
    links: any;
  };
}

export default function Index({ auth, transactions }: TransactionsIndexProps) {
  const handleDelete = (transactionId: number, customerName: string) => {
    if (confirm(`Are you sure you want to delete the transaction for ${customerName}? This action cannot be undone.`)) {
      router.delete(route('transactions.destroy', transactionId));
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">Transactions List</h2>
          <Link
            href={route('transactions.create')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Add New Transaction
          </Link>
        </div>
      }
    >
      <Head title="Transactions List" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Customer Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Payments
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Balance
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Balance Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.data.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.data.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.customer?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(transaction.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {formatCurrency(transaction.customer?.balance?.total_payments || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {transaction.customer?.balance?.balance > 0 ? (
                              <span className="text-red-600">
                                {formatCurrency(transaction.customer.balance.balance)}
                              </span>
                            ) : transaction.customer?.balance?.advance_payment > 0 ? (
                              <span className="text-green-600">
                                Advance: {formatCurrency(transaction.customer.balance.advance_payment)}
                              </span>
                            ) : (
                              <span className="text-gray-500">Clear</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.customer?.balance?.balance > 0
                                  ? 'bg-red-100 text-red-800'
                                  : transaction.customer?.balance?.advance_payment > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {transaction.customer?.balance?.balance > 0
                                ? 'Due'
                                : transaction.customer?.balance?.advance_payment > 0
                                ? 'Advance'
                                : 'Clear'
                              }
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex justify-center items-center space-x-2">
                              {/* View Details Button */}
                              <Link
                                href={route('transactions.show', transaction.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </Link>

                              {/* Edit Button */}
                              <Link
                                href={route('transactions.edit', transaction.id)}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                title="Edit Transaction"
                              >
                                <Edit size={16} />
                              </Link>

                              {/* Take Payment Button - Only show if customer has due balance */}
                              {transaction.customer?.balance?.balance > 0 && (
                                <Link
                                  href={route('payments.create', { transaction_id: transaction.id })}
                                  className="text-purple-600 hover:text-purple-900 p-1 rounded transition-colors"
                                  title="Take Payment"
                                >
                                  <CreditCard size={16} />
                                </Link>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(transaction.id, transaction.customer?.name || 'Unknown')}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Delete Transaction"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactions.links && (
                <div className="mt-4 flex flex-wrap justify-between">
                  <div className="flex-1 flex justify-between sm:justify-end">
                    {transactions.links.prev && (
                      <Link
                        href={transactions.links.prev}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}
                    {transactions.links.next && (
                      <Link
                        href={transactions.links.next}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
