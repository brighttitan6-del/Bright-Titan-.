import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckBadgeIcon, XCircleIcon, InformationCircleIcon } from './icons';
import { ToastMessage, SubscriptionPlan } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
    const baseClasses = 'font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 active:scale-95';
    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus:ring-slate-500',
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};


const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: number) => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [message.id, onDismiss]);

    const icons = {
        success: <CheckBadgeIcon className="w-6 h-6 text-green-500" />,
        error: <XCircleIcon className="w-6 h-6 text-red-500" />,
        info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
    };

    const style = {
      base: 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600',
    };

    return (
        <div className={`w-full max-w-sm rounded-xl shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${style.base} animate-fade-in-up`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">{icons[message.type]}</div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{message.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => onDismiss(message.id)}
                            className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Close</span>
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => {
    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <Toast key={toast.id} message={toast} onDismiss={onDismiss} />
                ))}
            </div>
        </div>
    );
};

export interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlan: (plan: SubscriptionPlan) => void;
    isSignUpFlow?: boolean; // New prop to indicate sign-up context
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSelectPlan, isSignUpFlow = false }) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const plans = [
        { plan: SubscriptionPlan.Daily, title: 'Daily Class', price: 2000, duration: '24 hours', features: ['Watch lesson videos', 'Read materials'] },
        { plan: SubscriptionPlan.Weekly, title: 'Weekly Class', price: 10000, duration: '7 days', features: ['Watch lesson videos', 'Read materials'] },
        { plan: SubscriptionPlan.Monthly, title: 'Monthly Class', price: 35000, duration: '30 days', features: ['All videos & materials', 'Join live classes', 'Download materials'] },
    ];

    const handlePay = () => {
        if (selectedPlan) {
            onSelectPlan(selectedPlan);
        }
    }

    // Reset local state when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            setSelectedPlan(null);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isSignUpFlow ? "Complete Your Sign-Up" : "Choose Your Plan"}>
            <div className="space-y-4">
                 {isSignUpFlow && (
                    <p className="text-center text-slate-600 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700">
                        Welcome! Please select a subscription plan to create your account.
                    </p>
                )}
                <div className="grid grid-cols-1 gap-3">
                    {plans.map(p => (
                        <div key={p.plan} onClick={() => setSelectedPlan(p.plan)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPlan === p.plan ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-slate-300 dark:border-slate-600 hover:border-teal-400'}`}>
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{p.title}</h3>
                                <p className="font-bold text-teal-600 dark:text-teal-400">K{p.price.toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{p.duration} access</p>
                            <ul className="text-xs list-disc list-inside mt-2 text-slate-600 dark:text-slate-300">
                                {p.features.map(f => <li key={f}>{f}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
                {selectedPlan && (
                    <div className="space-y-3 pt-4 border-t dark:border-slate-700 animate-fade-in-up">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Simulated Payment</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">This is a simulated payment. Click below to confirm.</p>
                        <Button onClick={handlePay} className="w-full">Pay K{plans.find(p=>p.plan===selectedPlan)?.price.toLocaleString()}</Button>
                    </div>
                )}
            </div>
        </Modal>
    )
};
