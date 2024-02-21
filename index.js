import { merge, fromEvent, map, switchMap, takeUntil } from "./operators.js";

const canvas = document.getElementById('canvas');
const clearButton = document.getElementById('clearButton');
const ctx = canvas.getContext('2d');

const mouseEvents = {
  down: 'mousedown',
  move: 'mousemove',
  up: 'mouseup',
  leave: 'mouseleave',

  touchstart: 'touchstart',
  touchmove: 'touchmove',
  touchend: 'touchend',

  click: 'click',
};

/**
 * 
 * @param {HTMLElement} canvasEl 
 * @param {EventTarget} eventValue 
 */
const getMousePosition = (canvasEl, eventValue) => {
  const rect = canvasEl.getBoundingClientRect();

  return {
    x: eventValue.clientX - rect.left,
    y: eventValue.clientY - rect.top
  };
}

const resetCanvas = (width, height) => {
  const parent = canvas.parentElement;
  canvas.width = width || parent.clientWidth * 0.9;
  canvas.height = height || parent.clientHeight * 1.5;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "green";
  ctx.lineWidth = 4;
}

resetCanvas();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const store = {
  db: [],
  get: function () {
    return store.db
  },
  set(item) {
    this.db.unshift(item);
  },
  clear() {
    this.db.length = 0;
  }
}

const touchToMouse = (touchEvent, mouseEvent) => {
  const [touch] = touchEvent.touches.length ? touchEvent.touches : touchEvent.changedTouches;

  return new MouseEvent(mouseEvent, {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}

merge([
  fromEvent(canvas, mouseEvents.down),
  fromEvent(canvas, mouseEvents.touchstart)
    .pipeThrough(map(ev => touchToMouse(ev, mouseEvents.down)))
])
.pipeThrough(
  switchMap(() => {
    return merge([
      fromEvent(canvas, mouseEvents.move),
      fromEvent(canvas, mouseEvents.touchmove).pipeThrough(map(ev => touchToMouse(ev, mouseEvents.move))),
    ])
    .pipeThrough(
      takeUntil(
        merge([
          fromEvent(canvas, mouseEvents.up),
          fromEvent(canvas, mouseEvents.leave),
          fromEvent(canvas, mouseEvents.touchend).pipeThrough(map(ev => touchToMouse(ev, mouseEvents.up))),
        ])
      )
    )
  })
)
.pipeThrough(
  map(function ([mousedown, mousemove]) {
    this._lastPosition = this._lastPosition || mousedown;
    
    const [from, to] = [this._lastPosition, mousemove]
    .map(item => getMousePosition(canvas, item));

    this._lastPosition = mousemove.type === mouseEvents.up ? null : mousemove;

    return { from, to };
  })
)
.pipeTo(new WritableStream({
  write({ from, to }) {
    store.set({ from, to });
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}));

fromEvent(clearButton, mouseEvents.click)
.pipeTo(new WritableStream({
  async write() {
    ctx.beginPath();
    ctx.strokeStyle = "white";

    for (const { from, to } of store.get()) {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      await sleep(5);
    }

    resetCanvas(canvas.width, canvas.height);
    store.clear();
  }
}))