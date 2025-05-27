import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Transaction as TransactionType } from '@/types';
import { formatCurrency, formatDate, getPaymentStatusText, getPaymentStatusClass } from '@/utils';

interface TransactionShowProps extends PageProps {
  transaction: TransactionType;
}

// Helper function to format quantity with exact decimal places
const formatQuantity = (quantity: any): string => {
  console.log('formatQuantity input:', quantity, 'type:', typeof quantity);

  // Handle null/undefined
  if (quantity == null) {
    return '0';
  }

  // Convert to number first to handle any string/number issues
  let num: number;

  if (typeof quantity === 'string') {
    num = parseFloat(quantity);
  } else if (typeof quantity === 'number') {
    num = quantity;
  } else {
    num = Number(quantity);
  }

  // Check if conversion was successful
  if (isNaN(num)) {
    console.log('formatQuantity: Invalid number, returning 0');
    return '0';
  }

  // Format the number to preserve decimals
  // Use parseFloat to remove unnecessary trailing zeros
  const result = parseFloat(num.toFixed(10)).toString();
  console.log('formatQuantity result:', result);

  return result;
};

export default function Show({ auth, transaction }: TransactionShowProps) {
  // Calculate actual balance from customer_balance table (passed from backend)
  const customerBalance = transaction.customer?.balance || {
    total_sales: 0,
    total_payments: 0,
    balance: 0,
    advance_payment: 0
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">Transaction Details</h2>
          <div className="space-x-2">
            {customerBalance.balance > 0 && (
              <Link
                href={route('payments.create', { transaction_id: transaction.id })}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Take Payment
              </Link>
            )}
            <Link
              href={route('transactions.index')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back to List
            </Link>
          </div>
        </div>
      }
    >
      <Head title="Transaction Details" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Transaction Details */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer</p>
                  <p className="mt-1 text-lg text-gray-900">{transaction.customer?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1 text-lg text-gray-900">{formatDate(transaction.transaction_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Season</p>
                  <p className="mt-1 text-lg text-gray-900">{transaction.season?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(transaction.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Total Sales</p>
                  <p className="mt-1 text-lg text-blue-600">{formatCurrency(customerBalance.total_sales)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Total Payments</p>
                  <p className="mt-1 text-lg text-green-600">{formatCurrency(customerBalance.total_payments)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {customerBalance.balance > 0 ? 'Due Amount' : 'Advance Payment'}
                  </p>
                  <p className={`mt-1 text-lg font-bold ${customerBalance.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {customerBalance.balance > 0
                      ? formatCurrency(customerBalance.balance)
                      : formatCurrency(customerBalance.advance_payment)
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Balance Status</p>
                  <p className="mt-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customerBalance.balance > 0
                          ? 'bg-red-100 text-red-800'
                          : customerBalance.advance_payment > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customerBalance.balance > 0
                        ? 'Due'
                        : customerBalance.advance_payment > 0
                        ? 'Advance'
                        : 'Clear'
                      }
                    </span>
                  </p>
                </div>
                {transaction.notes && (
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="mt-1 text-gray-900">{transaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Items */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Items</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Sack Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Unit Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transaction.items && transaction.items.map((item) => {
                      console.log('Item data:', item);
                      console.log('Item quantity:', item.quantity, typeof item.quantity);
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.sack_type?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatQuantity(item.quantity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-4 text-right font-medium">
                        Total:
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>

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
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transaction.payments && transaction.payments.length > 0 ? (
                      transaction.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                          No payments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
