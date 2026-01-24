import Toastify from 'toastify-js';

export const toast = {
    success(message: string) {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#22c55e",
                borderRadius: "12px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            },
        }).showToast();
    },
    error(message: string) {
        Toastify({
            text: message,
            duration: 4000,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#ef4444",
                borderRadius: "12px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            },
        }).showToast();
    }
};

