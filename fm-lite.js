const audio = new Audio();
audio.controls = true;
audio.preload = 'auto';
// document.body.appendChild(audio);

const iconLinkEl = document.querySelector('link[rel="apple-touch-icon"]');
const shortcutIconLinkEl = document.querySelector('link[rel="shortcut icon"]');



const padLeft = (num, size = 2,w='0') => (w+w+w + num).slice(size * -1);
const hax2rgb = (hex='333333') => String(hex).match(/\w{2}/g).map(x=>parseInt(x,16));
const rgb2hax = rgb=>rgb.map(n=>padLeft(n.toString(16),'2')).join('')
function rgb2hsl([r, g, b]) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min){ 
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}
function hsl2rgb([h, s, l]) {
    var r, g, b;

    if(s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
const loadImage = (src,cb)=>{
    const img = new Image();
    img.onload = ()=> cb(img);
    img.src = src;
}

const mediaPath = 'https://un.sojo.im';

const localStorageFavIdsKey = 'fm-lite-fav-ids';
const favIds = (localStorage.getItem(localStorageFavIdsKey) || '').split(',').filter(i=>i);

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 1;

const trackCover = canvas.toDataURL();


const app = new Vue({
    el: '.app',
    data(){
        return {
            trackId: null,
            tracks: [],
            playing: false,
            loading: true,
            favIds,
            trackCover,
        }
    },
    computed:{
        Tracks(){
            return Object.fromEntries(this.tracks.map(a=>[a[0],a]))
        },
        trackArray(){
            return this.Tracks[this.trackId];
        },
        track(){
            if(!this.trackArray) return;
            return this.trackArrayToTrack(this.trackArray);
        },
        sub(){
            if(!this.track) return;
            return this.track.sub;
        },
        color(){
            if(!this.track) return;
            return '#'+this.track.color;
        },
        hsl(){
            const rgb = hax2rgb(this.track ? this.track.color : '333333');
            return rgb2hsl(rgb);
        },
        colorDark(){
            const { hsl } = this;
            // hsl[1] = 1;
            hsl[2] = .4;
            const hax = rgb2hax(hsl2rgb(hsl))
            return '#'+hax;
        },
        colorLight(){
            const { hsl } = this;
            hsl[1] = .3;
            hsl[2] = .9;
            const hax = rgb2hax(hsl2rgb(hsl))
            return '#'+hax;
        },
        // trackCover(){
        //     if(!this.track) return;
        //     return this.track.cover;
        // },
        boxShadow(){
            if(!this.colorDark) return;
            return `${this.colorDark} 0px 15px 45px -25px`;
        },
        src(){
            if(!this.trackId) return;
            return `${mediaPath}/music/${this.trackId}`
        },
        title(){
            if(!this.track) return;
            return this.track.title;
        },
        favTracks(){
            return this.favIds.map(id=>this.Tracks[id]).filter(t=>t).map(this.trackArrayToTrack).reverse()
        }
    },
    methods:{
        fixSub(sub){
            if(!sub) return 'ヽ(･ω･´ﾒ)';

            if(/acg/i.test(sub)) return 'ヽ(･ω･´ﾒ)';

            sub = sub.replace(/,/g,'、');

            return sub;
        },
        trackArrayToTrack(trackArray){
            const [id,title,sub,aid,color] = trackArray;
            const cover = `${mediaPath}/xiami/${aid}.jpg!w520h520`
            return {id,title,sub,aid,color,cover};
        },
        randOne(){
            const track = this.tracks[Math.floor(this.tracks.length * Math.random())];
            this.go(track[0]);
        },
        go(trackId,noHash){
            const hash = `#/${trackId}`;

            if(!noHash){
                location.hash = hash;
            }

            app.loading = true;
            app.playing = false;

            
            this.trackId = trackId;

            if(!this.track) return this.randOne();

            document.title = `${this.track.title} - ${this.sub}`;
            iconLinkEl.href = this.track.cover;
            shortcutIconLinkEl.href = this.track.cover;

            document.documentElement.style.setProperty('--background-color',this.colorLight);

            audio.src = this.src;
            audio.currentTime = 0;

            loadImage(this.track.cover,el=>{
                this.trackCover = this.track.cover;
            });

            const playPromise = this.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    
                })
                .catch(error => {

                });
            }
            
        },
        play(){
            if(audio.paused){
                audio.play();
            }else{
                audio.pause();
            }
        },
        next(){
            this.randOne();
        },
        fav(){
            let { trackId } = this;
            trackId = String(trackId);
            const index = this.favIds.indexOf(trackId);
            if(index === -1){
                this.favIds.push(trackId);
            }else{
                this.favIds.splice(index,1);
            }
            localStorage.setItem(localStorageFavIdsKey,this.favIds.join(','));
        }
    }
})

audio.onended = _=>{
    app.next();
}

const progressBoxEl = document.querySelector('.progress');
const progressPlayingEl = progressBoxEl.children[1];
const progressLoadedEl = progressBoxEl.children[0];

let onClicking = false;
let clickProgress = 0;
const onMove = e=>{
    const { target, clientX } = e;
    const { offsetLeft, offsetWidth } = target;

    const isTouch = ['touchmove','touchstart'].includes(e.type);
   
    // console.log(e,e.type);
    const x = isTouch ? e.changedTouches[0].clientX : clientX;
    const w = x - offsetLeft;
    clickProgress = Math.min(1,Math.max(0,w / offsetWidth));

    progressPlayingEl.style.width = `${clickProgress * 100}%`;
    currentTimeEl.innerHTML = second2ms(clickProgress * audio.duration);
}
progressBoxEl.onmousedown =
progressBoxEl.ontouchstart = e=>{
    if(e.which === 3) return;
    e.preventDefault();
    onClicking = true;

    document.onmousemove =
    document.ontouchmove = onMove;

    onMove(e);

    document.onmouseup = 
    document.ontouchend = 
    document.onmouseleave =
    document.onvisibilitychange = e=>{
        onClicking = false;
        audio.currentTime = clickProgress * audio.duration;
        document.onmousemove = null;
        document.ontouchmove = null;
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmouseleave = null;
        document.onvisibilitychange = null;
    }
}

const timeEl = document.querySelector('.time-box');
const [ currentTimeEl , durationTimeEl ] = timeEl.children;

const second2ms = s=>{
	const mm = Math.floor(s/60);
	const ss = Math.floor(s % 60);

	return `${mm}:${padLeft(ss)}`
};


audio.ontimeupdate = e=>{
    let { currentTime } = audio;
    

    const playingProgress = currentTime / audio.duration;

    const loadedProgress = audio.buffered.length ? (audio.buffered.end(0) / audio.duration) : 0;
    progressLoadedEl.style.width = `${loadedProgress * 100}%`;

    if(!onClicking){
        progressPlayingEl.style.width = `${playingProgress * 100}%`;
        currentTimeEl.innerHTML = second2ms(currentTime);
    }
    durationTimeEl.innerHTML = audio.duration ? second2ms(audio.duration) : '';
};
audio.onloadedmetadata = _=>{
    app.loading = false;
}

// audio.onprogress = e=>{
//     console.log('onprogress')
//     console.log(audio.buffered.end(0))
// }
audio.oncanplaythrough = e=>{
    console.log('canplaythrough');
}
audio.onplay = e=>{
    app.playing = true;
}
audio.onpause = e=>{
    app.playing = false;
}

fetch('fav-tracks.json').then(r=>r.json()).then(tracks=>{
    app.tracks = tracks;
    window.onhashchange = e=>{
        const id = +location.hash.match(/\d+/);
        if(id){
            app.go(id,true);
        }else if(!app.track){
            app.randOne();
        }
    }
    window.onhashchange();
})