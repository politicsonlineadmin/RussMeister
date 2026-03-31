'use client';

type CardVariant = 'default' | 'flat' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: CardVariant;
  image?: string;
  imageAlt?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
  flat: 'bg-[#e7f5f5]',
  outlined: 'bg-white border border-gray-200',
};

export default function Card({
  children,
  className = '',
  onClick,
  variant = 'default',
  image,
  imageAlt,
}: CardProps) {
  const isClickable = !!onClick;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`
        rounded-2xl overflow-hidden
        transition-shadow duration-200
        ${variantStyles[variant]}
        ${isClickable ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]' : ''}
        ${className}
      `}
    >
      {image && (
        <div className="w-full aspect-[16/9] overflow-hidden">
          <img
            src={image}
            alt={imageAlt || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5">{children}</div>
    </div>
  );
}
