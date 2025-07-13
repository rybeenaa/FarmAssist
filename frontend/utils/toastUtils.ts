import toast from 'react-hot-toast';

export const toastUtils = {
  // Success toasts for farm operations
  farmSuccess: {
    dataSubmitted: () => toast.success('Farm data submitted successfully!'),
    cropAdded: () => toast.success('Crop added to your farm!'),
    profileUpdated: () => toast.success('Profile updated successfully!'),
    dataLoaded: () => toast.success('Data loaded successfully!'),
    backupCreated: () => toast.success('Backup created successfully!'),
  },

  // Error toasts for farm operations
  farmError: {
    submissionFailed: () => toast.error('Failed to submit farm data. Please try again.'),
    loadingFailed: () => toast.error('Failed to load data. Please check your connection.'),
    validationFailed: () => toast.error('Please fill in all required fields.'),
    permissionDenied: () => toast.error('You do not have permission to perform this action.'),
    networkError: () => toast.error('Network error. Please check your internet connection.'),
  },

  // Warning toasts for farm alerts
  farmWarning: {
    weatherAlert: (message: string) => toast(message, {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
      duration: 6000,
    }),
    lowStock: (item: string) => toast(`Low stock alert: ${item}`, {
      icon: '📦',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    }),
    maintenanceReminder: (equipment: string) => toast(`Maintenance due: ${equipment}`, {
      icon: '🔧',
      style: {
        background: '#6b7280',
        color: '#fff',
      },
    }),
  },

  // Info toasts for farm tips and notifications
  farmInfo: {
    tip: (message: string) => toast(message, {
      icon: '💡',
      duration: 5000,
    }),
    seasonalAdvice: (advice: string) => toast(advice, {
      icon: '🌱',
      duration: 6000,
    }),
    reminderSet: () => toast('Reminder set successfully!', {
      icon: '⏰',
    }),
  },

  // Generic toast functions
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
  loading: (message: string) => toast.loading(message),
  
  // Promise-based toast for async operations
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages),

  // Custom toast with dismiss functionality
  custom: (message: string, options?: any) => {
    const toastId = toast(message, {
      duration: Infinity,
      ...options,
    });
    
    return {
      dismiss: () => toast.dismiss(toastId),
      update: (newMessage: string, newOptions?: any) => 
        toast(newMessage, { id: toastId, ...newOptions }),
    };
  },
};

// Export individual functions for convenience
export const { farmSuccess, farmError, farmWarning, farmInfo, success, error, info, loading, promise, custom } = toastUtils;
