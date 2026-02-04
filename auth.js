/**
 * Authentication Module for Court Documents Generator
 * Handles Firebase email/password authentication
 */

const CourtDocsAuth = {
    currentUser: null,
    isLoading: true,

    // Initialize auth state listener
    init() {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.isLoading = false;

            if (user) {
                console.log('User logged in:', user.email);
                this.hideAuthModal();
                this.showApp();
                this.updateUserDisplay();
            } else {
                console.log('No user logged in');
                this.showAuthModal();
                this.hideApp();
            }
        });
    },

    // Login with email and password
    async login(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Register new account
    async register(email, password) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Logout
    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get user-friendly error messages
    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
            'auth/user-not-found': 'No account found with this email. Please register first.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-credential': 'Incorrect email or password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        };
        return messages[code] || 'An error occurred. Please try again.';
    },

    // Show auth modal
    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    // Hide auth modal
    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Show main app
    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
        }
    },

    // Hide main app
    hideApp() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.add('hidden');
        }
    },

    // Update user display in header
    updateUserDisplay() {
        const userEmail = document.getElementById('userEmail');
        if (userEmail && this.currentUser) {
            userEmail.textContent = this.currentUser.email;
        }
    }
};

// Auth Modal Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const signOutBtn = document.getElementById('signOutBtn');

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (targetTab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }

            // Clear errors
            loginError.textContent = '';
            registerError.textContent = '';
        });
    });

    // Login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        loginError.textContent = '';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading">Signing in</span>';

        const result = await CourtDocsAuth.login(email, password);

        if (!result.success) {
            loginError.textContent = result.error;
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    });

    // Register form submission
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        registerError.textContent = '';

        if (password !== confirm) {
            registerError.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 6) {
            registerError.textContent = 'Password must be at least 6 characters';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading">Creating account</span>';

        const result = await CourtDocsAuth.register(email, password);

        if (!result.success) {
            registerError.textContent = result.error;
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    });

    // Sign out button
    signOutBtn?.addEventListener('click', async () => {
        await CourtDocsAuth.logout();
    });

    // Initialize auth
    CourtDocsAuth.init();
});
