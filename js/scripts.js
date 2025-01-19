const lerp = (f0, f1, t) => (1 - t) * f0 + t * f1; // linear interpolation between f0 and f1
const clamp = (val, min, max) => Math.max(min, Math.min(val, max)); // restrict val between min and max

class DragScroll {
    constructor(obj) {
        this.el = document.querySelector(obj.el);
        this.wrap = document.querySelector(obj.wrap);
        this.items = document.querySelectorAll(obj.item);
        this.bar = document.querySelector(obj.bar);
        this.init();
    }

    init() {
        this.progress = 0; // scroll progress
        this.speed = 0; // x - oldX (delta A.K.A speed of the scroll) (needed for item scaling animations)
        this.oldX = 0; // previous x position (needed for speed calculation)
        this.x = 0; // slighty lerped version of progress (needed for smooth sliding)
        this.playrate = 0; // progress bar ratio (0 - 1)

        this.bindings();
        this.events();
        this.calculate();
        this.raf();
    }

    bindings() {
        [
            "events",
            "calculate",
            "raf",
            "handleWheel",
            "move",
            "handleTouchStart",
            "handleTouchMove",
            "handleTouchEnd",
        ].forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }
    
    calculate() {
        this.progress = 0;
        this.wrapWidth = Array.from(this.items).reduce((acc, item) => acc + item.offsetWidth, 0); // calculate wrap width
        this.wrap.style.width = `${this.wrapWidth}px`; // dynamically set wrap width
        this.maxScroll = this.wrapWidth - this.el.clientWidth; // calculate max scroll
    }

    handleWheel(e) {
        this.progress += e.deltaY;
        this.move();
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.dragging = true;
        this.startX = e.clientX || e.touches[0].clientX;
    }

    handleTouchMove(e) {
        if (!this.dragging) return false;
        const x = e.clientX || e.touches[0].clientX;
        this.progress += (this.startX - x) * 2.5;
        this.startX = x;
        this.move();
    }

    handleTouchEnd() {
        this.dragging = false;
    }

    move() {
        this.progress = clamp(this.progress, 0, this.maxScroll)
    }

    events() {
        window.addEventListener("resize", this.calculate);
        window.addEventListener("wheel", this.handleWheel);

        window.addEventListener("touchstart", this.handleTouchStart);
        window.addEventListener("touchmove", this.handleTouchMove);
        window.addEventListener("touchend", this.handleTouchEnd);

        window.addEventListener("mousedown", this.handleTouchStart);
        window.addEventListener("mousemove", this.handleTouchMove);
        window.addEventListener("mouseup", this.handleTouchEnd);
        document.body.addEventListener("mouseleave", this.handleTouchEnd);
    }

    raf() {
        this.x = lerp(this.x, this.progress, 0.1); // interpolation between x and progress
        this.playrate = this.x / this.maxScroll; // progress bar calculation (0 - 1)

        this.wrap.style.transform = `translatex(${-this.x}px)`; // wrapper sliding on x pixels to the left
        this.bar.style.transform = `scaleX(${0.18 + this.playrate * 0.82})`; // progress bar scaling from 0.18 to 1

        this.speed = Math.min(100, this.oldX - this.x); // speed calculation (delta x)
        this.oldX = this.x;

        this.scale = lerp(this.scale, this.speed, 0.1); // interpolation of the scaling
        this.items.forEach((item) => {
            item.style.transform = `scale(${1 - Math.abs(this.speed) * 0.005})`; // scaling of the item
            item.querySelector("video").style.transform = `scaleX(${1 + Math.abs(this.speed) * 0.004})`; //scaling of the video
        });
    }
}

const scroll = new DragScroll({
    el: ".slider",
    wrap: ".slider-wrapper",
    item: ".slider-item",
    bar: ".slider-progress-bar",
});

const animateScroll = () => {
    requestAnimationFrame(animateScroll);
    scroll.raf();
};

animateScroll();
