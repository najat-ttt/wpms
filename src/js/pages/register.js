import { registerUser, requireUnauth } from '../auth.js';
import { createUserProfile } from '../db.js';

requireUnauth();

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const errorMsg = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
      showError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    const { user, error } = await registerUser(email, password);

    if (error) {
      let errorMessage = error;
      if (error.includes('auth/email-already-in-use')) {
        errorMessage = 'This email is already registered.';
      } else if (error.includes('auth/invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      showError(errorMessage);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register';
    } else {
      try {
        await createUserProfile(user.uid, email, name);
        // Auth state change will automatically redirect to dashboard
      } catch (dbError) {
        showError("Account created but failed to save profile data.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
      }
    }
  });
});
