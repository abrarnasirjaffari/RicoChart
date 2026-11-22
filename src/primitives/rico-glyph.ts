/** RICO vector mark, kept as pure 2D path commands so SVG export stays crisp with zero external images. */
export function drawRicoGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.beginPath();
  // Left candle (wick + body)
  ctx.moveTo(7, 13);
  ctx.lineTo(9, 13);
  ctx.lineTo(9, 16);
  ctx.lineTo(11, 16);
  ctx.lineTo(11, 24);
  ctx.lineTo(9, 24);
  ctx.lineTo(9, 27);
  ctx.lineTo(7, 27);
  ctx.lineTo(7, 24);
  ctx.lineTo(5, 24);
  ctx.lineTo(5, 16);
  ctx.lineTo(7, 16);
  ctx.closePath();
  // Middle candle (wick + body)
  ctx.moveTo(15, 9);
  ctx.lineTo(17, 9);
  ctx.lineTo(17, 12);
  ctx.lineTo(19, 12);
  ctx.lineTo(19, 21);
  ctx.lineTo(17, 21);
  ctx.lineTo(17, 24);
  ctx.lineTo(15, 24);
  ctx.lineTo(15, 21);
  ctx.lineTo(13, 21);
  ctx.lineTo(13, 12);
  ctx.lineTo(15, 12);
  ctx.closePath();
  // Right breakout candle + upward spark peak
  ctx.moveTo(23, 4);
  ctx.lineTo(25, 4);
  ctx.lineTo(25, 7);
  ctx.lineTo(27, 7);
  ctx.lineTo(27, 18);
  ctx.lineTo(25, 18);
  ctx.lineTo(25, 21);
  ctx.lineTo(23, 21);
  ctx.lineTo(23, 18);
  ctx.lineTo(21, 18);
  ctx.lineTo(21, 7);
  ctx.lineTo(23, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
