function shortUUID() {
    return crypto.randomUUID().replace(/-/g, "").substring(0, 8);
}

export { shortUUID }