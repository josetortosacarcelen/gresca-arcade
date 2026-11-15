let last = performance.now(),
  acc = 0;
function loop(ts) {
  acc += Math.min(100, ts - last);
  last = ts;
  while (acc >= 1000 / 60) {
    acc -= 1000 / 60;
    if (screen === "home" && demo) demo.step();
    if (screen === "fight" && scene) tickScene();
    else if (screen === "fight" && active && !paused) {
      if (mode === "guest") {
        net.guestTick();
        active.remoteStep();
      } else {
        active.step();
        if (mode === "host") net.hostTick();
      }
    }
  }
  if (screen === "home" && demo) demo.render();
  if (screen === "fight" && scene) paint($("game").getContext("2d"), drawScene);
  else if (screen === "fight" && active) {
    active.render();
    if (paused) {
      const c = active.ctx;
      c.fillStyle = "#0e0a1caa";
      c.fillRect(0, 0, W, H);
      c.font = "60px Bungee, Impact, sans-serif";
      c.textAlign = "center";
      c.fillStyle = "#ffc93c";
      c.fillText("PAUSA", W / 2, H / 2 - 40);
    }
  }
  if (screen === "editor") drawEdPreview(ts);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
