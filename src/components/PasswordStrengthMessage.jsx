import React from 'react';
import { getPasswordStrength } from '@/utils/passwordStrength';

const PasswordStrengthMessage = ({ password }) => {
    const strength = getPasswordStrength(password);

    if (!strength) {
        return null;
    }

    return (
        <p className="text-xs mt-1">
            Password strength: <span className={`font-semibold ${strength.className}`}>{strength.label}</span>
        </p>
    );
};

export default PasswordStrengthMessage;
