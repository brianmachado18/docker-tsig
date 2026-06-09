import React, { useEffect, useMemo, useState } from 'react';
import useRefreshEntityLayer from '@/features/map/useRefreshEntityLayer';
import useAttractionsStore from '@/features/attractions/attractionsStore';
import { validateAttractionForm } from '@/features/attractions/attractionValidation';
import ImagePicker from '@/features/attractions/ImagePicker';
import useLangStore from '@/shared/i18n/langStore';
import { getApiErrorMessage } from '@/shared/lib/forms/validation';

const classifyOptions = ['MUSEO', 'TEATRO', 'MONUMENTO', 'PLAZA', 'GASTRONOMIA', 'PLAYA', 'PARQUE'];

const AttractionForm = ({ attraction, onSaved, onDeleted }) => {
  const { t } = useLangStore();
  const {
    closeForm,
    saveAttraction,
    deleteAttraction,
    isSaving,
    isDeleting,
    error,
    clearError,
  } = useAttractionsStore();
  const refreshAttractionLayers = useRefreshEntityLayer('attractions');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CULTURAL');
  const [imageUrl, setImageUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setTitle(attraction?.title || '');
    setDescription(attraction?.description || '');
    setCategory(attraction?.category || 'MUSEO');
    setImageUrl(attraction?.imageUrl || '');
    setLatitude(attraction?.latitude ?? attraction?.coordinates?.[1] ?? '');
    setLongitude(attraction?.longitude ?? attraction?.coordinates?.[0] ?? '');
    setValidationError('');
    clearError();
  }, [attraction, clearError]);

  const apiError = useMemo(() => {
    return getApiErrorMessage(error, t('common.error'));
  }, [error, t]);

  const validate = () => {
    return validateAttractionForm({
      title,
      description,
      category,
      latitude,
      longitude,
    }, t);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    setValidationError(validation);
    if (validation) {
      return;
    }

    const ok = await saveAttraction({
      id: attraction?.id,
      title,
      description,
      category,
      imageUrl,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    if (ok) {
      onSaved?.();
    }
  };

  const handleClose = () => {
    refreshAttractionLayers();
    closeForm();
  };

  const handleDelete = async () => {
    if (!attraction?.id) {
      return;
    }
    const confirmed = window.confirm('¿Eliminar atracción?');
    if (!confirmed) {
      return;
    }
    const ok = await deleteAttraction(attraction.id);
    if (ok) {
      onDeleted?.();
      closeForm();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          {attraction?.id ? t('attractions.edit') : t('attractions.addNew')}
        </h3>
        <button
          onClick={handleClose}
          className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form className="p-6 flex-1 min-h-0 overflow-y-auto flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('attractions.name')}</span>
          <input
            className="w-full px-3 py-2 border border-outline rounded bg-surface"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('common.description')}</span>
          <textarea
            className="w-full px-3 py-2 border border-outline rounded bg-surface resize-none"
            rows="3"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">{t('attractions.category')}</span>
          <select
            className="w-full px-3 py-2 border border-outline rounded bg-surface"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {classifyOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Foto (opcional)</span>
          <ImagePicker value={imageUrl} onChange={setImageUrl} />
        </div>

        {(validationError || apiError) && (
          <p className="text-sm text-error">{validationError || apiError}</p>
        )}

        <div className="pt-4 mt-auto border-t border-outline-variant flex items-center justify-between">
          <button
            type="button"
            disabled={!attraction?.id || isDeleting || isSaving}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg border border-error text-error disabled:opacity-40"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface"
              disabled={isSaving || isDeleting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-60"
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Guardando...' : t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AttractionForm;
