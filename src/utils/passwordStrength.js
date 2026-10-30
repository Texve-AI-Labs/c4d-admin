export const getPasswordStrength = (password = '') => {
    const value = String(password);

    if (!value) {
        return null;
    }

    const checks = [
        value.length >= 8,
        /[A-Z]/.test(value),
        /[a-z]/.test(value),
        /[0-9]/.test(value),
        /[^A-Za-z0-9\s]/.test(value),
        value === value.trim(),
        value.length <= 64,
    ];

    const score = checks.filter(Boolean).length;

    if (score <= 3) {
        return { label: 'Weak', className: 'text-red-500' };
    }

    if (score <= 5) {
        return { label: 'Good', className: 'text-yellow-700' };
    }

    if (value.length < 12) {
        return { label: 'Very Good', className: 'text-blue-600' };
    }

    return { label: 'Perfect', className: 'text-green-600' };
};
