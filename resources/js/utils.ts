/**
 * Format a number as currency in Bengali (BDT)
 */
export function formatCurrency(amount: number): string {
    // Convert to Bengali numerals
    const formatter = new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  }

  /**
   * Convert English digits to Bengali digits
   */
  export function toBengaliDigits(number: number | string): string {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    return number.toString().replace(/[0-9]/g, function(match) {
      return bengaliDigits[englishDigits.indexOf(match)];
    });
  }

  /**
   * Format a date in Bengali
   */
  export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD');
  }

  /**
   * Get payment status in Bengali
   */
  export function getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'পরিশোধিত';
      case 'partial':
        return 'আংশিক';
      case 'due':
        return 'বাকি';
      default:
        return status;
    }
  }

  /**
   * Get payment status color class
   */
  export function getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'due':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
