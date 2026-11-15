if (document.fonts && document.fonts.load) {
  document.fonts.load("20px Bungee").then(() => {
    STAGE = null;
    STAGECACHE = {};
  });
}
show("home");
