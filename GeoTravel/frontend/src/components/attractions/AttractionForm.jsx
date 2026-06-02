import React, { useEffect, useMemo, useState } from 'react';
import useLangStore from '../../store/langStore';
import useAttractionsStore from '../../store/attractionsStore';

const classifyOptions = ['CULTURAL', 'GASTRONOMICO', 'NATURAL', 'HITORICA', 'AVENTURA', 'OTRO'];

const AttractionForm = ({ attraction }) => {
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
    setCategory((attraction?.category || 'CULTURAL').toUpperCase());
    setImageUrl(attraction?.imageUrl || '');
    setLatitude(attraction?.latitude ?? attraction?.coordinates?.[1] ?? '');
    setLongitude(attraction?.longitude ?? attraction?.coordinates?.[0] ?? '');
    setValidationError('');
    clearError();
  }, [attraction, clearError]);

  const apiError = useMemo(() => {
    if (!error) {
      return '';
    }
    return error.details || error.message || t('common.error');
  }, [error, t]);

  const validate = () => {
    if (!title.trim()) return t('validation.nameRequired');
    if (!description.trim()) return t('common.description') + ' requerida.';
    if (!category.trim()) return t('attractions.category') + ' requerida.';
    if (!String(latitude).trim() || !String(longitude).trim()) {
      return 'Latitud y longitud son obligatorias.';
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return 'Latitud y longitud deben ser numéricas.';
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return 'Latitud/longitud fuera de rango.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    setValidationError(validation);
    if (validation) {
      return;
    }

    await saveAttraction({
      id: attraction?.id,
      title,
      description,
      category,
      imageUrl,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
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
      closeForm();
    }
  };

  return (
    <aside className="absolute top-0 right-0 h-full w-[380px] bg-surface-container-lowest border-l border-outline-variant z-40 shadow-lg flex flex-col">
      <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          {attraction?.id ? t('attractions.edit') : t('attractions.addNew')}
        </h3>
        <button
          onClick={closeForm}
          className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <form className="p-6 flex-grow overflow-y-auto flex flex-col gap-4" onSubmit={handleSubmit}>
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

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Foto URL (opcional)</span>
          <input
            className="w-full px-3 py-2 border border-outline rounded bg-surface"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
        </label>

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
              onClick={closeForm}
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
    </aside>
  );
};

export default AttractionForm;

