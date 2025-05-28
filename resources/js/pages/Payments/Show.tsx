import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Payment, Customer, Transaction, Season } from '@/types';
import { ArrowLeft, Edit, Trash2, DollarSign, User, Calendar, FileText, Eye } from 'lucide-react';

interface PaymentsShowProps extends PageProps {
  payment: Payment & {
    customer: Customer & {
      balance_info: {
        total_sales: number;
        total_payments: number;
        balance: number;
        advance_payment: number;
      };
    };
    transaction?: Transaction;
    season: Season;
  };
}

export default function Show({ auth, payment }: PaymentsShowProps) {
  const deletePayment = () => {
    if (confirm('Are you sure you want to delete this payment? This action cannot be undone and will affect customer balance and cash balance.')) {
      router.delete(route('payments.destroy', payment.id), {
        onSuccess: () => {
          // Redirect will be handled by controller
        }
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-CA'),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href={route('payments.index')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </Link>
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
              Payment Details #{payment.id}
            </h2>
          </div>
          <div className="flex gap-2">
            <Link
              href={route('payments.edit', payment.id)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <Edit size={16} />
              Edit
            </Link>
            <button
              onClick={deletePayment}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
            <Link
              href={route('payments.index')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back to List
            </Link>
          </div>
        </div>
      }
    >
      <Head title={`Payment #${payment.id}`} />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

          {/* Payment Overview */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign size={20} />
                Payment Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Payment ID</label>
                    <p className="text-lg font-bold text-gray-900">#{payment.id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">Payment Amount</label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(payment.amount))}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">Payment Date</label>
                    <p className="text-lg text-gray-900">{formatDate(payment.payment_date)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">Season</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {payment.season.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Received By</label>
                    <p className="text-lg text-gray-900">{payment.received_by || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-sm text-gray-900">
                      {formatDateTime(payment.created_at).date} at {formatDateTime(payment.created_at).time}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-sm text-gray-900">
                      {formatDateTime(payment.updated_at).date} at {formatDateTime(payment.updated_at).time}
                    </p>
                  </div>

                  {payment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Notes</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-gray-900">{payment.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                <User size={20} />
                Customer Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Customer Name</label>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-gray-900">{payment.customer.name}</p>
                    <Link
                      href={route('payments.customerPayments', payment.customer.id)}
                      className="text-blue-600 hover:text-blue-900 text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View All Payments
                    </Link>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Current Balance Summary</label>
                  {payment.customer.balance_info && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-xs text-blue-600">Total Sales</div>
                        <div className="text-sm font-bold text-blue-900">
                          {formatCurrency(payment.customer.balance_info.total_sales)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-xs text-green-600">Total Payments</div>
                        <div className="text-sm font-bold text-green-900">
                          {formatCurrency(payment.customer.balance_info.total_payments)}
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <div className="text-xs text-red-600">Balance Due</div>
                        <div className="text-sm font-bold text-red-900">
                          {formatCurrency(payment.customer.balance_info.balance)}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-xs text-purple-600">Advance</div>
                        <div className="text-sm font-bold text-purple-900">
                          {formatCurrency(payment.customer.balance_info.advance_payment)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Information */}
          {payment.transaction ? (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar size={20} />
                  Linked Transaction
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Transaction #{payment.transaction.id}
                    </h4>
                    <Link
                      href={route('transactions.show', payment.transaction.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View Details
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Transaction Date</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(payment.transaction.transaction_date)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Total Amount</label>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.transaction.total_amount)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Paid Amount</label>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(payment.transaction.paid_amount)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Due Amount</label>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(payment.transaction.due_amount)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600">Payment Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.transaction.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : payment.transaction.payment_status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.transaction.payment_status === 'paid' ? 'Paid' :
                       payment.transaction.payment_status === 'partial' ? 'Partially Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Payment Type
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">General Payment</p>
                  <p className="text-blue-600 text-sm mt-1">
                    This payment is not linked to any specific transaction. It's a general payment that affects the customer's overall balance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href={route('payments.create', { customer_id: payment.customer_id })}
                  className="flex items-center justify-center px-4 py-3 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <DollarSign size={16} className="mr-2" />
                  Record Another Payment for {payment.customer.name}
                </Link>

                <Link
                  href={route('payments.customerPayments', payment.customer_id)}
                  className="flex items-center justify-center px-4 py-3 border border-green-300 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <User size={16} className="mr-2" />
                  View All Customer Payments
                </Link>

                <Link
                  href={route('payments.index')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Eye size={16} className="mr-2" />
                  View All Payments
                </Link>
              </div>
            </div>
          </div>

          {/* Payment History Context */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Information</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This payment affects the customer's balance and overall cash balance.</li>
              <li>• Editing or deleting this payment will recalculate all related balances.</li>
              {payment.transaction && (
                <li>• This payment is linked to Transaction #{payment.transaction.id} and affects its payment status.</li>
              )}
              <li>• All changes are logged for audit purposes.</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
