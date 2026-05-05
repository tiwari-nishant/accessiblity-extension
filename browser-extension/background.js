// Background script to handle browser action click
browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});

// Made with Bob
