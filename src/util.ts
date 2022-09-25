export function delay(time: number) {
    return new Promise((res) => {
        setTimeout(res, time);
    });
}

export function randomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let out = Math.floor(Math.random() * (max - min + 1)) + min;
    return out <= max ? out : max;
  }