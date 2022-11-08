const audio = new Audio();
audio.controls = true;
audio.preload = 'auto';
// document.body.appendChild(audio);
const iconLinkEl = $('link[rel="apple-touch-icon"]');
const shortcutIconLinkEl = $('link[rel="shortcut icon"]');


const mediaPath = 'https://un.sojo.im';

const localStorageFavIdsKey = 'fm-lite-fav-ids';
const favIds = (localStorage.getItem(localStorageFavIdsKey) || '').split(',').filter(i=>i);

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 1;

const trackCover = canvas.toDataURL();

const play = (paused = audio.paused)=>{
    if(paused){
        audio.play();
    }else{
        audio.pause();
    }
}

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
        play,
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

const progressBoxEl = $('.progress');
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

const timeEl = $('.time-box');
const [ currentTimeEl , durationTimeEl ] = timeEl.children;


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
    document.addEventListener('click', _=> play(true), { once: true});
    document.addEventListener('touchstart', _=> play(true), { once: true});
})