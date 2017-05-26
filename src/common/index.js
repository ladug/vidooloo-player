/**
 * Created by vladi on 26-May-17.
 */

export const assert = (condition, message) => {
        if (!condition) {
            throw new Error(message);
        }
    },
    sec = 1000,
    min = 60000,
    hour = 3600000,
    kb = 1024,
    mb = 1048576;
