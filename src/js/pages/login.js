import { loginUser, requireUnauth } from '../auth.js';

requireUnauth();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    const { user, error } = await loginUser(email, password);

    if (error) {
      let errorMessage = error;
      if (error.includes('auth/invalid-credential') || error.includes('auth/wrong-password') || error.includes('auth/user-not-found')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.includes('auth/invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      showError(errorMessage);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
});
