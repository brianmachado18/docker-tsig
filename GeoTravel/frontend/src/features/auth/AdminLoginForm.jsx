import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/features/auth/authStore';
import useLangStore from '@/shared/i18n/langStore';

const AdminLoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.error);
  const { t } = useLangStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    const ok = await login(username, password);
    if (ok) {
      navigate('/zones');
      return;
    }
    setLocalError(t('auth.signInFailed'));
  };

  const handleCancel = () => {
    navigate('/guest');
  };

  return (
    <form className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-8" onSubmit={handleSubmit}>
      <div className="mb-6">
        <h1 className="font-headline-lg text-headline-lg text-primary">{t('auth.adminAccess')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('auth.adminPortal')}</p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface">{t('auth.username')}</span>
          <input
            className="px-4 py-3 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            type="text"
            placeholder="admin"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface">{t('auth.password')}</span>
          <input
            className="px-4 py-3 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button
          className="mt-2 w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-colors"
          type="submit"
          disabled={isSubmitting}
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>

        <button
          className="w-full py-3 border border-outline text-on-surface rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
          type="button"
          onClick={handleCancel}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t('common.cancel')}
        </button>

        {(localError || authError) && (
          <p className="text-xs text-error">{authError || localError}</p>
        )}
      </div>
    </form>
  );
};

export default AdminLoginForm;
