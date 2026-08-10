interface IconProps {
    className?: string;
    name: string;
}

export function Icon({ className = '', name }: IconProps) {
    return (
        <i aria-hidden="true" className={`fa-solid fa-${name} ${className}`} />
    );
}
