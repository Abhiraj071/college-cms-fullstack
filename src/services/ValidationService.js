export class ValidationService {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateRequired(value) {
        return value && value.toString().trim().length > 0;
    }

    static validatePhone(phone) {
        const re = /^\+?[\d\s-]{10,}$/;
        return re.test(phone);
    }

    static validateMarks(marks, max = 100) {
        const m = parseFloat(marks);
        return !isNaN(m) && m >= 0 && m <= max;
    }

    /**
     * Checks if a value already exists in the given storage key
     */
    static isDuplicate(storageKey, field, value, excludeId = null) {
        const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return data.some(item =>
            item[field] &&
            item[field].toString().toLowerCase() === value.toString().toLowerCase() &&
            item.id !== excludeId
        );
    }

    static highlightError(input, message) {
        input.style.borderColor = 'var(--danger)';
        input.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.1)';

        let errorSpan = input.parentNode.querySelector('.error-msg');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-msg';
            errorSpan.style.color = 'var(--danger)';
            errorSpan.style.fontSize = '0.75rem';
            errorSpan.style.marginTop = '0.25rem';
            errorSpan.style.display = 'block';
            input.parentNode.appendChild(errorSpan);
        }
        errorSpan.textContent = message;

        const clear = () => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
            if (errorSpan) errorSpan.remove();
            input.removeEventListener('input', clear);
        };
        input.addEventListener('input', clear);
    }

    static clearErrors(form) {
        form.querySelectorAll('.error-msg').forEach(e => e.remove());
        form.querySelectorAll('input, select, textarea').forEach(i => {
            i.style.borderColor = '';
            i.style.boxShadow = '';
        });
    }
}
