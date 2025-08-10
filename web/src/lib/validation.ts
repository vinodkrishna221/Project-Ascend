// Validation utilities for forms

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCollegeEmail = (email: string): boolean => {
  if (!validateEmail(email)) {
    return false;
  }
  
  // List of common college email domains
  const collegeDomains = [
    '.edu',
    '.ac.',
    '.university',
    '.college',
    'student.',
    'alumni.'
  ];
  
  return collegeDomains.some(domain => email.toLowerCase().includes(domain));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateVerificationCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

export const validateCollegeName = (name: string): boolean => {
  return name.trim().length >= 3;
};

export const validateCountry = (country: string): boolean => {
  return country.trim().length >= 2;
};

export const validateDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};