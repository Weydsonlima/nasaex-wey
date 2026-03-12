export function enterFullscreen(
  element: HTMLElement = document.documentElement,
) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    (element as any).webkitRequestFullscreen(); // Safari
  } else if ((element as any).msRequestFullscreen) {
    (element as any).msRequestFullscreen(); // IE/Edge antigo
  }
}
