const cx = (...classNames) => classNames.flat().filter(Boolean).join(' ');

export default cx;
