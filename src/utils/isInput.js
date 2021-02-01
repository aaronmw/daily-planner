const INPUT_TAG_NAMES = ['input', 'textarea'];

const isInput = node =>
    node.tagName &&
    INPUT_TAG_NAMES.map(tagName => tagName.toLowerCase()).includes(
        node.tagName.toLowerCase()
    );

export default isInput;
