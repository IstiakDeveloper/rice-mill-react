// resources/js/utils/index.ts

/**
 * Format currency with proper locale
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount).replace('BDT', '৳');
};

/**
 * Format date in readable format
 */
export const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format number with proper locale
 */
export const formatNumber = (number: number): string => {
    return new Intl.NumberFormat('en-US').format(number);
};

/**
 * Format date for input fields
 */
export const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, length: number = 50): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        paid: 'text-green-600 bg-green-100',
        partial: 'text-yellow-600 bg-yellow-100',
        due: 'text-red-600 bg-red-100',
        active: 'text-blue-600 bg-blue-100',
        inactive: 'text-gray-600 bg-gray-100',
    };
    return colors[status.toLowerCase()] || 'text-gray-600 bg-gray-100';
};

/**
 * Validate phone number (BD format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
};

/**
 * Download data as JSON file
 */
export const downloadAsJson = (data: any, filename: string): void => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Check if user is on mobile device
 */
export const isMobile = (): boolean => {
    return window.innerWidth < 768;
};

/**
 * Smooth scroll to element
 */
export const scrollToElement = (elementId: string): void => {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
