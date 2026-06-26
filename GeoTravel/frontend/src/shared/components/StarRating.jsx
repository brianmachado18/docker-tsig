import React from 'react';

const STAR_VALUES = [1, 2, 3, 4, 5];

const StarRating = ({
  value = 0,
  max = 5,
  onChange,
  readonly = false,
  className = '',
  sizeClassName = 'text-[22px]',
  activeClassName = 'text-amber-500',
  inactiveClassName = 'text-outline',
  ariaLabel,
}) => {
  const normalizedMax = Math.max(1, Number(max) || 5);
  const normalizedValue = Math.max(0, Math.min(normalizedMax, Number(value) || 0));
  const stars = STAR_VALUES.slice(0, normalizedMax);

  return (
    <div
      className={`flex items-center gap-1 ${className}`.trim()}
      aria-label={ariaLabel}
      role={readonly ? 'img' : 'radiogroup'}
    >
      {stars.map((starValue) => {
        const isActive = starValue <= normalizedValue;
        const iconClassName = `${sizeClassName} ${isActive ? activeClassName : inactiveClassName}`;

        if (readonly) {
          return (
            <span
              key={starValue}
              className={`material-symbols-outlined leading-none ${iconClassName}`}
              aria-hidden="true"
            >
              {isActive ? 'star' : 'star_outline'}
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange?.(starValue)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label={`${starValue} de ${normalizedMax} estrellas`}
            aria-checked={starValue === normalizedValue}
            role="radio"
          >
            <span
              className={`material-symbols-outlined leading-none ${iconClassName}`}
              aria-hidden="true"
            >
              {isActive ? 'star' : 'star_outline'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
