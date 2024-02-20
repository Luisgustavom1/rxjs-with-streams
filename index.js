import { fromEvent, map } from "./operators.js";

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

const resetCanvas = (width, height) => {
  const parent = canvas.parentElement;
  canvas.width = width || parent.clientWidth * 0.9;
  canvas.height = height || parent.clientHeight * 1.5;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "green";
  ctx.lineWidth = 4;
}

resetCanvas();

const touchToMouse = (touchEvent, mouseEvent) => {
  const [touch] = touchEvent.touches.length ? touchEvent.touches : touchEvent.changedTouches;

  return new MouseEvent(mouseEvent, {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}

fromEvent(canvas, mouseEvents.touchstart)
  .pipeThrough(map(ev => touchToMouse(ev, mouseEvents.touchstart)))
  .pipeTo(new WritableStream({
    write(chunk) {
      console.log('chunk', chunk);
    }
  }))