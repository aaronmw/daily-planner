export default str => {
    return typeof str === 'string'
        ? str.trim().replace(/\s([^ ]*)$/m, `${String.fromCharCode(160)}$1`)
        : str;
};
