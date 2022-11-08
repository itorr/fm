
const $ = s => document.querySelector(s);

const padLeft = (num, size = 2,w='0') => (w+w+w + num).slice(size * -1);
const hax2rgb = (hex='333333') => String(hex).match(/\w{2}/g).map(x=>parseInt(x,16));
const rgb2hax = rgb=>rgb.map(n=>padLeft(n.toString(16),'2')).join('')
function rgb2hsl([r, g, b]) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) return [0,0,0];
    
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;

    return [h, s, l];
}
function hue2rgb(p, q, t) {
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}
function hsl2rgb([h, s, l]) {
    let r, g, b;

    if(s == 0) return [0,0,0];
    
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);

    return [
        Math.round(r * 255), 
        Math.round(g * 255), 
        Math.round(b * 255)
    ];
}
const loadImage = (src,cb)=>{
    const img = new Image();
    img.onload = ()=> cb(img);
    img.src = src;
}

const second2ms = s=>{
	const mm = Math.floor(s/60);
	const ss = Math.floor(s % 60);

	return `${mm}:${padLeft(ss)}`
};
