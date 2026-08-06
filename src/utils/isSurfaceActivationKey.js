const isSurfaceActivationKey = evt =>
    evt.target === evt.currentTarget && ['Enter', ' '].includes(evt.key);

export default isSurfaceActivationKey;
