export async function executeAsyncBatches<T>(args: T[], exec: (arg: T) => Promise<any>, concurrencyLimit = 25) {
    // Enhance arguments array to have an index of the argument at hand
    const argsCopy = ([] as { val: T, ind }[]).concat(args.map((val, ind) => ({ val, ind })));
    const result = new Array(args.length);
    const promises = new Array(concurrencyLimit).fill(Promise.resolve());

    // Recursively chain the next Promise to the currently executed Promise
    function chainNext(p) {
        if (argsCopy.length) {
            const arg = argsCopy.shift();
            return p.then(() => {
                if (!arg) return Promise.resolve()

                // Store the result into the array upon Promise completion
                const operationPromise = exec(arg.val).then(r => { result[arg.ind] = r; })
                return chainNext(operationPromise);
            });
        }
        return p;
    }

    await Promise.all(promises.map(chainNext));

    return result;
}